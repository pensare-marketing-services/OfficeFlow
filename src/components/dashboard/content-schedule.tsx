'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Task, UserProfile as User, ProgressNote, TaskStatus, Client, ContentType } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MessageSquare, Trash2, ArrowUpDown, MoreVertical, Pen } from 'lucide-react';
import { format } from 'date-fns';
import { cn, capitalizeSentences } from '@/lib/utils';
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
import { Badge } from '@/components/ui/badge';
import { InsertLinkPopover } from '../shared/insert-link-popover';


type UserWithId = User & { id: string };
type ClientWithId = Client & { id: string };

const allStatuses: TaskStatus[] = ['To Do', 'Scheduled', 'On Work', 'For Approval', 'Approved', 'Posted', 'Hold', 'Ready for Next'];

interface ContentScheduleProps {
    tasks: (Task & { id: string })[];
    users: UserWithId[];
    clients?: ClientWithId[];
    onTaskUpdate: (task: Partial<Task> & { id: string }) => void;
    onTaskDelete?: (taskId: string) => void;
    showClient?: boolean;
    showOrder?: boolean;
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
    'Web Blogs',
    'Grid Insta',
];


const MAX_IMAGE_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5MB

const getInitials = (name: string = '') => name ? name.charAt(0).toUpperCase() : '';

const statusColors: Record<string, string> = {
    'Scheduled': 'bg-transparent text-foreground',
    'On Work': 'bg-gray-500 text-white',
    'For Approval': 'bg-[#ffb131] text-black',
    'Approved': 'bg-[#42f925] text-black',
    'Posted': 'bg-[#32fafe] text-black',
    'Completed': 'bg-[#32fafe] text-black',
    'Hold': 'bg-gray-500 text-white',
    'To Do': 'bg-gray-400 text-white',
    'Ready for Next': 'bg-teal-500 text-white',
    'Reschedule': 'bg-rose-500 text-white',
    'Overdue': 'bg-red-600 text-white',
    'Running': 'bg-blue-500 text-white',
    'Active': 'bg-blue-500 text-white',
    'Stopped': 'bg-red-500 text-white',
};

const statusDotColors: Record<string, string> = {
    'Scheduled': 'bg-transparent',
    'On Work': 'bg-gray-500',
    'For Approval': 'bg-[#ffb131]',
    'Approved': 'bg-[#42f925]',
    'Posted': 'bg-[#32fafe]',
    'Completed': 'bg-[#32fafe]',
    'Hold': 'bg-gray-500',
    'To Do': 'bg-gray-400',
    'Ready for Next': 'bg-teal-500',
    'Reschedule': 'bg-rose-500',
    'Overdue': 'bg-red-600',
    'Running': 'bg-blue-500',
    'Active': 'bg-blue-500',
    'Stopped': 'bg-red-500',
};

const EditableTableCell: React.FC<{ value: string; onSave: (value: string) => void; type?: 'text' | 'textarea', placeholder?: string }> = ({ value, onSave, type = 'text', placeholder }) => {
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const formattedValue = capitalizeSentences(e.target.value);
        if(formattedValue !== value) {
            onSave(formattedValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const formattedValue = capitalizeSentences(e.currentTarget.value);
            onSave(formattedValue);
            e.currentTarget.blur();
        }
    };
    
    const commonClasses = "bg-transparent border-0 focus-visible:ring-1 text-[10px] p-1 h-auto placeholder:text-muted-foreground/70 w-full";

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
        <span className="truncate text-[10px]">{selectedUser.nickname || selectedUser.username}</span>
    ) : <SelectValue placeholder="Assign" />;


    if (!isEditable) {
        return selectedUser ? (
            <div className="flex items-center justify-start p-1 h-7 text-[10px] truncate">
                {selectedUser.nickname || selectedUser.username}
            </div>
        ) : (
             <div className="w-full p-2 h-7 text-[10px] text-muted-foreground">-</div>
        )
    }

    return (
        <Select
            value={assigneeId || 'unassigned'}
            onValueChange={(value) => onAssigneeChange(value === 'unassigned' ? '' : value)}
        >
            <SelectTrigger className={cn("w-full h-7 text-[10px] p-1", isActive && "ring-2 ring-accent", !selectedUser && "justify-center")}>
                <TriggerContent />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {employeeUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                
                                <AvatarFallback>{getInitials(user.nickname || user.username)}</AvatarFallback>
                            </Avatar>
                            <span className="text-[10px]">{user.nickname || user.username}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};


export default function ContentSchedule({ tasks, users, onTaskUpdate, onTaskDelete, showClient = true, showOrder = false, clients: propClients }: ContentScheduleProps) {
    const { user: currentUser } = useAuth();
    const [noteInput, setNoteInput] = useState('');
    const { toast } = useToast();
    const [clients, setClients] = useState<ClientWithId[]>(propClients || []);
    const [openedChats, setOpenedChats] = useState<Set<string>>(new Set());
    const { updateTaskStatus } = useTasks();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
    const [editingRemark, setEditingRemark] = useState<{ taskId: string; remarkIndex: number } | null>(null);
    const [editingText, setEditingText] = useState('');


    const sortedTasks = useMemo(() => {
        let sortableTasks = [...tasks];
        sortableTasks.sort((a, b) => {
            const dateA = new Date(a.deadline).getTime();
            const dateB = new Date(b.deadline).getTime();
            if (dateA !== dateB) {
                return dateB - dateA; // Newest deadline first
            }
            const priorityA = a.priority || 99;
            const priorityB = b.priority || 9;
            return priorityA - priorityB; 
        });
        return sortableTasks;
    }, [tasks]);


    useEffect(() => {
        if (propClients) {
            setClients(propClients);
        } else {
            const clientsQuery = collection(db, "clients");
            const unsubscribe = onSnapshot(clientsQuery, (querySnapshot) => {
                const clientsData = querySnapshot.docs.map(doc => ({ ...doc.data() as Client, id: doc.id }));
                setClients(clientsData);
            });

            return () => unsubscribe();
        }
    }, [propClients]);
    
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
        let updatePayload: Partial<Task> = { status: finalStatus as TaskStatus };

        if (['Posted', 'Completed'].includes(finalStatus)) {
            updatePayload.deadline = new Date().toISOString();
        }

        if (currentUser?.role === 'employee') {
            updateTaskStatus(task, finalStatus);
        } else {
             onTaskUpdate({ id: task.id, ...updatePayload });
        }
    }


    const handleAssigneeChange = (taskId: string, index: number, newId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const newAssigneeIds = [...(task.assigneeIds || [])];
        newAssigneeIds[index] = newId;
        const finalAssignees = [...new Set(newAssigneeIds.filter(id => id && id !== 'unassigned'))];
        onTaskUpdate({ id: taskId, assigneeIds: finalAssignees, activeAssigneeIndex: 0 }); // Reset index on change
    };

    const addNote = (task: Task & { id: string }, note: Partial<Omit<ProgressNote, 'date' | 'authorId' | 'authorName'>>) => {
        if (!currentUser) return;
        if (!note.note?.trim() && !note.imageUrl) return;

        const newNote: ProgressNote = {
            note: note.note ? capitalizeSentences(note.note) : '',
            imageUrl: note.imageUrl || '',
            date: new Date().toISOString(),
            authorId: currentUser.uid,
            authorName: currentUser.nickname || currentUser.username,
        };
        
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
        if (e.key === 'Enter' && !e.shiftKey) {
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
    
        handleFieldChange(task.id, 'progressNotes', updatedNotes);
    
        setEditingRemark(null);
        setEditingText('');
    };

    const handlePopoverOpen = (taskId: string) => {
        setOpenedChats(prev => new Set(prev.add(taskId)));
        setNoteInput('');
    }

    const employeeUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u => u.role === 'employee');
    }, [users]);
    
    const getAvailableStatuses = (task: Task) => {
        const isPromotionTask = task.description === 'Paid Promotion' || task.description === 'Plan Promotion';
        
        if (currentUser?.role === 'employee' && isPromotionTask) {
             return ['Completed'];
        }
        
        if (currentUser?.role === 'admin') {
            if (isPromotionTask) {
                return ['Scheduled', 'Active', 'Stopped'];
            }
            return allStatuses;
        };

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
                    <Table className="text-[10px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[20px] p-1 border-r h-8 text-center">No</TableHead>
                                <TableHead className="w-[40px] p-1 border-r h-8">Date</TableHead>
                                {showOrder && <TableHead className="w-[30px] p-1 border-r h-8 text-center">O</TableHead>}
                                {showClient && <TableHead className="w-[120px] p-1 border-r h-8">Client</TableHead>}
                                {currentUser?.role === 'employee' && <TableHead className="w-[120px] p-1 border-r h-8">Assigned By</TableHead>}
                                <TableHead className="w-[150px] p-1 border-r h-8">Title</TableHead>
                                <TableHead className="p-1 border-r h-8 min-w-[150px]">Description</TableHead>
                                <TableHead className="w-[50px] p-1 border-r h-8">Type</TableHead>
                                <TableHead className="w-[240px] p-1 border-r h-8">Assigned To</TableHead>
                                <TableHead className="w-[80px] p-1 border-r h-8">Status</TableHead>
                                <TableHead className="w-[40px] p-1 text-center h-8">Note</TableHead>
                                <TableHead className="w-[40px] p-1 h-8"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTasks.map((task, index) => {
                                const isCompleted = ['Posted', 'Approved', 'Completed'].includes(task.status);
                                const client = getClient(task.clientId);
                                const { assigneeIds = [], activeAssigneeIndex = 0 } = task;
                                const isMultiAssignee = assigneeIds.length > 1;
                                const currentWorkerId = assigneeIds[activeAssigneeIndex];
                                
                                const isMyTurn = currentWorkerId === currentUser?.uid;
                                const isEmployee = currentUser?.role === 'employee';
                                const isAdmin = currentUser?.role === 'admin';
                                
                                const isPromotionTask = task.description === 'Paid Promotion' || task.description === 'Plan Promotion';

                                const now = new Date();
                                const deadline = new Date(task.deadline);
                                deadline.setHours(23, 59, 59, 999);
                                const isOverdue = !isPromotionTask && !['For Approval', 'Approved', 'Posted', 'Completed'].includes(task.status) && task.status !== 'To Do' && deadline < now;
                                
                                const isStandardTask = !isPromotionTask;
                                
                                const clientAssignedEmployees = client?.employeeIds
                                    ?.map(id => {
                                        const user = users.find(u => u.id === id);
                                        return user ? (user.nickname || user.username) : null;
                                    })
                                    .filter(Boolean)
                                    .join(', ');


                                const getDisplayedStatus = (): string => {
                                    if (isOverdue) return 'Overdue';
                                    if (isPromotionTask) {
                                         if (isEmployee) {
                                            return task.status;
                                        }
                                        if (isAdmin) {
                                            if (task.status === 'Completed') return 'Active';
                                        }
                                    }
                                    if (isEmployee && !isMyTurn && !isCompleted && task.status !== 'For Approval') {
                                       return 'On Work';
                                    }
                                    return task.status;
                                }

                                let finalDisplayedStatus = getDisplayedStatus();
                                
                                const availableStatuses = getAvailableStatuses(task);
                                
                                const lastNote = (task.progressNotes?.length ?? 0) > 0 ? task.progressNotes![task.progressNotes!.length - 1] : null;
                                const hasUnreadMessage = lastNote && lastNote.authorId !== currentUser?.uid && !openedChats.has(task.id);
                                

                                return (
                                <TableRow key={task.id} className="border-b">
                                    <TableCell className="p-0 px-1 border-r text-center font-medium">{index + 1}</TableCell>
                                    <TableCell className="p-0 px-1 border-r">
                                        <Popover open={openPopoverId === task.id} onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? task.id : null)}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={'ghost'}
                                                    size="sm"
                                                    disabled={!isAdmin}
                                                    className={cn('w-full justify-start text-left font-normal h-7 text-[10px] px-1', !task.deadline && 'text-muted-foreground')}
                                                >
                                                
                                                    {task.deadline ? format(new Date(task.deadline), 'MMM dd') : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={task.deadline ? new Date(task.deadline) : undefined}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            handleFieldChange(task.id, 'deadline', date.toISOString());
                                                        }
                                                        setOpenPopoverId(null);
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                    {showOrder && (
                                        <TableCell className="p-1 border-r text-center font-bold text-[10px]">
                                            {task.priority || 9}
                                        </TableCell>
                                    )}
                                    {showClient && <TableCell className="p-1 border-r font-medium text-[10px]">{client?.name || '-'}</TableCell>}
                                    {currentUser?.role === 'employee' && (
                                        <TableCell className="p-1 border-r text-[10px] text-muted-foreground">
                                            {clientAssignedEmployees || '-'}
                                        </TableCell>
                                    )}
                                    <TableCell className="p-0 border-r">
                                        {isAdmin ? (
                                            <EditableTableCell value={task.title} onSave={(value) => handleFieldChange(task.id, 'title', value)} placeholder="New Title"/>
                                        ) : (
                                            <div className="text-[10px] p-1 h-7 flex items-center truncate" title={task.title}>{task.title || '-'}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="p-0 border-r" style={{maxWidth: '200px'}}>
                                        {isAdmin ? (
                                            <EditableTableCell 
                                                value={task.description || ''} 
                                                onSave={(value) => handleFieldChange(task.id, 'description', value)}
                                                type="text"
                                                placeholder="Add a description..."
                                            />
                                        ) : (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <p className="text-[10px] text-muted-foreground p-1 truncate cursor-pointer hover:text-foreground">
                                                        {(task.description || '-').substring(0, 30)}{task.description && task.description.length > 30 ? '...' : ''}
                                                    </p>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[60vw]">
                                                    <DialogHeader>
                                                        <DialogTitle>{task.title}</DialogTitle>
                                                    </DialogHeader>
                                                    <DialogDescription asChild>
                                                    <div className="whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto p-4">
                                                        <LinkifiedText text={task.description || ''} />
                                                    </div>
                                                    </DialogDescription>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </TableCell>
                                    <TableCell className="p-0 border-r">
                                        {(isAdmin && isStandardTask) ? (
                                            <Select value={task.contentType} onValueChange={(value: ContentType) => handleFieldChange(task.id, 'contentType', value)}>
                                                <SelectTrigger className="h-7 text-[10px] p-1"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                     {mainContentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="text-[10px] p-1 h-7 flex items-center">{task.contentType || '-'}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="p-0 border-r">
                                        <div className="flex items-center justify-start gap-1 p-1">
                                            {[0, 1, 2].map(i => {
                                                const otherAssigneeIds = assigneeIds.filter((_, idx) => idx !== i);
                                                return (
                                                <div key={i} className="flex-1 min-w-0">
                                                    <AssigneeSelect 
                                                        assigneeId={assigneeIds[i]}
                                                        onAssigneeChange={(newId) => handleAssigneeChange(task.id, i, newId)}
                                                        employeeUsers={employeeUsers.filter(u => !otherAssigneeIds.includes(u.id))}
                                                        isActive={isMultiAssignee && activeAssigneeIndex === i}
                                                        isEditable={isAdmin}
                                                    />
                                                </div>
                                            )})}
                                        </div>
                                    </TableCell>
                                    <TableCell className="p-0 border-r">
                                       <Select
                                            value={finalDisplayedStatus}
                                            onValueChange={(value: string) => handleLocalStatusChange(task, value)}
                                            disabled={isEmployee && !isMyTurn && !isCompleted && !isOverdue}
                                        >
                                            <SelectTrigger className={cn("h-7 text-[10px] p-1 border-0 focus:ring-0", statusColors[finalDisplayedStatus])}>
                                                <SelectValue>{finalDisplayedStatus}</SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {isAdmin && isStandardTask && (
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
                                                    {availableStatuses.map(status => {
                                                        let displayStatus = status;
                                                        if (isAdmin && isPromotionTask) {
                                                            if(status === 'On Work') displayStatus = 'Active';
                                                            if(status === 'Completed') displayStatus = 'Stopped';
                                                        }
                                                        return (
                                                        <SelectItem key={status} value={status} disabled={(isEmployee && !availableStatuses.includes(status as TaskStatus)) && status !== finalDisplayedStatus}>
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("h-2 w-2 rounded-full", statusDotColors[status as TaskStatus])} />
                                                                {displayStatus}
                                                            </div>
                                                        </SelectItem>
                                                    )})}
                                                </SelectGroup>
                                                {![...allStatuses, "Reschedule", "Overdue", "Running", "Completed", "Active", "Stopped"].includes(finalDisplayedStatus as TaskStatus) && !availableStatuses.includes(finalDisplayedStatus as TaskStatus) && (
                                                    <SelectItem value={finalDisplayedStatus} disabled>
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("h-2 w-2 rounded-full", statusColors[finalDisplayedStatus])} />
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
                                                        <h4 className="font-medium leading-none text-[10px]">Notes</h4>
                                                        {(task.progressNotes || []).length > 0 && isAdmin && (
                                                            <Button variant="ghost" size="default" onClick={() => handleClearChat(task.id)} className="text-[10px] h-7 text-muted-foreground">
                                                                <Trash2 className="mr-1 h-3 w-3" />
                                                                Clear
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="max-h-60 space-y-3 overflow-y-auto p-1">
                                                        {(task.progressNotes || []).map((note, remarkIndex) => {
                                                            const author = users.find(u => u.id === note.authorId);
                                                            const authorName = author ? (author.nickname || author.username) : note.authorName;
                                                            const isEditing = editingRemark?.taskId === task.id && editingRemark?.remarkIndex === remarkIndex;

                                                            return (
                                                                <div key={remarkIndex} className={cn("flex items-start gap-2 text-[10px] group/remark", note.authorId === currentUser?.uid ? 'justify-end' : '')}>
                                                                    {note.authorId !== currentUser?.uid && (
                                                                        <Avatar className="h-6 w-6 border">
                                                                            <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                                                                        </Avatar>
                                                                    )}
                                                                    <div className={cn("max-w-[75%] rounded-lg p-2 relative", note.authorId === currentUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                                                        {isAdmin && !isEditing && (
                                                                            <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-4 w-4" onClick={() => handleEditRemark(task, remarkIndex)}>
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
                                                                            </>
                                                                        )}
                                                                        <p className={cn("text-right text-[9px] mt-1 opacity-70", note.authorId === currentUser?.uid ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>{format(new Date(note.date), "MMM d, HH:mm")}</p>
                                                                    </div>
                                                                    {note.authorId === currentUser?.uid && (
                                                                        <Avatar className="h-6 w-6 border">
                                                                            
                                                                            <AvatarFallback>{getInitials(currentUser.nickname || currentUser.username)}</AvatarFallback>
                                                                        </Avatar>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                    <div className="relative">
                                                        <Textarea 
                                                            ref={textareaRef}
                                                            placeholder="Add a remark or paste an image..."
                                                            value={noteInput}
                                                            onChange={(e) => setNoteInput(e.target.value)}
                                                            onKeyDown={(e) => handleNewNote(e, task)}
                                                            onPaste={(e) => handlePaste(e, task)}
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