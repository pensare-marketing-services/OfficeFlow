

'use client';

import React, { useState } from 'react';
import type { Task, UserProfile as User, ProgressNote, TaskStatus } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MessageSquare, Trash2, UserPlus, X, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

type UserWithId = User & { id: string };

type ContentType = 'Image Ad' | 'Video Ad' | 'Carousel' | 'Backend Ad' | 'Story' | 'Web Blogs';
type TaskPriority = 'Low' | 'Medium' | 'High';


interface ContentScheduleProps {
    tasks: (Task & { id: string })[];
    users: UserWithId[];
    onTaskUpdate: (task: Partial<Task> & { id: string }) => void;
}

const contentTypes: ContentType[] = ['Image Ad', 'Video Ad', 'Carousel', 'Backend Ad', 'Story', 'Web Blogs'];
const allStatuses: TaskStatus[] = ['To Do', 'In Progress', 'Done', 'Overdue', 'Scheduled', 'On Work', 'For Approval', 'Approved', 'Posted', 'Hold'];
const employeeStatuses: TaskStatus[] = ['Scheduled', 'In Progress', 'For Approval'];
const priorities: TaskPriority[] = ['Low', 'Medium', 'High'];
const completedStatuses: Task['status'][] = ['Done', 'Posted', 'Approved'];


const getInitials = (name: string) => name ? name.split(' ').map((n) => n[0]).join('').toUpperCase() : '';

const statusColors: Record<TaskStatus, string> = {
    'To Do': 'bg-gray-500',
    'In Progress': 'bg-blue-500',
    Scheduled: 'bg-blue-500',
    'On Work': 'bg-yellow-500',
    'For Approval': 'bg-orange-500',
    Approved: 'bg-green-500',
    Done: 'bg-green-500',
    Posted: 'bg-purple-500',
    Hold: 'bg-gray-500',
    Overdue: 'bg-red-500'
};

const EditableTableCell: React.FC<{ value: string; onSave: (value: string) => void; type?: 'text' | 'textarea' }> = ({ value, onSave, type = 'text' }) => {
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onSave(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSave(e.currentTarget.value);
            e.currentTarget.blur();
        }
    };
    
    if (type === 'textarea') {
         return <Textarea defaultValue={value} onBlur={handleBlur} onKeyDown={handleKeyDown} className="bg-transparent border-0 focus-visible:ring-1 text-xs" />;
    }

    return <Input defaultValue={value} onBlur={handleBlur} onKeyDown={handleKeyDown} className="bg-transparent border-0 focus-visible:ring-1 text-xs" />;
};

const AssigneeSelect = ({
    assigneeId,
    onAssigneeChange,
    employeeUsers
}: {
    assigneeId: string | undefined;
    onAssigneeChange: (newId: string) => void;
    employeeUsers: UserWithId[];
}) => {
    const selectedUser = employeeUsers.find(u => u.id === assigneeId);
    return (
        <Select
            value={assigneeId || 'unassigned'}
            onValueChange={(value) => onAssigneeChange(value === 'unassigned' ? '' : value)}
        >
            <SelectTrigger className="w-[150px]">
                {selectedUser ? (
                    <div className="flex items-center gap-2 truncate">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedUser.avatar} />
                            <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{selectedUser.name}</span>
                    </div>
                ) : <SelectValue placeholder="Assign..." />}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {employeeUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-3">
                                <Avatar className="h-6 w-6">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};


export default function ContentSchedule({ tasks, users, onTaskUpdate }: ContentScheduleProps) {
    const { user: currentUser } = useAuth();
    const [noteInput, setNoteInput] = useState('');
    
    const handleFieldChange = (taskId: string, field: keyof Task, value: any) => {
        onTaskUpdate({ id: taskId, [field]: value });
    };

    const handleAssigneeChange = (taskId: string, index: number, newId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const newAssigneeIds = [...(task.assigneeIds || [])];
        newAssigneeIds[index] = newId;
        // Filter out empty strings and duplicates
        const finalAssignees = [...new Set(newAssigneeIds.filter(id => id))];
        onTaskUpdate({ id: taskId, assigneeIds: finalAssignees });
    };

    const addNote = (task: Task & { id: string }, note: Partial<ProgressNote>) => {
        if (!currentUser) return;
        
        const newNote: ProgressNote = { 
            note: note.note || '',
            imageUrl: note.imageUrl,
            date: new Date().toISOString(),
            authorId: currentUser.uid,
            authorName: currentUser.name,
        };

        handleFieldChange(task.id, 'progressNotes', [...(task.progressNotes || []), newNote]);
    }
    
    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, task: Task & { id: string }) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    if(event.target && typeof event.target.result === 'string') {
                       addNote(task, { imageUrl: event.target.result });
                    }
                };
                reader.readAsDataURL(file);
                e.preventDefault();
                return;
            }
        }
    };

    const handleNewNote = (e: React.KeyboardEvent<HTMLTextAreaElement>, task: Task & { id: string }) => {
        if (e.key === 'Enter' && !e.shiftKey && currentUser) {
            e.preventDefault();
            const noteText = noteInput.trim();
            if(noteText){
                addNote(task, { note: noteText });
                setNoteInput('');
            }
        }
    }

    const handleClearChat = (taskId: string) => {
        handleFieldChange(taskId, 'progressNotes', []);
    }

    const employeeUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u => u.role === 'employee');
    }, [users]);
    
    const availableStatuses = currentUser?.role === 'employee' ? 
        ['In Progress', 'For Approval'] : 
        allStatuses;


    if (tasks.length === 0) {
        return (
             <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-card">
                <div className="text-center">
                <h3 className="font-headline text-lg font-semibold">No Content Scheduled</h3>
                <p className="text-muted-foreground">Click "Schedule" to get started.</p>
                </div>
            </div>
        )
    }

    return (
        <Card>
            <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <Table className="text-xs">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Date</TableHead>
                                <TableHead className="min-w-[150px]">Content Title</TableHead>
                                <TableHead className="min-w-[250px]">Content Description</TableHead>
                                <TableHead className="w-[130px]">Type</TableHead>
                                <TableHead className="w-[120px]">Priority</TableHead>
                                <TableHead className="w-[140px]">Status</TableHead>
                                <TableHead className="w-[320px]">Assigned To</TableHead>
                                <TableHead className="w-[80px]">Remarks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.map((task) => {
                                const isCompleted = completedStatuses.includes(task.status);
                                
                                return (
                                <TableRow key={task.id}>
                                    <TableCell>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={'ghost'}
                                                    size="icon"
                                                    className={cn('w-full justify-center text-left font-normal', !task.deadline && 'text-muted-foreground')}
                                                >
                                                    <CalendarIcon className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={task.deadline ? new Date(task.deadline) : undefined}
                                                    onSelect={(date) => handleFieldChange(task.id, 'deadline', date ? date.toISOString() : '')}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                    <TableCell>
                                        <EditableTableCell value={task.title} onSave={(value) => handleFieldChange(task.id, 'title', value)} />
                                    </TableCell>
                                    <TableCell>
                                        <EditableTableCell value={task.description || ''} onSave={(value) => handleFieldChange(task.id, 'description', value)} type="textarea" />
                                    </TableCell>
                                    <TableCell>
                                        <Select value={task.contentType} onValueChange={(value: ContentType) => handleFieldChange(task.id, 'contentType', value)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {contentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                     <TableCell>
                                        <Select value={task.priority} onValueChange={(value: TaskPriority) => handleFieldChange(task.id, 'priority', value)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Select value={task.status as TaskStatus} onValueChange={(value: TaskStatus) => handleFieldChange(task.id, 'status', value)} disabled={isCompleted && currentUser?.role === 'employee'}>
                                            <SelectTrigger>
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("h-2 w-2 rounded-full", statusColors[task.status as TaskStatus])} />
                                                    <SelectValue />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableStatuses.map(status => (
                                                    <SelectItem key={status} value={status}>
                                                         <div className="flex items-center gap-2">
                                                            <div className={cn("h-2 w-2 rounded-full", statusColors[status])} />
                                                            {status}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                     <TableCell>
                                        <div className="flex items-center gap-2">
                                            <AssigneeSelect 
                                                assigneeId={task.assigneeIds ? task.assigneeIds[0] : ''}
                                                onAssigneeChange={(newId) => handleAssigneeChange(task.id, 0, newId)}
                                                employeeUsers={employeeUsers}
                                            />
                                            <AssigneeSelect
                                                assigneeId={task.assigneeIds ? task.assigneeIds[1] : ''}
                                                onAssigneeChange={(newId) => handleAssigneeChange(task.id, 1, newId)}
                                                employeeUsers={employeeUsers.filter(u => u.id !== (task.assigneeIds ? task.assigneeIds[0] : ''))}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                         <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={!task.assigneeIds || task.assigneeIds.length === 0} className="relative">
                                                    <MessageSquare className="h-5 w-5" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-96" side="bottom" align="end">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-medium leading-none">Remarks</h4>
                                                        {(task.progressNotes || []).length > 0 && (
                                                            <Button variant="ghost" size="sm" onClick={() => handleClearChat(task.id)} className="text-xs text-muted-foreground">
                                                                <Trash2 className="mr-1 h-3 w-3" />
                                                                Clear Chat
                                                            </Button>
                                                        )}
                                                    </div>
                                                     <div className="max-h-60 space-y-4 overflow-y-auto p-1">
                                                        {(task.progressNotes || []).map((note, i) => {
                                                            const author = users.find(u => u.id === note.authorId);
                                                            const authorName = author ? author.name : note.authorName;
                                                            const authorAvatar = author ? author.avatar : '';
                                                            return (
                                                                <div key={i} className={cn("flex items-start gap-3 text-sm", note.authorId === currentUser?.uid ? 'justify-end' : '')}>
                                                                    {note.authorId !== currentUser?.uid && (
                                                                        <Avatar className="h-8 w-8 border">
                                                                            <AvatarImage src={authorAvatar} />
                                                                            <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                                                                        </Avatar>
                                                                    )}
                                                                    <div className={cn("max-w-[75%] rounded-lg p-3", note.authorId === currentUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                                                        <p className="font-bold text-xs mb-1">{note.authorId === currentUser?.uid ? 'You' : authorName}</p>
                                                                        {note.note && <p>{note.note}</p>}
                                                                        {note.imageUrl && (
                                                                             <Dialog>
                                                                                <DialogTrigger asChild>
                                                                                    <img src={note.imageUrl} alt="remark" className="mt-2 rounded-md max-w-full h-auto cursor-pointer" />
                                                                                </DialogTrigger>
                                                                                <DialogContent className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                                                                                    <img src={note.imageUrl} alt="remark full view" className="max-w-full max-h-full object-contain" />
                                                                                </DialogContent>
                                                                            </Dialog>
                                                                        )}
                                                                        <p className={cn("text-right text-[10px] mt-2 opacity-70", note.authorId === currentUser?.uid ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>{format(new Date(note.date), "MMM d, HH:mm")}</p>
                                                                    </div>
                                                                    {note.authorId === currentUser?.uid && (
                                                                        <Avatar className="h-8 w-8 border">
                                                                            <AvatarImage src={currentUser?.avatar} />
                                                                            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                                                                        </Avatar>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                    <div className="relative">
                                                        <Textarea 
                                                            placeholder="Add a remark or paste an image..."
                                                            value={noteInput}
                                                            onChange={(e) => setNoteInput(e.target.value)}
                                                            onKeyDown={(e) => handleNewNote(e, task)}
                                                            onPaste={(e) => handlePaste(e, task)}
                                                            className="pr-10"
                                                        />
                                                        <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                                                            <Paperclip className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
