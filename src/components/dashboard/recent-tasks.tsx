'use client';

import type { Task, UserProfile as User } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type UserWithId = User & { id: string };

interface RecentTasksProps {
  tasks: Task[];
  users: UserWithId[];
  title: string;
  onTaskUpdate?: (task: Partial<Task> & {id: string}) => void;
}

const getInitials = (name: string) => name ? name.split(' ').map((n) => n[0]).join('').toUpperCase() : '';

const allStatuses: Task['status'][] = ['To Do', 'In Progress', 'Done', 'Overdue', 'Scheduled', 'On Work', 'For Approval', 'Approved', 'Posted', 'Hold'];

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

  const getAssignee = (assigneeId: string): UserWithId | undefined => {
    return users.find(u => u.id === assigneeId);
  }

  const handleStatusChange = (task: Task, newStatus: Task['status']) => {
    if(onTaskUpdate) {
        onTaskUpdate({ id: task.id, status: newStatus });
    }
  }

  return (
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
               {currentUser?.role === 'admin' && <TableHead>Assignee</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => {
                const assignee = getAssignee(task.assigneeId);
                const isEmployeeView = currentUser?.role === 'employee';
                return (
                    <TableRow key={task.id}>
                        <TableCell>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-xs text-muted-foreground">{task.id}</div>
                        </TableCell>
                        {currentUser?.role === 'admin' && (
                            <TableCell>
                                {assignee ? (
                                     <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={assignee.avatar} />
                                            <AvatarFallback>{getInitials(assignee.name)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{assignee.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Unassigned</span>
                                )}
                            </TableCell>
                        )}
                        <TableCell>
                            {isEmployeeView && onTaskUpdate ? (
                                <Select value={task.status} onValueChange={(newStatus) => handleStatusChange(task, newStatus as any)}>
                                    <SelectTrigger className="w-[140px] text-xs focus:ring-accent">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allStatuses.map(status => (
                                            <SelectItem key={status} value={status}>
                                                <Badge variant={statusVariant[status] || 'default'} className="capitalize w-full justify-start">{status}</Badge>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                               <Badge variant={statusVariant[task.status] || 'default'} className="capitalize">{task.status}</Badge>
                            )}
                        </TableCell>
                        <TableCell>
                            <Badge variant={priorityVariant[task.priority] || 'default'} className="capitalize">{task.priority}</Badge>
                        </TableCell>
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
  );
}
