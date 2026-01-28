'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Client, Bill } from '@/lib/data';
import { useClients } from '@/hooks/use-clients';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import BillsReportTable from '@/components/dashboard/bills-report-table';
import { db } from '@/firebase/client';
import { collection, query, onSnapshot, Unsubscribe } from 'firebase/firestore';
import ClientBillOverviewTable from '@/components/dashboard/client-bill-overview-table';
import { Button } from '@/components/ui/button';

type ClientWithId = Client & { id: string };
type BillWithClientId = Bill & { id: string; clientId: string };

export default function AccountPage() {
    const { clients, loading: clientsLoading } = useClients();
    const [allBills, setAllBills] = useState<BillWithClientId[]>([]);
    const [billsLoading, setBillsLoading] = useState(true);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [monthFilter, setMonthFilter] = useState<number>(1);

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

    const clientsForTable = useMemo(() => {
        if (!clients || clients.length === 0) return [];

        return clients
            .filter(c => c.active !== false && c.months && c.months.length >= monthFilter)
            .map(client => {
                const monthData = client.months?.[monthFilter - 1];
                return {
                    ...client,
                    billDuration: monthData?.billDuration || client.billDuration || '-',
                };
            })
            .sort((a, b) => (a.priority || 0) - (b.priority || 0));
    }, [clients, monthFilter]);

    useEffect(() => {
        if (selectedClientId && !clientsForTable.some(c => c.id === selectedClientId)) {
            setSelectedClientId(null);
        }
    }, [selectedClientId, clientsForTable]);

    const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId) || null, [clients, selectedClientId]);
    const billsForSelectedClient = useMemo(() => allBills.filter(b => b.clientId === selectedClientId).sort((a,b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime()), [allBills, selectedClientId]);

    const maxMonths = useMemo(() => {
        if (!clients || clients.length === 0) return 1;
        return Math.max(1, ...clients.map(c => c.months?.length || 0));
    }, [clients]);
    
    const monthFilterButtons = Array.from({ length: maxMonths }, (_, i) => i + 1);

    return (
        <div className="space-y-4">
             <Card>
                <CardHeader>
                    <CardTitle>Billing Center</CardTitle>
                    <CardDescription>Manage all client billing from one central location.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center gap-2 p-2 bg-muted rounded-md flex-wrap">
                        <span className="text-sm font-medium mr-2">Filter by Month No:</span>
                        <div className="flex flex-wrap gap-1">
                            {monthFilterButtons.map(monthNum => (
                                <Button
                                    key={monthNum}
                                    variant={monthFilter === monthNum ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setMonthFilter(monthNum)}
                                    className="h-7"
                                >
                                    {monthNum}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ClientBillOverviewTable
                            clients={clientsForTable}
                            bills={allBills}
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
                                />
                            ) : (
                                <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-card">
                                    <p className="text-muted-foreground text-center">Select a client to view and issue bills.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
