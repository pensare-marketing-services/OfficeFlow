
'use client';

import type { Task, UserProfile as User } from '@/lib/data';
import { useMemo } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '../ui/card';
import { format } from 'date-fns';

type UserWithId = User & { id: string };

interface EmployeeTasksProps {
  tasks: Task[];
  users: UserWithId[];
}

const getInitials = (name: string = '') => name ? name.charAt(0).toUpperCase() : '';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Approved': 'default',
    'Posted': 'default',
    'On Work': 'secondary',
    'For Approval': 'secondary',
    'To Do': 'outline',
    'Scheduled': 'outline',
    'Hold': 'outline',
}

const priorityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'High': 'destructive',
    'Medium': 'secondary',
    'Low': 'outline'
}

export default function EmployeeTasks({ tasks, users }: EmployeeTasksProps) {
  const employees = useMemo(() => {
    const employeeMap = new Map<string, { user: UserWithId; tasks: Task[] }>();
    
    users.filter(u => u.role === 'employee').forEach(employee => {
      employeeMap.set(employee.id, { user: employee, tasks: [] });
    });

    tasks.forEach(task => {
      (task.assigneeIds || []).forEach(assigneeId => {
        if (assigneeId && employeeMap.has(assigneeId)) {
          employeeMap.get(assigneeId)!.tasks.push(task);
        }
      });
    });

    return Array.from(employeeMap.values());
  }, [tasks, users]);

  return (
    <Card>
      <Accordion type="single" collapsible className="w-full">
        {employees.map(({ user, tasks: employeeTasks }) => (
          <AccordionItem value={user.id} key={user.id}>
            <AccordionTrigger className="hover:no-underline px-6">
              <div className="flex items-center gap-4 w-full">
                <Avatar>
                  
                  <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{user.username}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <div className="flex items-center gap-4 pr-4">
                    <Badge variant="outline">{employeeTasks.length} Task{employeeTasks.length !== 1 && 's'}</Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-4 pb-4">
                {employeeTasks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Deadline</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeTasks.map(task => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell><Badge variant={statusVariant[task.status] || 'default'} className="capitalize">{task.status}</Badge></TableCell>
                          <TableCell><Badge variant={priorityVariant[task.priority] || 'default'} className="capitalize">{task.priority}</Badge></TableCell>
                          <TableCell>{format(new Date(task.deadline), 'MMM dd, yyyy')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-muted-foreground p-8">No tasks assigned to this employee.</div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
       {employees.length === 0 && (
          <div className="text-center text-muted-foreground p-8">No employees found.</div>
      )}
    </Card>
  );
}
