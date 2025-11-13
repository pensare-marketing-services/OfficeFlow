'use client';

import React from 'react';
import type { Task, User, ContentType, ContentStatus } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useMemo } from 'react';

interface ContentScheduleProps {
    tasks: (Task & { id: string })[];
    users: User[];
    onTaskUpdate: (task: Partial<Task> & { id: string }) => void;
}

const contentTypes: ContentType[] = ['Image Ad', 'Video Ad', 'Carousel', 'Backend Ad', 'Story', 'Web Blogs'];
const statuses: ContentStatus[] = ['Scheduled', 'On Work', 'For Approval', 'Approved', 'Posted', 'Hold'];

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase();

const statusColors: Record<ContentStatus, string> = {
    Scheduled: 'bg-blue-500',
    'On Work': 'bg-yellow-500',
    'For Approval': 'bg-orange-500',
    Approved: 'bg-green-500',
    Posted: 'bg-purple-500',
    Hold: 'bg-gray-500',
}

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
    
    const handleFieldChange = (taskId: string, field: keyof Task, value: any) => {
        onTaskUpdate({ id: taskId, [field]: value });
    };

    const employeeUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u => u.role === 'employee');
    }, [users]);

    if (tasks.length === 0) {
        return (
             <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-card">
                <div className="text-center">
                <h3 className="font-headline text-lg font-semibold">No Content Scheduled</h3>
                <p className="text-muted-foreground">Click "Add Content" to get started.</p>
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
                                <TableHead className="w-[80px]">References</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.map((task) => (
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
                                                    onSelect={(date) => handleFieldChange(task.id, 'deadline', date?.toISOString() || '')}
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
                                                {task.assigneeId && users.find(u => u.email === task.assigneeId) ? (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={users.find(u => u.email === task.assigneeId)?.avatar} />
                                                            <AvatarFallback>{getInitials(users.find(u => u.email === task.assigneeId)?.name || '')}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="truncate">{users.find(u => u.email === task.assigneeId)?.name}</span>
                                                    </div>
                                                ) : <SelectValue placeholder="Assign..." />}
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                                {employeeUsers.map(user => (
                                                    <SelectItem key={user.id} value={user.email}>
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
                                         <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={!task.assigneeId}>
                                                    <MessageSquare className="h-5 w-5" />
                                                    {task.progressNotes?.length > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0">{task.progressNotes.length}</Badge>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80">
                                                <div className="space-y-4">
                                                    <h4 className="font-medium leading-none">References</h4>
                                                     <div className="max-h-48 space-y-2 overflow-y-auto">
                                                        {(task.progressNotes || []).slice().reverse().map((note, i) => (
                                                        <div key={i} className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded-md">"{note.note}"
                                                            <p className="text-right text-muted-foreground/50 text-[10px] mt-1">{format(new Date(note.date), "MMM d, HH:mm")}</p>
                                                        </div>
                                                        ))}
                                                    </div>
                                                    <Textarea 
                                                        placeholder="Add a new reference..."
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                if(e.currentTarget.value.trim()){
                                                                    const newNote = { note: e.currentTarget.value, date: new Date().toISOString() };
                                                                    handleFieldChange(task.id, 'progressNotes', [...(task.progressNotes || []), newNote]);
                                                                    e.currentTarget.value = '';
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
