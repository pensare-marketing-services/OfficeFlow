'use client';

import type { Task, UserProfile as User, ProgressNote, Client, TaskStatus, ContentType } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MessageSquare, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn, capitalizeSentences } from '@/lib/utils';
import { format } from 'date-fns';
import { useTasks } from '@/hooks/use-tasks';
import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LinkifiedText } from '@/components/shared/linkified-text';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Input } from '../ui/input';


type UserWithId = User & { id: string };
type ClientWithId = Client & { id: string };

interface RecentTasksProps {
  tasks: (Task & {id: string})[];
  users: UserWithId[];
  title: string;
  onTaskDelete?: (taskId: string) => void;
}

const getInitials = (name: string = '') => name ? name.charAt(0).toUpperCase() : '';

const completedStatuses: Task['status'][] = ['Posted', 'Approved', 'Completed'];
const allStatuses: TaskStatus[] = ['To Do', 'Scheduled', 'On Work', 'For Approval', 'Approved', 'Posted', 'Hold', 'Ready for Next', 'Completed', 'Running', 'Overdue'];

const adTypes: (Task['contentType'])[] = [
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


const MAX_IMAGE_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5MB


const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Approved': 'default',
    'Posted': 'default',
    'On Work': 'secondary',
    'For Approval': 'secondary',
    'To Do': 'outline',
    'Scheduled': 'outline',
    'Hold': 'outline',
    'Completed': 'default',
    'Running': 'secondary',
    'Overdue': 'destructive',
}

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
    'Completed': 'bg-green-600 text-white',
    'Running': 'bg-blue-500 text-white',
};

const EditablePriorityCell = ({ task, onUpdate }: { task: Task & {id: string}, onUpdate: (taskId: string, data: Partial<Task>) => void }) => {
    const [priority, setPriority] = useState(task.priority || 0);

    useEffect(() => {
        setPriority(task.priority || 0);
    }, [task.priority]);

    const handleSave = () => {
        const newPriority = Number(priority);
        if (newPriority !== task.priority) {
            onUpdate(task.id, { priority: newPriority });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
            e.currentTarget.blur();
        }
    };

    return (
        <TableCell className="py-1 px-2 border-r border-t text-center">
            <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="h-7 w-10 text-xs p-1 mx-auto"
            />
        </TableCell>
    );
};


export default function RecentTasks({ tasks, users, title, onTaskDelete }: RecentTasksProps) {
  const { user: currentUser } = useAuth();
  const [clients, setClients] = useState<ClientWithId[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const { toast } = useToast();
  const { updateTask } = useTasks();
  
  const sortedTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...tasks]
      .map(task => ({
        ...task,
        isOverdue: !['For Approval', 'Approved', 'Posted', 'Completed'].includes(task.status) && new Date(task.deadline) < today
      }))
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        
        return (a.priority || 99) - (b.priority || 99);
      });
  }, [tasks]);

  useEffect(() => {
    const clientsQuery = collection(db, "clients");
    const unsubscribe = onSnapshot(clientsQuery, (querySnapshot) => {
        const clientsData = querySnapshot.docs.map(doc => ({ ...doc.data() as Client, id: doc.id }));
        setClients(clientsData);
    });

    return () => unsubscribe();
  }, []);
  
  const getAssignee = (assigneeId: string): UserWithId | undefined => {
    return users.find(u => u.id === assigneeId);
  }
  
  const getClient = (clientId?: string): ClientWithId | undefined => {
    if (!clientId) return undefined;
    return clients.find(c => c.id === clientId);
  }

  const handleStatusChange = (task: Task & {id: string}, newStatus: Task['status']) => {
    if(updateTask) {
        let statusToSave = newStatus;
        if (newStatus === 'Running') statusToSave = 'On Work';
        if (newStatus === 'Completed') statusToSave = 'Completed';
        if (newStatus === 'Overdue') {
             // If we are in an overdue state, and the user selects something else, that's fine.
             // But we don't want to save "Overdue" itself.
            const currentIsOverdue = !['For Approval', 'Approved', 'Posted', 'Completed'].includes(task.status) && new Date(task.deadline) < new Date();
             if(!currentIsOverdue) return;
             if(task.status !== 'Overdue') {
                 statusToSave = task.status;
             }
        }
        
        updateTask(task.id, { status: statusToSave });
    }
  }

  const handlePriorityChange = (task: Task & {id: string}, newPriority: Task['priority']) => {
    if(updateTask) {
        updateTask(task.id, { priority: newPriority });
    }
  }


    const addNote = (task: Task & { id: string }, note: Partial<ProgressNote>) => {
        if (!currentUser || !updateTask) return;
        
        const newNote: ProgressNote = { 
            note: note.note || '',
            date: new Date().toISOString(),
            authorId: currentUser.uid,
            authorName: currentUser.username,
            imageUrl: note.imageUrl,
        };

        updateTask(task.id, { progressNotes: [...(task.progressNotes || []), newNote] });
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
        if (updateTask) {
            updateTask(taskId, { progressNotes: [] });
        }
    }

  const employeeAllowedStatuses: TaskStatus[] = ['On Work', 'For Approval', 'Approved', 'Posted', 'Hold', 'Running', 'Completed'];
  const isAdmin = currentUser?.role === 'admin';

  return (
    <TooltipProvider>
    <Card className="shadow-md">
      <CardHeader className="py-2 px-3">
        <CardTitle className="font-headline text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="py-1 px-2 border-r border-t w-[25px] text-[10px] h-8">#</TableHead>
              <TableHead className="py-1 px-1 border-r border-t text-[10px] h-8 w-5">Order</TableHead>
              <TableHead className="py-1 px-2 border-r border-t text-[10px] h-8" style={{width: '100px'}}>Client</TableHead>
              <TableHead className="py-1 px-2 border-r border-t text-[10px] h-8" style={{width: '200px'}}>Task</TableHead>
               {isAdmin && <TableHead className="py-1 px-2 border-r border-t text-[10px] h-8">Assigned</TableHead>}
              <TableHead className="py-1 px-2 border-t w-[110px] text-[10px] h-8">Status</TableHead>
              {currentUser?.role === 'employee' && <TableHead className="text-xs h-8">Remarks</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map((task, index) => {
                const assignees = (task.assigneeIds || []).map(id => getAssignee(id)).filter(Boolean) as UserWithId[];
                const client = getClient(task.clientId);
                const isEmployeeView = currentUser?.role === 'employee';
                
                const descriptionWords = task.description ? task.description.split(/\s+/).filter(Boolean) : [];
                const wordCount = descriptionWords.length;
                const descriptionPreview = descriptionWords.slice(0, 10).join(' ');

                const isCompleted = completedStatuses.includes(task.status);
                const isPromotionTask = task.contentType && adTypes.includes(task.contentType as ContentType);
                
                let statusOptions: TaskStatus[] = allStatuses;

                if (isPromotionTask && isEmployeeView) {
                    statusOptions = ['Running', 'Completed'];
                }
                
                let currentStatus = task.isOverdue ? 'Overdue' : task.status;
                if (!statusOptions.includes(currentStatus as TaskStatus)) {
                    if (currentStatus === 'On Work' && isPromotionTask && isEmployeeView) {
                       // Don't add 'On Work' if 'Started' is the option
                    } else {
                         statusOptions.unshift(currentStatus as TaskStatus);
                    }
                }

                 if (currentStatus === 'On Work' && isPromotionTask && isEmployeeView) {
                    currentStatus = 'Running';
                 }
                 const finalDisplayedStatus = currentStatus;


                return (
                    <DropdownMenu key={task.id}>
                        <TableRow onContextMenu={(e) => { if (!isAdmin) e.preventDefault(); }}>
                            <TableCell className="py-1 px-2 border-r border-t text-[11px] font-medium text-center">{index + 1}</TableCell>
                            
                            {isAdmin ? (
                                <EditablePriorityCell task={task} onUpdate={updateTask} />
                            ) : (
                               <TableCell className="py-1 px-2 border-r border-t text-center text-xs font-bold">{task.priority}</TableCell>
                            )}

                            <TableCell className="py-1 px-2 border-r border-t text-[11px]" style={{maxWidth: '100px'}}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">
                                            {client ? (
                                                <span>{client.name}</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{client?.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TableCell>
                            <TableCell className="py-1 px-2 border-r border-t" style={{maxWidth: '200px'}}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="font-medium text-[11px] flex items-center gap-2 truncate">
                                            {task.title}
                                        </div>
                                    </TooltipTrigger>
                                     <TooltipContent>
                                        <p>{task.title}</p>
                                    </TooltipContent>
                                </Tooltip>

                                {wordCount > 10 ? (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <p className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground truncate">
                                            {descriptionPreview}... <span className="underline">more</span>
                                            </p>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[60vw]">
                                            <DialogHeader>
                                                <DialogTitle>{task.title}</DialogTitle>
                                            </DialogHeader>
                                            <DialogDescription asChild>
                                            <div className="whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto p-4">
                                                <LinkifiedText text={task.description} />
                                            </div>
                                            </DialogDescription>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <p className="text-[10px] text-muted-foreground truncate">{task.description}</p>
                                )}
                            </TableCell>
                            {isAdmin && (
                            <TableCell className="py-1 px-2 border-r border-t">
                                <DropdownMenuTrigger asChild>
                                    <span className="cursor-pointer hover:underline text-[11px]">
                                        {assignees.map(a => a.username).join(', ') || '-'}
                                    </span>
                                </DropdownMenuTrigger>
                            </TableCell>
                            )}
                            <TableCell className="py-1 px-2 border-t">
                                {updateTask && (isAdmin || isEmployeeView) ? (
                                    <div className="flex items-center gap-2">
                                        <Select 
                                            onValueChange={(newStatus) => handleStatusChange(task, newStatus as any)} 
                                            value={finalDisplayedStatus}
                                            disabled={(isCompleted && !isAdmin) || (finalDisplayedStatus === 'Overdue' && !isAdmin)}
                                        >
                                            <SelectTrigger className={cn("w-full h-7 text-[10px] px-2 focus:ring-accent", statusColors[finalDisplayedStatus])}>
                                                <SelectValue>{finalDisplayedStatus}</SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                {statusOptions.map(status => (
                                                    <SelectItem 
                                                        key={status} 
                                                        value={status}
                                                        disabled={(isEmployeeView && !employeeAllowedStatuses.includes(status as TaskStatus)) || (finalDisplayedStatus === 'Overdue' && status !== 'Overdue' && !isAdmin)}
                                                        className="text-xs"
                                                    >
                                                        {status}
                                                    </SelectItem>
                                                ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                <Badge variant={statusVariant[task.status] || 'default'} className={cn(
                                    "capitalize text-xs",
                                    statusColors[task.status]
                                )}>{task.status}</Badge>
                                )}
                            </TableCell>
                            {isEmployeeView && (
                                <TableCell className="text-center py-1 px-3 border-t">
                                    <Popover onOpenChange={(open) => {
                                        if (open) {
                                            setNoteInput('');
                                        }
                                    }}>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="relative h-8 w-8">
                                                <MessageSquare className="h-4 w-4" />
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
                                                        const authorName = author ? author.username : (note.authorName || '');
                                                        return (
                                                            <div key={i} className={cn("flex items-start gap-3 text-sm", note.authorId === currentUser?.uid ? 'justify-end' : '')}>
                                                                {note.authorId !== currentUser?.uid && (
                                                                        <Avatar className="h-8 w-8 border">
                                                                        
                                                                        <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                                                                    </Avatar>
                                                                )}
                                                                <div className={cn("max-w-[75%] rounded-lg p-3", note.authorId === currentUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                                                    <p className="font-bold text-xs mb-1">{note.authorId === currentUser?.uid ? 'You' : authorName}</p>
                                                                    {note.note && <div className="text-[11px] whitespace-pre-wrap break-words"><LinkifiedText text={note.note} /></div>}
                                                                    {note.imageUrl && (
                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <img src={note.imageUrl} alt="remark" className="mt-2 rounded-md max-w-full h-auto cursor-pointer" />
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
                                                                    <p className={cn("text-right text-[10px] mt-2 opacity-70", note.authorId === currentUser?.uid ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>{format(new Date(note.date), "MMM d, HH:mm")}</p>
                                                                </div>
                                                                    {note.authorId === currentUser?.uid && (
                                                                        <Avatar className="h-8 w-8 border">
                                                                        
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
                                                    />
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                            )}
                        </TableRow>
                        
                        {isAdmin && onTaskDelete && (
                            <DropdownMenuContent>
                                <DropdownMenuItem 
                                    onSelect={() => onTaskDelete(task.id)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Task
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        )}
                    </DropdownMenu>
                )
            })}
          </TableBody>
        </Table>
         {tasks.length === 0 && (
            <div className="text-center text-muted-foreground p-8">No tasks to display.</div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
