'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Task, UserProfile as User, ProgressNote, TaskStatus, Client, ContentType } from '@/lib/data';
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
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useTasks } from '@/hooks/use-tasks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LinkifiedText } from '@/components/shared/linkified-text';


type UserWithId = User & { id: string };
type ClientWithId = Client & { id: string };

const allStatuses: TaskStatus[] = ['To Do', 'Scheduled', 'On Work', 'For Approval', 'Approved', 'Posted', 'Hold', 'Ready for Next'];
const completedStatuses: Task['status'][] = ['Posted', 'Approved', 'Completed'];
const priorities: Task['priority'][] = ['High', 'Medium', 'Low'];

interface ContentScheduleProps {
    tasks: (Task & { id: string })[];
    users: UserWithId[];
    onTaskUpdate: (task: Partial<Task> & { id: string }) => void;
    onTaskDelete?: (taskId: string) => void;
    showClient?: boolean;
}

const adTypes: (ContentType)[] = [
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

const mainContentTypes: ContentType[] = [
    'Image Ad',
    'Video Ad',
    'Carousel Ad',
    'Reels',
    'Story',
    'Hoarding',
    'Other',
    'Printing',
    'Board',
    'Backend Ad',
    'LED Video',
    'Website',
    'Podcast',
    'SEO',
    'Web Blogs'
];


const MAX_IMAGE_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5MB

const getInitials = (name: string = '') => name ? name.charAt(0).toUpperCase() : '';

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

const statusDotColors: Record<string, string> = {
    'To Do': 'bg-gray-500',
    'Scheduled': 'bg-gray-500',
    'On Work': 'bg-orange-500',
    'For Approval': 'bg-yellow-500',
    'Approved': 'bg-green-600',
    'Posted': 'bg-purple-500',
    'Hold': 'bg-gray-500',
    'Ready for Next': 'bg-teal-500',
    'Reschedule': 'bg-rose-500',
    'Overdue': 'bg-red-600',
    'Running': 'bg-blue-500',
    'Completed': 'bg-green-600',
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
    
    const commonClasses = "bg-transparent border-0 focus-visible:ring-1 text-xs p-1 h-auto placeholder:text-muted-foreground/70 w-full";

    if (type === 'textarea') {
         return <Textarea value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} className={cn(commonClasses, "h-auto")} placeholder={placeholder} />;
    }

    return <Input value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} className={cn(commonClasses, 'h-7')} placeholder={placeholder} />;
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

    const TriggerContent = () => selectedUser ? (
        <span className="truncate text-xs">{selectedUser.username}</span>
    ) : <SelectValue placeholder="Assign" />;


    if (!isEditable) {
        return selectedUser ? (
            <div className="flex items-center justify-start p-1 h-7 text-xs truncate">
                {selectedUser.username}
            </div>
        ) : (
             <div className="w-full p-2 h-7 text-xs text-muted-foreground">-</div>
        )
    }

    return (
        <Select
            value={assigneeId || 'unassigned'}
            onValueChange={(value) => onAssigneeChange(value === 'unassigned' ? '' : value)}
        >
            <SelectTrigger className={cn("w-full h-7 text-xs p-1", isActive && "ring-2 ring-accent", !selectedUser && "justify-center")}>
                <TriggerContent />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {employeeUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                
                                <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{user.username}</span>
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

        let finalStatus = newStatus;
        const isPromotionTask = task.contentType && adTypes.includes(task.contentType);
        if (isPromotionTask) {
             if (newStatus === 'Running') finalStatus = 'On Work';
             if (newStatus === 'Completed') finalStatus = 'Completed';
        }

        if (currentUser?.role === 'employee') {
            updateTaskStatus(task, finalStatus);
        } else {
            handleFieldChange(task.id, 'status', finalStatus as TaskStatus);
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
        if (!note.note?.trim() && !note.imageUrl) return;

        const newNote: Partial<ProgressNote> = {
            date: new Date().toISOString(),
            authorId: currentUser.uid,
            authorName: currentUser.username,
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
        const isPromotionTask = task.contentType && adTypes.includes(task.contentType);
        
        if (currentUser?.role === 'employee' && isPromotionTask) {
            return ['Running', 'Completed'];
        }
        
        if (currentUser?.role === 'admin') return allStatuses;

        const { assigneeIds = [], activeAssigneeIndex = 0 } = task;
        const isMyTurn = assigneeIds[activeAssigneeIndex] === currentUser?.uid;

        if (!isMyTurn) return [];

        const isLastAssignee = activeAssigneeIndex === assigneeIds.length - 1;
        const baseStatuses: TaskStatus[] = ['On Work', 'Hold'];

        if (isLastAssignee) {
            return [...baseStatuses, 'For Approval', 'Approved', 'Posted'];
        }
        
        return [...baseStatuses, 'Ready for Next'];
    };

    if (tasks.length === 0) {
        return (
             <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-card">
                <div className="text-center">
                <h3 className="font-headline text-lg font-semibold">No Tasks Scheduled</h3>
                <p className="text-muted-foreground">There are no tasks in this view.</p>
                </div>
            </div>
        )
    }
    
    return (
        <Card>
            <CardContent className="p-0">
                    <Table className="text-xs">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px] p-1 border-r h-8 text-center">#</TableHead>
                                <TableHead className="w-[80px] p-1 border-r h-8">Date</TableHead>
                                {showClient && <TableHead className="w-[120px] p-1 border-r h-8">Client</TableHead>}
                                <TableHead className="w-[150px] p-1 border-r h-8">Title</TableHead>
                                <TableHead className="p-1 border-r h-8 w-[15%]">Description</TableHead>
                                <TableHead className="w-[100px] p-1 border-r h-8">Type</TableHead>
                                <TableHead className="w-[240px] p-1 border-r h-8">Assigned To</TableHead>
                                <TableHead className="w-[80px] p-1 border-r h-8">Status</TableHead>
                                <TableHead className="w-[40px] p-1 text-center h-8">Remarks</TableHead>
                                <TableHead className="w-[40px] p-1 h-8"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTasks.map((task, index) => {
                                const isCompleted = completedStatuses.includes(task.status);
                                const client = getClient(task.clientId);
                                const { assigneeIds = [], activeAssigneeIndex = 0 } = task;
                                const isMultiAssignee = assigneeIds.length > 1;
                                const currentWorkerId = assigneeIds[activeAssigneeIndex];
                                
                                const isMyTurn = currentWorkerId === currentUser?.uid;
                                const isEmployee = currentUser?.role === 'employee';
                                const isAdmin = currentUser?.role === 'admin';
                                
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const isOverdue = !['For Approval', 'Approved', 'Posted', 'Completed'].includes(task.status) && new Date(task.deadline) < today;

                                const getDisplayedStatusForEmployee = (): string => {
                                    if (isOverdue) return 'Overdue';
                                    if (task.status === 'Scheduled') return 'Scheduled';

                                    const isPromotionTask = task.contentType && adTypes.includes(task.contentType);
                                    if (isPromotionTask) {
                                        if (task.status === 'On Work') return 'Running';
                                        if (task.status === 'Completed') return 'Completed';
                                    }
                                    if (isEmployee && !isMyTurn && !isCompleted && task.status !== 'For Approval') {
                                       return 'On Work';
                                    }
                                    return task.status;
                                }

                                let finalDisplayedStatus = isEmployee ? getDisplayedStatusForEmployee() : (isOverdue ? 'Overdue' : task.status);
                                
                                const availableStatuses = getAvailableStatuses(task);
                                
                                const descriptionWords = task.description ? task.description.split(/\s+/).filter(Boolean) : [];
                                const wordCount = descriptionWords.length;
                                const descriptionPreview = descriptionWords.slice(0, 10).join(' ');

                                const lastNote = (task.progressNotes?.length ?? 0) > 0 ? task.progressNotes![task.progressNotes!.length - 1] : null;
                                const hasUnreadMessage = lastNote && lastNote.authorId !== currentUser?.uid && !openedChats.has(task.id);
                                
                                const isPromotionType = task.contentType && adTypes.includes(task.contentType);


                                return (
                                <TableRow key={task.id} className="border-b">
                                    <TableCell className="p-0 px-1 border-r text-center font-medium">{index + 1}</TableCell>
                                    <TableCell className="p-0 px-1 border-r">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={'ghost'}
                                                    size="sm"
                                                    disabled={!isAdmin}
                                                    className={cn('w-full justify-start text-left font-normal h-7 text-xs px-1', !task.deadline && 'text-muted-foreground')}
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
                                    {showClient && <TableCell className="p-1 border-r font-medium text-xs">{client?.name || '-'}</TableCell>}
                                    <TableCell className="p-0 border-r">
                                        {isAdmin ? (
                                            <EditableTableCell value={task.title} onSave={(value) => handleFieldChange(task.id, 'title', value)} placeholder="New Title"/>
                                        ) : (
                                            <div className="text-xs p-1 h-7 flex items-center truncate" title={task.title}>{task.title || '-'}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="p-0 border-r">
                                        {isAdmin ? (
                                            <EditableTableCell 
                                                value={task.description || ''} 
                                                onSave={(value) => handleFieldChange(task.id, 'description', value)}
                                                type="text"
                                                placeholder="Add a description..."
                                            />
                                        ) : (
                                            <p className="text-xs text-muted-foreground p-1 truncate">{task.description || '-'}</p>
                                        )}
                                    </TableCell>
                                    <TableCell className="p-0 border-r">
                                        {(isAdmin && !isPromotionType) ? (
                                            <Select value={task.contentType} onValueChange={(value: ContentType) => handleFieldChange(task.id, 'contentType', value)}>
                                                <SelectTrigger className="h-7 text-xs p-1"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                     {mainContentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="text-xs p-1 h-7 flex items-center">{task.contentType || '-'}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="p-0 border-r">
                                        <div className="flex items-center justify-start gap-1 p-1">
                                            {[0, 1].map(i => (
                                                <div key={i} className="flex-1 min-w-0">
                                                    <AssigneeSelect 
                                                        assigneeId={assigneeIds[i]}
                                                        onAssigneeChange={(newId) => handleAssigneeChange(task.id, i, newId)}
                                                        employeeUsers={employeeUsers.filter(u => u.id !== assigneeIds[1-i])} // filter out the other assignee
                                                        isActive={isMultiAssignee && activeAssigneeIndex === i}
                                                        isEditable={isAdmin}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="p-0 border-r">
                                        <Select 
                                            value={finalDisplayedStatus}
                                            onValueChange={(value: string) => handleLocalStatusChange(task, value)} 
                                            disabled={(isEmployee && !isMyTurn && !isCompleted && !isOverdue) || (isEmployee && isMyTurn && task.status === "Scheduled")}
                                        >
                                            <SelectTrigger className={cn("h-7 text-xs p-1 border-0 focus:ring-0", statusColors[finalDisplayedStatus])}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {isAdmin && !isPromotionType && (
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
                                                    {availableStatuses.map(status => (
                                                        <SelectItem key={status} value={status} disabled={(isEmployee && !availableStatuses.includes(status as TaskStatus)) && status !== finalDisplayedStatus}>
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("h-2 w-2 rounded-full", statusDotColors[status as TaskStatus])} />
                                                                {status}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                                 {![...allStatuses, "Reschedule", "Overdue", "Running", "Completed"].includes(finalDisplayedStatus as TaskStatus) && !availableStatuses.includes(finalDisplayedStatus as TaskStatus) && (
                                                    <SelectItem value={finalDisplayedStatus} disabled>
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("h-2 w-2 rounded-full", statusDotColors[finalDisplayedStatus])} />
                                                            {finalDisplayedStatus} {finalDisplayedStatus === 'On Work' && `(${users.find(u => u.id === currentWorkerId)?.username?.split(' ')[0] || '...'})`}
                                                        </div>
                                                    </SelectItem>
                                                )}
                                                {isOverdue && <SelectItem value="Overdue" disabled>
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("h-2 w-2 rounded-full", statusDotColors.Overdue)} />
                                                        Overdue
                                                    </div>
                                                </SelectItem>}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="p-0 text-center">
                                        <Popover onOpenChange={(open) => { if (open) handlePopoverOpen(task.id); }}>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={!task.assigneeIds || task.assigneeIds.length === 0} className="relative h-7 w-7">
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
                                                        {(task.progressNotes || []).length > 0 && isAdmin && (
                                                            <Button variant="ghost" size="default" onClick={() => handleClearChat(task.id)} className="text-xs h-7 text-muted-foreground">
                                                                <Trash2 className="mr-1 h-3 w-3" />
                                                                Clear
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="max-h-60 space-y-3 overflow-y-auto p-1">
                                                        {(task.progressNotes || []).map((note, i) => {
                                                            const author = users.find(u => u.id === note.authorId);
                                                            const authorName = author ? author.username : note.authorName;
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
                                                    </div>
                                                    <div className="relative">
                                                        <Textarea 
                                                            placeholder="Add a remark or paste an image..."
                                                            value={noteInput}
                                                            onChange={(e) => setNoteInput(e.target.value)}
                                                            onKeyDown={(e) => handleNewNote(e, task)}
                                                            onPaste={(e) => handlePaste(e, task)}
                                                            className="pr-2 text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                     <TableCell className="p-0">
                                        {isAdmin && onTaskDelete && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <MoreVertical className="h-4 w-4" />
                                                        <span className="sr-only">More options</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem 
                                                        onSelect={() => onTaskDelete(task.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Task
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
            </CardContent>
        </Card>
    );
}
