

'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Task, UserProfile, Client, ProgressNote } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LinkifiedText } from '@/components/shared/linkified-text';
import { format, getDaysInMonth, startOfMonth, isSameDay, setDate, startOfDay } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { useTasks } from '@/hooks/use-tasks';
import { useHorizontalScroll } from '@/hooks/use-horizontal-scroll';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, ChevronDown, Pen } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';


type UserWithId = UserProfile & { id: string };
type ClientWithId = Client & { id: string };
type TaskWithId = Task & { id: string };

interface SeoWebEmployeeMasterViewProps {
  tasks: TaskWithId[];
  users: UserWithId[];
  clients: ClientWithId[];
  onViewEmployee?: (employeeId: string) => void;
}

const statusBackgroundColors: Record<string, string> = {
  'Scheduled': 'bg-transparent',
  'On Work': 'bg-gray-500/40',
  'For Approval': 'bg-[#ffb131]',
  'Approved': 'bg-[#42f925]',
  'Posted': 'bg-[#32fafe]',
  'Completed': 'bg-[#32fafe]',
  'Hold': 'bg-gray-500/40',
  'To Do': 'bg-gray-400/40',
  'Ready for Next': 'bg-teal-500/40',
  'Reschedule': 'bg-rose-500/40',
  'Overdue': 'bg-red-600/40',
  'Running': 'bg-blue-500/40',
  'Active': 'bg-blue-500/40',
  'Stopped': 'bg-red-500/40',
};


const getInitials = (name: string = '') =>
  name ? name.charAt(0).toUpperCase() : '';

const PriorityDisplayItem = ({ task }: { task: TaskWithId }) => {
    const { updateTask } = useTasks();
    const [priority, setPriority] = useState(task.priority ?? 9);

    useEffect(() => {
        setPriority(task.priority ?? 9);
    }, [task.priority]);

    const handleBlur = () => {
        const newPriority = Number(priority);
        if (newPriority !== (task.priority ?? 9)) {
            updateTask(task.id, { priority: newPriority });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    return (
        <div className="h-7 w-full flex items-center justify-center border-b">
            <Input
                type="number"
                value={priority}
                min={1}
                max={9}
                onChange={(e) => setPriority(Number(e.target.value))}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="h-6 w-8 text-[10px] text-center p-1 bg-transparent border-transparent hover:border-border focus:border-ring"
            />
        </div>
    );
};

const TaskDisplayItem = ({ task, isSelected }: { task: TaskWithId; isSelected: boolean }) => {
    const { user: currentUser } = useAuth();
    const { updateTask } = useTasks();
    const [editingRemark, setEditingRemark] = useState<{ taskId: string; remarkIndex: number } | null>(null);
    const [editingText, setEditingText] = useState('');

    const handleEditRemark = (task: TaskWithId, remarkIndex: number) => {
        const remark = task.progressNotes?.[remarkIndex];
        if (!remark) return;
        setEditingRemark({ taskId: task.id, remarkIndex });
        setEditingText(remark.note || '');
    };

    const handleSaveRemark = (task: TaskWithId, remarkIndex: number) => {
        if (!editingRemark) return;
        const updatedNotes = [...(task.progressNotes || [])];
        updatedNotes[remarkIndex] = { ...updatedNotes[remarkIndex], note: editingText };
        updateTask(task.id, { progressNotes: updatedNotes });
        setEditingRemark(null);
        setEditingText('');
    };

    const taskStatusColor = statusBackgroundColors[task.status] || 'bg-transparent';

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        'h-7 w-full flex items-center justify-center cursor-pointer text-[10px] font-medium border-b px-1 gap-1',
                        taskStatusColor,
                        isSelected && 'ring-1 ring-accent ring-inset'
                    )}
                >
                    <span className="truncate">{task.title}</span>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" side="bottom" align="start">
                <div className="max-h-60 space-y-3 p-1 overflow-y-auto">
                    <h4 className="font-medium text-xs">{task.title}</h4>
                    {(task.progressNotes || []).map((note, remarkIndex) => {
                        const authorName = note.authorName || 'User';
                        const isEditing = editingRemark?.taskId === task.id && editingRemark?.remarkIndex === remarkIndex;

                        return (
                            <div key={remarkIndex} className={cn('flex items-start gap-2 text-[10px] group/remark', note.authorId === currentUser?.uid ? 'justify-end' : '')}>
                                {note.authorId !== currentUser?.uid && <Avatar className="h-6 w-6 border"><AvatarFallback>{getInitials(authorName)}</AvatarFallback></Avatar>}
                                <div className={cn('max-w-[75%] rounded-lg p-2 relative', note.authorId === currentUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                    {currentUser?.role === 'admin' && !isEditing && (
                                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-2 w-2" onClick={() => handleEditRemark(task, remarkIndex)}><Pen className="h-2 w-2" /></Button>
                                    )}
                                    <p className="font-bold text-[10px] mb-1">{note.authorId === currentUser?.uid ? 'You' : authorName}</p>
                                    {isEditing ? (
                                        <Textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} onBlur={() => handleSaveRemark(task, remarkIndex)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveRemark(task, remarkIndex); } else if (e.key === 'Escape') { setEditingRemark(null); } }} autoFocus className="text-[10px] h-auto bg-background/80 text-foreground" />
                                    ) : (
                                        <>
                                            {note.note && <div className="text-[11px] whitespace-pre-wrap"><LinkifiedText text={note.note} /></div>}
                                            {note.imageUrl && <Dialog><DialogTrigger asChild><img src={note.imageUrl} alt="remark" className="mt-1 rounded-md max-w-full h-auto cursor-pointer" /></DialogTrigger><DialogContent className="max-w-[90vw] max-h-[90vh] flex items-center"><img src={note.imageUrl} alt="remark full view" className="max-w-full max-h-full object-contain" /></DialogContent></Dialog>}
                                        </>
                                    )}
                                    <p className="text-[9px] text-right mt-1 opacity-70">{format(new Date(note.date), 'MMM d, HH:mm')}</p>
                                </div>
                                {note.authorId === currentUser?.uid && <Avatar className="h-6 w-6 border"><AvatarFallback>{getInitials(currentUser.nickname || currentUser.username)}</AvatarFallback></Avatar>}
                            </div>
                        );
                    })}
                    {(task.progressNotes || []).length === 0 && <p className="text-center text-[10px] text-muted-foreground py-4">No notes for this task.</p>}
                </div>
            </PopoverContent>
        </Popover>
    );
};


export default function SeoWebEmployeeMasterView({ tasks, users, clients, onViewEmployee }: SeoWebEmployeeMasterViewProps) {
  const [currentMonthDate, setCurrentMonthDate] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  
  const employees = useMemo(() => {
    const departmentOrder: Exclude<UserProfile['department'], undefined>[] = ['seo', 'web'];
    return users
      .filter((u) => u.role === 'employee' && u.department && departmentOrder.includes(u.department))
      .sort((a, b) => {
        const priorityA = a.priority ?? 99;
        const priorityB = b.priority ?? 99;
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        const depA = a.department;
        const depB = b.department;
        const indexA = depA ? departmentOrder.indexOf(depA) : -1;
        const indexB = depB ? departmentOrder.indexOf(depB) : -1;

        if (indexA !== indexB) {
            return indexA - indexB;
        }

        return (a.username || '').localeCompare(b.username || '');
      });
  }, [users]);
  
  const activeTasks = useMemo(() => tasks.filter(t => t.status !== 'To Do'), [tasks]);

  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, TaskWithId[]>();
    const today = startOfDay(new Date());
    const incompleteStatuses: Task['status'][] = ['Scheduled', 'On Work', 'For Approval', 'Hold', 'Ready for Next'];

    activeTasks.forEach(task => {
        if (!task.deadline) return;
        const deadline = startOfDay(new Date(task.deadline));

        if (incompleteStatuses.includes(task.status) && deadline < today) {
            const dateKey = format(today, 'yyyy-MM-dd');
            if(!grouped.has(dateKey)) grouped.set(dateKey, []);
            grouped.get(dateKey)!.push(task);
        } else {
            const dateKey = format(deadline, 'yyyy-MM-dd');
            if(!grouped.has(dateKey)) grouped.set(dateKey, []);
            grouped.get(dateKey)!.push(task);
        }
    });
    return grouped;
  }, [activeTasks]);
  
  const daysInMonth = getDaysInMonth(currentMonthDate);
  const dateButtons = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const changeMonth = (amount: number) => {
    setCurrentMonthDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(prev.getMonth() + amount);
        setSelectedDate(startOfDay(newDate));
        return newDate;
    });
  }
  
  const daysWithTasksInCurrentMonth = useMemo(() => {
    const days = new Set<number>();
    activeTasks.forEach(task => {
        if(task.deadline) {
            const taskDate = new Date(task.deadline);
            if(taskDate.getMonth() === currentMonthDate.getMonth() && taskDate.getFullYear() === currentMonthDate.getFullYear()) {
                days.add(taskDate.getDate());
            }
        }
    });
    const today = new Date();
    if(currentMonthDate.getMonth() === today.getMonth() && currentMonthDate.getFullYear() === today.getFullYear()) {
       days.add(today.getDate());
    }

    return days;
  }, [activeTasks, currentMonthDate]);
  
  const getTasksForSelectedDay = () => {
    const today = startOfDay(new Date());
    const incompleteStatuses: Task['status'][] = ['Scheduled', 'On Work', 'For Approval', 'Hold', 'Ready for Next', 'Approved'];
  
    let dailyTasks = activeTasks.filter(task => {
      if (!task.deadline) return false;
      const deadline = startOfDay(new Date(task.deadline));
      return isSameDay(deadline, selectedDate);
    });
  
    if (isSameDay(selectedDate, today)) {
      const rolloverTasks = activeTasks.filter(task => {
        if (!task.deadline) return false;
        const deadline = startOfDay(new Date(task.deadline));
        return deadline < today && incompleteStatuses.includes(task.status);
      });
  
      const allTasksForToday = [...dailyTasks, ...rolloverTasks];
      const uniqueTasks = Array.from(new Map(allTasksForToday.map(task => [task.id, task])).values());
      return uniqueTasks;
    }
  
    return dailyTasks;
  };

  const tasksForSelectedDay = getTasksForSelectedDay();


  return (
    <Card className="w-full overflow-hidden m-0">
      <CardContent className="p-1 space-y-1">
        <div className="flex items-center justify-between p-1 border-b gap-2">
           <div className="flex-shrink-0 flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-xs font-semibold w-24 text-center">{format(currentMonthDate, 'MMMM yyyy')}</h3>
                 <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
           </div>
            <div className="flex-grow flex flex-wrap gap-1 justify-around">
                {dateButtons.map(day => (
                    <Button 
                        key={day} 
                        variant={isSameDay(selectedDate, setDate(currentMonthDate, day)) ? 'default' : daysWithTasksInCurrentMonth.has(day) ? 'secondary' : 'outline'}
                        size="sm"
                        className="h-6 w-6 p-0 text-[10px]"
                        onClick={() => {
                            setSelectedDate(startOfDay(setDate(currentMonthDate, day)));
                        }}
                    >
                        {day}
                    </Button>
                ))}
            </div>
        </div>
        
        <div>
            <DailyTaskTable 
                tasks={tasksForSelectedDay}
                users={users}
                clients={clients}
                employees={employees}
                selectedDate={selectedDate}
                onViewEmployee={onViewEmployee}
            />
        </div>
      </CardContent>
    </Card>
  );
}





const DailyTaskTable: React.FC<{
  tasks: TaskWithId[];
  users: UserWithId[];
  clients: ClientWithId[];
  employees: UserWithId[];
  selectedDate: Date;
  onViewEmployee?: (employeeId: string) => void;
}> = ({ tasks, users, clients, employees, selectedDate, onViewEmployee }) => {
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const { scrollRef } = useHorizontalScroll();
    const tableRef = useRef<HTMLDivElement>(null);
    const [highlightedClientIds, setHighlightedClientIds] = useState<Set<string>>(new Set());

    const getStorageKey = (date: Date) => `seo_highlightedClients_${format(date, 'yyyy-MM-dd')}`;

    useEffect(() => {
        const storageKey = getStorageKey(selectedDate);
        try {
            const item = window.localStorage.getItem(storageKey);
            if (item) {
                setHighlightedClientIds(new Set(JSON.parse(item)));
            } else {
                setHighlightedClientIds(new Set());
            }
        } catch (error) {
            console.error("Failed to read from localStorage", error);
            setHighlightedClientIds(new Set());
        }
    }, [selectedDate]);

    const toggleHighlight = (clientId: string) => {
        const newSet = new Set(highlightedClientIds);
        if (newSet.has(clientId)) {
            newSet.delete(clientId);
        } else {
            newSet.add(clientId);
        }
        setHighlightedClientIds(newSet);

        try {
            const storageKey = getStorageKey(selectedDate);
            window.localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));
        } catch (error) {
            console.error("Failed to write to localStorage", error);
        }
    };


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setSelectedClientId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [tableRef]);

  const seoWebClients = useMemo(
    () =>
      clients
        .filter(c => c.active !== false)
        .filter(
          (c) =>
            c.categories?.includes('seo') ||
            c.categories?.includes('website')
        )
        .sort((a, b) => (a.priority || 0) - (b.priority || 0)),
    [clients]
  );
  
    const clientTasks = useMemo(() => {
        const map = new Map<string, TaskWithId[]>();
        tasks.forEach((task) => {
            (task.assigneeIds || []).forEach(assigneeId => {
                 if (task.clientId && assigneeId) {
                    const key = `${task.clientId}-${assigneeId}`;
                    if (!map.has(key)) {
                        map.set(key, []);
                    }
                    map.get(key)!.push(task);
                }
            });
        });
        return map;
    }, [tasks]);

  const employeeColWidth = 80;
  const orderColWidth = 25;

  if (tasks.length === 0) {
      return (
          <div className="text-center p-8 text-muted-foreground">
              No tasks scheduled for this day for SEO/Web teams.
          </div>
      );
  }

  return (
    <div className="border rounded-lg overflow-hidden" ref={tableRef}>
        <div className="overflow-x-auto relative" ref={scrollRef}>
            <Table className="text-[10px] border-collapse min-w-full">
                <TableHeader className="sticky top-0 bg-background z-30">
                <TableRow className="h-7">
                    <TableHead className='border-r p-1 w-[20px]'>Sl.</TableHead>
                    <TableHead className='border-r p-1 w-[40px]'>Client</TableHead>
                    <TableHead className='border-r p-1 w-[40px]'>Assigned</TableHead>
                    {employees.map((employee) => (
                    <React.Fragment key={employee.id}>
                        <TableHead
                        style={{ width: `${employeeColWidth}px` }}
                        className="bg-muted/80 border-r p-0"
                        >
                        <div className="h-full w-full flex items-center justify-center px-1">
                            {onViewEmployee ? (
                                <Button 
                                    variant="link"
                                    className="text-foreground hover:text-primary h-auto p-0 text-[10px] font-semibold" 
                                    onClick={() => onViewEmployee(employee.id)}
                                >
                                    <span className="truncate">{employee.nickname || employee.username}</span>
                                </Button>
                            ) : (
                                <span className="truncate">{employee.nickname || employee.username}</span>
                            )}
                        </div>
                        </TableHead>

                        <TableHead
                        style={{ width: `${orderColWidth}px` }}
                        className="bg-muted/80 border-r p-0"
                        >
                        <div className="h-full w-full flex items-center justify-center text-center">
                            O
                        </div>
                        </TableHead>
                    </React.Fragment>
                    ))}
                </TableRow>
                </TableHeader>
                <TableBody>
                {seoWebClients.map((client, clientIndex) => {
                    const assignedEmployees = (client.employeeIds || [])
                    .map((id) => {
                        const user = users.find((u) => u.id === id);
                        return user ? user.nickname || user.username : null;
                        })
                    .filter(Boolean)
                    .join(', ');
                    
                    const isHighlighted = highlightedClientIds.has(client.id);

                    const tasksByEmployee = employees.map(employee => 
                        clientTasks.get(`${client.id}-${employee.id}`)?.sort((a, b) => (a.priority || 99) - (b.priority || 99)) || []
                    );

                    const maxTasks = Math.max(1, ...tasksByEmployee.map(tasks => tasks.length));

                    return (
                    <React.Fragment key={client.id}>
                        {Array.from({ length: maxTasks }).map((_, rowIndex) => (
                        <TableRow
                            key={`${client.id}-${rowIndex}`}
                            className={cn('hover:bg-muted/30', selectedClientId === client.id && 'bg-accent/20')}
                            onClick={() => setSelectedClientId(client.id)}
                        >
                            {rowIndex === 0 && (
                            <>
                                <TableCell rowSpan={maxTasks} className="border-r align-middle text-center">
                                {clientIndex + 1}
                                </TableCell>
                                <TableCell
                                rowSpan={maxTasks}
                                className={cn("border-r align-middle px-1", isHighlighted && "bg-yellow-200")}
                                onDoubleClick={() => toggleHighlight(client.id)}
                                >
                                <span className="truncate">{client.name}</span>
                                </TableCell>
                                <TableCell rowSpan={maxTasks} className="border-r align-middle px-1">
                                <span className="truncate">{assignedEmployees}</span>
                                </TableCell>
                            </>
                            )}
                            
                            {employees.map((employee, empIndex) => {
                            const task = tasksByEmployee[empIndex]?.[rowIndex];
                            return (
                                <React.Fragment key={employee.id}>
                                <TableCell className="p-0 border-r align-top" style={{ width: `${employeeColWidth}px` }}>
                                    {task ? <TaskDisplayItem task={task} isSelected={selectedClientId === client.id} /> : <div className='h-7 border-b'></div>}
                                </TableCell>
                                <TableCell className="p-0 border-r align-top" style={{ width: `${orderColWidth}px` }}>
                                    {task ? <PriorityDisplayItem task={task} /> : <div className='h-7 border-b'></div>}
                                </TableCell>
                                </React.Fragment>
                            );
                            })}
                        </TableRow>
                        ))}
                    </React.Fragment>
                    );
                })}
                </TableBody>
            </Table>
        </div>
    </div>
  );
};
