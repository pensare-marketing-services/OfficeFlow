'use client';

import React, { useState } from 'react';
import type { Bill, BillStatus, Client } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Download, Trash2, Loader2 } from 'lucide-react';
import { IssueBillDialog } from './issue-bill-dialog';
import { generateBillPDF } from './bill-pdf';
import { saveAs } from 'file-saver';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


interface BillsReportTableProps {
    bills: (Bill & { id: string })[];
    client: Client;
    loading: boolean;
    activeMonthName: string | null;
}

const statusColors: Record<BillStatus, string> = {
    "Issued": "bg-blue-100 text-blue-800",
    "Paid": "bg-green-100 text-green-800",
    "Partially": "bg-yellow-100 text-yellow-800",
    "Overdue": "bg-red-100 text-red-800",
    "Cancelled": "bg-gray-100 text-gray-800"
};

const allStatuses: BillStatus[] = ["Issued", "Partially", "Paid", "Overdue", "Cancelled"];

export default function BillsReportTable({ bills, client, loading, activeMonthName }: BillsReportTableProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill & { id: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const handleIssueNewBill = () => {
        if (!activeMonthName) {
            toast({
                variant: 'destructive',
                title: 'Cannot Issue Bill',
                description: 'A valid month must be selected for the client.',
            });
            return;
        }
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

    const handleDelete = async (billId: string) => {
        setIsDeleting(true);
        try {
            const billRef = doc(db, `clients/${client.id}/bills`, billId);
            await deleteDoc(billRef);
            toast({
                title: "Bill Deleted",
                description: "The bill has been successfully deleted.",
            });
        } catch (error) {
            console.error("Error deleting bill:", error);
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: "There was an error deleting the bill.",
            });
        } finally {
            setIsDeleting(false);
        }
    };
    
    const handleStatusChange = async (billId: string, newStatus: BillStatus) => {
        try {
            const billRef = doc(db, `clients/${client.id}/bills`, billId);
            await updateDoc(billRef, { status: newStatus });
            toast({
                title: "Status Updated",
                description: "The bill status has been changed.",
            });
        } catch (error) {
            console.error("Error updating bill status:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "There was an error updating the bill status.",
            });
        }
    };


    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between p-3">
                    <CardTitle className="text-base font-headline">Bills Report for {client.name}</CardTitle>
                    <Button size="sm" onClick={handleIssueNewBill} className="h-7 gap-1">
                        <Plus className="h-4 w-4" />
                        Issue Bill
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px] text-[10px]">No</TableHead>
                                <TableHead className="text-[10px]">Duration</TableHead>
                                <TableHead className="w-[120px] text-[10px]">Status</TableHead>
                                <TableHead className="w-[50px] text-center text-[10px]">View</TableHead>
                                <TableHead className="text-right text-[10px]">Bill Amount</TableHead>
                                <TableHead className="text-right text-[10px]">Balance</TableHead>
                                <TableHead className="w-[80px] text-center text-[10px]">Actions</TableHead>
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
                                        <Select value={bill.status} onValueChange={(newStatus: BillStatus) => handleStatusChange(bill.id, newStatus)}>
                                            <SelectTrigger className={cn("h-7 text-xs border-0 focus:ring-0", statusColors[bill.status])}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {allStatuses.map(status => (
                                                    <SelectItem key={status} value={status}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("h-2 w-2 rounded-full", statusColors[status].replace('bg-','').replace('-100','').replace(/text-.*/, ''))} />
                                                            {status}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="p-0 text-center">
                                         <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewBill(bill)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                    <TableCell className="py-1 px-2 text-[10px] text-right">{bill.billAmount.toFixed(2)}</TableCell>
                                    <TableCell className="py-1 px-2 text-[10px] text-right">{bill.balance.toFixed(2)}</TableCell>
                                    <TableCell className="p-0 text-center">
                                         <div className="flex items-center justify-center gap-0">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Confirm Download</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to download the PDF for bill #{bill.slNo}?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDownload(bill)}>Download</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete bill #{bill.slNo}.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            disabled={isDeleting}
                                                            onClick={() => handleDelete(bill.id)}
                                                            className="bg-destructive hover:bg-destructive/90"
                                                        >
                                                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            Yes, delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && bills.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No bills issued for this month.
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
                existingBill={selectedBill}
                billCount={bills.length}
                activeMonthName={activeMonthName}
            />
        </>
    );
}
