'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Task, UserProfile, Client } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LinkifiedText } from '@/components/shared/linkified-text';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
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

const getInitials = (name: string = '') =>
  name ? name.charAt(0).toUpperCase() : '';

/* ---------------------------------------------------
   Editable Priority Cell
--------------------------------------------------- */
const EditablePriorityCell: React.FC<{ user: UserWithId }> = ({ user }) => {
  const { updateUserPriority } = useUsers();
  const [priority, setPriority] = useState(user.priority ?? 0);

  useEffect(() => {
    setPriority(user.priority ?? 99);
  }, [user.priority]);

  const handleBlur = () => {
    const newPriority = Number(priority);
    if (newPriority !== (user.priority ?? 0)) {
      updateUserPriority(user.id, newPriority);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center">
      <Input
        type="number"
        value={priority}
        onChange={(e) => setPriority(Number(e.target.value))}
        onBlur={handleBlur}
        className="h-6 w-8 text-[10px] text-center p-1 bg-transparent border-transparent hover:border-border focus:border-ring"
      />
    </div>
  );
};

/* ---------------------------------------------------
   Task Cell Popover
--------------------------------------------------- */
const TaskCell = ({
  task,
  onSelect,
  isSelected,
}: {
  task: TaskWithId;
  onSelect: () => void;
  isSelected: boolean;
}) => {
  if (!task) return <div className="h-full w-full flex items-center justify-center border-r">-</div>;
  const { user: currentUser } = useAuth();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          onClick={onSelect}
          className={cn(
            'h-full w-full flex items-center justify-center cursor-pointer text-[10px] font-medium border-r px-2',
            statusColors[task.status] || 'bg-transparent',
            isSelected && 'ring-1 ring-accent ring-inset'
          )}
        >
          <span className="truncate">{task.title}</span>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80" side="bottom" align="start">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">{task.title}</h4>

          <div className="max-h-60 space-y-3 p-1">
            {(task.progressNotes || []).map((note, i) => {
              const authorName = note.authorName || 'User';

              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-2 text-[10px]',
                    note.authorId === currentUser?.uid ? 'justify-end' : ''
                  )}
                >
                  {note.authorId !== currentUser?.uid && (
                    <Avatar className="h-6 w-6 border">
                      <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      'max-w-[75%] rounded-lg p-2',
                      note.authorId === currentUser?.uid
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="font-bold text-[10px] mb-1">
                      {note.authorId === currentUser?.uid ? 'You' : authorName}
                    </p>

                    {note.note && (
                      <div className="text-[11px] whitespace-pre-wrap">
                        <LinkifiedText text={note.note} />
                      </div>
                    )}

                    {note.imageUrl && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <img
                            src={note.imageUrl}
                            alt="remark"
                            className="mt-1 rounded-md max-w-full h-auto cursor-pointer"
                          />
                        </DialogTrigger>
                        <DialogContent className="max-w-[90vw] max-h-[90vh] flex items-center">
                          <img
                            src={note.imageUrl}
                            alt="remark full view"
                            className="max-w-full max-h-full object-contain"
                          />
                        </DialogContent>
                      </Dialog>
                    )}

                    <p className="text-[9px] text-right mt-1 opacity-70">
                      {format(new Date(note.date), 'MMM d, HH:mm')}
                    </p>
                  </div>

                  {note.authorId === currentUser?.uid && (
                    <Avatar className="h-6 w-6 border">
                      <AvatarFallback>
                        {getInitials(currentUser.username)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}

            {(task.progressNotes || []).length === 0 && (
              <p className="text-center text-[10px] text-muted-foreground py-4">
                No remarks for this task.
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/* ---------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------- */
export default function EmployeeMasterView({ tasks, users, clients }: EmployeeMasterViewProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { scrollRef, scrollLeft, scrollRight, canScrollLeft, canScrollRight } =
    useHorizontalScroll();

  const containerRef = useRef<HTMLDivElement>(null);

  /* FILTER EMPLOYEES */
  const employees = useMemo(
    () =>
      users
        .filter((u) => u.role === 'employee')
        .sort((a, b) => (a.username || '').localeCompare(b.username || '')),
    [users]
  );

  /* FILTER CLIENTS */
  const dmClients = useMemo(
    () =>
      clients
        .filter(
          (c) =>
            c.categories?.includes('digital marketing') ||
            c.categories?.includes('gd')
        )
        .sort((a, b) => (a.priority || 0) - (b.priority || 0)),
    [clients]
  );

  /* MAP CLIENT-TASK ASSIGNMENTS */
  const clientTasks = useMemo(() => {
    const map = new Map<string, TaskWithId>();
    tasks.forEach((task) => {
      const activeAssigneeId =
        task.assigneeIds?.[task.activeAssigneeIndex ?? 0];
      if (task.clientId && activeAssigneeId) {
        const key = `${task.clientId}-${activeAssigneeId}`;
        map.set(key, task);
      }
    });
    return map;
  }, [tasks]);

  const employeeColWidth = 100;
  const orderColWidth = 30;
  const totalEmployeeWidth =
    employees.length * (employeeColWidth + orderColWidth);

  // Fixed row height for ALL rows
  const rowHeight = 'h-7';

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0 w-full overflow-x-hidden">

        {/* Scroll Buttons */}
        <div className="flex items-center justify-end p-1 border-b">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            disabled={!canScrollLeft}
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            disabled={!canScrollRight}
            onClick={scrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* MAIN WRAPPER */}
        <div
          className="flex w-full min-w-0 h-full"
          ref={containerRef}
        >
          {/* ----------------------------------------------------
             LEFT FIXED COLUMNS
          ---------------------------------------------------- */}
          <div className="flex-shrink-0 bg-background border-r shadow-sm sticky left-0 z-20">
            <Table className="text-[10px] border-collapse">
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow className={rowHeight}>
                  <TableHead className='border-r p-0 w-10'>Sl.</TableHead>
                  <TableHead className='border-r p-0 w-32'>Client</TableHead>
                  <TableHead className='border-r p-0 w-36'>Assigned</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {dmClients.map((client, index) => {
                  const assignedEmployees = (client.employeeIds || [])
                    .map((id) => users.find((u) => u.id === id)?.username)
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <TableRow
                      key={client.id}
                      className={cn(
                        `${rowHeight} border-b hover:bg-muted/30`,
                        selectedClientId === client.id && 'bg-accent/20'
                      )}
                      onClick={() => setSelectedClientId(client.id)}
                    >
                      <TableCell className="p-0 border-r">
                        <div className="h-full w-full flex items-center justify-center">
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="p-0 border-r">
                        <div className="h-full w-full flex items-center px-2">
                          <span className="truncate">{client.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-0 border-r">
                        <div className="h-full w-full flex items-center px-2">
                          <span className="truncate">{assignedEmployees}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Spacer row for the fixed table */}
                <TableRow className="h-4">
                  <TableCell colSpan={3}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* ----------------------------------------------------
             RIGHT SCROLLABLE COLUMNS
          ---------------------------------------------------- */}
          <div className="flex-grow min-w-0 relative">
            <div
              className="absolute inset-0 overflow-x-auto overflow-y-hidden"
              ref={scrollRef}
            >
              <div
                className="min-w-max"
                style={{ width: `${totalEmployeeWidth}px` }}
              >
                <Table className="text-[10px] border-collapse">
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className={rowHeight}>
                      {employees.map((employee) => (
                        <React.Fragment key={employee.id}>
                          <TableHead
                            style={{
                              width: `${employeeColWidth}px`,
                            }}
                            className="bg-muted/80 border-r p-0"
                          >
                            <div className="h-full w-full flex items-center justify-center px-2">
                              <span className="truncate">{employee.username}</span>
                            </div>
                          </TableHead>

                          <TableHead
                            style={{
                              width: `${orderColWidth}px`,
                            }}
                            className="bg-muted/80 border-r p-0"
                          >
                            <div className="h-full w-full flex items-center justify-center">
                              Order
                            </div>
                          </TableHead>
                        </React.Fragment>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {dmClients.map((client) => (
                      <TableRow
                        key={client.id}
                        className={cn(
                          `${rowHeight} border-b`,
                          selectedClientId === client.id && 'bg-accent/20'
                        )}
                      >
                        {employees.map((employee) => {
                          const task = clientTasks.get(
                            `${client.id}-${employee.id}`
                          );

                          return (
                            <React.Fragment key={employee.id}>
                              <TableCell
                                className="p-0 border-r"
                                style={{
                                  width: `${employeeColWidth}px`,
                                }}
                              >
                                {task ? (
                                  <TaskCell
                                    task={task}
                                    onSelect={() =>
                                      setSelectedClientId(client.id)
                                    }
                                    isSelected={
                                      selectedClientId === client.id
                                    }
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-muted-foreground/40 border-r">
                                    -
                                  </div>
                                )}
                              </TableCell>

                              <TableCell
                                className="p-0 border-r"
                                style={{ width: `${orderColWidth}px` }}
                              >
                                <div className="h-full w-full">
                                  <EditablePriorityCell user={employee} />
                                </div>
                              </TableCell>
                            </React.Fragment>
                          );
                        })}
                      </TableRow>
                    ))}
                    {/* Spacer row for the scrollable table */}
                    <TableRow className="h-4">
                        <TableCell colSpan={employees.length * 2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {dmClients.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">
            No Digital Marketing or GD clients found.
          </div>
        )}
      </CardContent>
    </Card>
  );
}