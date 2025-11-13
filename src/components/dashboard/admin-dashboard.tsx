'use client';

import { tasks, users } from '@/lib/data';
import { StatsCard } from './stats-card';
import { ClipboardList, Users, CheckCircle2, Clock } from 'lucide-react';
import TasksOverviewChart from './tasks-overview-chart';
import RecentTasks from './recent-tasks';

export default function AdminDashboard() {
  const totalTasks = tasks.length;
  const totalEmployees = users.filter(u => u.role === 'employee').length;
  const completedTasks = tasks.filter(t => t.status === 'Done').length;
  const overdueTasks = tasks.filter(t => t.status === 'Overdue').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Tasks" value={totalTasks} icon={ClipboardList} />
        <StatsCard title="Employees" value={totalEmployees} icon={Users} />
        <StatsCard title="Completed Tasks" value={completedTasks} icon={CheckCircle2} />
        <StatsCard title="Overdue Tasks" value={overdueTasks} icon={Clock} variant="destructive" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TasksOverviewChart tasks={tasks} />
        <RecentTasks tasks={tasks} users={users} title="All Recent Tasks" />
      </div>
    </div>
  );
}
