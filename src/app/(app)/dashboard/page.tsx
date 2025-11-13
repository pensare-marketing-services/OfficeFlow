'use client';

import { useState, useEffect } from 'react';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import EmployeeDashboard from '@/components/dashboard/employee-dashboard';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { getUsers, allTasks } from '@/lib/data';
import type { User, Task } from '@/lib/data';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    const loadedUsers = getUsers();
    const loadedTasks = allTasks;
    setUsers(loadedUsers);
    setTasks(loadedTasks);
    setDataLoading(false);
  }, []);

  if (loading || dataLoading) {
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
    return null; // Or a message indicating no user found
  }

  const employeeTasks = tasks.filter(task => task.assigneeId === user.id);

  return user.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard employeeTasks={employeeTasks} />;
}
