'use client';

import { useAuth } from '@/hooks/use-auth';
import { tasks } from '@/lib/data';
import { StatsCard } from './stats-card';
import { ClipboardList, CheckCircle2, Clock, Hourglass } from 'lucide-react';
import RecentTasks from './recent-tasks';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const myTasks = tasks.filter(t => t.assigneeId === user.id);
  const totalTasks = myTasks.length;
  const inProgressTasks = myTasks.filter(t => t.status === 'In Progress').length;
  const completedTasks = myTasks.filter(t => t.status === 'Done').length;
  const overdueTasks = myTasks.filter(t => t.status === 'Overdue').length;
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="My Active Tasks" value={totalTasks - completedTasks} icon={ClipboardList} />
        <StatsCard title="In Progress" value={inProgressTasks} icon={Hourglass} />
        <StatsCard title="Completed" value={completedTasks} icon={CheckCircle2} />
        <StatsCard title="Overdue" value={overdueTasks} icon={Clock} variant="destructive" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RecentTasks tasks={myTasks} title="My Tasks" />
      </div>
    </div>
  );
}
