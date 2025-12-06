

'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Task, UserProfile as User } from '@/lib/data';
import { StatsCard } from './stats-card';
import { ClipboardList, CheckCircle2, Hourglass } from 'lucide-react';
import ContentSchedule from './content-schedule';
import { useTasks } from '@/hooks/use-tasks';
import { useUsers } from '@/hooks/use-users';

type UserWithId = User & { id: string };

interface EmployeeDashboardProps {
  employeeTasks: (Task & {id: string})[];
  users: UserWithId[];
  onTaskUpdate: (taskId: string, updatedData: Partial<Task>) => void;
}

type TaskFilter = 'active' | 'inProgress' | 'completed';

export default function EmployeeDashboard({ employeeTasks, onTaskUpdate }: EmployeeDashboardProps) {
  const { user } = useAuth();
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('active');
  const { users } = useUsers();


  if (!user) return null;

  const completedStatuses: Task['status'][] = ['Posted', 'Approved'];
  
  const totalTasks = employeeTasks.length;
  const completedTasksCount = employeeTasks.filter(t => completedStatuses.includes(t.status)).length;
  const activeTasksCount = totalTasks - completedTasksCount;
  const inProgressTasksCount = employeeTasks.filter(t => t.status === 'On Work').length;
  
  const filteredTasks = useMemo(() => {
    switch (taskFilter) {
      case 'inProgress':
        return employeeTasks.filter(t => t.status === 'On Work');
      case 'completed':
        return employeeTasks.filter(t => completedStatuses.includes(t.status));
      case 'active':
      default:
        return employeeTasks.filter(t => !completedStatuses.includes(t.status));
    }
  }, [employeeTasks, taskFilter]);

  const filterTitles: Record<TaskFilter, string> = {
    active: "My Active Tasks",
    inProgress: "My In Progress Tasks",
    completed: "My Completed Tasks",
  };

  const handleTaskUpdate = (updatedTask: Partial<Task> & { id: string }) => {
    onTaskUpdate(updatedTask.id, updatedTask);
  };
  

  return (
    <div className="space-y-1">
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-3">
        <StatsCard 
            title="My Tasks" 
            value={activeTasksCount} 
            icon={ClipboardList} 
            onClick={() => setTaskFilter('active')}
            isActive={taskFilter === 'active'}
        />
        <StatsCard 
            title="On Work" 
            value={inProgressTasksCount} 
            icon={Hourglass} 
            variant="warning"
            onClick={() => setTaskFilter('inProgress')}
            isActive={taskFilter === 'inProgress'}
        />
        <StatsCard 
            title="Completed" 
            value={completedTasksCount} 
            icon={CheckCircle2} 
            variant="success"
            onClick={() => setTaskFilter('completed')}
            isActive={taskFilter === 'completed'}
        />
      </div>

      <div className="space-y-2">
         <h2 className="text-xl font-semibold tracking-tight font-headline">{filterTitles[taskFilter]}</h2>
         <ContentSchedule
            tasks={filteredTasks}
            users={users}
            onTaskUpdate={handleTaskUpdate}
            showClient={true}
        />
      </div>
    </div>
  );
}

    