'use client';

import { useMemo } from 'react';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import EmployeeDashboard from '@/components/dashboard/employee-dashboard';
import { useCollection, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, doc, updateDoc } from 'firebase/firestore';
import type { Task } from '@/lib/data';
import { useMemoFirebase } from '@/firebase/hooks';
import { users as mockUsers } from '@/lib/data';

export default function DashboardPage() {
  const firestore = useFirestore();

  // Mocking an admin user to bypass login
  const user = { data: { role: 'admin', email: 'admin@officeflow.com' }};
  const userLoading = false;

  const tasksQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'tasks') : null),
    [firestore]
  );
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);
  
  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: users, loading: usersLoading } = useCollection(usersQuery);

  const handleTaskUpdate = async (updatedTask: Task) => {
    if (!firestore || !updatedTask.id) return;
    const taskRef = doc(firestore, 'tasks', updatedTask.id);
    await updateDoc(taskRef, { ...updatedTask });
  };
  
  const loading = userLoading || tasksLoading || usersLoading;

  const employeeTasks = useMemo(() => {
    if (!tasks || !user?.data.email) return [];
    return tasks.filter(task => task.assigneeId === user.data?.email);
  }, [tasks, user]);


  if (loading) {
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

  return user.data?.role === 'admin' ? 
    <AdminDashboard tasks={tasks || []} users={users || mockUsers} /> : 
    <EmployeeDashboard employeeTasks={employeeTasks} users={users || mockUsers} onTaskUpdate={handleTaskUpdate} />;
}
