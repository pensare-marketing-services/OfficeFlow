
'use client';

import React, { useState } from 'react';
import type { Bill, BillStatus, Client } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Download, Share2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { IssueBillDialog } from './issue-bill-dialog';
import { generateBillPDF } from './bill-pdf';
import { saveAs } from 'file-saver';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

interface BillsReportTableProps {
    bills: (Bill & { id: string })[];
    client: Client;
    loading: boolean;
    activeMonth: string;
}

const statusColors: Record<BillStatus, string> = {
    "Issued": "bg-blue-100 text-blue-800",
    "Paid": "bg-green-100 text-green-800",
    "Overdue": "bg-red-100 text-red-800",
    "Cancelled": "bg-gray-100 text-gray-800"
};

export default function BillsReportTable({ bills, client, loading, activeMonth }: BillsReportTableProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill & { id: string } | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const handleIssueNewBill = () => {
        setSelectedBill(null);
        setDialogOpen(true);
    };

    const handleViewBill = (bill: Bill & { id: string }) => {
        setSelectedBill(bill);
        setDialogOpen(true);
    };
    
    const handleDownload = (bill: Bill & { id: string }) => {
        const pdfBlob = generateBillPDF(bill, client);
        saveAs(pdfBlob, `Bill_${client.name}_${bill.slNo}.pdf`);
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between p-3">
                    <CardTitle className="text-base font-headline">Bills Report</CardTitle>
                    <Button size="sm" onClick={handleIssueNewBill} className="h-7 gap-1">
                        <Plus className="h-4 w-4" />
                        Issue Bill
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px] text-[10px]">Sl No</TableHead>
                                <TableHead className="text-[10px]">Duration</TableHead>
                                <TableHead className="w-[100px] text-[10px]">Status</TableHead>
                                <TableHead className="text-[10px]">View</TableHead>
                                <TableHead className="text-right text-[10px]">Bill Amount</TableHead>
                                <TableHead className="text-right text-[10px]">Balance</TableHead>
                                <TableHead className="w-[60px] text-center text-[10px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={7}><Skeleton className="h-7 w-full" /></TableCell>
                                </TableRow>
                            ))}
                            {!loading && bills.map((bill) => (
                                <TableRow key={bill.id}>
                                    <TableCell className="py-1 px-2 text-[10px] font-medium">{bill.slNo}</TableCell>
                                    <TableCell className="py-1 px-2 text-[10px]">{bill.duration}</TableCell>
                                    <TableCell className="py-1 px-2 text-[10px]">
                                        <span className={cn("px-2 py-0.5 rounded-full text-xs", statusColors[bill.status])}>
                                            {bill.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-1 px-2 text-[10px] truncate">{bill.view}</TableCell>
                                    <TableCell className="py-1 px-2 text-[10px] text-right">{bill.billAmount.toFixed(2)}</TableCell>
                                    <TableCell className="py-1 px-2 text-[10px] text-right">{bill.balance.toFixed(2)}</TableCell>
                                    <TableCell className="p-0 text-center">
                                        <DropdownMenu 
                                            open={openMenuId === bill.id} 
                                            onOpenChange={(isOpen) => setOpenMenuId(isOpen ? bill.id : null)}
                                        >
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={(e) => {
                                                    e.preventDefault();
                                                    setOpenMenuId(null);
                                                    handleViewBill(bill);
                                                }}>
                                                    <Eye className="mr-2 h-4 w-4" /> View/Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleDownload(bill)}>
                                                    <Download className="mr-2 h-4 w-4" /> Download
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleDownload(bill)}>
                                                    <Share2 className="mr-2 h-4 w-4" /> Share
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && bills.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No bills issued for this month yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <IssueBillDialog 
                isOpen={dialogOpen} 
                setIsOpen={setDialogOpen} 
                client={client}
                activeMonth={activeMonth}
                existingBill={selectedBill}
                billCount={bills.length}
            />
        </>
    );
}
