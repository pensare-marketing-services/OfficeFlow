'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Task, UserProfile as User, ContentType, ProgressNote } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CalendarIcon, MessageSquare, Pen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isValid } from 'date-fns';
import { cn, capitalizeSentences } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { LinkifiedText } from '../shared/linkified-text';
import { InsertLinkPopover } from '../shared/insert-link-popover';

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
const getInitials = (name: string = '') => name ? name.charAt(0).toUpperCase() : '';

const statusColors: Record<string, string> = {
    'Scheduled': 'bg-transparent text-foreground',
    'On Work': 'bg-gray-500 text-white',
    'For Approval': 'bg-[#ffb131] text-white',
    'Approved': 'bg-[#42f925] text-white',
    'Posted': 'bg-[#32fafe] text-white',
    'Completed': 'bg-[#32fafe] text-white',
    'Hold': 'bg-gray-500 text-white',
    'To Do': 'bg-gray-400 text-white',
    'Ready for Next': 'bg-teal-500 text-white',
    'Reschedule': 'bg-rose-500 text-white',
    'Overdue': 'bg-red-600 text-white',
    'Running': 'bg-blue-500 text-white',
    'Active': 'bg-blue-500 text-white',
    'Stopped': 'bg-red-500 text-white',
};

const EditableCell: React.FC<{
    value: string;
    onSave: (value: string) => void;
    className?: string;
    placeholder?: string;
}> = ({ value, onSave, className, placeholder }) => {
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleBlur = () => {
        const formattedValue = capitalizeSentences(currentValue);
        if (formattedValue !== value) {
            onSave(formattedValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const formattedValue = capitalizeSentences(e.currentTarget.value);
            onSave(formattedValue);
            e.currentTarget.blur();
        }
    };

    return (
        <Input
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn("h-7 text-[10px] p-1 border-transparent hover:border-border focus:border-ring focus:bg-background", className)}
            placeholder={placeholder}
        />
    );
};

export default function WebsiteTable({ clientId, users, tasks, onTaskAdd, onTaskUpdate, onTaskDelete }: WebsiteTableProps) {
    const { user: currentUser } = useAuth();
    const [noteInput, setNoteInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
    const [editingRemark, setEditingRemark] = useState<{ taskId: string; remarkIndex: number } | null>(null);
    const [editingText, setEditingText] = useState('');

    
    const handleTaskChange = (id: string, field: keyof Task, value: any) => {
        onTaskUpdate(id, { [field]: value });
    };

    const addNote = (task: TaskWithId, note: Partial<Omit<ProgressNote, 'date' | 'authorId' | 'authorName'>>) => {
        if (!currentUser) return;
        if (!note.note?.trim() && !note.imageUrl) return;

        const newNote: ProgressNote = {
            note: note.note ? capitalizeSentences(note.note) : '',
            imageUrl: note.imageUrl || '',
            date: new Date().toISOString(),
            authorId: currentUser.uid,
            authorName: currentUser.username,
        };

        handleTaskChange(task.id, 'progressNotes', [...(task.progressNotes || []), newNote]);
    };

    const handleNewNote = (e: React.KeyboardEvent<HTMLTextAreaElement>, task: TaskWithId) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = noteInput.trim();
            if (text) {
                addNote(task, { note: text });
                setNoteInput('');
            }
        }
    };

    const handleEditRemark = (task: Task & { id: string }, remarkIndex: number) => {
      const remark = task.progressNotes?.[remarkIndex];
      if (!remark) return;
      setEditingRemark({ taskId: task.id, remarkIndex });
      setEditingText(remark.note || '');
    };
  
    const handleSaveRemark = (task: Task & { id: string }, remarkIndex: number) => {
        if (!editingRemark) return;
    
        const updatedNotes = [...(task.progressNotes || [])];
        updatedNotes[remarkIndex] = { ...updatedNotes[remarkIndex], note: editingText };
    
        handleTaskChange(task.id, 'progressNotes', updatedNotes);
    
        setEditingRemark(null);
        setEditingText('');
    };

    const addTask = () => {
        const deadline = new Date();
        deadline.setHours(23, 59, 59, 999);

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

    const handleAssigneeChange = (taskId: string, index: number, newId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const newAssigneeIds = [...(task.assigneeIds || [])];
        while (newAssigneeIds.length < 2) {
            newAssigneeIds.push('');
        }
        newAssigneeIds[index] = newId;
        const finalAssignees = [...new Set(newAssigneeIds.filter(id => id && id !== 'unassigned'))];
        onTaskUpdate(taskId, { assigneeIds: finalAssignees, activeAssigneeIndex: 0 }); 
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
                            <TableHead className="w-[40px] px-2 text-[10px]">No</TableHead>
                            <TableHead className="w-[90px] text-[10px]">Date</TableHead>
                            <TableHead className="w-[150px] text-[10px]">Task</TableHead>
                            <TableHead className="w-[200px] text-[10px]">Description</TableHead>
                            <TableHead className="w-[180px] text-[10px]">Assigned</TableHead>
                            <TableHead className="w-[120px] text-[10px]">Status</TableHead>
                            <TableHead className="w-[100px] text-[10px]">Note</TableHead>
                            <TableHead className="w-[40px] text-[10px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.map((task, index) => (
                            <TableRow key={task.id}>
                                <TableCell className="px-2 py-1 text-[10px] text-center">{index + 1}</TableCell>
                                <TableCell className="p-0">
                                     <Popover open={openPopoverId === task.id} onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? task.id : null)}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={'ghost'}
                                                size="sm"
                                                className={cn('w-full justify-start text-left font-normal h-7 text-[10px] px-2', !task.deadline && 'text-muted-foreground')}
                                            >
                                                {task.deadline && isValid(new Date(task.deadline)) ? format(new Date(task.deadline), 'MMM dd') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={task.deadline ? new Date(task.deadline) : undefined}
                                                onSelect={(date) => {
                                                    handleTaskChange(task.id, 'deadline', date ? date.toISOString() : '');
                                                    setOpenPopoverId(null);
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                                <TableCell className="p-0"><EditableCell value={task.title} onSave={(v) => handleTaskChange(task.id, 'title', v)} placeholder="New website task..." /></TableCell>
                                <TableCell className="p-0"><EditableCell value={task.description} onSave={(v) => handleTaskChange(task.id, 'description', v)} placeholder="Add description..."/></TableCell>
                                <TableCell className="p-1">
                                    <div className="flex items-center gap-1">
                                        {[0, 1].map(i => (
                                            <Select 
                                                key={i}
                                                value={task.assigneeIds?.[i] || 'unassigned'} 
                                                onValueChange={(v) => handleAssigneeChange(task.id, i, v)}
                                            >
                                                <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Assign" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                                    {employeeUsers.filter(u => u.id !== task.assigneeIds?.[1-i]).map(user => <SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        ))}
                                    </div>
                                </TableCell>
                                 <TableCell className="p-1">
                                    <Select value={task.status} onValueChange={(v: Task['status']) => handleTaskChange(task.id, 'status', v)}>
                                        <SelectTrigger className={cn("h-7 text-[10px]", statusColors[task.status] || 'bg-gray-500 text-white')}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="p-0 text-center">
                                    <Popover onOpenChange={() => setNoteInput('')}>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="relative h-7 w-7">
                                                <MessageSquare className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80" side="left" align="end">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none text-[10px]">Note for "{task.title}"</h4>
                                                <div className="max-h-60 space-y-3 overflow-y-auto p-1">
                                                    {(task.progressNotes || []).map((note, remarkIndex) => {
                                                        const author = users.find(u => u.id === note.authorId);
                                                        const authorName = author ? author.username : note.authorName;
                                                        const isEditing = editingRemark?.taskId === task.id && editingRemark?.remarkIndex === remarkIndex;

                                                        return (
                                                            <div key={remarkIndex} className={cn("flex items-start gap-2 text-[10px] group/remark", note.authorId === currentUser?.uid ? 'justify-end' : '')}>
                                                                {note.authorId !== currentUser?.uid && (
                                                                    <Avatar className="h-6 w-6 border"><AvatarFallback>{getInitials(authorName)}</AvatarFallback></Avatar>
                                                                )}
                                                                <div className={cn("max-w-[75%] rounded-lg p-2 relative", note.authorId === currentUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                                                    {currentUser?.role === 'admin' && !isEditing && (
                                                                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-2 w-2" onClick={() => handleEditRemark(task, remarkIndex)}>
                                                                        <Pen className="h-2 w-2"/>
                                                                      </Button>
                                                                    )}
                                                                    <p className="font-bold text-[10px] mb-1">{note.authorId === currentUser?.uid ? 'You' : authorName}</p>
                                                                    
                                                                     {isEditing ? (
                                                                        <Textarea
                                                                          value={editingText}
                                                                          onChange={(e) => setEditingText(e.target.value)}
                                                                          onBlur={() => handleSaveRemark(task, remarkIndex)}
                                                                          onKeyDown={(e) => {
                                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                              e.preventDefault();
                                                                              handleSaveRemark(task, remarkIndex);
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
                                                                            {note.imageUrl && <img src={note.imageUrl} alt="remark" className="mt-1 rounded-md max-w-full h-auto" />}
                                                                        </>
                                                                    )}
                                                                    <p className={cn("text-right text-[9px] mt-1 opacity-70", note.authorId === currentUser?.uid ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>{format(new Date(note.date), "MMM d, HH:mm")}</p>
                                                                </div>
                                                                {note.authorId === currentUser?.uid && (
                                                                    <Avatar className="h-6 w-6 border"><AvatarFallback>{getInitials(currentUser.username)}</AvatarFallback></Avatar>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="relative">
                                                    <Textarea 
                                                        ref={textareaRef}
                                                        placeholder="Add a remark..."
                                                        value={noteInput}
                                                        onChange={(e) => setNoteInput(e.target.value)}
                                                        onKeyDown={(e) => handleNewNote(e, task)}
                                                        className="pr-8 text-[10px]"
                                                    />
                                                    <div className="absolute bottom-1 right-1">
                                                        <InsertLinkPopover 
                                                            textareaRef={textareaRef} 
                                                            onValueChange={setNoteInput} 
                                                            onSend={(message) => addNote(task, {note: message})}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                                <TableCell className="p-0 text-center">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onTaskDelete(task.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                         {tasks.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
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
