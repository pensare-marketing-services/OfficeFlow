'use client';

import { useMemo } from 'react';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import EmployeeDashboard from '@/components/dashboard/employee-dashboard';
import { useCollection, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, doc, updateDoc } from 'firebase/firestore';
import type { Task, User } from '@/lib/data';
import { useMemoFirebase } from '@/firebase/hooks';
import { useAuth } from '@/hooks/use-auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user, loading: userLoading } = useAuth();

  const tasksQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'tasks') : null),
    [firestore]
  );
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);
  
  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: usersData, loading: usersLoading } = useCollection<User>(usersQuery);

  const users = useMemo(() => usersData || [], [usersData]);

  const handleTaskUpdate = (updatedTask: Task) => {
    if (!firestore || !updatedTask.id) return;
    const taskRef = doc(firestore, 'tasks', updatedTask.id);
    const { id, ...taskData } = updatedTask;
    updateDoc(taskRef, taskData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: taskRef.path,
            operation: 'update',
            requestResourceData: taskData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const loading = userLoading || tasksLoading || usersLoading;

  const employeeTasks = useMemo(() => {
    if (!tasks || !user?.email) return [];
    return tasks.filter(task => task.assigneeId === user.email);
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
    return null; // Or a redirect, but layout should handle it.
  }

  return user.role === 'admin' ? 
    <AdminDashboard tasks={tasks || []} users={users} /> : 
    <EmployeeDashboard employeeTasks={employeeTasks} users={users} onTaskUpdate={handleTaskUpdate} />;
}
