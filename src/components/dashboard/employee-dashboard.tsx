'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Task, UserProfile as User } from '@/lib/data';
import { StatsCard } from './stats-card';
import { ClipboardList, CheckCircle2, Clock, Hourglass } from 'lucide-react';
import RecentTasks from './recent-tasks';

type UserWithId = User & { id: string };

interface EmployeeDashboardProps {
  employeeTasks: (Task & {id: string})[];
  users: UserWithId[];
  onTaskUpdate: (taskId: string, updatedData: Partial<Task>) => void;
}

type TaskFilter = 'active' | 'inProgress' | 'completed' | 'overdue';

export default function EmployeeDashboard({ employeeTasks, users, onTaskUpdate }: EmployeeDashboardProps) {
  const { user } = useAuth();
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('active');

  if (!user) return null;

  const completedStatuses: Task['status'][] = ['Done', 'Posted', 'Approved'];
  
  const totalTasks = employeeTasks.length;
  const completedTasksCount = employeeTasks.filter(t => completedStatuses.includes(t.status)).length;
  const activeTasksCount = totalTasks - completedTasksCount;
  const inProgressTasksCount = employeeTasks.filter(t => t.status === 'In Progress' || t.status === 'On Work').length;
  const overdueTasksCount = employeeTasks.filter(t => new Date(t.deadline) < new Date() && !completedStatuses.includes(t.status)).length;
  
  const filteredTasks = useMemo(() => {
    switch (taskFilter) {
      case 'inProgress':
        return employeeTasks.filter(t => t.status === 'In Progress' || t.status === 'On Work');
      case 'completed':
        return employeeTasks.filter(t => completedStatuses.includes(t.status));
      case 'overdue':
        return employeeTasks.filter(t => new Date(t.deadline) < new Date() && !completedStatuses.includes(t.status));
      case 'active':
      default:
        return employeeTasks.filter(t => !completedStatuses.includes(t.status));
    }
  }, [employeeTasks, taskFilter]);

  const filterTitles: Record<TaskFilter, string> = {
    active: "My Active Tasks",
    inProgress: "My In Progress Tasks",
    completed: "My Completed Tasks",
    overdue: "My Overdue Tasks"
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
            title="My Active Tasks" 
            value={activeTasksCount} 
            icon={ClipboardList} 
            onClick={() => setTaskFilter('active')}
            isActive={taskFilter === 'active'}
        />
        <StatsCard 
            title="In Progress" 
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
        <StatsCard 
            title="Overdue" 
            value={overdueTasksCount} 
            icon={Clock} 
            variant="destructive"
            onClick={() => setTaskFilter('overdue')}
            isActive={taskFilter === 'overdue'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RecentTasks tasks={filteredTasks} users={users} title={filterTitles[taskFilter]} onTaskUpdate={onTaskUpdate} />
      </div>
    </div>
  );
}
