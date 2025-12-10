

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Task, UserProfile as User, ProgressNote, TaskStatus, Client } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MessageSquare, Trash2, ArrowUpDown, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useTasks } from '@/hooks/use-tasks';


type UserWithId = User & { id: string };
type ClientWithId = Client & { id: string };

type ContentType = 'Image Ad' | 'Video Ad' | 'Carousel' | 'Backend Ad' | 'Story' | 'Web Blogs' | 'Podcast';

const allStatuses: TaskStatus[] = ['To Do', 'Scheduled', 'On Work', 'For Approval', 'Approved', 'Posted', 'Hold', 'Ready for Next'];
const completedStatuses: Task['status'][] = ['Posted', 'Approved'];
const priorities: Task['priority'][] = ['High', 'Medium', 'Low'];

interface ContentScheduleProps {
    tasks: (Task & { id: string })[];
    users: UserWithId[];
    onTaskUpdate: (task: Partial<Task> & { id: string }) => void;
    onTaskDelete?: (taskId: string) => void;
    showClient?: boolean;
}

const contentTypes: ContentType[] = ['Image Ad', 'Video Ad', 'Carousel', 'Backend Ad', 'Story', 'Web Blogs', 'Podcast'];

const MAX_IMAGE_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5MB

const getInitials = (name: string) => name ? name.split(' ').map((n) => n[0]).join('').toUpperCase() : '';

const statusColors: Record<string, string> = {
    'To Do': 'bg-gray-500 text-white',
    Scheduled: 'bg-cyan-500 text-white',
    'On Work': 'bg-yellow-500 text-black',
    'For Approval': 'bg-orange-500 text-white',
    Approved: 'bg-green-500 text-white',
    Posted: 'bg-purple-500 text-white',
    Hold: 'bg-gray-500 text-white',
    'Ready for Next': 'bg-teal-500 text-white',
    'Reschedule': 'bg-rose-500 text-white',
    Overdue: 'bg-red-600 text-white',
};

const statusDotColors: Record<string, string> = {
    'To Do': 'bg-gray-500',
    Scheduled: 'bg-cyan-500',
    'On Work': 'bg-yellow-500',
    'For Approval': 'bg-orange-500',
    Approved: 'bg-green-500',
    Posted: 'bg-purple-500',
    Hold: 'bg-gray-500',
    'Ready for Next': 'bg-teal-500',
    'Reschedule': 'bg-rose-500',
    Overdue: 'bg-red-600',
};

const priorityMap: Record<Task['priority'], number> = {
    'High': 1,
    'Medium': 2,
    'Low': 3
};

const EditableTableCell: React.FC<{ value: string; onSave: (value: string) => void; type?: 'text' | 'textarea', placeholder?: string }> = ({ value, onSave, type = 'text', placeholder }) => {
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if(e.target.value !== value) {
            onSave(e.target.value);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSave(e.currentTarget.value);
            e.currentTarget.blur();
        }
    };
    
    const commonClasses = "bg-transparent border-0 focus-visible:ring-1 text-xs p-1 h-7 placeholder:text-muted-foreground/70 w-full";

    if (type === 'textarea') {
         return <Textarea value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} className={cn(commonClasses, "h-auto")} placeholder={placeholder} />;
    }

    return <Input value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} className={commonClasses} placeholder={placeholder} />;
};

const AssigneeSelect = ({
    assigneeId,
    onAssigneeChange,
    employeeUsers,
    isActive,
    isEditable
}: {
    assigneeId: string | undefined;
    onAssigneeChange: (newId: string) => void;
    employeeUsers: UserWithId[];
    isActive?: boolean;
    isEditable?: boolean;
}) => {
    const selectedUser = employeeUsers.find(u => u.id === assigneeId);

    if (!isEditable) {
        return selectedUser ? (
             <div className="flex items-center gap-1 truncate w-[120px] p-2 h-7 text-xs">
                <Avatar className="h-5 w-5">
                    
                    <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedUser.name}</span>
            </div>
        ) : (
             <div className="w-[120px] p-2 h-7 text-xs text-muted-foreground">-</div>
        )
    }

    return (
        <Select
            value={assigneeId || 'unassigned'}
            onValueChange={(value) => onAssigneeChange(value === 'unassigned' ? '' : value)}
        >
            <SelectTrigger className={cn("w-[120px] h-7 text-xs p-2", isActive && "ring-2 ring-accent")}>
                {selectedUser ? (
                    <div className="flex items-center gap-1 truncate">
                        <Avatar className="h-5 w-5">
                            
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


export default function ContentSchedule({ tasks, users, onTaskUpdate, onTaskDelete, showClient = true }: ContentScheduleProps) {
    const { user: currentUser } = useAuth();
    const [noteInput, setNoteInput] = useState('');
    const { toast } = useToast();
    const [clients, setClients] = useState<ClientWithId[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: 'priority'; direction: 'ascending' | 'descending' } | null>(null);
    const [openedChats, setOpenedChats] = useState<Set<string>>(new Set());
    const { updateTaskStatus } = useTasks();

    const sortedTasks = useMemo(() => {
        let sortableTasks = [...tasks];
        if (sortConfig !== null) {
            sortableTasks.sort((a, b) => {
                if (sortConfig.key === 'priority') {
                    const aValue = priorityMap[a.priority];
                    const bValue = priorityMap[b.priority];
                    if (aValue < bValue) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (aValue > bValue) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                }
                return 0;
            });
        }
        return sortableTasks;
    }, [tasks, sortConfig]);

    const requestSort = (key: 'priority') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
            setSortConfig(null);
            return;
        }
        setSortConfig({ key, direction });
    };

    useEffect(() => {
        const clientsQuery = collection(db, "clients");
        const unsubscribe = onSnapshot(clientsQuery, (querySnapshot) => {
            const clientsData = querySnapshot.docs.map(doc => ({ ...doc.data() as Client, id: doc.id }));
            setClients(clientsData);
        });

        return () => unsubscribe();
    }, []);
    
    const getClient = (clientId?: string): ClientWithId | undefined => {
      if (!clientId) return undefined;
      return clients.find(c => c.id === clientId);
    }
    
    const handleFieldChange = (taskId: string, field: keyof Task, value: any) => {
        onTaskUpdate({ id: taskId, [field]: value });
    };
    
    const handleLocalStatusChange = (task: Task & { id: string }, newStatus: string) => {
        if (currentUser?.role === 'admin' && newStatus === 'Reschedule') {
            onTaskUpdate({ 
                id: task.id, 
                status: 'Scheduled', 
                activeAssigneeIndex: 0 
            });
            return;
        }

        if (currentUser?.role === 'employee') {
            updateTaskStatus(task, newStatus);
        } else {
            handleFieldChange(task.id, 'status', newStatus as TaskStatus);
        }
    }


    const handleAssigneeChange = (taskId: string, index: number, newId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const newAssigneeIds = [...(task.assigneeIds || [])];
        newAssigneeIds[index] = newId;
        const finalAssignees = [...new Set(newAssigneeIds.filter(id => id))];
        onTaskUpdate({ id: taskId, assigneeIds: finalAssignees, activeAssigneeIndex: 0 }); // Reset index on change
    };

    const addNote = (task: Task & { id: string }, note: Partial<Omit<ProgressNote, 'date' | 'authorId' | 'authorName'>>) => {
        if (!currentUser) return;

        const newNote: Partial<ProgressNote> = {
            date: new Date().toISOString(),
            authorId: currentUser.uid,
            authorName: currentUser.name,
        };

        if (note.note) {
            newNote.note = note.note;
        }
        if (note.imageUrl) {
            newNote.imageUrl = note.imageUrl;
        }
        
        // Reset opened state for all users except sender
        setOpenedChats(prev => {
            const newSet = new Set(prev);
            newSet.delete(task.id);
            return newSet;
        });

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
                        description: `Please paste an image smaller than ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB.`
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

    const handlePopoverOpen = (taskId: string) => {
        setOpenedChats(prev => new Set(prev.add(taskId)));
        setNoteInput('');
    }

    const employeeUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u => u.role === 'employee');
    }, [users]);
    
    const getAvailableStatuses = (task: Task) => {
        if (currentUser?.role === 'admin') return allStatuses;

        const { assigneeIds = [], activeAssigneeIndex = 0 } = task;
        const isMyTurn = assigneeIds[activeAssigneeIndex] === currentUser?.uid;

        if (!isMyTurn) return [];

        const isLastAssignee = activeAssigneeIndex === assigneeIds.length - 1;
        if (isLastAssignee) {
            return ['On Work', 'For Approval'];
        }
        
        return ['On Work', 'Ready for Next'];
    };

    if (tasks.length === 0) {
        return (
             <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-card">
                <div className="text-center">
                <h3 className="font-headline text-lg font-semibold">No Content Scheduled</h3>
                <p className="text-muted-foreground">There are no tasks in this view.</p>
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
                                <TableHead className="w-[100px] px-1 border-r">Date</TableHead>
                                {showClient && <TableHead className="min-w-[100px] px-1 border-r">Client</TableHead>}
                                <TableHead className="min-w-[250px] px-1 border-r">Content Title</TableHead>
                                <TableHead className="min-w-[250px] px-1 border-r">Content Description</TableHead>
                                <TableHead className="w-[120px] px-1 border-r">Type</TableHead>
                                <TableHead className="w-[200px] px-1 border-r">Assigned To</TableHead>
                                <TableHead className="w-[80px] px-1 border-r text-center">
                                    <Button variant="ghost" onClick={() => requestSort('priority')} className="p-1 h-auto text-muted-foreground hover:bg-transparent">
                                        Priority
                                        <ArrowUpDown className="ml-2 h-3 w-3" />
                                    </Button>
                                </TableHead>
                                <TableHead className="w-[120px] px-1 border-r">Status</TableHead>
                                <TableHead className="w-[50px] px-1 text-center">Remarks</TableHead>
                                <TableHead className="w-[40px] px-1"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTasks.map((task) => {
                                const isCompleted = completedStatuses.includes(task.status);
                                const client = getClient(task.clientId);
                                const { assigneeIds = [], activeAssigneeIndex = 0 } = task;
                                const isMultiAssignee = assigneeIds.length > 1;
                                const currentWorkerId = assigneeIds[activeAssigneeIndex];
                                
                                const isMyTurn = currentWorkerId === currentUser?.uid;
                                const isEmployee = currentUser?.role === 'employee';
                                const isEditable = currentUser?.role === 'admin';
                                
                                let currentStatus: TaskStatus = task.status;
                                const today = new Date();
                                today.setHours(0, 0, 0, 0); // Set to the beginning of today
                                if (!['For Approval', 'Approved', 'Posted'].includes(task.status) && new Date(task.deadline) < today) {
                                    currentStatus = 'Overdue';
                                }

                                const availableStatuses = getAvailableStatuses(task);
                                
                                const getDisplayedStatus = (): TaskStatus => {
                                    if (currentStatus === 'Overdue') return 'Overdue';
                                    if (isEmployee && !isMyTurn && !isCompleted && currentStatus !== 'For Approval' && currentStatus !== 'Scheduled') {
                                       return 'On Work';
                                    }
                                    return task.status;
                                }

                                const displayedStatus = getDisplayedStatus();
                                
                                const descriptionWords = task.description ? task.description.split(/\s+/).filter(Boolean) : [];
                                const wordCount = descriptionWords.length;
                                const descriptionPreview = descriptionWords.slice(0, 10).join(' ');

                                const lastNote = (task.progressNotes?.length ?? 0) > 0 ? task.progressNotes![task.progressNotes!.length - 1] : null;
                                const hasUnreadMessage = lastNote && lastNote.authorId !== currentUser?.uid && !openedChats.has(task.id);


                                return (
                                <TableRow key={task.id} className="border-b">
                                    <TableCell className="py-0 px-2 border-r">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={'ghost'}
                                                    size="default"
                                                    disabled={!isEditable}
                                                    className={cn('w-full justify-start text-left font-normal h-7 text-xs', !task.deadline && 'text-muted-foreground')}
                                                >
                                                
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
                                    {showClient && <TableCell className="py-0 px-2 border-r font-medium">{client?.name || '-'}</TableCell>}
                                    <TableCell className="py-0 px-2 border-r">
                                        {isEditable ? (
                                            <EditableTableCell value={task.title} onSave={(value) => handleFieldChange(task.id, 'title', value)} placeholder="New Content Title"/>
                                        ) : (
                                            <div className="text-xs p-1 h-7 flex items-center truncate" title={task.title}>{task.title || '-'}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-0 px-2 border-r">
                                        <div className="w-full">
                                            {wordCount > 10 ? (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <p className="text-xs text-muted-foreground cursor-pointer hover:text-foreground p-1 truncate">
                                                            {descriptionPreview}... <span className="underline">Read more</span>
                                                        </p>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[60vw]">
                                                        <DialogHeader>
                                                            <DialogTitle>{task.title}</DialogTitle>
                                                        </DialogHeader>
                                                        {isEditable ? (
                                                            <Textarea 
                                                                defaultValue={task.description} 
                                                                onBlur={(e) => handleFieldChange(task.id, 'description', e.target.value)} 
                                                                className="h-48"
                                                                placeholder="Add a detailed description..."
                                                            />
                                                        ) : (
                                                            <div className="whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto p-4 text-sm">
                                                                {task.description}
                                                            </div>
                                                        )}
                                                    </DialogContent>
                                                </Dialog>
                                            ) : (
                                                isEditable ? (
                                                    <EditableTableCell 
                                                        value={task.description || ''} 
                                                        onSave={(value) => handleFieldChange(task.id, 'description', value)}
                                                        type="textarea"
                                                        placeholder="Add a description..."
                                                    />
                                                ) : (
                                                    <p className="text-xs text-muted-foreground p-1 truncate">{task.description || '-'}</p>
                                                )
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-0 px-2 border-r">
                                        {isEditable ? (
                                            <Select value={task.contentType} onValueChange={(value: ContentType) => handleFieldChange(task.id, 'contentType', value)}>
                                                <SelectTrigger className="h-7 text-xs p-2"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {contentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="text-xs p-2 h-7 flex items-center">{task.contentType || '-'}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-0 px-2 border-r">
                                        <div className="flex items-center gap-1">
                                            {[0, 1].map(i => (
                                                <AssigneeSelect 
                                                    key={i}
                                                    assigneeId={assigneeIds[i]}
                                                    onAssigneeChange={(newId) => handleAssigneeChange(task.id, i, newId)}
                                                    employeeUsers={employeeUsers.filter(u => u.id !== assigneeIds[1-i])} // filter out the other assignee
                                                    isActive={isMultiAssignee && activeAssigneeIndex === i}
                                                    isEditable={isEditable}
                                                />
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-0 px-2 border-r text-center font-bold text-base">
                                    {isEditable ? (
                                        <Select
                                        value={task.priority}
                                        onValueChange={(value: Task['priority']) => handleFieldChange(task.id, 'priority', value)}
                                        >
                                        <SelectTrigger className="h-7 text-xs p-2 font-bold focus:bg-accent">
                                            <SelectValue>
                                                <span className="font-bold text-base">{priorityMap[task.priority]}</span>
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {priorities.map(p => (
                                                <SelectItem key={p} value={p}>{p} ({priorityMap[p]})</SelectItem>
                                            ))}
                                        </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="font-bold text-base flex items-center justify-center h-7">{priorityMap[task.priority]}</div>
                                    )}
                                    </TableCell>
                                    <TableCell className="py-0 px-2 border-r">
                                        <Select 
                                            value={displayedStatus} 
                                            onValueChange={(value: string) => handleLocalStatusChange(task, value)} 
                                            disabled={(isEmployee && !isMyTurn && !isCompleted && displayedStatus !== 'Overdue')}
                                        >
                                            <SelectTrigger className={cn("h-7 text-xs p-2 border-0 focus:ring-0", statusColors[displayedStatus])}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {isEditable && (
                                                    <SelectGroup>
                                                        <SelectLabel>Actions</SelectLabel>
                                                        <SelectItem value="Reschedule">
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("h-2 w-2 rounded-full", statusDotColors['Reschedule'])} />
                                                                Reschedule
                                                            </div>
                                                        </SelectItem>
                                                    </SelectGroup>
                                                )}
                                                <SelectGroup>
                                                    <SelectLabel>Statuses</SelectLabel>
                                                    {allStatuses.map(status => (
                                                        <SelectItem key={status} value={status} disabled={(isEmployee && !availableStatuses.includes(status as TaskStatus))}>
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("h-3 w-2 rounded-full", statusDotColors[status as TaskStatus])} />
                                                                {status}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                                {![...allStatuses, "Reschedule"].includes(displayedStatus as TaskStatus) && (
                                                    <SelectItem value={displayedStatus} disabled>
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("h-2 w-2 rounded-full", statusDotColors[displayedStatus])} />
                                                            {displayedStatus} {displayedStatus === 'On Work' && `(${users.find(u => u.id === currentWorkerId)?.name.split(' ')[0] || '...'})`}
                                                        </div>
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="py-0 px-2 text-center">
                                        <Popover onOpenChange={(open) => { if (open) handlePopoverOpen(task.id); }}>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={!task.assigneeIds || task.assigneeIds.length === 0} className="relative h-7 w-8">
                                                    <MessageSquare className="h-4 w-4" />
                                                    {hasUnreadMessage && (
                                                        <span className="absolute top-1 right-1 flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                        </span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80" side="left" align="end">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-medium leading-none text-xs">Remarks</h4>
                                                        {(task.progressNotes || []).length > 0 && isEditable && (
                                                            <Button variant="ghost" size="default" onClick={() => handleClearChat(task.id)} className="text-xs h-7 text-muted-foreground">
                                                                <Trash2 className="mr-1 h-3 w-3" />
                                                                Clear
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="max-h-60 space-y-3 overflow-y-auto p-1">
                                                        {(task.progressNotes || []).map((note, i) => {
                                                            const author = users.find(u => u.id === note.authorId);
                                                            const authorName = author ? author.name : note.authorName;
                                                            return (
                                                                <div key={i} className={cn("flex items-start gap-2 text-xs", note.authorId === currentUser?.uid ? 'justify-end' : '')}>
                                                                    {note.authorId !== currentUser?.uid && (
                                                                        <Avatar className="h-6 w-6 border">
                                                                            
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
                                                            className="pr-2"
                                                        />
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                     <TableCell className="py-0 px-2">
                                        {isEditable && onTaskDelete && (
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                            <span className="sr-only">More options</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    
                                                    <DropdownMenuContent align="end">
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Task
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                    
                                                </DropdownMenu>

                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the task "{task.title}".
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onTaskDelete!(task.id)} className="bg-destructive hover:bg-destructive/90">
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
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
