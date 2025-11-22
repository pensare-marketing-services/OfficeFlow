'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import EmployeeDashboard from '@/components/dashboard/employee-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task, User } from '@/lib/data';
import { tasks as mockTasks, users as mockUsers } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
  const { user, loading: userLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setTasks(mockTasks);
    setUsers(mockUsers);
    setLoading(false);
  }, []);

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(currentTasks => currentTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };
  
  const finalLoading = userLoading || loading;

  const employeeTasks = useMemo(() => {
    if (!tasks || !user?.email) return [];
    return tasks.filter(task => task.assigneeId === user.email);
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

  return user.role === 'admin' ? 
    <AdminDashboard tasks={tasks || []} users={users} /> : 
    <EmployeeDashboard employeeTasks={employeeTasks} users={users} onTaskUpdate={handleTaskUpdate} />;
}
