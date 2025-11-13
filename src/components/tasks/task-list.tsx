'use client';

import type { Task } from '@/lib/data';
import TaskCard from './task-card';

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (updatedTask: Task) => void;
}

export default function TaskList({ tasks, onTaskUpdate }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-card">
        <div className="text-center">
          <h3 className="font-headline text-lg font-semibold">No Tasks Found</h3>
          <p className="text-muted-foreground">Looks like it's a quiet day!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} onTaskUpdate={onTaskUpdate} />
      ))}
    </div>
  );
}
