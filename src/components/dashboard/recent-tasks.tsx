'use client';

import type { Task, User } from '@/lib/data';
import { users } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface RecentTasksProps {
  tasks: Task[];
  title: string;
}

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Done': 'default',
    'In Progress': 'secondary',
    'To Do': 'outline',
    'Overdue': 'destructive'
}

const priorityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'High': 'destructive',
    'Medium': 'secondary',
    'Low': 'outline'
}


export default function RecentTasks({ tasks, title }: RecentTasksProps) {
  const { user: currentUser } = useAuth();
  const recentTasks = tasks.slice(0, 5);

  const getAssignee = (assigneeId: string): User | undefined => {
    return users.find(u => u.id === assigneeId);
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
            {recentTasks.map(task => {
                const assignee = getAssignee(task.assigneeId);
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
                            <Badge variant={statusVariant[task.status] || 'default'} className="capitalize">{task.status}</Badge>
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
