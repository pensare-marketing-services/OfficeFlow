'use client';

import type { Client, Bill, BillStatus } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

interface ClientBillOverviewTableProps {
    clients: (Client & { id: string })[];
    bills: (Bill & { id: string; clientId: string })[];
    selectedClientId: string | null;
    onClientSelect: (clientId: string) => void;
    loading: boolean;
}

const statusColors: Record<BillStatus | 'Not Issued', string> = {
    "Issued": "bg-blue-100 text-blue-800",
    "Paid": "bg-green-100 text-green-800",
    "Partially Paid": "bg-yellow-100 text-yellow-800",
    "Overdue": "bg-red-100 text-red-800",
    "Cancelled": "bg-gray-100 text-gray-800",
    "Not Issued": "bg-gray-100 text-gray-800"
};

export default function ClientBillOverviewTable({ clients, bills, selectedClientId, onClientSelect, loading }: ClientBillOverviewTableProps) {
    
    const getClientBillStatus = (clientId: string): { status: BillStatus | "Not Issued", color: string } => {
        const clientBills = bills
            .filter(b => b.clientId === clientId)
            .sort((a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime());

        if (clientBills.length === 0) {
            return { status: "Not Issued", color: statusColors["Not Issued"] };
        }
        
        // Check for highest priority status across all bills
        if (clientBills.some(b => b.status === 'Overdue')) {
            return { status: "Overdue", color: statusColors["Overdue"] };
        }
        if (clientBills.some(b => b.status === 'Partially Paid')) {
            return { status: "Partially Paid", color: statusColors["Partially Paid"] };
        }
        if (clientBills.some(b => b.status === 'Issued')) {
            return { status: "Issued", color: statusColors["Issued"] };
        }

        // If we are here, all non-cancelled bills must be Paid
        if (clientBills.every(b => b.status === 'Paid' || b.status === 'Cancelled')) {
            // If there are any paid bills, show paid. Otherwise it's all cancelled.
            if (clientBills.some(b => b.status === 'Paid')) {
                return { status: "Paid", color: statusColors["Paid"] };
            }
        }

        // Fallback to the latest bill's status (could be 'Cancelled')
        const latestBill = clientBills[0];
        return { status: latestBill.status, color: statusColors[latestBill.status] };
    };

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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={4}><Skeleton className="h-7 w-full" /></TableCell>
                                </TableRow>
                            ))}
                            {!loading && clients.map((client, index) => {
                                const { status, color } = getClientBillStatus(client.id);
                                const duration = client.billDuration || '-';

                                return (
                                    <TableRow
                                        key={client.id}
                                        onClick={() => onClientSelect(client.id)}
                                        className={cn("cursor-pointer", selectedClientId === client.id && "bg-accent")}
                                    >
                                        <TableCell className="py-1 px-2 text-[10px] font-medium">{index + 1}</TableCell>
                                        <TableCell className="py-1 px-2 text-[10px]">{client.name}</TableCell>
                                        <TableCell className="py-1 px-2 text-[10px]">{duration}</TableCell>
                                        <TableCell className="py-1 px-2 text-[10px]">
                                            <span className={cn("px-2 py-0.5 rounded-full text-xs", color)}>
                                                {status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {!loading && clients.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground p-4">
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
