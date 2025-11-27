'use client';

import React from 'react';
import type { Task, UserProfile as User, ProgressNote } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MessageSquare, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';

type UserWithId = User & { id: string };

type ContentType = 'Image Ad' | 'Video Ad' | 'Carousel' | 'Backend Ad' | 'Story' | 'Web Blogs';
type ContentStatus = 'Scheduled' | 'On Work' | 'For Approval' | 'Approved' | 'Posted' | 'Hold';

interface ContentScheduleProps {
    tasks: (Task & { id: string })[];
    users: UserWithId[];
    onTaskUpdate: (task: Partial<Task> & { id: string }) => void;
}

const contentTypes: ContentType[] = ['Image Ad', 'Video Ad', 'Carousel', 'Backend Ad', 'Story', 'Web Blogs'];
const statuses: ContentStatus[] = ['Scheduled', 'On Work', 'For Approval', 'Approved', 'Posted', 'Hold'];

const getInitials = (name: string) => name ? name.split(' ').map((n) => n[0]).join('').toUpperCase() : '';

const statusColors: Record<ContentStatus, string> = {
    Scheduled: 'bg-blue-500',
    'On Work': 'bg-yellow-500',
    'For Approval': 'bg-orange-500',
    Approved: 'bg-green-500',
    Posted: 'bg-purple-500',
    Hold: 'bg-gray-500',
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

export default function ContentSchedule({ tasks, users, onTaskUpdate }: ContentScheduleProps) {
    const { user: currentUser } = useAuth();
    
    const handleFieldChange = (taskId: string, field: keyof Task, value: any) => {
        onTaskUpdate({ id: taskId, [field]: value });
    };

    const handleNewNote = (e: React.KeyboardEvent<HTMLTextAreaElement>, task: Task & { id: string }) => {
        if (e.key === 'Enter' && !e.shiftKey && currentUser) {
            e.preventDefault();
            const noteText = e.currentTarget.value.trim();
            if(noteText){
                const newNote: ProgressNote = { 
                    note: noteText, 
                    date: new Date().toISOString(),
                    authorId: currentUser.uid,
                    authorName: currentUser.name,
                    readBy: [currentUser.uid],
                };
                handleFieldChange(task.id, 'progressNotes', [...(task.progressNotes || []), newNote]);
                e.currentTarget.value = '';
            }
        }
    }
    
    const handleMarkAsRead = (task: Task & {id: string}) => {
        if (!currentUser) return;
        const updatedNotes = (task.progressNotes || []).map(note => {
            if (note.readBy && !note.readBy.includes(currentUser.uid)) {
                return { ...note, readBy: [...note.readBy, currentUser.uid] };
            }
            return note;
        });
        if (JSON.stringify(updatedNotes) !== JSON.stringify(task.progressNotes)) {
             handleFieldChange(task.id, 'progressNotes', updatedNotes);
        }
    }

    const handleClearChat = (taskId: string) => {
        handleFieldChange(taskId, 'progressNotes', []);
    }

    const employeeUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u => u.role === 'employee');
    }, [users]);

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
                                <TableHead className="w-[140px]">Status</TableHead>
                                <TableHead className="w-[150px]">Assigned To</TableHead>
                                <TableHead className="w-[80px]">Remarks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.map((task) => {
                                const unreadCount = currentUser ? (task.progressNotes || []).filter(n => n.readBy && !n.readBy.includes(currentUser.uid)).length : 0;
                                
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
                                        <EditableTableCell value={task.description} onSave={(value) => handleFieldChange(task.id, 'description', value)} type="textarea" />
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
                                        <Select value={task.status as ContentStatus} onValueChange={(value: ContentStatus) => handleFieldChange(task.id, 'status', value)}>
                                            <SelectTrigger>
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("h-2 w-2 rounded-full", statusColors[task.status as ContentStatus])} />
                                                    <SelectValue />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statuses.map(status => (
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
                                        <Select
                                            value={task.assigneeId || 'unassigned'}
                                            onValueChange={(value) => handleFieldChange(task.id, 'assigneeId', value === 'unassigned' ? '' : value)}
                                        >
                                            <SelectTrigger>
                                                {task.assigneeId && users.find(u => u.id === task.assigneeId) ? (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={users.find(u => u.id === task.assigneeId)?.avatar} />
                                                            <AvatarFallback>{getInitials(users.find(u => u.id === task.assigneeId)?.name || '')}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="truncate">{users.find(u => u.id === task.assigneeId)?.name}</span>
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
                                    </TableCell>
                                    <TableCell className="text-center">
                                         <Popover onOpenChange={(open) => open && handleMarkAsRead(task)}>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={!task.assigneeId} className="relative">
                                                    <MessageSquare className="h-5 w-5" />
                                                    {unreadCount > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 justify-center p-0">{unreadCount}</Badge>}
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
                                                                        <p>{note.note}</p>
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
                                                    <Textarea 
                                                        placeholder="Add a new remark..."
                                                        onKeyDown={(e) => handleNewNote(e, task)}
                                                    />
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
