'use client';

import { useMemo } from 'react';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import EmployeeDashboard from '@/components/dashboard/employee-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useTasks } from '@/hooks/use-tasks';
import type { Task, UserProfile, Client } from '@/lib/data';
import { useUsers } from '@/hooks/use-users';
import { useClients } from '@/hooks/use-clients';

export default function DashboardPage() {
  const { user, loading: userLoading } = useAuth();
  const { tasks, loading: tasksLoading, updateTask } = useTasks();
  const { users, loading: usersLoading } = useUsers();
  const { clients, loading: clientsLoading } = useClients();
  
  const finalLoading = userLoading || tasksLoading || usersLoading || clientsLoading;

  const handleTaskUpdate = (taskId: string, updatedData: Partial<Task>) => {
    updateTask(taskId, updatedData);
  };

  const employeeTasks = useMemo(() => {
    if (!tasks || !user?.uid) return [];
    return tasks.filter(task => (task.assigneeIds || []).includes(user.uid));
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
    <AdminDashboard tasks={tasks || []} users={allUsers} clients={clients || []} /> : 
    <EmployeeDashboard employeeTasks={employeeTasks} users={allUsers} onTaskUpdate={handleTaskUpdate} />;
}
