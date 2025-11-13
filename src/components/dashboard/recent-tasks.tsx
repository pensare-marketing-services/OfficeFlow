'use client';

import type { Task, User, ContentStatus } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface RecentTasksProps {
  tasks: Task[];
  users: User[];
  title: string;
  onTaskUpdate?: (task: Task) => void;
}

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase();

const allStatuses = ['To Do', 'In Progress', 'Done', 'Overdue', 'Scheduled', 'On Work', 'For Approval', 'Approved', 'Posted', 'Hold'];

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
  const { user: currentUser } = useUser();
  const recentTasks = tasks.sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()).slice(0, 10);

  const getAssignee = (assigneeId: string): User | undefined => {
    return users.find(u => u.email === assigneeId); // Matching by email as ID
  }

  const handleStatusChange = (task: Task, newStatus: ContentStatus | 'To Do' | 'In Progress' | 'Done' | 'Overdue') => {
    if(onTaskUpdate) {
        onTaskUpdate({ ...task, status: newStatus });
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline">{title}</CardTitle>
        <CardDescription>
            { currentUser?.data?.role === 'admin' ? "An overview of the latest tasks across the company." : "Your most recent tasks."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
               {currentUser?.data?.role === 'admin' && <TableHead>Assignee</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTasks.map(task => {
                const assignee = getAssignee(task.assigneeId);
                const isEmployeeView = currentUser?.data?.role === 'employee';
                return (
                    <TableRow key={task.id}>
                        <TableCell>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-xs text-muted-foreground">{task.id}</div>
                        </TableCell>
                        {currentUser?.data?.role === 'admin' && (
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
                                    <SelectTrigger className="w-[140px] text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allStatuses.map(status => (
                                            <SelectItem key={status} value={status}>
                                                <Badge variant={statusVariant[status] || 'default'} className="capitalize">{status}</Badge>
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
         {recentTasks.length === 0 && (
            <div className="text-center text-muted-foreground p-8">No tasks to display.</div>
        )}
      </CardContent>
    </Card>
  );
}
