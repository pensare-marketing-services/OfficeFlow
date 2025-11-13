'use client';

import { useAuth } from '@/hooks/use-auth';
import type { Task, User } from '@/lib/data';
import { StatsCard } from './stats-card';
import { ClipboardList, CheckCircle2, Clock, Hourglass } from 'lucide-react';
import RecentTasks from './recent-tasks';

interface EmployeeDashboardProps {
  employeeTasks: Task[];
  users: User[];
  onTaskUpdate: (task: Task) => void;
}

export default function EmployeeDashboard({ employeeTasks, users, onTaskUpdate }: EmployeeDashboardProps) {
  const { user } = useAuth();
  if (!user) return null;

  const totalTasks = employeeTasks.length;
  const inProgressTasks = employeeTasks.filter(t => t.status === 'In Progress' || t.status === 'On Work').length;
  const completedTasks = employeeTasks.filter(t => t.status === 'Done' || t.status === 'Posted' || t.status === 'Approved').length;
  const overdueTasks = employeeTasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'Done').length;
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="My Active Tasks" value={totalTasks - completedTasks} icon={ClipboardList} />
        <StatsCard title="In Progress" value={inProgressTasks} icon={Hourglass} />
        <StatsCard title="Completed" value={completedTasks} icon={CheckCircle2} />
        <StatsCard title="Overdue" value={overdueTasks} icon={Clock} variant="destructive" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RecentTasks tasks={employeeTasks} users={users} title="My Tasks" onTaskUpdate={onTaskUpdate} />
      </div>
    </div>
  );
}
