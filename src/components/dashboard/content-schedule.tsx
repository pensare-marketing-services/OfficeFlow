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
import { CalendarIcon, MessageSquare, Trash2, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';


type UserWithId = User & { id: string };

type ContentType = 'Image Ad' | 'Video Ad' | 'Carousel' | 'Backend Ad' | 'Story' | 'Web Blogs';

interface ContentScheduleProps {
    tasks: (Task & { id: string })[];
    users: UserWithId[];
    onTaskUpdate: (task: Partial<Task> & { id: string }) => void;
}

const contentTypes: ContentType[] = ['Image Ad', 'Video Ad', 'Carousel', 'Backend Ad', 'Story', 'Web Blogs'];
const allStatuses: TaskStatus[] = ['To Do', 'In Progress', 'Done', 'Overdue', 'Scheduled', 'On Work', 'For Approval', 'Approved', 'Posted', 'Hold'];
const completedStatuses: Task['status'][] = ['Done', 'Posted', 'Approved'];

const MAX_IMAGE_SIZE_BYTES = 700 * 1024; // 700KB

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
         return <Textarea defaultValue={value} onBlur={handleBlur} onKeyDown={handleKeyDown} className="bg-transparent border-0 focus-visible:ring-1 text-xs p-1 h-auto" />;
    }

    return <Input defaultValue={value} onBlur={handleBlur} onKeyDown={handleKeyDown} className="bg-transparent border-0 focus-visible:ring-1 text-xs p-1 h-8" />;
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
            <SelectTrigger className="w-[120px] h-8 text-xs p-2">
                {selectedUser ? (
                    <div className="flex items-center gap-1 truncate">
                        <Avatar className="h-5 w-5">
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
                        <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{user.name}</span>
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
    const { toast } = useToast();
    
    const handleFieldChange = (taskId: string, field: keyof Task, value: any) => {
        onTaskUpdate({ id: taskId, [field]: value });
    };

    const handleAssigneeChange = (taskId: string, index: number, newId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const newAssigneeIds = [...(task.assigneeIds || [])];
        newAssigneeIds[index] = newId;
        const finalAssignees = [...new Set(newAssigneeIds.filter(id => id))];
        onTaskUpdate({ id: taskId, assigneeIds: finalAssignees });
    };

    const addNote = (task: Task & { id: string }, note: Partial<Omit<ProgressNote, 'date' | 'authorId' | 'authorName'>>) => {
        if (!currentUser) return;

        const newNote: Partial<ProgressNote> & { date: string; authorId: string; authorName: string } = {
            note: note.note,
            date: new Date().toISOString(),
            authorId: currentUser.uid,
            authorName: currentUser.name,
        };

        if (note.imageUrl) {
            newNote.imageUrl = note.imageUrl;
        }

        handleFieldChange(task.id, 'progressNotes', [...(task.progressNotes || []), newNote]);
    }
    
    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, task: Task & { id: string }) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (!file) return;

                if (file.size > MAX_IMAGE_SIZE_BYTES) {
                    toast({
                        variant: 'destructive',
                        title: 'Image too large',
                        description: 'Please paste an image smaller than 700KB.'
                    });
                    e.preventDefault();
                    return;
                }

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
                            <TableRow className="bg-yellow-200 hover:bg-yellow-200/80">
                                <TableHead colSpan={8} className="text-center font-bold text-black">Regular Contents</TableHead>
                            </TableRow>
                            <TableRow>
                                <TableHead className="w-[50px] px-2">Sl No.</TableHead>
                                <TableHead className="w-[90px] px-2">Date</TableHead>
                                <TableHead className="min-w-[150px] px-2">Content Title</TableHead>
                                <TableHead className="min-w-[200px] px-2">Content Description</TableHead>
                                <TableHead className="w-[120px] px-2">Type</TableHead>
                                <TableHead className="w-[130px] px-2">Status</TableHead>
                                <TableHead className="w-[250px] px-2">Assigned To</TableHead>
                                <TableHead className="w-[80px] px-2 text-center">Remarks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.map((task, index) => {
                                const isCompleted = completedStatuses.includes(task.status);
                                
                                return (
                                <TableRow key={task.id} className="border-b">
                                    <TableCell className="p-2 text-center">{index + 1}</TableCell>
                                    <TableCell className="p-1">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={'ghost'}
                                                    size="sm"
                                                    className={cn('w-full justify-start text-left font-normal h-8 text-xs', !task.deadline && 'text-muted-foreground')}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {task.deadline ? format(new Date(task.deadline), 'MMM dd') : <span>Pick a date</span>}
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
                                    <TableCell className="p-1">
                                        <EditableTableCell value={task.title} onSave={(value) => handleFieldChange(task.id, 'title', value)} />
                                    </TableCell>
                                    <TableCell className="p-1">
                                        <EditableTableCell value={task.description || ''} onSave={(value) => handleFieldChange(task.id, 'description', value || '')} type="textarea" />
                                    </TableCell>
                                    <TableCell className="p-1">
                                        <Select value={task.contentType} onValueChange={(value: ContentType) => handleFieldChange(task.id, 'contentType', value)}>
                                            <SelectTrigger className="h-8 text-xs p-2"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {contentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="p-1">
                                        <Select value={task.status as TaskStatus} onValueChange={(value: TaskStatus) => handleFieldChange(task.id, 'status', value)} disabled={isCompleted && currentUser?.role === 'employee'}>
                                            <SelectTrigger className="h-8 text-xs p-2">
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
                                     <TableCell className="p-1">
                                        <div className="flex items-center gap-1">
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
                                    <TableCell className="p-1 text-center">
                                         <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={!task.assigneeIds || task.assigneeIds.length === 0} className="relative h-8 w-8">
                                                    <MessageSquare className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80" side="left" align="end">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-medium leading-none text-sm">Remarks</h4>
                                                        {(task.progressNotes || []).length > 0 && (
                                                            <Button variant="ghost" size="sm" onClick={() => handleClearChat(task.id)} className="text-xs h-7 text-muted-foreground">
                                                                <Trash2 className="mr-1 h-3 w-3" />
                                                                Clear
                                                            </Button>
                                                        )}
                                                    </div>
                                                     <div className="max-h-60 space-y-3 overflow-y-auto p-1">
                                                        {(task.progressNotes || []).map((note, i) => {
                                                            const author = users.find(u => u.id === note.authorId);
                                                            const authorName = author ? author.name : note.authorName;
                                                            const authorAvatar = author ? author.avatar : '';
                                                            return (
                                                                <div key={i} className={cn("flex items-start gap-2 text-xs", note.authorId === currentUser?.uid ? 'justify-end' : '')}>
                                                                    {note.authorId !== currentUser?.uid && (
                                                                        <Avatar className="h-6 w-6 border">
                                                                            <AvatarImage src={authorAvatar} />
                                                                            <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                                                                        </Avatar>
                                                                    )}
                                                                    <div className={cn("max-w-[75%] rounded-lg p-2", note.authorId === currentUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                                                        <p className="font-bold text-xs mb-1">{note.authorId === currentUser?.uid ? 'You' : authorName}</p>
                                                                        {note.note && <p className="text-[11px]">{note.note}</p>}
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
                                                            placeholder="Add a remark..."
                                                            value={noteInput}
                                                            onChange={(e) => setNoteInput(e.target.value)}
                                                            onKeyDown={(e) => handleNewNote(e, task)}
                                                            onPaste={(e) => handlePaste(e, task)}
                                                            className="pr-8 text-xs"
                                                            rows={2}
                                                        />
                                                        <Button size="icon" variant="ghost" className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7">
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
