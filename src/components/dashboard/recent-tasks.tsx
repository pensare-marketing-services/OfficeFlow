
'use client';

import type { Task, UserProfile as User, ProgressNote, Client, TaskStatus } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MessageSquare, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTasks } from '@/hooks/use-tasks';
import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useToast } from '@/hooks/use-toast';


type UserWithId = User & { id: string };
type ClientWithId = Client & { id: string };

interface RecentTasksProps {
  tasks: (Task & {id: string})[];
  users: UserWithId[];
  title: string;
  onTaskUpdate?: (taskId: string, updatedData: Partial<Task>) => void;
}

const getInitials = (name: string) => name ? name.split(' ').map((n) => n[0]).join('').toUpperCase() : '';

const completedStatuses: Task['status'][] = ['Done', 'Posted', 'Approved'];

const MAX_IMAGE_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5MB


const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Done': 'default',
    'Approved': 'default',
    'Posted': 'default',
    'In Progress': 'secondary',
    'On Work': 'secondary',
    'For Approval': 'secondary',
    'To Do': 'outline',
    'Scheduled': 'outline',
    'Hold': 'outline',
}

const priorityMap: Record<Task['priority'], number> = {
    'High': 1,
    'Medium': 2,
    'Low': 3
};


export default function RecentTasks({ tasks, users, title, onTaskUpdate }: RecentTasksProps) {
  const { user: currentUser } = useAuth();
  const [clients, setClients] = useState<ClientWithId[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const { toast } = useToast();
  
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
    if(onTaskUpdate) {
        onTaskUpdate(task.id, { status: newStatus });
    }
  }

    const addNote = (task: Task & { id: string }, note: Partial<ProgressNote>) => {
        if (!currentUser || !onTaskUpdate) return;
        
        const newNote: ProgressNote = { 
            note: note.note || '',
            date: new Date().toISOString(),
            authorId: currentUser.uid,
            authorName: currentUser.name,
            imageUrl: note.imageUrl,
        };

        onTaskUpdate(task.id, { progressNotes: [...(task.progressNotes || []), newNote] });
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
        if (onTaskUpdate) {
            onTaskUpdate(taskId, { progressNotes: [] });
        }
    }

  const employeeAllowedStatuses: TaskStatus[] = ['In Progress', 'For Approval'];

  return (
    <>
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline">{title}</CardTitle>
        <CardDescription>
            { currentUser?.role === 'admin' ? "An overview of the latest tasks across the company." : "Your most recent tasks."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
               <TableHead>Client</TableHead>
               {currentUser?.role === 'admin' && <TableHead>Assigned To</TableHead>}
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              {currentUser?.role === 'employee' && <TableHead>Remarks</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => {
                const assignees = (task.assigneeIds || []).map(id => getAssignee(id)).filter(Boolean) as UserWithId[];
                const client = getClient(task.clientId);
                const isEmployeeView = currentUser?.role === 'employee';
                
                const descriptionWords = task.description ? task.description.split(/\s+/).filter(Boolean) : [];
                const wordCount = descriptionWords.length;
                const descriptionPreview = descriptionWords.slice(0, 10).join(' ');

                const isCompleted = completedStatuses.includes(task.status);
                
                const statusOptions: TaskStatus[] = ['In Progress', 'For Approval'];
                if (!statusOptions.includes(task.status)) {
                    statusOptions.unshift(task.status);
                }

                return (
                    <TableRow key={task.id}>
                        <TableCell>
                            <div className="font-medium">{task.title}</div>
                            {wordCount > 10 ? (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <p className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                          {descriptionPreview}... <span className="underline">Read more</span>
                                        </p>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[60vw]">
                                        <DialogHeader>
                                            <DialogTitle>{task.title}</DialogTitle>
                                        </DialogHeader>
                                        <DialogDescription asChild>
                                          <div className="whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto p-4">
                                            {task.description}
                                          </div>
                                        </DialogDescription>
                                    </DialogContent>
                                </Dialog>
                            ) : (
                                <p className="text-xs text-muted-foreground">{task.description}</p>
                            )}
                        </TableCell>
                        <TableCell>
                            {client ? (
                                <span className="text-sm">{client.name}</span>
                            ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                            )}
                        </TableCell>
                         {currentUser?.role === 'admin' && (
                          <TableCell>
                            <div className="flex -space-x-2">
                              {assignees.map(assignee => (
                                <Avatar key={assignee.id} className="h-8 w-8 border-2 border-background">
                                  <AvatarImage src={assignee.avatar} />
                                  <AvatarFallback>{getInitials(assignee.name)}</AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                           <span className="font-bold text-lg">{priorityMap[task.priority]}</span>
                        </TableCell>
                        <TableCell>
                            {onTaskUpdate && isEmployeeView ? (
                                <div className="flex items-center gap-2">
                                    <Select 
                                        onValueChange={(newStatus) => handleStatusChange(task, newStatus as any)} 
                                        value={task.status}
                                        disabled={isCompleted}
                                    >
                                        <SelectTrigger className="w-[140px] text-xs focus:ring-accent">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map(status => (
                                                <SelectItem 
                                                    key={status} 
                                                    value={status}
                                                    disabled={!employeeAllowedStatuses.includes(status)}
                                                >
                                                    <Badge variant={statusVariant[status] || 'default'} className="capitalize w-full justify-start">{status}</Badge>
                                                </SelectItem>
                                             ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                               <Badge variant={statusVariant[task.status] || 'default'} className="capitalize">{task.status}</Badge>
                            )}
                        </TableCell>
                        {isEmployeeView && (
                            <TableCell className="text-center">
                                <Popover onOpenChange={(open) => {
                                    if (open) {
                                        setNoteInput('');
                                    }
                                }}>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="relative">
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
                                                    const authorName = author ? author.name : (note.authorName || '');
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
                                                />
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </TableCell>
                        )}
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
         {tasks.length === 0 && (
            <div className="text-center text-muted-foreground p-8">No tasks to display.</div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
