'use client';

import React, { useState, useMemo } from 'react';
import type { Task, UserProfile, Client, ProgressNote } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, capitalizeSentences } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LinkifiedText } from '../shared/linkified-text';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';


type UserWithId = UserProfile & { id: string };
type ClientWithId = Client & { id: string };
type TaskWithId = Task & { id: string };

interface EmployeeMasterViewProps {
  tasks: TaskWithId[];
  users: UserWithId[];
  clients: ClientWithId[];
}

const statusColors: Record<string, string> = {
    'On Work': 'bg-orange-500/20',
    'For Approval': 'bg-yellow-500/20',
    'Approved': 'bg-green-600/20',
    'Posted': 'bg-purple-500/20',
    'Hold': 'bg-gray-500/20',
    'Ready for Next': 'bg-teal-500/20',
};

const getInitials = (name: string = '') => name ? name.charAt(0).toUpperCase() : '';

const TaskCell = ({ task }: { task: TaskWithId }) => {
    if (!task) return <TableCell className="p-1"></TableCell>;
    const { user: currentUser } = useAuth();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div 
                    className={cn(
                        "h-full w-full cursor-pointer p-1 text-xs font-medium hover:bg-opacity-40",
                         statusColors[task.status] || 'bg-transparent'
                    )}
                >
                    {task.title}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="bottom" align="start">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none text-sm">{task.title}</h4>
                     <div className="max-h-60 space-y-3 overflow-y-auto p-1">
                        {(task.progressNotes || []).map((note, i) => {
                             const authorName = note.authorName || 'User';
                             return (
                                <div key={i} className={cn("flex items-start gap-2 text-xs", note.authorId === currentUser?.uid ? 'justify-end' : '')}>
                                    {note.authorId !== currentUser?.uid && (
                                        <Avatar className="h-6 w-6 border">
                                            <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn("max-w-[75%] rounded-lg p-2", note.authorId === currentUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                        <p className="font-bold text-xs mb-1">{note.authorId === currentUser?.uid ? 'You' : authorName}</p>
                                        {note.note && <div className="text-[11px] whitespace-pre-wrap break-words"><LinkifiedText text={note.note} /></div>}
                                        {note.imageUrl && (
                                             <Dialog>
                                                <DialogTrigger asChild>
                                                    <img src={note.imageUrl} alt="remark" className="mt-1 rounded-md max-w-full h-auto cursor-pointer" />
                                                </DialogTrigger>
                                                <DialogContent className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                                                    <DialogHeader className="sr-only">
                                                        <DialogTitle>Image Preview</DialogTitle>
                                                        <DialogDescription>A full-screen view of the image attached to the remark.</DialogDescription>
                                                    </DialogHeader>
                                                    <img src={note.imageUrl} alt="remark full view" className="max-w-full max-h-full object-contain" />
                                                </DialogContent>
                                            </Dialog>
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
                         {(task.progressNotes || []).length === 0 && (
                            <p className="text-center text-xs text-muted-foreground py-4">No remarks for this task.</p>
                         )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default function EmployeeMasterView({ tasks, users, clients }: EmployeeMasterViewProps) {

    const employees = useMemo(() => 
        users.filter(u => u.role === 'employee').sort((a,b) => (a.priority || 99) - (b.priority || 99))
    , [users]);

    const dmClients = useMemo(() =>
        clients
        .filter(c => c.categories?.includes('digital marketing') || c.categories?.includes('gd'))
        .sort((a,b) => (a.priority || 99) - (b.priority || 99))
    , [clients]);
    
    const clientTasks = useMemo(() => {
        const map = new Map<string, TaskWithId>();
        tasks.forEach(task => {
            const activeAssigneeId = task.assigneeIds?.[task.activeAssigneeIndex ?? 0];
            if (task.clientId && activeAssigneeId) {
                const key = `${task.clientId}-${activeAssigneeId}`;
                // Simple logic: last task wins for a given client/assignee cell
                map.set(key, task);
            }
        });
        return map;
    }, [tasks]);

    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table className="border-collapse w-full">
                        <TableHeader>
                            <TableRow className="h-10">
                                <TableHead className="w-12 text-center text-xs p-1 border">Sl. No</TableHead>
                                <TableHead className="w-40 text-xs p-1 border">Client Name</TableHead>
                                <TableHead className="w-40 text-xs p-1 border">Assigned</TableHead>
                                {employees.map(employee => (
                                    <TableHead key={employee.id} className="w-40 text-xs p-1 border text-center">
                                        {employee.username}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dmClients.map((client, index) => {
                                const assignedEmployees = (client.employeeIds || [])
                                    .map(id => users.find(u => u.id === id)?.username)
                                    .filter(Boolean)
                                    .join(', ');

                                return (
                                <TableRow key={client.id} className="h-10">
                                    <TableCell className="text-center p-1 border text-sm">{index + 1}</TableCell>
                                    <TableCell className="p-1 border text-sm font-medium">{client.name}</TableCell>
                                    <TableCell className="p-1 border text-xs">{assignedEmployees}</TableCell>
                                    {employees.map(employee => {
                                        const task = clientTasks.get(`${client.id}-${employee.id}`);
                                        return (
                                            <TableCell key={employee.id} className="p-0 border">
                                                {task ? <TaskCell task={task} /> : null}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </div>
                 {dmClients.length === 0 && (
                    <div className="text-center text-muted-foreground p-8">No Digital Marketing or GD clients found.</div>
                )}
            </CardContent>
        </Card>
    );
}
