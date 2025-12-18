'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { PaidPromotion, UserProfile as User } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Separator } from '../ui/separator';

type UserWithId = User & { id: string };

interface PaidPromotionsTableProps {
  clientId: string;
  users: UserWithId[];
}

const adTypes: PaidPromotion['adType'][] = [
    "EG Whatsapp", 
    "EG Instagram", 
    "EG FB Post", 
    "EG Insta Post", 
    "Traffic Web", 
    "Lead Gen", 
    "Lead Call", 
    "Profile Visit Ad", 
    "FB Page Like", 
    "Carousel Ad", 
    "IG Engage",
    "Reach Ad"
];
const statuses: PaidPromotion['status'][] = ["Active", "Stopped", "Scheduled"];

const EditableCell: React.FC<{
    value: string | number;
    onSave: (value: string | number) => void;
    type?: 'text' | 'number';
    className?: string;
}> = ({ value, onSave, type = 'text', className }) => {
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleBlur = () => {
        if (currentValue !== value) {
            onSave(type === 'number' ? Number(currentValue) || 0 : currentValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSave(type === 'number' ? Number(e.currentTarget.value) || 0 : e.currentTarget.value);
            e.currentTarget.blur();
        }
    };

    return (
        <Input
            type={type}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn("h-7 text-xs p-1 border-transparent hover:border-border focus:border-ring focus:bg-background", className)}
        />
    );
};

export default function PaidPromotionsTable({ clientId, users }: PaidPromotionsTableProps) {
    const [promotions, setPromotions] = useState<(PaidPromotion & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [oldBalance, setOldBalance] = useState(0);

    useEffect(() => {
        if (!clientId) return;
        setLoading(true);
        const promotionsQuery = query(collection(db, `clients/${clientId}/promotions`));
        const unsubscribe = onSnapshot(promotionsQuery, (snapshot) => {
            const promotionsData = snapshot.docs.map(doc => ({ ...doc.data() as PaidPromotion, id: doc.id }));
            setPromotions(promotionsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching promotions:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [clientId]);
    
    const handlePromotionChange = async (id: string, field: keyof PaidPromotion, value: any) => {
        const promotionRef = doc(db, `clients/${clientId}/promotions`, id);
        await updateDoc(promotionRef, { [field]: value });
    };

    const addPromotion = async () => {
        const newPromotion = {
            date: new Date().toISOString(),
            campaign: '',
            adType: 'Lead Call' as const,
            budget: 0,
            status: 'Active' as const,
            assignedTo: '',
            spent: 0,
            remarks: '',
            clientId,
        };
        await addDoc(collection(db, `clients/${clientId}/promotions`), newPromotion);
    };

    const deletePromotion = async (id: string) => {
        await deleteDoc(doc(db, `clients/${clientId}/promotions`, id));
    };

    const employeeUsers = useMemo(() => users.filter(u => u.role === 'employee'), [users]);

    const totalSpent = useMemo(() => promotions.reduce((acc, p) => acc + (Number(p.spent) || 0), 0), [promotions]);
    const totalBudget = useMemo(() => promotions.reduce((acc, p) => acc + (Number(p.budget) || 0), 0), [promotions]);
    const gst = totalSpent * 0.18;
    const totalWithGst = totalSpent + gst;
    const balance = oldBalance - totalWithGst;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3">
                <CardTitle className="text-base font-headline">Paid Promotions</CardTitle>
                <Button size="sm" onClick={addPromotion} className="h-7 gap-1">
                    <Plus className="h-4 w-4" />
                    Add Promotion
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[110px]">Date</TableHead>
                            <TableHead className="w-[200px]">Campaign</TableHead>
                            <TableHead>Ad Type</TableHead>
                            <TableHead>Budget</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned</TableHead>
                            <TableHead>Spent</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead className="w-[40px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <TableRow><TableCell colSpan={9} className="h-24 text-center">Loading...</TableCell></TableRow>}
                        {!loading && promotions.map((promo) => (
                            <TableRow key={promo.id}>
                                <TableCell className="p-0">
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={'ghost'}
                                                size="sm"
                                                className={cn('w-full justify-start text-left font-normal h-7 text-xs px-2', !promo.date && 'text-muted-foreground')}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {promo.date && isValid(new Date(promo.date)) ? format(new Date(promo.date), 'MMM dd') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={promo.date ? new Date(promo.date) : undefined}
                                                onSelect={(date) => handlePromotionChange(promo.id, 'date', date ? date.toISOString() : '')}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                                <TableCell className="p-0"><EditableCell value={promo.campaign} onSave={(v) => handlePromotionChange(promo.id, 'campaign', v)} /></TableCell>
                                <TableCell className="p-1">
                                    <Select value={promo.adType} onValueChange={(v: PaidPromotion['adType']) => handlePromotionChange(promo.id, 'adType', v)}>
                                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {adTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="p-0"><EditableCell value={promo.budget} onSave={(v) => handlePromotionChange(promo.id, 'budget', v)} type="number" /></TableCell>
                                <TableCell className="p-1">
                                    <Select value={promo.status} onValueChange={(v: PaidPromotion['status']) => handlePromotionChange(promo.id, 'status', v)}>
                                        <SelectTrigger className={cn("h-7 text-xs", promo.status === 'Stopped' ? 'bg-red-500 text-white' : promo.status === 'Active' ? 'bg-green-500 text-white' : '')}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="p-1">
                                    <Select value={promo.assignedTo} onValueChange={(v) => handlePromotionChange(promo.id, 'assignedTo', v)}>
                                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Assign" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {employeeUsers.map(user => <SelectItem key={user.id} value={user.username}>{user.username}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="p-0"><EditableCell value={promo.spent} onSave={(v) => handlePromotionChange(promo.id, 'spent', v)} type="number" /></TableCell>
                                <TableCell className="p-0"><EditableCell value={promo.remarks} onSave={(v) => handlePromotionChange(promo.id, 'remarks', v)} type="text" /></TableCell>
                                <TableCell className="p-0 text-center">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deletePromotion(promo.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                         {!loading && promotions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                    No promotions added yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={5}></TableCell>
                            <TableCell className="text-right font-bold">Old bal</TableCell>
                            <TableCell colSpan={2} className="p-0">
                                <Input 
                                    type="number" 
                                    value={oldBalance} 
                                    onChange={(e) => setOldBalance(Number(e.target.value))} 
                                    className="h-7 text-xs p-1 bg-yellow-200 font-bold"
                                />
                            </TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell colSpan={3}></TableCell>
                            <TableCell className="font-bold">{totalBudget.toFixed(2)}</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right font-bold">TOTAL</TableCell>
                            <TableCell className="p-1 font-bold">{totalSpent.toFixed(2)}</TableCell>
                             <TableCell className="p-1 font-bold"></TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                        <TableRow><TableCell colSpan={9} className="p-0 h-1"><Separator /></TableCell></TableRow>
                        <TableRow>
                            <TableCell colSpan={5}></TableCell>
                            <TableCell className="text-right font-bold">GST 18%</TableCell>
                            <TableCell className="p-1 font-bold">{gst.toFixed(2)}</TableCell>
                            <TableCell colSpan={2}></TableCell>
                        </TableRow>
                        <TableRow><TableCell colSpan={9} className="p-0 h-1"><Separator /></TableCell></TableRow>
                         <TableRow>
                            <TableCell colSpan={5}></TableCell>
                            <TableCell className="text-right font-bold">Total</TableCell>
                            <TableCell className="p-1 font-bold">{totalWithGst.toFixed(2)}</TableCell>
                             <TableCell colSpan={2}></TableCell>
                        </TableRow>
                        <TableRow><TableCell colSpan={9} className="p-0 h-1"><Separator /></TableCell></TableRow>
                        <TableRow>
                            <TableCell colSpan={5}></TableCell>
                            <TableCell className="text-right font-bold">Balance</TableCell>
                            <TableCell className="p-1 font-bold text-red-600">{balance.toFixed(2)}</TableCell>
                            <TableCell colSpan={2}></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
        </Card>
    );
}
