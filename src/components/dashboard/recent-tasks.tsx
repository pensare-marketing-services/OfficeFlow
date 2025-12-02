

'use client';

import type { Task, UserProfile as User, ProgressNote, Client } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTasks } from '@/hooks/use-tasks';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/client';

type UserWithId = User & { id: string };
type ClientWithId = Client & { id: string };

interface RecentTasksProps {
  tasks: (Task & {id: string})[];
  users: UserWithId[];
  title: string;
  onTaskUpdate?: (taskId: string, updatedData: Partial<Task>) => void;
}

const getInitials = (name: string) => name ? name.split(' ').map((n) => n[0]).join('').toUpperCase() : '';

const baseEmployeeStatuses: Task['status'][] = ['In Progress', 'For Approval'];
const completedStatuses: Task['status'][] = ['Done', 'Approved', 'Posted'];


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
    'Overdue': 'destructive'
}

const priorityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'High': 'destructive',
    'Medium': 'secondary',
    'Low': 'outline'
}


export default function RecentTasks({ tasks, users, title, onTaskUpdate }: RecentTasksProps) {
  const { user: currentUser } = useAuth();
  const [clients, setClients] = useState<ClientWithId[]>([]);
  
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

  const handleNewNote = (e: React.KeyboardEvent<HTMLTextAreaElement>, task: Task & { id: string }) => {
    if (e.key === 'Enter' && !e.shiftKey && currentUser && onTaskUpdate) {
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
            onTaskUpdate(task.id, { progressNotes: [...(task.progressNotes || []), newNote] });
            e.currentTarget.value = '';
        }
    }
  }

  const handleMarkAsRead = (task: Task & {id: string}) => {
    if (!currentUser || !onTaskUpdate) return;
    const updatedNotes = (task.progressNotes || []).map(note => {
        if (note.readBy && !note.readBy.includes(currentUser.uid)) {
            return { ...note, readBy: [...note.readBy, currentUser.uid] };
        }
        return note;
    });
    if (JSON.stringify(updatedNotes) !== JSON.stringify(task.progressNotes)) {
         onTaskUpdate(task.id, { progressNotes: updatedNotes });
    }
  }

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
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              {currentUser?.role === 'employee' && <TableHead>Remarks</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => {
                const assignees = (task.assigneeIds || []).map(id => getAssignee(id)).filter(Boolean) as UserWithId[];
                const client = getClient(task.clientId);
                const isEmployeeView = currentUser?.role === 'employee';
                const unreadCount = currentUser ? (task.progressNotes || []).filter(n => n.readBy && !n.readBy.includes(currentUser.uid)).length : 0;
                
                const descriptionWords = task.description ? task.description.split(/\s+/).filter(Boolean) : [];
                const wordCount = descriptionWords.length;
                const descriptionPreview = descriptionWords.slice(0, 2).join(' ');

                const isCompleted = completedStatuses.includes(task.status);
                
                const availableStatuses: Task['status'][] = baseEmployeeStatuses;


                return (
                    <TableRow key={task.id}>
                        <TableCell>
                            <div className="font-medium">{task.title}</div>
                            {wordCount > 10 ? (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <p className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                          {descriptionPreview}... <span className="underline">Read description...</span>
                                        </p>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[60vw]">
                                        <DialogHeader>
                                            <DialogTitle>{task.title}</DialogTitle>
                                        </DialogHeader>
                                        <DialogDescription className="whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto">
                                            {task.description}
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
                                                {!availableStatuses.includes(task.status) && (
                                                    <SelectItem value={task.status} disabled>
                                                        <Badge variant={statusVariant[task.status] || 'default'} className="capitalize w-full justify-start">{task.status}</Badge>
                                                    </SelectItem>
                                                )}
                                                 {availableStatuses.map(status => (
                                                    <SelectItem key={status} value={status}>
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
                        <TableCell>
                            <Badge variant={priorityVariant[task.priority] || 'default'} className="capitalize">{task.priority}</Badge>
                        </TableCell>
                        {isEmployeeView && (
                            <TableCell className="text-center">
                                <Popover onOpenChange={(open) => open && handleMarkAsRead(task)}>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="relative">
                                            <MessageSquare className="h-5 w-5" />
                                            {unreadCount > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 justify-center p-0">{unreadCount}</Badge>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-96" side="bottom" align="end">
                                        <div className="space-y-4">
                                            <h4 className="font-medium leading-none">Remarks</h4>
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
