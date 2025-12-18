'use client';

import React from 'react';
import type { CashInTransaction, CashInTransactionStatus } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';

interface CashInLogProps {
    clientId: string;
    transactions: (CashInTransaction & { id: string })[];
    totalCashIn: number;
}

const statuses: CashInTransactionStatus[] = ['Received', 'Not Received'];

export default function CashInLog({ clientId, transactions, totalCashIn }: CashInLogProps) {
    const [newDate, setNewDate] = React.useState<Date | undefined>(new Date());
    const [newAmount, setNewAmount] = React.useState<number | ''>('');

    const addTransaction = async () => {
        if (!newDate || newAmount === '' || newAmount <= 0) return;

        const newTransaction: Omit<CashInTransaction, 'id'> = {
            date: newDate.toISOString(),
            amount: Number(newAmount),
            status: 'Not Received',
        };
        await addDoc(collection(db, `clients/${clientId}/cashInTransactions`), newTransaction);
        setNewDate(new Date());
        setNewAmount('');
    };

    const handleTransactionChange = async (id: string, field: keyof CashInTransaction, value: any) => {
        const transactionRef = doc(db, `clients/${clientId}/cashInTransactions`, id);
        await updateDoc(transactionRef, { [field]: value });
    };

    const deleteTransaction = async (id: string) => {
        await deleteDoc(doc(db, `clients/${clientId}/cashInTransactions`, id));
    };

    return (
        <Card>
            <CardHeader className="p-3">
                <CardTitle className="text-base font-headline">Cash In Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Date</TableHead>
                            <TableHead className="w-[120px]">Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-[40px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((t) => (
                             <TableRow key={t.id}>
                                <TableCell className="py-1 px-2 text-xs">{format(new Date(t.date), 'MMM dd, yyyy')}</TableCell>
                                <TableCell className='p-1'>
                                     <Select value={t.status} onValueChange={(v: CashInTransactionStatus) => handleTransactionChange(t.id, 'status', v)}>
                                        <SelectTrigger className={cn("h-7 text-xs w-full", t.status === 'Received' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statuses.map(s => <SelectItem key={s} value={s} className="text-xs">{s === 'Received' ? 'Cash Rcvd' : 'Not Rcvd'}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="py-1 px-2 text-xs text-right font-medium">{t.amount.toFixed(2)}</TableCell>
                                <TableCell className="p-0 text-center">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTransaction(t.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {transactions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No cash-in transactions yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="p-3 flex-col items-stretch gap-2">
                 <Separator className="my-1" />
                 <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={'outline'}
                                size="sm"
                                className={cn('w-[150px] justify-start text-left font-normal h-8 text-xs', !newDate && 'text-muted-foreground')}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newDate ? format(newDate, 'MMM dd, yyyy') : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={newDate} onSelect={setNewDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <Input 
                        type="number"
                        placeholder="Amount"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="h-8 text-xs"
                    />
                    <Button size="sm" className="h-8" onClick={addTransaction} disabled={!newDate || newAmount === '' || Number(newAmount) <= 0}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <Separator className="my-1" />
                 <div className="flex justify-between items-center p-2 bg-muted rounded-md">
                    <span className="font-bold text-sm">Total Cash In</span>
                    <span className="font-bold text-sm">{totalCashIn.toFixed(2)}</span>
                </div>
            </CardFooter>
        </Card>
    );
}
