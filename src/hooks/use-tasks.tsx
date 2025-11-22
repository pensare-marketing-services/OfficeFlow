'use client';

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/hooks';
import type { Task, UserProfile as User } from '@/lib/data';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface TaskContextType {
    tasks: Task[];
    users: User[];
    loading: boolean;
    error: Error | null;
    addTask: (task: Omit<Task, 'id'>) => void;
    updateTask: (task: Partial<Task> & { id: string }) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
    const firestore = useFirestore();

    const tasksQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'tasks');
    }, [firestore]);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);

    const { data: tasks, loading: tasksLoading, error: tasksError } = useCollection<Task>(tasksQuery);
    const { data: users, loading: usersLoading, error: usersError } = useCollection<User>(usersQuery);

    const addTask = useCallback((task: Omit<Task, 'id'>) => {
        if (!firestore) return;
        const tasksCollection = collection(firestore, 'tasks');
        
        addDoc(tasksCollection, { ...task, createdAt: serverTimestamp() })
          .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: tasksCollection.path,
              operation: 'create',
              requestResourceData: task,
            });
            errorEmitter.emit('permission-error', permissionError);
          });

    }, [firestore]);

    const updateTask = useCallback((updatedTask: Partial<Task> & { id: string }) => {
        if (!firestore) return;
        const taskDocRef = doc(firestore, 'tasks', updatedTask.id);
        
        const { id, ...taskData } = updatedTask;

        updateDoc(taskDocRef, taskData)
         .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: taskDocRef.path,
              operation: 'update',
              requestResourceData: taskData,
            });
            errorEmitter.emit('permission-error', permissionError);
          });

    }, [firestore]);

    const value = { 
        tasks: tasks || [], 
        users: users || [], 
        loading: tasksLoading || usersLoading,
        error: tasksError || usersError,
        addTask, 
        updateTask 
    };

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
};
