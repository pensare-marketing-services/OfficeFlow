'use client';

import { useState } from 'react';
import type { Task, User } from '@/lib/data';
import { users } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { CalendarIcon, User as UserIcon, Flag, Edit } from 'lucide-react';
import { UpdateTaskDialog } from './update-task-dialog';

interface TaskCardProps {
  task: Task;
  onTaskUpdate: (updatedTask: Task) => void;
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

export default function TaskCard({ task, onTaskUpdate }: TaskCardProps) {
  const { user } = useAuth();
  const [isUpdateDialogOpen, setUpdateDialogOpen] = useState(false);
  const assignee = users.find(u => u.id === task.assigneeId);

  return (
    <>
      <Card className="flex flex-col shadow-md transition-all hover:shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <Badge variant={statusVariant[task.status] || 'default'} className="capitalize">{task.status}</Badge>
            {assignee && (
                <div className="flex items-center gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={assignee.avatar} />
                        <AvatarFallback>{getInitials(assignee.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-muted-foreground">{assignee.name}</span>
                </div>
            )}
          </div>
          <CardTitle className="font-headline pt-2">{task.title}</CardTitle>
          <CardDescription className="line-clamp-2">{task.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Priority: <Badge variant={priorityVariant[task.priority] || 'default'} className="ml-auto capitalize">{task.priority}</Badge>
            </div>
            <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Due: <span className="ml-auto font-medium text-foreground">{format(new Date(task.deadline), 'PP')}</span>
            </div>
            <div className="text-xs text-center">{formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}</div>
        </CardContent>
        <CardFooter>
          {user?.role === 'employee' && user.id === task.assigneeId && (
            <Button variant="outline" className="w-full" onClick={() => setUpdateDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Update Progress
            </Button>
          )}
           {user?.role === 'admin' && (
            <Button variant="outline" className="w-full" onClick={() => setUpdateDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                View / Edit Task
            </Button>
          )}
        </CardFooter>
      </Card>
      <UpdateTaskDialog
        open={isUpdateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        task={task}
        onTaskUpdate={onTaskUpdate}
        assignee={assignee}
      />
    </>
  );
}
