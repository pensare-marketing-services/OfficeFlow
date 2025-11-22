'use client';

import { useState, useMemo } from 'react';
import { StatsCard } from './stats-card';
import { ClipboardList, Users, CheckCircle2, Clock } from 'lucide-react';
import RecentTasks from './recent-tasks';
import type { Task, UserProfile as User } from '@/lib/data';
import EmployeeTasks from './employee-tasks';

type UserWithId = User & { id: string };

interface AdminDashboardProps {
  tasks: Task[];
  users: UserWithId[];
}

type TaskFilter = 'total' | 'completed' | 'overdue';
type ViewMode = 'tasks' | 'employees';

export default function AdminDashboard({ tasks, users }: AdminDashboardProps) {
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('total');
  const [viewMode, setViewMode] = useState<ViewMode>('tasks');

  const totalTasks = tasks.length;
  const totalEmployees = users.filter(u => u.role === 'employee').length;
  const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'Approved' || t.status === 'Posted').length;
  const overdueTasks = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'Done' && t.status !== 'Approved' && t.status !== 'Posted').length;
  
  const filteredTasks = useMemo(() => {
    if (viewMode !== 'tasks') return [];
    switch (taskFilter) {
      case 'completed':
        return tasks.filter(t => t.status === 'Done' || t.status === 'Approved' || t.status === 'Posted');
      case 'overdue':
        return tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'Done' && t.status !== 'Approved' && t.status !== 'Posted');
      case 'total':
      default:
        return tasks;
    }
  }, [tasks, taskFilter, viewMode]);

  const filterTitles: Record<TaskFilter, string> = {
    total: "All Recent Tasks",
    completed: "Completed Tasks",
    overdue: "Overdue Tasks"
  };

  const handleTaskFilterClick = (filter: TaskFilter) => {
    setViewMode('tasks');
    setTaskFilter(filter);
  };

  const handleEmployeeViewClick = () => {
    setViewMode('employees');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
            title="Total Tasks" 
            value={totalTasks} 
            icon={ClipboardList} 
            onClick={() => handleTaskFilterClick('total')}
            isActive={viewMode === 'tasks' && taskFilter === 'total'}
        />
        <StatsCard 
            title="Employees" 
            value={totalEmployees} 
            icon={Users}
            onClick={handleEmployeeViewClick}
            isActive={viewMode === 'employees'} 
        />
        <StatsCard 
            title="Completed Tasks" 
            value={completedTasks} 
            icon={CheckCircle2} 
            onClick={() => handleTaskFilterClick('completed')}
            isActive={viewMode === 'tasks' && taskFilter === 'completed'}
        />
        <StatsCard 
            title="Overdue Tasks" 
            value={overdueTasks} 
            icon={Clock} 
            variant="destructive" 
            onClick={() => handleTaskFilterClick('overdue')}
            isActive={viewMode === 'tasks' && taskFilter === 'overdue'}
        />
      </div>
      
      {viewMode === 'tasks' && <RecentTasks tasks={filteredTasks} users={users} title={filterTitles[taskFilter]} />}
      {viewMode === 'employees' && <EmployeeTasks tasks={tasks} users={users} />}

    </div>
  );
}
