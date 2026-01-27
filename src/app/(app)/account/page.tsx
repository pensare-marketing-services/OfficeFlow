'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Client, Bill } from '@/lib/data';
import { useClients } from '@/hooks/use-clients';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import BillsReportTable from '@/components/dashboard/bills-report-table';
import { db } from '@/firebase/client';
import { collection, query, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClientBillOverviewTable from '@/components/dashboard/client-bill-overview-table';

type ClientWithId = Client & { id: string };
type BillWithClientId = Bill & { id: string; clientId: string };

export default function AccountPage() {
    const { clients, loading: clientsLoading } = useClients();
    const [allBills, setAllBills] = useState<BillWithClientId[]>([]);
    const [billsLoading, setBillsLoading] = useState(true);

    const [selectedClientId, setSelectedClientId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('selectedBillClientId');
        }
        return null;
    });
    
    // Create a list of unique months from clients data for the tabs
    const allMonths = useMemo(() => {
        if (clients.length === 0) return ['Month 1'];
        const monthsSet = new Set<string>();
        clients.forEach(c => {
            if (c.months && c.months.length > 0) {
                c.months.forEach(m => monthsSet.add(m.name));
            } else {
                 monthsSet.add('Month 1');
            }
        });
        return Array.from(monthsSet).sort((a, b) => {
            const aMatch = a.match(/\d+/);
            const bMatch = b.match(/\d+/);
            if (aMatch && bMatch) {
                return parseInt(aMatch[0]) - parseInt(bMatch[0]);
            }
            return a.localeCompare(b);
        });
    }, [clients]);

    const [activeMonth, setActiveMonth] = useState<string>(allMonths[0]);

     useEffect(() => {
        if (allMonths.length > 0 && !allMonths.includes(activeMonth)) {
            setActiveMonth(allMonths[0]);
        }
     }, [allMonths, activeMonth]);

    useEffect(() => {
        if (clients.length === 0) {
            setAllBills([]);
            setBillsLoading(false);
            return;
        }
        setBillsLoading(true);

        const unsubs: Unsubscribe[] = [];

        clients.forEach(client => {
            const billsQuery = query(collection(db, `clients/${client.id}/bills`));
            const unsub = onSnapshot(billsQuery, (snapshot) => {
                setAllBills(prevBills => {
                    const otherClientBills = prevBills.filter(b => b.clientId !== client.id);
                    const newBills = snapshot.docs.map(doc => ({ ...doc.data() as Bill, id: doc.id, clientId: client.id }));
                    return [...otherClientBills, ...newBills];
                });
            }, (error) => {
                console.error(`Error fetching bills for client ${client.id}:`, error);
            });
            unsubs.push(unsub);
        });
        
        // After setting up all listeners, set loading to false
        setBillsLoading(false);

        return () => {
            unsubs.forEach(unsub => unsub());
        };
    }, [clients]);

     // Save selected client ID to session storage
    useEffect(() => {
        if (selectedClientId) {
            sessionStorage.setItem('selectedBillClientId', selectedClientId);
        } else {
            sessionStorage.removeItem('selectedBillClientId');
        }
    }, [selectedClientId]);

    const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId) || null, [clients, selectedClientId]);
    const billsForSelectedClient = useMemo(() => allBills.filter(b => b.clientId === selectedClientId && b.month === activeMonth).sort((a,b) => a.slNo - b.slNo), [allBills, selectedClientId, activeMonth]);
    const sortedClients = useMemo(() => [...clients].filter(c => c.active !== false).sort((a, b) => (a.priority || 0) - (b.priority || 0)), [clients]);

    return (
        <div className="space-y-4">
             <Card>
                <CardHeader>
                    <CardTitle>Billing Center</CardTitle>
                    <CardDescription>Manage all client billing from one central location.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Tabs value={activeMonth} onValueChange={setActiveMonth}>
                        <ScrollArea className="w-full whitespace-nowrap">
                            <TabsList>
                                {allMonths.map(month => (
                                    <TabsTrigger key={month} value={month}>
                                        {month}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </Tabs>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ClientBillOverviewTable
                            clients={sortedClients}
                            bills={allBills}
                            activeMonth={activeMonth}
                            selectedClientId={selectedClientId}
                            onClientSelect={setSelectedClientId}
                            loading={clientsLoading || billsLoading}
                        />

                        <div>
                            {selectedClient ? (
                                <BillsReportTable
                                    client={selectedClient}
                                    bills={billsForSelectedClient}
                                    loading={billsLoading}
                                    activeMonth={activeMonth}
                                />
                            ) : (
                                <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-card">
                                    <p className="text-muted-foreground text-center">Select a client from the list on the left to view their bills.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
