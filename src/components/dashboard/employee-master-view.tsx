'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Task, UserProfile, Client, ProgressNote } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LinkifiedText } from '@/components/shared/linkified-text';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useUsers } from '@/hooks/use-users';
import { useHorizontalScroll } from '@/hooks/use-horizontal-scroll';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    const {scrollRef, scrollLeft, scrollRight, canScrollLeft, canScrollRight} = useHorizontalScroll();
    
    const containerRef = useRef<HTMLDivElement>(null);
    const fixedTableContainerRef = useRef<HTMLDivElement>(null);
    
    const isSyncingLeftScroll = useRef(false);
    const isSyncingRightScroll = useRef(false);


    // Synchronize vertical scrolling
    useEffect(() => {
        const fixedContainer = fixedTableContainerRef.current;
        const scrollableContainer = scrollRef.current;

        if (!fixedContainer || !scrollableContainer) return;

        const handleFixedScroll = () => {
            if (!isSyncingLeftScroll.current) {
                isSyncingRightScroll.current = true;
                scrollableContainer.scrollTop = fixedContainer.scrollTop;
            }
            isSyncingLeftScroll.current = false;
        };

        const handleScrollableScroll = () => {
            if (!isSyncingRightScroll.current) {
                isSyncingLeftScroll.current = true;
                fixedContainer.scrollTop = scrollableContainer.scrollTop;
            }
            isSyncingRightScroll.current = false;
        };

        fixedContainer.addEventListener('scroll', handleFixedScroll);
        scrollableContainer.addEventListener('scroll', handleScrollableScroll);

        return () => {
            fixedContainer.removeEventListener('scroll', handleFixedScroll);
            scrollableContainer.removeEventListener('scroll', handleScrollableScroll);
        };
    }, [scrollRef]);
    
    const employees = useMemo(() => 
        users.filter(u => u.role === 'employee').sort((a,b) => (a.priority ?? 99) - (b.priority ?? 99))
    , [users]);

    const dmClients = useMemo(() =>
        clients
        .filter(c => c.categories?.includes('digital marketing') || c.categories?.includes('gd'))
        .sort((a,b) => (a.priority || 0) - (b.priority || 0))
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

    const employeeColWidth = 120;
    const orderColWidth = 70;
    const totalEmployeeWidth = employees.length * (employeeColWidth + orderColWidth);

    return (
        <Card className="w-full overflow-hidden">
            <CardContent className="p-0 w-full">
                <div className='flex items-center justify-end p-1 border-b bg-muted/50'>
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={scrollLeft} 
                            disabled={!canScrollLeft}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={scrollRight} 
                            disabled={!canScrollRight}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex w-full" ref={containerRef} style={{ height: 'calc(100vh - 200px)' }}>
                    {/* Fixed Columns */}
                    <div 
                        ref={fixedTableContainerRef}
                        className="flex-shrink-0 z-10 bg-background border-r shadow-sm overflow-y-auto"
                        style={{'--scrollbar-width': '0px'} as React.CSSProperties}
                        onWheel={(e) => {
                            if (scrollRef.current) {
                                scrollRef.current.scrollTop += e.deltaY;
                            }
                        }}
                    >
                        <Table className="text-xs">
                            <TableHeader className="sticky top-0 z-20 bg-background">
                                <TableRow className="h-10">
                                    <TableHead className="bg-muted/80" style={{ width: '40px' }}>Sl.</TableHead>
                                    <TableHead className="bg-muted/80" style={{ width: '180px' }}>Client Name</TableHead>
                                    <TableHead className="bg-muted/80" style={{ minWidth: '180px' }}>Assigned</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dmClients.map((client, index) => {
                                    const assignedEmployees = (client.employeeIds || [])
                                        .map(id => users.find(u => u.id === id)?.username)
                                        .filter(Boolean)
                                        .join(', ');
                                    return (
                                        <TableRow 
                                            key={client.id}
                                            className={cn("h-10 border-b border-border/50 hover:bg-muted/30", selectedClientId === client.id && 'bg-accent/20')}
                                            onClick={() => setSelectedClientId(client.id)}
                                        >
                                            <TableCell className="text-center font-medium border-r">{index + 1}</TableCell>
                                            <TableCell className="font-medium text-xs border-r">{client.name}</TableCell>
                                            <TableCell className="text-xs">{assignedEmployees}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Scrollable Columns */}
                    <div 
                        ref={scrollRef}
                        className="flex-grow min-w-0 overflow-auto"
                    >
                        <div style={{ width: `${totalEmployeeWidth}px` }}>
                            <Table className="text-xs table-fixed">
                                <TableHeader className="sticky top-0 z-10 bg-background">
                                    <TableRow className="h-10">
                                        {employees.map(employee => (
                                            <React.Fragment key={employee.id}>
                                                <TableHead style={{ width: `${employeeColWidth}px` }} className="bg-muted/80 border-l border-border/50">
                                                    <div className="truncate px-2 font-medium" title={employee.username}>{employee.username}</div>
                                                </TableHead>
                                                <TableHead style={{ width: `${orderColWidth}px` }} className="bg-muted/80 border-l border-border/50">
                                                    <div className="px-2 font-medium">Order</div>
                                                </TableHead>
                                            </React.Fragment>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dmClients.map((client) => (
                                        <TableRow key={client.id} className={cn("h-10 border-b border-border/50", selectedClientId === client.id && 'bg-accent/20 hover:bg-accent/20')}>
                                            {employees.map(employee => {
                                                const task = clientTasks.get(`${client.id}-${employee.id}`);
                                                return (
                                                    <React.Fragment key={employee.id}>
                                                        <TableCell className='p-0 border-l border-border/50' style={{ width: `${employeeColWidth}px` }}>
                                                            {task ? 
                                                                <TaskCell task={task} onSelect={() => setSelectedClientId(client.id)} isSelected={selectedClientId === client.id} /> :
                                                                <div className="h-full w-full p-1 border-r border-border/50 flex items-center justify-center text-muted-foreground/50">-</div>
                                                            }
                                                        </TableCell>
                                                        <TableCell className='p-0 border-l border-border/50' style={{ width: `${orderColWidth}px` }}>
                                                            <div className="p-1 border-r border-border/50 flex items-center justify-center h-full">
                                                                <EditablePriorityCell user={employee} />
                                                            </div>
                                                        </TableCell>
                                                    </React.Fragment>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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
