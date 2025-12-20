'use client';

import { useState, useMemo } from 'react';
import { StatsCard } from './stats-card';
import { ClipboardList, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import RecentTasks from './recent-tasks';
import type { Task, UserProfile as User, Client } from '@/lib/data';
import EmployeeTasks from './employee-tasks';
import { useTasks } from '@/hooks/use-tasks';

type UserWithId = User & { id: string };
type ClientWithId = Client & { id: string };

interface AdminDashboardProps {
  tasks: (Task & { id: string })[];
  users: UserWithId[];
  clients: ClientWithId[];
}

type TaskFilter = 'total' | 'completed' | 'overdue';
type ViewMode = 'tasks' | 'employees';

export default function AdminDashboard({ tasks, users, clients }: AdminDashboardProps) {
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('total');
  const [viewMode, setViewMode] = useState<ViewMode>('tasks');
  const { deleteTask, updateTask } = useTasks();

  const totalTasks = tasks.length;
  const totalEmployees = users.filter(u => u.role === 'employee').length;
  const completedTasks = tasks.filter(t => t.status === 'Approved' || t.status === 'Posted').length;
  
  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the beginning of today

    return tasks.filter(task => {
      const deadline = new Date(task.deadline);
      return deadline < today && !['For Approval', 'Approved', 'Posted'].includes(task.status);
    });
  }, [tasks]);

  const overdueCount = overdueTasks.length;
  
  const filteredTasks = useMemo(() => {
    if (viewMode !== 'tasks') return [];
    switch (taskFilter) {
      case 'completed':
        return tasks.filter(t => t.status === 'Approved' || t.status === 'Posted');
      case 'overdue':
        return overdueTasks;
      case 'total':
      default:
        return tasks;
    }
  }, [tasks, taskFilter, viewMode, overdueTasks]);
  
  const dmTasks = filteredTasks.filter(task => !['SEO', 'Website', 'Web Blogs'].includes(task.contentType || ''));
  const seoTasks = filteredTasks.filter(task => task.contentType === 'SEO');
  const webTasks = filteredTasks.filter(task => task.contentType === 'Website' || task.contentType === 'Web Blogs');


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
    
    <div className="space-y-6 ">
     <div className="w-full lg:w-1/2 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

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
            variant="success"
            onClick={() => handleTaskFilterClick('completed')}
            isActive={viewMode === 'tasks' && taskFilter === 'completed'}
        />
        <StatsCard
            title="Overdue"
            value={overdueCount}
            icon={AlertTriangle}
            variant="destructive"
            onClick={() => handleTaskFilterClick('overdue')}
            isActive={viewMode === 'tasks' && taskFilter === 'overdue'}
        />
      </div>
      
      {viewMode === 'tasks' && taskFilter !== 'total' && (
        <RecentTasks tasks={filteredTasks} users={users} title={filterTitles[taskFilter]} onTaskDelete={deleteTask} />
      )}
      {viewMode === 'tasks' && taskFilter === 'total' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <RecentTasks tasks={dmTasks} users={users} title="Tasks - Digital Marketing" onTaskDelete={deleteTask} />
            <RecentTasks tasks={seoTasks} users={users} title="Tasks - SEO" onTaskDelete={deleteTask} />
            <RecentTasks tasks={webTasks} users={users} title="Tasks - Website" onTaskDelete={deleteTask} />
        </div>
      )}

      {viewMode === 'employees' && <EmployeeTasks tasks={tasks} users={users} />}

    </div>
  );
}
