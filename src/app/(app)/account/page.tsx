
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Client, Bill } from '@/lib/data';
import { useClients } from '@/hooks/use-clients';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import BillsReportTable from '@/components/dashboard/bills-report-table';
import { db } from '@/firebase/client';
import { collection, query, onSnapshot, Unsubscribe, doc, updateDoc } from 'firebase/firestore';
import ClientBillOverviewTable from '@/components/dashboard/client-bill-overview-table';
import { Button } from '@/components/ui/button';
import { startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

type ClientWithId = Client & { id: string };
type BillWithClientId = Bill & { id: string };
type MonthlyBillingStatus = 'all' | 'Issued' | 'Not Issued';


function getEndDateFromDuration(durationStr: string): Date | null {
    if (!durationStr) return null;

    // Normalize separators and handle various formats
    const normalizedDuration = durationStr.replace(/\s+to\s+/i, '-');
    const parts = normalizedDuration.split('-');
    
    if (parts.length < 2) return null;

    try {
        const endDatePart = parts[parts.length - 1].trim();
        if (!endDatePart) return null;

        const today = new Date();
        const currentYear = today.getFullYear();
        
        // Create candidate dates for previous, current, and next year
        const datesToTest = [
            new Date(`${endDatePart} ${currentYear - 1}`),
            new Date(`${endDatePart} ${currentYear}`),
            new Date(`${endDatePart} ${currentYear + 1}`),
        ];

        // Filter out any dates that failed to parse
        const validDates = datesToTest.filter(d => !isNaN(d.getTime()));

        if (validDates.length === 0) {
            return null; // Can't parse at all
        }

        // Find the date that is closest in time to today's date
        const todayTimestamp = today.getTime();
        validDates.sort((a, b) => Math.abs(a.getTime() - todayTimestamp) - Math.abs(b.getTime() - todayTimestamp));

        // The closest date is the most likely candidate
        return validDates[0];

    } catch (e) {
        console.error("Error parsing duration string:", durationStr, e);
        return null;
    }
}


export default function AccountPage() {
    const { user, loading: userLoading } = useAuth();
    const router = useRouter();
    const { clients, loading: clientsLoading } = useClients();
    const [allBills, setAllBills] = useState<BillWithClientId[]>([]);
    const [billsLoading, setBillsLoading] = useState(true);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [monthFilter, setMonthFilter] = useState<number>(1);
    const [billingStatusFilter, setBillingStatusFilter] = useState<MonthlyBillingStatus>('all');
    const { toast } = useToast();

    useEffect(() => {
        if (!userLoading && user?.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [user, userLoading, router]);

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
    
    const handleBillingStatusChange = async (clientId: string, newStatus: 'Issued' | 'Not Issued') => {
        const client = clients.find(c => c.id === clientId);
        if (!client || !client.months) return;

        const monthIndex = monthFilter - 1;
        if (monthIndex < 0 || monthIndex >= client.months.length) return;

        const newMonths = [...client.months];
        newMonths[monthIndex] = {
            ...newMonths[monthIndex],
            billingStatus: newStatus,
        };
        
        const clientRef = doc(db, 'clients', clientId);
        try {
            await updateDoc(clientRef, { months: newMonths });
            toast({
                title: "Status Updated",
                description: `Billing status for ${client.name} set to ${newStatus}.`,
            });
        } catch (error) {
            console.error("Error updating billing status:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not update billing status.",
            });
        }
    };


    const clientsForTable = useMemo(() => {
        if (!clients || clients.length === 0) return [];
        const today = startOfDay(new Date());

        return clients
            .filter(c => {
                if (c.active === false || !c.months || c.months.length < monthFilter) return false;
                if (billingStatusFilter === 'all') return true;
                const monthData = c.months[monthFilter - 1];
                const currentStatus = monthData?.billingStatus || 'Not Issued';
                return currentStatus === billingStatusFilter;
            })
            .map(client => {
                const monthData = client.months?.[monthFilter - 1];
                const currentMonthName = monthData?.name;
                
                const clientMonthBills = allBills.filter(bill => 
                    bill.clientId === client.id && bill.month === currentMonthName
                );

                const totalBillAmount = clientMonthBills.reduce((acc, bill) => acc + (bill.billAmount || 0), 0);
                const totalPaid = clientMonthBills.reduce((acc, bill) => acc + (bill.balance || 0), 0); // User interprets 'balance' as 'paid'
                const totalBalanceDue = totalBillAmount - totalPaid;
                
                const billDuration = monthData?.billDuration || client.billDuration || '-';
                
                const endDate = getEndDateFromDuration(billDuration);
                let isEndingSoon = false;

                if (endDate) {
                    const daysUntilEnd = (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                    isEndingSoon = daysUntilEnd <= 7;
                }

                return {
                    ...client,
                    billDuration,
                    endDate,
                    isEndingSoon,
                    billingStatus: monthData?.billingStatus || 'Not Issued',
                    totalPaid,
                    totalBalanceDue,
                    totalBillAmount,
                };
            })
            .sort((a, b) => {
                if (a.endDate && b.endDate) {
                    return a.endDate.getTime() - b.endDate.getTime();
                }
                if (a.endDate && !b.endDate) return -1;
                if (!a.endDate && b.endDate) return 1;
                return (a.priority || 0) - (b.priority || 0);
            });
    }, [clients, monthFilter, allBills, billingStatusFilter]);

    const summaryData = useMemo(() => {
        if (!clientsForTable || clientsForTable.length === 0) {
            return { totalPaid: 0, totalUnpaid: 0, totalBilled: 0 };
        }
        return clientsForTable.reduce((acc, client) => {
            acc.totalPaid += client.totalPaid;
            acc.totalUnpaid += client.totalBalanceDue;
            acc.totalBilled += client.totalBillAmount;
            return acc;
        }, { totalPaid: 0, totalUnpaid: 0, totalBilled: 0 });
    }, [clientsForTable]);


    useEffect(() => {
        if (selectedClientId && !clientsForTable.some(c => c.id === selectedClientId)) {
            setSelectedClientId(null);
        }
    }, [selectedClientId, clientsForTable]);

    const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId) || null, [clients, selectedClientId]);
    
    const selectedClientMonthName = useMemo(() => {
        if (!selectedClient || !selectedClient.months || selectedClient.months.length < monthFilter) return null;
        return selectedClient.months[monthFilter - 1].name;
    }, [selectedClient, monthFilter]);

    const billsForSelectedClient = useMemo(() => {
        return allBills.filter(b => b.clientId === selectedClientId && b.month === selectedClientMonthName)
                       .sort((a,b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime())
    }, [allBills, selectedClientId, selectedClientMonthName]);

    const maxMonths = useMemo(() => {
        if (!clients || clients.length === 0) return 1;
        return Math.max(1, ...clients.map(c => c.months?.length || 0));
    }, [clients]);
    
    const monthFilterButtons = Array.from({ length: maxMonths }, (_, i) => i + 1);

    if (userLoading || !user || user.role !== 'admin') {
        return null;
    }

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
                        <div className="border-l border-border h-6 mx-2"></div>
                        <span className="text-sm font-medium mr-2">Filter by Status:</span>
                         <div className="flex flex-wrap gap-1">
                            <Button variant={billingStatusFilter === 'all' ? 'default' : 'outline'} size="sm" className="h-7" onClick={() => setBillingStatusFilter('all')}>All</Button>
                            <Button variant={billingStatusFilter === 'Issued' ? 'default' : 'outline'} size="sm" className="h-7" onClick={() => setBillingStatusFilter('Issued')}>Issued</Button>
                            <Button variant={billingStatusFilter === 'Not Issued' ? 'default' : 'outline'} size="sm" className="h-7" onClick={() => setBillingStatusFilter('Not Issued')}>Not Issued</Button>
                         </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <ClientBillOverviewTable
                                clients={clientsForTable}
                                selectedClientId={selectedClientId}
                                onClientSelect={setSelectedClientId}
                                loading={clientsLoading || billsLoading}
                                onStatusChange={handleBillingStatusChange}
                            />
                             <Card>
                                <CardHeader className="p-3">
                                    <CardTitle className="text-base font-headline">Billing Summary (Month {monthFilter})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableHead className="font-bold">Total Paid</TableHead>
                                                <TableCell className="font-bold text-green-600 font-mono text-right">{summaryData.totalPaid.toFixed(2)}</TableCell>
                                            </TableRow>
                                             <TableRow>
                                                <TableHead className="font-bold">Total Unpaid</TableHead>
                                                <TableCell className="font-bold text-red-600 font-mono text-right">{summaryData.totalUnpaid.toFixed(2)}</TableCell>
                                            </TableRow>
                                             <TableRow>
                                                <TableHead className="font-bold">Total Billed</TableHead>
                                                <TableCell className="font-bold font-mono text-right">{summaryData.totalBilled.toFixed(2)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>

                        <div>
                            {selectedClient ? (
                                <BillsReportTable
                                    client={selectedClient}
                                    bills={billsForSelectedClient}
                                    loading={billsLoading}
                                    activeMonthName={selectedClientMonthName}
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
