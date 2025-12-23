'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Task, UserProfile as User, ContentType } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isValid } from 'date-fns';
import { cn, capitalizeSentences } from '@/lib/utils';

type UserWithId = User & { id: string };
type TaskWithId = Task & { id: string };

interface WebsiteTableProps {
  clientId: string;
  users: UserWithId[];
  tasks: TaskWithId[];
  onTaskAdd: (task: Omit<Task, 'id' | 'createdAt' | 'activeAssigneeIndex'>) => void;
  onTaskUpdate: (taskId: string, task: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
}

const allStatuses: Task['status'][] = ['To Do', 'Scheduled', 'On Work', 'For Approval', 'Approved', 'Posted', 'Hold', 'Ready for Next'];

const statusColors: Record<string, string> = {
    'To Do': 'bg-gray-500 text-white',
    'Scheduled': 'bg-gray-500 text-white',
    'On Work': 'bg-orange-500 text-white',
    'For Approval': 'bg-yellow-500 text-black',
    'Approved': 'bg-green-600 text-white',
    'Posted': 'bg-purple-500 text-white',
    'Hold': 'bg-gray-500 text-white',
    'Ready for Next': 'bg-teal-500 text-white',
    'Reschedule': 'bg-rose-500 text-white',
    'Overdue': 'bg-red-600 text-white',
    'Running': 'bg-blue-500 text-white',
    'Completed': 'bg-green-600 text-white',
};

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
            className={cn("h-7 text-xs p-1 border-transparent hover:border-border focus:border-ring focus:bg-background", className)}
        />
    );
};

export default function WebsiteTable({ clientId, users, tasks, onTaskAdd, onTaskUpdate, onTaskDelete }: WebsiteTableProps) {
    
    const handleTaskChange = (id: string, field: keyof Task, value: any) => {
        onTaskUpdate(id, { [field]: value });
    };

    const addTask = () => {
        const deadline = new Date();
        deadline.setHours(23, 59, 59, 999); // Set to end of today

        const newTask: Omit<Task, 'id' | 'createdAt'> = {
            title: '',
            description: '',
            status: 'Scheduled',
            priority: 99,
            deadline: deadline.toISOString(),
            assigneeIds: [],
            progressNotes: [],
            clientId,
            contentType: 'Website',
        };
        onTaskAdd(newTask);
    };

    const employeeUsers = useMemo(() => users.filter(u => u.role === 'employee'), [users]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3">
                <CardTitle className="text-base font-headline">Website</CardTitle>
                <Button size="sm" onClick={addTask} className="h-7 gap-1">
                    <Plus className="h-4 w-4" />
                    Add Task
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px] px-2 text-xs">Sl.No</TableHead>
                            <TableHead className="w-[110px]">Date</TableHead>
                            <TableHead className="w-[150px]">Task</TableHead>
                            <TableHead>Assigned</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[250px]">Remarks</TableHead>
                            <TableHead className="w-[40px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.map((task, index) => (
                            <TableRow key={task.id}>
                                <TableCell className="px-2 py-1 text-xs text-center">{index + 1}</TableCell>
                                <TableCell className="p-0">
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={'ghost'}
                                                size="sm"
                                                className={cn('w-full justify-start text-left font-normal h-7 text-xs px-2', !task.deadline && 'text-muted-foreground')}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {task.deadline && isValid(new Date(task.deadline)) ? format(new Date(task.deadline), 'MMM dd') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={task.deadline ? new Date(task.deadline) : undefined}
                                                onSelect={(date) => handleTaskChange(task.id, 'deadline', date ? date.toISOString() : '')}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                                <TableCell className="p-0"><EditableCell value={task.title} onSave={(v) => handleTaskChange(task.id, 'title', v)} /></TableCell>
                                <TableCell className="p-1">
                                    <Select value={task.assigneeIds && task.assigneeIds.length > 0 ? task.assigneeIds[0] : 'unassigned'} onValueChange={(v) => handleTaskChange(task.id, 'assigneeIds', v === 'unassigned' ? [] : [v])}>
                                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Assign" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {employeeUsers.map(user => <SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                 <TableCell className="p-1">
                                    <Select value={task.status} onValueChange={(v: Task['status']) => handleTaskChange(task.id, 'status', v)}>
                                        <SelectTrigger className={cn("h-7 text-xs", statusColors[task.status] || 'bg-gray-500 text-white')}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="p-0"><EditableCell value={task.description} onSave={(v) => handleTaskChange(task.id, 'description', v)} type="text" /></TableCell>
                                <TableCell className="p-0 text-center">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onTaskDelete(task.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                         {tasks.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No Website tasks added yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
