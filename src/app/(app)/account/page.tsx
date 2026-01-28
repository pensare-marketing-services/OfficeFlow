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
import { startOfDay } from 'date-fns';

type ClientWithId = Client & { id: string };
type BillWithClientId = Bill & { id: string; clientId: string };

function getEndDateFromDuration(durationStr: string): Date | null {
    if (!durationStr || !durationStr.includes('-')) return null;

    try {
        const endDatePart = durationStr.split('-')[1].trim(); // e.g., "Jan 31"
        if (!endDatePart) return null;

        const currentYear = new Date().getFullYear();
        const today = new Date();
        
        // Attempt to parse with current year
        let endDate = new Date(`${endDatePart} ${currentYear}`);
        if (isNaN(endDate.getTime())) return null;
        
        // If the calculated date is more than a month in the past, assume it's for next year.
        // This handles the case where it's December and the bill is for January.
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(today.getMonth() - 1);

        if (endDate < oneMonthAgo) {
            endDate.setFullYear(currentYear + 1);
        }

        return endDate;
    } catch (e) {
        console.error("Error parsing duration string:", e);
        return null;
    }
}

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
        const today = startOfDay(new Date());

        return clients
            .filter(c => c.active !== false && c.months && c.months.length >= monthFilter)
            .map(client => {
                const monthData = client.months?.[monthFilter - 1];
                const billDuration = monthData?.billDuration || client.billDuration || '-';
                
                const endDate = getEndDateFromDuration(billDuration);
                let isEndingSoon = false;

                if (endDate) {
                    const daysUntilEnd = (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                    // A duration is ending soon if it's within the next 7 days or has already passed
                    isEndingSoon = daysUntilEnd <= 7;
                }

                return {
                    ...client,
                    billDuration,
                    endDate,
                    isEndingSoon
                };
            })
            .sort((a, b) => {
                if (a.endDate && b.endDate) {
                    // Sort by end date ascending (earlier dates first)
                    return a.endDate.getTime() - b.endDate.getTime();
                }
                if (a.endDate && !b.endDate) return -1; // Clients with dates come before those without
                if (!a.endDate && b.endDate) return 1;
                return (a.priority || 0) - (b.priority || 0); // fallback to priority
            });
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
