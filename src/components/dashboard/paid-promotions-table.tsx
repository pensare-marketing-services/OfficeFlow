

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { PaidPromotion, UserProfile as User, Task, ProgressNote, ContentType, Client } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CalendarIcon, MessageSquare, Pen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isValid } from 'date-fns';
import { cn, capitalizeSentences } from '@/lib/utils';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Separator } from '../ui/separator';
import { useTasks } from '@/hooks/use-tasks';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LinkifiedText } from '@/components/shared/linkified-text';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { InsertLinkPopover } from '../shared/insert-link-popover';
import * as SelectPrimitive from "@radix-ui/react-select"


type UserWithId = User & { id: string };
type ClientWithId = Client & { id: string };

interface PaidPromotionsTableProps {
    client: ClientWithId;
    users: UserWithId[];
    totalCashIn: number;
    onClientUpdate: (updatedData: Partial<Client>) => void;
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

const getInitials = (name: string = '') => name ? name.charAt(0).toUpperCase() : '';

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
        const formattedValue = typeof currentValue === 'string' && type === 'text' ? capitalizeSentences(currentValue) : currentValue;
        if (formattedValue !== value) {
            onSave(type === 'number' ? Number(formattedValue) || 0 : formattedValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const formattedValue = type === 'text' ? capitalizeSentences(e.currentTarget.value) : e.currentTarget.value;
            onSave(type === 'number' ? Number(formattedValue) || 0 : formattedValue);
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
            className={cn("h-7 text-[10px] p-1 border-transparent hover:border-border focus:border-ring focus:bg-background", className)}
        />
    );
};

export default function PaidPromotionsTable({ client, users, totalCashIn, onClientUpdate }: PaidPromotionsTableProps) {
    const { user: currentUser } = useAuth();
    const [promotions, setPromotions] = useState<(PaidPromotion & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const { addTask, updateTask, deleteTask, tasks } = useTasks();
    const [noteInput, setNoteInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
    const [editingRemark, setEditingRemark] = useState<{ promoId: string; remarkIndex: number } | null>(null);
    const [editingText, setEditingText] = useState('');
    const isAdmin = currentUser?.role === 'admin';
    const [mainBudget, setMainBudget] = useState<number | ''>(client.paidPromotionsMainBudget || 0);
    const [oldBalance, setOldBalance] = useState<number>(client.paidPromotionsOldBalance || 0);

    useEffect(() => {
        setMainBudget(client.paidPromotionsMainBudget || 0);
        setOldBalance(client.paidPromotionsOldBalance || 0);
    }, [client.paidPromotionsMainBudget, client.paidPromotionsOldBalance]);

    const handleMainBudgetChange = () => {
        onClientUpdate({ paidPromotionsMainBudget: Number(mainBudget) || 0 });
    };

    const handleOldBalanceChange = () => {
        onClientUpdate({ paidPromotionsOldBalance: Number(oldBalance) || 0 });
    };

    useEffect(() => {
        if (!client.id) return;
        setLoading(true);
        const promotionsQuery = query(collection(db, `clients/${client.id}/promotions`));
        const unsubscribe = onSnapshot(promotionsQuery, (snapshot) => {
            const promotionsData = snapshot.docs.map(doc => ({ ...doc.data() as PaidPromotion, id: doc.id }));
            setPromotions(promotionsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching promotions:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [client.id]);

    const handlePromotionChange = async (id: string, field: keyof PaidPromotion, value: any) => {
        const promotionRef = doc(db, `clients/${client.id}/promotions`, id);
        await updateDoc(promotionRef, { [field]: value });

        const updatedPromotion = { ...promotions.find(p => p.id === id), [field]: value } as PaidPromotion & { id: string };
        if (!updatedPromotion) return;
        
        const linkedTask = tasks.find(t => t.description === 'Paid Promotion' && t.clientId === client.id && t.id === updatedPromotion.linkedTaskId);

        if (field === 'status') {
             if (value === 'Stopped') {
                 if (linkedTask && linkedTask.status !== 'Completed') {
                     updateTask(linkedTask.id, { status: 'Completed' });
                 }
             } else if (value === 'Active') {
                if (linkedTask && linkedTask.status !== 'On Work') {
                    updateTask(linkedTask.id, { status: 'On Work' });
                }
             } else if (value === 'Scheduled') {
                 if (linkedTask && linkedTask.status !== 'Scheduled') {
                    updateTask(linkedTask.id, { status: 'Scheduled' });
                }
             }
        }
        if (field === 'assignedTo') {
            const employee = users.find(u => u.username === value);
            if (employee && updatedPromotion.campaign) {
                if (linkedTask) {
                    updateTask(linkedTask.id, { assigneeIds: [employee.id] });
                } else {
                    const newTask: Omit<Task, 'id' | 'createdAt'> = {
                        title: updatedPromotion.campaign,
                        description: 'Paid Promotion',
                        status: 'Scheduled',
                        priority: 2,
                        deadline: updatedPromotion.date,
                        assigneeIds: [employee.id],
                        progressNotes: [],
                        clientId: client.id,
                        contentType: updatedPromotion.adType as ContentType,
                    };
                    // addTask returns the id of the new task
                    const newTaskId = await addTask(newTask);
                    if (newTaskId) {
                        // Link the new task to the promotion
                        await updateDoc(promotionRef, { linkedTaskId: newTaskId });
                    }
                }
            } else if (linkedTask && value === 'unassigned') {
                updateTask(linkedTask.id, { assigneeIds: [] });
            }
        }
        if (field === 'campaign' && linkedTask) {
            updateTask(linkedTask.id, { title: value });
        }
        if (field === 'adType' && linkedTask) {
            updateTask(linkedTask.id, { contentType: value as ContentType });
        }
        if (field === 'date' && linkedTask) {
            updateTask(linkedTask.id, { deadline: value });
        }
    };

    const addNote = async (promoId: string, note: Partial<ProgressNote>) => {
        if (!currentUser) return;
        if (!note.note?.trim() && !note.imageUrl) return;

        const promo = promotions.find(p => p.id === promoId);
        if (!promo) return;
        const newNote: ProgressNote = {
            note: note.note ? capitalizeSentences(note.note) : '',
            imageUrl: note.imageUrl || '',
            date: new Date().toISOString(),
            authorId: currentUser.uid,
            authorName: currentUser.username,
        };
        const updatedRemarks = [...(promo.remarks || []), newNote];
        await handlePromotionChange(promoId, 'remarks', updatedRemarks);

        if (promo.linkedTaskId) {
            const linkedTask = tasks.find(t => t.id === promo.linkedTaskId);
            if (linkedTask) {
                const updatedTaskNotes = [...(linkedTask.progressNotes || []), newNote];
                updateTask(linkedTask.id, { progressNotes: updatedTaskNotes });
            }
        }
    };


    const handleNewNote = (e: React.KeyboardEvent<HTMLTextAreaElement>, promoId: string) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const noteText = noteInput.trim();
            if (noteText) {
                addNote(promoId, { note: noteText });
                setNoteInput('');
            }
        }
    };

    const handleEditRemark = (promo: PaidPromotion & { id: string }, remarkIndex: number) => {
        const remark = promo.remarks?.[remarkIndex];
        if (!remark) return;
        setEditingRemark({ promoId: promo.id, remarkIndex });
        setEditingText(remark.note || '');
    };

    const handleSaveRemark = async (promoId: string, remarkIndex: number) => {
        if (!editingRemark) return;
        const promo = promotions.find(p => p.id === promoId);
        if (!promo || !promo.remarks) return;

        const updatedRemarks = [...promo.remarks];
        updatedRemarks[remarkIndex] = { ...updatedRemarks[remarkIndex], note: editingText };

        await handlePromotionChange(promoId, 'remarks', updatedRemarks);

        setEditingRemark(null);
        setEditingText('');
    };


    const addPromotion = async () => {
        const newPromotion: Omit<PaidPromotion, 'id'> = {
            date: new Date().toISOString(),
            campaign: '',
            adType: 'Lead Call' as const,
            budget: 0,
            status: 'Scheduled' as const,
            assignedTo: '',
            spent: 0,
            remarks: [],
            clientId: client.id,
        };
        await addDoc(collection(db, `clients/${client.id}/promotions`), newPromotion);
    };

    const deletePromotion = async (id: string) => {
        const promotionToDelete = promotions.find(p => p.id === id);
        if (!promotionToDelete) return;

        await deleteDoc(doc(db, `clients/${client.id}/promotions`, id));

        if (promotionToDelete.linkedTaskId) {
            deleteTask(promotionToDelete.linkedTaskId);
        }
    };

    const employeeUsers = useMemo(() => users.filter(u => u.role === 'employee' && u.username), [users]);

    const totalSpent = useMemo(() => promotions.reduce((acc, p) => acc + (Number(p.spent) || 0), 0), [promotions]);
    const totalBudget = useMemo(() => promotions.reduce((acc, p) => acc + (Number(p.budget) || 0), 0), [promotions]);

    const gst = totalSpent * 0.18;
    const grandTotal = totalSpent + gst;

    const balance = (totalCashIn + oldBalance) - grandTotal;


    const getPromotionDisplayStatus = (promo: PaidPromotion & { id: string }): PaidPromotion['status'] => {
        if (promo.status === 'Stopped') {
            return 'Stopped';
        }
        
        const linkedTask = tasks.find(t => t.id === promo.linkedTaskId);
        if (linkedTask?.status === 'Completed') {
            return 'Active';
        }

        return promo.status;
    };


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3">
                <CardTitle className="text-base font-headline">Paid Promotions</CardTitle>
                <div className="flex items-center gap-2 text-xs font-medium">
                    Total Budget
                    <Input
                        placeholder="Budget..."
                        className="h-7 w-28 text-[10px] text-center text-right placeholder:text-[10px]"
                        type="number"
                        value={mainBudget}
                        onChange={(e) => setMainBudget(e.target.value === '' ? '' : Number(e.target.value))}
                        onBlur={handleMainBudgetChange}
                    />
                </div>
                <Button size="sm" onClick={addPromotion} className="h-7 gap-1">
                    <Plus className="h-4 w-4" />
                    Add Promotion
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[10px] px-2 text-[10px]">No</TableHead>
                            <TableHead className="w-[40px] text-[10px]">Date</TableHead>
                            <TableHead className="w-[120px] text-[10px]">Campaign</TableHead>
                            <TableHead className="w-[110px] text-[10px]">Type</TableHead>
                            <TableHead className="w-[20px] text-right text-[10px]">Budget</TableHead>
                            <TableHead className="w-[90px] text-[10px]">Status</TableHead>
                            <TableHead className="w-[90px] text-[10px]">Assign</TableHead>
                            <TableHead className="w-[70px] text-right text-[10px]">Spent</TableHead>
                            <TableHead className="w-[40px] text-[10px]">Note</TableHead>
                            <TableHead className="w-[40px] text-[10px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <TableRow><TableCell colSpan={10} className="h-24 text-center">Loading...</TableCell></TableRow>}
                        {!loading && promotions.map((promo, index) => {
                            const displayStatus = getPromotionDisplayStatus(promo);
                            return (
                            <TableRow key={promo.id}>
                                <TableCell className="px-2 py-1 text-[10px] text-center">{index + 1}</TableCell>
                                <TableCell className="p-0">
                                    <Popover open={openPopoverId === promo.id} onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? promo.id : null)}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={'ghost'}
                                                size="sm"
                                                disabled={!isAdmin}
                                                className={cn('w-full justify-start text-left font-normal h-7 text-[10px] px-2', !promo.date && 'text-muted-foreground')}
                                            >
                                                {promo.date && isValid(new Date(promo.date)) ? format(new Date(promo.date), 'MMM dd') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={promo.date ? new Date(promo.date) : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        handlePromotionChange(promo.id, 'date', date.toISOString());
                                                    }
                                                    setOpenPopoverId(null);
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                                <TableCell className="p-0 text-[10px]"><EditableCell value={promo.campaign} onSave={(v) => handlePromotionChange(promo.id, 'campaign', v)} /></TableCell>
                                <TableCell className="p-0">
                                    <Select value={promo.adType} onValueChange={(v: PaidPromotion['adType']) => handlePromotionChange(promo.id, 'adType', v)}>
                                        <SelectTrigger className="h-7 text-[10px] p-1 text-[10px]">
                                            <SelectValue />
                                            <SelectPrimitive.Icon asChild>
                                                <span />
                                            </SelectPrimitive.Icon>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {adTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="p-0 text-[10px]"><EditableCell value={promo.budget} onSave={(v) => handlePromotionChange(promo.id, 'budget', v)} type="number" className="text-right" /></TableCell>
                                <TableCell className="p-1">
                                    <Select value={displayStatus} onValueChange={(v: PaidPromotion['status']) => handlePromotionChange(promo.id, 'status', v)}>
                                        <SelectTrigger className={cn("h-7 text-[10px]", displayStatus === 'Stopped' ? 'bg-red-500 text-white' : displayStatus === 'Active' ? 'bg-green-500 text-white' : displayStatus === 'Scheduled' ? 'bg-gray-500 text-white' : '')}>
                                            <SelectValue />
                                            <SelectPrimitive.Icon asChild>
                                                <span />
                                            </SelectPrimitive.Icon>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="p-1">
                                    <Select value={promo.assignedTo || 'unassigned'} onValueChange={(v) => handlePromotionChange(promo.id, 'assignedTo', v)}>
                                        <SelectTrigger className="h-7 text-[10px]">
                                            <SelectValue placeholder="Assign" />
                                            <SelectPrimitive.Icon asChild>
                                                <span />
                                            </SelectPrimitive.Icon>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {employeeUsers.map(user => <SelectItem key={user.id} value={user.username!}>{user.username!}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="p-0 text-[10px]"><EditableCell value={promo.spent} onSave={(v) => handlePromotionChange(promo.id, 'spent', v)} type="number" className="text-right" /></TableCell>
                                <TableCell className="p-0 text-center">
                                    <Popover onOpenChange={(open) => { if (open) setNoteInput(''); }}>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="relative h-7 w-7">
                                                <MessageSquare className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80" side="left" align="end">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none text-[10px]">Note</h4>
                                                <div className="max-h-60 space-y-3 overflow-y-auto p-1">
                                                    {(promo.remarks || []).map((note: ProgressNote, remarkIndex: number) => {
                                                        const author = users.find(u => u.id === note.authorId);
                                                        const authorName = author ? author.username : note.authorName;
                                                        const isEditing = editingRemark?.promoId === promo.id && editingRemark?.remarkIndex === remarkIndex;

                                                        return (
                                                            <div key={remarkIndex} className={cn("flex items-start gap-2 text-[10px] group/remark", note.authorId === currentUser?.uid ? 'justify-end' : '')}>
                                                                {note.authorId !== currentUser?.uid && (
                                                                    <Avatar className="h-6 w-6 border">
                                                                        <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                                                                    </Avatar>
                                                                )}
                                                                <div className={cn("max-w-[75%] rounded-lg p-2 relative", note.authorId === currentUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                                                    {currentUser?.role === 'admin' && !isEditing && (
                                                                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-2 w-2" onClick={() => handleEditRemark(promo, remarkIndex)}>
                                                                            <Pen className="h-2 w-2" />
                                                                        </Button>
                                                                    )}
                                                                    <p className="font-bold text-[10px] mb-1">{note.authorId === currentUser?.uid ? 'You' : authorName}</p>

                                                                    {isEditing ? (
                                                                        <Textarea
                                                                            value={editingText}
                                                                            onChange={(e) => setEditingText(e.target.value)}
                                                                            onBlur={() => handleSaveRemark(promo.id, remarkIndex)}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                                    e.preventDefault();
                                                                                    handleSaveRemark(promo.id, remarkIndex);
                                                                                } else if (e.key === 'Escape') {
                                                                                    setEditingRemark(null);
                                                                                }
                                                                            }}
                                                                            autoFocus
                                                                            className="text-[10px] h-auto bg-background/80 text-foreground"
                                                                        />
                                                                    ) : (
                                                                        <>
                                                                            {note.note && <div className="text-[11px] whitespace-pre-wrap break-words"><LinkifiedText text={note.note} /></div>}
                                                                        </>
                                                                    )}
                                                                    <p className={cn("text-right text-[9px] mt-1 opacity-70", note.authorId === currentUser?.uid ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>{format(new Date(note.date), "MMM d, HH:mm")}</p>
                                                                </div>
                                                                {note.authorId === currentUser?.uid && (
                                                                    <Avatar className="h-6 w-6 border">
                                                                        <AvatarFallback>{getInitials(currentUser.username)}</AvatarFallback>
                                                                    </Avatar>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                                <div className="relative">
                                                    <Textarea
                                                        ref={textareaRef}
                                                        placeholder="Add a remark..."
                                                        value={noteInput}
                                                        onChange={(e) => setNoteInput(e.target.value)}
                                                        onKeyDown={(e) => handleNewNote(e, promo.id)}
                                                        className="pr-8 text-[10px]"
                                                    />
                                                    <div className="absolute bottom-1 right-1">
                                                        <InsertLinkPopover
                                                            textareaRef={textareaRef}
                                                            onValueChange={setNoteInput}
                                                            onSend={(message) => addNote(promo.id, { note: message })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                                <TableCell className="p-0 text-center">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deletePromotion(promo.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )})}
                        {!loading && promotions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                    No promotions added yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <TableFooter>
                        <TableRow>

                            <TableCell colSpan={7} className="text-right font-bold text-[10px] pr-4">Total Spent</TableCell>
                            <TableCell className="p-1 font-bold text-[10px] text-right">{totalSpent.toFixed(2)}</TableCell>
                            <TableCell colSpan={2} />
                        </TableRow>

                        <TableRow><TableCell colSpan={10} className="p-0 h-2"><Separator /></TableCell></TableRow>

                        <TableRow>
                            <TableCell colSpan={7} className="text-right font-bold text-[10px] pr-4">Old Balance</TableCell>
                            <TableCell className="p-0 text-right">
                                <Input
                                    type="number"
                                    value={oldBalance}
                                    onChange={(e) => setOldBalance(Number(e.target.value))}
                                    onBlur={handleOldBalanceChange}
                                    className="h-7 text-[11px] p-0 bg-yellow-100 font-bold border-0 text-right w-full"
                                    placeholder="Old Balance"
                                />
                            </TableCell>
                            <TableCell colSpan={2} />
                        </TableRow>

                        <TableRow><TableCell colSpan={10} className="p-0 h-1"><Separator /></TableCell></TableRow>

                        <TableRow>
                            <TableCell colSpan={7} className="text-right font-bold text-[10px] pr-4">GST 18%</TableCell>
                            <TableCell className="p-1 font-bold text-[10px] text-right">{gst.toFixed(2)}</TableCell>
                            <TableCell colSpan={2} />
                        </TableRow>
                        <TableRow>
                        <TableCell colSpan={4} className="text-right font-bold text-[10px] pr-4">Budget</TableCell>
                        <TableCell className="p-1 font-bold text-[10px] text-right">{totalBudget.toFixed(2)}</TableCell>
                            <TableCell colSpan={2} className="text-right font-bold text-[10px] pr-4">Grand Total</TableCell>
                            <TableCell className="p-1 font-bold text-[10px] text-right">{grandTotal.toFixed(2)}</TableCell>
                            <TableCell colSpan={2} />
                        </TableRow>

                        <TableRow>
                            <TableCell colSpan={7} className="text-right font-bold text-[10px] pr-4">Balance</TableCell>
                            <TableCell className="p-1 font-bold text-[10px] text-right">
                                <span className={cn(balance < 0 ? "text-red-600" : "text-green-600")}>
                                    {balance.toFixed(2)}
                                </span>
                            </TableCell>
                            <TableCell colSpan={2} />
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
        </Card>
    );
}
