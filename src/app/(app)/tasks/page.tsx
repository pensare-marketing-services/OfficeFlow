'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { tasks as initialTasks, users } from '@/lib/data';
import type { Task } from '@/lib/data';
import TaskList from '@/components/tasks/task-list';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AssignTaskDialog } from '@/components/tasks/assign-task-dialog';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);

  if (!user) return null;

  const handleTaskAssigned = (newTask: Task) => {
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prevTasks => prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task));
  }

  const displayedTasks = user.role === 'admin' 
    ? tasks 
    : tasks.filter(task => task.assigneeId === user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline text-2xl font-semibold tracking-tight">
            {user.role === 'admin' ? 'All Tasks' : 'My Tasks'}
          </h2>
          <p className="text-muted-foreground">
            View and manage all assigned tasks.
          </p>
        </div>
        {user.role === 'admin' && (
          <>
            <Button onClick={() => setAssignDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Assign Task
            </Button>
            <AssignTaskDialog
              open={isAssignDialogOpen}
              onOpenChange={setAssignDialogOpen}
              employees={users.filter(u => u.role === 'employee')}
              onTaskAssigned={handleTaskAssigned}
            />
          </>
        )}
      </div>
      <TaskList tasks={displayedTasks} onTaskUpdate={handleTaskUpdate} />
    </div>
  );
}
