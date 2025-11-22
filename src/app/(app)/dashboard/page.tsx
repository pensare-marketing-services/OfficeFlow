'use client';

import { useMemo } from 'react';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import EmployeeDashboard from '@/components/dashboard/employee-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useTasks } from '@/hooks/use-tasks';
import type { Task, UserProfile } from '@/lib/data';

export default function DashboardPage() {
  const { user, loading: userLoading } = useAuth();
  const { tasks, users, loading: tasksLoading, updateTask } = useTasks();
  
  const finalLoading = userLoading || tasksLoading;

  const handleTaskUpdate = (updatedTask: Partial<Task> & { id: string }) => {
    updateTask(updatedTask);
  };

  const employeeTasks = useMemo(() => {
    if (!tasks || !user?.uid) return [];
    return tasks.filter(task => task.assigneeId === user.uid);
  }, [tasks, user]);


  if (finalLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Or a redirect, but layout should handle it.
  }
  
  const allUsers = (users as (UserProfile & {id: string})[]);

  return user.role === 'admin' ? 
    <AdminDashboard tasks={tasks || []} users={allUsers} /> : 
    <EmployeeDashboard employeeTasks={employeeTasks} users={allUsers} onTaskUpdate={handleTaskUpdate} />;
}
