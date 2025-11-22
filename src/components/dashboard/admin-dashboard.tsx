'use client';

import { useState, useMemo } from 'react';
import { StatsCard } from './stats-card';
import { ClipboardList, Users, CheckCircle2, Clock } from 'lucide-react';
import RecentTasks from './recent-tasks';
import type { Task, User } from '@/lib/data';

interface AdminDashboardProps {
  tasks: Task[];
  users: User[];
}

type TaskFilter = 'total' | 'completed' | 'overdue';

export default function AdminDashboard({ tasks, users }: AdminDashboardProps) {
  const [filter, setFilter] = useState<TaskFilter>('total');

  const totalTasks = tasks.length;
  const totalEmployees = users.filter(u => u.role === 'employee').length;
  const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'Approved' || t.status === 'Posted').length;
  const overdueTasks = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'Done' && t.status !== 'Approved' && t.status !== 'Posted').length;
  
  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'completed':
        return tasks.filter(t => t.status === 'Done' || t.status === 'Approved' || t.status === 'Posted');
      case 'overdue':
        return tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'Done' && t.status !== 'Approved' && t.status !== 'Posted');
      case 'total':
      default:
        return tasks;
    }
  }, [tasks, filter]);

  const filterTitles: Record<TaskFilter, string> = {
    total: "All Recent Tasks",
    completed: "Completed Tasks",
    overdue: "Overdue Tasks"
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
            title="Total Tasks" 
            value={totalTasks} 
            icon={ClipboardList} 
            onClick={() => setFilter('total')}
            isActive={filter === 'total'}
        />
        <StatsCard 
            title="Employees" 
            value={totalEmployees} 
            icon={Users}
            // Non-task related, so no filter change
            isActive={false} 
        />
        <StatsCard 
            title="Completed Tasks" 
            value={completedTasks} 
            icon={CheckCircle2} 
            onClick={() => setFilter('completed')}
            isActive={filter === 'completed'}
        />
        <StatsCard 
            title="Overdue Tasks" 
            value={overdueTasks} 
            icon={Clock} 
            variant="destructive" 
            onClick={() => setFilter('overdue')}
            isActive={filter === 'overdue'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
        <RecentTasks tasks={filteredTasks} users={users} title={filterTitles[filter]} />
      </div>
    </div>
  );
}
