'use client';

import { useMemo } from 'react';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import EmployeeDashboard from '@/components/dashboard/employee-dashboard';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, doc, updateDoc } from 'firebase/firestore';
import type { Task } from '@/lib/data';
import { useMemoFirebase } from '@/firebase/hooks';

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

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
    if (!tasks || !user?.auth.uid) return [];
    // Note: Firebase Auth UID is often the email for email/password auth
    // but can be different. We match on email here as our user profile `id` is the email.
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

  if (!user) {
    return null; // Or a message indicating no user found
  }

  return user.data?.role === 'admin' ? 
    <AdminDashboard tasks={tasks || []} users={users || []} /> : 
    <EmployeeDashboard employeeTasks={employeeTasks} users={users || []} onTaskUpdate={handleTaskUpdate} />;
}
