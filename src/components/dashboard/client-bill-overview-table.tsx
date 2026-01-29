'use client';

import type { Client } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type MonthlyBillingStatus = 'Issued' | 'Not Issued';

interface ClientBillOverviewTableProps {
    clients: (Client & { 
        id: string; 
        billDuration: string; 
        isEndingSoon: boolean; 
        billingStatus: MonthlyBillingStatus;
        totalPaid: number;
        totalBalanceDue: number;
        totalBillAmount: number;
    })[];
    selectedClientId: string | null;
    onClientSelect: (clientId: string) => void;
    loading: boolean;
    onStatusChange: (clientId: string, newStatus: MonthlyBillingStatus) => void;
}

const monthlyStatusColors: Record<MonthlyBillingStatus, string> = {
    "Issued": "bg-blue-100 text-blue-800",
    "Not Issued": "bg-gray-100 text-gray-800",
};

export default function ClientBillOverviewTable({ clients, selectedClientId, onClientSelect, loading, onStatusChange }: ClientBillOverviewTableProps) {
    
    return (
        <Card>
            <CardHeader className="p-3">
                <CardTitle className="text-base font-headline">Client Billing Status</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                            <TableRow>
                                <TableHead className="w-[40px] text-[10px]">No</TableHead>
                                <TableHead className="text-[10px]">Client</TableHead>
                                <TableHead className="text-[10px]">Duration</TableHead>
                                <TableHead className="w-[120px] text-[10px]">Status</TableHead>
                                <TableHead className="w-[80px] text-right text-[10px]">Paid</TableHead>
                                <TableHead className="w-[80px] text-right text-[10px]">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6}><Skeleton className="h-7 w-full" /></TableCell>
                                </TableRow>
                            ))}
                            {!loading && clients.map((client, index) => {
                                const { billDuration, isEndingSoon } = client;

                                return (
                                    <TableRow
                                        key={client.id}
                                        onClick={() => onClientSelect(client.id)}
                                        className={cn("cursor-pointer", selectedClientId === client.id && "bg-accent")}
                                    >
                                        <TableCell className="py-1 px-2 text-[10px] font-medium">{index + 1}</TableCell>
                                        <TableCell className="py-1 px-2 text-[10px]">{client.name}</TableCell>
                                        <TableCell className={cn("py-1 px-2 text-[10px]", isEndingSoon && "font-bold text-red-600")}>{billDuration}</TableCell>
                                        <TableCell className="py-1 px-2 text-[10px]">
                                             <Select
                                                value={client.billingStatus}
                                                onValueChange={(newStatus: MonthlyBillingStatus) => onStatusChange(client.id, newStatus)}
                                            >
                                                <SelectTrigger 
                                                    className={cn("h-7 text-xs border-0 focus:ring-0", monthlyStatusColors[client.billingStatus])} 
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(['Issued', 'Not Issued'] as MonthlyBillingStatus[]).map(status => (
                                                        <SelectItem key={status} value={status}>
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("h-2 w-2 rounded-full", status === 'Issued' ? 'bg-blue-500' : 'bg-gray-500')} />
                                                                {status}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="py-1 px-2 text-[10px] text-right font-mono">{client.totalPaid.toFixed(2)}</TableCell>
                                        <TableCell className="py-1 px-2 text-[10px] text-right font-mono">{client.totalBalanceDue.toFixed(2)}</TableCell>
                                    </TableRow>
                                );
                            })}
                            {!loading && clients.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground p-4">
                                        No clients found for this month filter.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
