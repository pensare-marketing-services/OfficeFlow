'use client';

import React, { useState, useMemo } from 'react';
import type { Task, UserProfile, Client, ProgressNote } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, capitalizeSentences } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LinkifiedText } from '../shared/linkified-text';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useUsers } from '@/hooks/use-users';

type UserWithId = UserProfile & { id: string };
type ClientWithId = Client & { id: string };
type TaskWithId = Task & { id: string };

interface EmployeeMasterViewProps {
  tasks: TaskWithId[];
  users: UserWithId[];
  clients: ClientWithId[];
}

const statusColors: Record<string, string> = {
    'On Work': 'bg-orange-500/20',
    'For Approval': 'bg-yellow-500/20',
    'Approved': 'bg-green-600/20',
    'Posted': 'bg-purple-500/20',
    'Hold': 'bg-gray-500/20',
    'Ready for Next': 'bg-teal-500/20',
};

const getInitials = (name: string = '') => name ? name.charAt(0).toUpperCase() : '';


const EditablePriorityCell: React.FC<{ user: UserWithId }> = ({ user }) => {
    const { updateUserPriority } = useUsers();
    const [priority, setPriority] = useState(user.priority ?? 0);

    const handleBlur = () => {
        const newPriority = Number(priority);
        if (newPriority !== (user.priority ?? 0)) {
            updateUserPriority(user.id, newPriority);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleBlur();
            e.currentTarget.blur();
        }
    };

    return (
        <Input 
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="h-7 w-12 text-xs text-center p-1 bg-transparent border-transparent hover:border-border focus:border-ring"
        />
    )
}

const TaskCell = ({ task, onSelect, isSelected }: { task: TaskWithId; onSelect: () => void; isSelected: boolean }) => {
    if (!task) return <div className="h-full w-full p-1 border-r"></div>;
    const { user: currentUser } = useAuth();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div 
                    onClick={onSelect}
                    className={cn(
                        "h-full w-full cursor-pointer p-1 text-xs font-medium border-r",
                         statusColors[task.status] || 'bg-transparent',
                         isSelected && 'ring-2 ring-inset ring-accent'
                    )}
                >
                    {task.title}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="bottom" align="start">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none text-sm">{task.title}</h4>
                     <div className="max-h-60 space-y-3 overflow-y-auto p-1">
                        {(task.progressNotes || []).map((note, i) => {
                             const authorName = note.authorName || 'User';
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
                         {(task.progressNotes || []).length === 0 && (
                            <p className="text-center text-xs text-muted-foreground py-4">No remarks for this task.</p>
                         )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default function EmployeeMasterView({ tasks, users, clients }: EmployeeMasterViewProps) {
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    const employees = useMemo(() => 
        users.filter(u => u.role === 'employee').sort((a,b) => (a.priority ?? 99) - (b.priority ?? 99))
    , [users]);

    const dmClients = useMemo(() =>
        clients
        .filter(c => c.categories?.includes('digital marketing') || c.categories?.includes('gd'))
        .sort((a,b) => (a.priority || 99) - (b.priority || 99))
    , [clients]);
    
    const clientTasks = useMemo(() => {
        const map = new Map<string, TaskWithId>();
        tasks.forEach(task => {
            const activeAssigneeId = task.assigneeIds?.[task.activeAssigneeIndex ?? 0];
            if (task.clientId && activeAssigneeId) {
                const key = `${task.clientId}-${activeAssigneeId}`;
                map.set(key, task);
            }
        });
        return map;
    }, [tasks]);

    return (
        <Card>
            <CardContent className="p-0">
                <div className="flex text-xs">
                    {/* Fixed Columns */}
                    <div className="flex-shrink-0 border-r">
                        {/* Header */}
                        <div className="flex bg-muted">
                            <div className="p-1 border-b border-r text-center font-semibold" style={{width: '40px'}}>Sl.</div>
                            <div className="p-1 border-b border-r font-semibold" style={{width: '150px'}}>Client Name</div>
                            <div className="p-1 border-b font-semibold" style={{width: '150px'}}>Assigned</div>
                        </div>
                        {/* Body */}
                        <div>
                            {dmClients.map((client, index) => {
                                const assignedEmployees = (client.employeeIds || [])
                                    .map(id => users.find(u => u.id === id)?.username)
                                    .filter(Boolean)
                                    .join(', ');
                                return (
                                    <div 
                                        key={client.id}
                                        className={cn(
                                            "flex h-10 items-stretch border-b",
                                            selectedClientId === client.id && 'bg-accent/20'
                                        )}
                                    >
                                        <div className="p-1 border-r text-center self-center" style={{width: '40px'}}>{index + 1}</div>
                                        <div 
                                            className="p-1 border-r font-medium text-xs cursor-pointer self-center" 
                                            style={{width: '150px'}}
                                            onClick={() => setSelectedClientId(client.id)}
                                        >
                                            {client.name}
                                        </div>
                                        <div className="p-1 text-xs self-center" style={{width: '150px'}}>{assignedEmployees}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    {/* Scrollable Columns */}
                    <div className="overflow-x-auto flex-grow">
                        <div className="flex flex-col" style={{width: employees.length * 210}}>
                             {/* Header */}
                            <div className="flex bg-muted flex-shrink-0">
                                {employees.map(employee => (
                                    <React.Fragment key={employee.id}>
                                        <div className="p-1 border-b border-r text-center font-semibold" style={{width: '150px'}}>
                                            {employee.username}
                                        </div>
                                        <div className="p-1 border-b border-r text-center font-semibold" style={{width: '60px'}}>
                                            Order
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                            {/* Body */}
                            <div>
                                {dmClients.map((client) => (
                                    <div key={client.id} className="flex h-10 items-stretch border-b">
                                        {employees.map(employee => {
                                            const task = clientTasks.get(`${client.id}-${employee.id}`);
                                            return (
                                                <React.Fragment key={employee.id}>
                                                    <div style={{width: '150px'}}>
                                                        {task && 
                                                            <TaskCell 
                                                                task={task} 
                                                                onSelect={() => setSelectedClientId(client.id)}
                                                                isSelected={selectedClientId === client.id}
                                                            />
                                                        }
                                                        {!task && 
                                                             <div 
                                                                className={cn("h-full w-full border-r", selectedClientId === client.id && 'bg-accent/20')}
                                                                onClick={() => setSelectedClientId(client.id)}
                                                             ></div>
                                                        }
                                                    </div>
                                                    <div 
                                                        className={cn("p-1 border-r flex items-center justify-center", selectedClientId === client.id && 'bg-accent/20')} 
                                                        style={{width: '60px'}}
                                                        onClick={() => setSelectedClientId(client.id)}
                                                    >
                                                        <EditablePriorityCell user={employee} />
                                                    </div>
                                                </React.Fragment>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                 {dmClients.length === 0 && (
                    <div className="text-center text-muted-foreground p-8">No Digital Marketing or GD clients found.</div>
                )}
            </CardContent>
        </Card>
    );
}
