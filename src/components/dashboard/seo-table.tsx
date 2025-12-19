'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { SeoTask, UserProfile as User } from '@/lib/data';
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
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Separator } from '../ui/separator';

type UserWithId = User & { id: string };

interface SeoTableProps {
  clientId: string;
  users: UserWithId[];
}

const statuses: SeoTask['status'][] = ["Pending", "Completed"];

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

export default function SeoTable({ clientId, users }: SeoTableProps) {
    const [tasks, setTasks] = useState<(SeoTask & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!clientId) return;
        setLoading(true);
        const seoTasksQuery = query(collection(db, `clients/${clientId}/seoTasks`));
        const unsubscribe = onSnapshot(seoTasksQuery, (snapshot) => {
            const tasksData = snapshot.docs.map(doc => ({ ...doc.data() as SeoTask, id: doc.id }));
            setTasks(tasksData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching SEO tasks:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [clientId]);
    
    const handleTaskChange = async (id: string, field: keyof SeoTask, value: any) => {
        const taskRef = doc(db, `clients/${clientId}/seoTasks`, id);
        await updateDoc(taskRef, { [field]: value });
    };

    const addTask = async () => {
        const newTask: Omit<SeoTask, 'id'> = {
            date: new Date().toISOString(),
            taskName: '',
            assigneeId: '',
            status: 'Pending' as const,
            remarks: '',
            clientId,
        };
        await addDoc(collection(db, `clients/${clientId}/seoTasks`), newTask);
    };

    const deleteTask = async (id: string) => {
        await deleteDoc(doc(db, `clients/${clientId}/seoTasks`, id));
    };

    const employeeUsers = useMemo(() => users.filter(u => u.role === 'employee'), [users]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3">
                <CardTitle className="text-base font-headline">SEO</CardTitle>
                <Button size="sm" onClick={addTask} className="h-7 gap-1">
                    <Plus className="h-4 w-4" />
                    Add Task
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[110px]">Date</TableHead>
                            <TableHead className="w-[300px]">Task</TableHead>
                            <TableHead>Assigned</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead className="w-[40px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow>}
                        {!loading && tasks.map((task) => (
                            <TableRow key={task.id}>
                                <TableCell className="p-0">
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={'ghost'}
                                                size="sm"
                                                className={cn('w-full justify-start text-left font-normal h-7 text-xs px-2', !task.date && 'text-muted-foreground')}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {task.date && isValid(new Date(task.date)) ? format(new Date(task.date), 'MMM dd') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={task.date ? new Date(task.date) : undefined}
                                                onSelect={(date) => handleTaskChange(task.id, 'date', date ? date.toISOString() : '')}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                                <TableCell className="p-0"><EditableCell value={task.taskName} onSave={(v) => handleTaskChange(task.id, 'taskName', v)} /></TableCell>
                                <TableCell className="p-1">
                                    <Select value={task.assigneeId} onValueChange={(v) => handleTaskChange(task.id, 'assigneeId', v)}>
                                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Assign" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {employeeUsers.map(user => <SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                 <TableCell className="p-1">
                                    <Select value={task.status} onValueChange={(v: SeoTask['status']) => handleTaskChange(task.id, 'status', v)}>
                                        <SelectTrigger className={cn("h-7 text-xs", task.status === 'Completed' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white')}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="p-0"><EditableCell value={task.remarks} onSave={(v) => handleTaskChange(task.id, 'remarks', v)} type="text" /></TableCell>
                                <TableCell className="p-0 text-center">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTask(task.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                         {!loading && tasks.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No SEO tasks added yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
