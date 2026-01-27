'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Client, Bill } from '@/lib/data';
import { useClients } from '@/hooks/use-clients';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import BillsReportTable from '@/components/dashboard/bills-report-table';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from '@/firebase/client';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type ClientWithId = Client & { id: string };

export default function AccountPage() {
    const { clients, loading: clientsLoading } = useClients();
    const [selectedClientId, setSelectedClientId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('selectedBillClientId');
        }
        return null;
    });
    const [selectedClient, setSelectedClient] = useState<ClientWithId | null>(null);
    const [activeMonth, setActiveMonth] = useState<string>('');
    const [bills, setBills] = useState<(Bill & { id: string })[]>([]);
    const [billsLoading, setBillsLoading] = useState(false);

    // Save selected client ID to session storage
    useEffect(() => {
        if (selectedClientId) {
            sessionStorage.setItem('selectedBillClientId', selectedClientId);
        } else {
            sessionStorage.removeItem('selectedBillClientId');
        }
    }, [selectedClientId]);

    // Effect to set selectedClient when clientId changes or clients load
    useEffect(() => {
        if (selectedClientId && clients.length > 0) {
            const client = clients.find(c => c.id === selectedClientId);
            if (client) {
                setSelectedClient(client);
                // Set active month only if it's not valid for the new client
                const currentMonths = client.months?.map(m => m.name) || [];
                if (!activeMonth || !currentMonths.includes(activeMonth)) {
                    const firstMonth = client.months?.[0]?.name || 'Month 1';
                    setActiveMonth(firstMonth);
                }
            } else {
                 // If saved client ID is invalid, clear it
                 setSelectedClientId(null);
            }
        } else if (!selectedClientId) {
            setSelectedClient(null);
            setActiveMonth('');
            setBills([]);
        }
    }, [selectedClientId, clients, activeMonth]);

    // Effect to fetch bills when client or month changes
    useEffect(() => {
        if (!selectedClientId || !activeMonth) {
            setBills([]);
            return;
        }
        setBillsLoading(true);
        const billsQuery = query(
            collection(db, `clients/${selectedClientId}/bills`),
            where("month", "==", activeMonth)
        );
        const unsubscribe = onSnapshot(billsQuery, (snapshot) => {
            const billsData = snapshot.docs.map(doc => ({ ...doc.data() as Bill, id: doc.id }));
            billsData.sort((a, b) => a.slNo - b.slNo);
            setBills(billsData);
            setBillsLoading(false);
        }, (error) => {
            console.error("Error fetching bills:", error);
            setBillsLoading(false);
        });
        return () => unsubscribe();
    }, [selectedClientId, activeMonth]);

    const sortedClients = useMemo(() => {
        return [...clients].sort((a, b) => (a.priority || 0) - (b.priority || 0));
    }, [clients]);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Billing Reports</CardTitle>
                    <CardDescription>Select a client to view and manage their bills.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {clientsLoading ? (
                        <Skeleton className="h-10 w-full md:w-1/3" />
                    ) : (
                        <Select onValueChange={setSelectedClientId} value={selectedClientId || ''}>
                            <SelectTrigger className="w-full md:w-1/3">
                                <SelectValue placeholder="Select a client..." />
                            </SelectTrigger>
                            <SelectContent>
                                {sortedClients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {selectedClient && (
                         <Tabs value={activeMonth} onValueChange={setActiveMonth}>
                            <ScrollArea className="w-full whitespace-nowrap">
                                <TabsList>
                                    {(selectedClient.months && selectedClient.months.length > 0) ? (
                                        selectedClient.months.map(month => (
                                            <TabsTrigger key={month.name} value={month.name}>
                                                {month.name}
                                            </TabsTrigger>
                                        ))
                                    ) : (
                                        <TabsTrigger value="Month 1">Month 1</TabsTrigger>
                                    )}
                                </TabsList>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </Tabs>
                    )}

                    {selectedClient && activeMonth ? (
                        <BillsReportTable
                            client={selectedClient}
                            bills={bills}
                            loading={billsLoading}
                            activeMonth={activeMonth}
                        />
                    ) : selectedClientId ? (
                         <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-card">
                            <p className="text-muted-foreground">Loading client data...</p>
                        </div>
                    ) : (
                         <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-card">
                            <p className="text-muted-foreground">Please select a client to view their bills.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
