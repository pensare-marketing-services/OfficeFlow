'use client';

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import type { Task, UserProfile } from '@/lib/data';
import { useAuth } from './use-auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


interface TaskContextType {
    tasks: (Task & {id: string})[];
    users: (UserProfile & {id: string})[];
    loading: boolean;
    error: Error | null;
    addTask: (task: Omit<Task, 'id'>) => void;
    updateTask: (taskId: string, task: Partial<Task>) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const firestore = useFirestore();
    const { user } = useAuth();
    
    const { data: tasks, loading: tasksLoading, error: tasksError } = useCollection<Task & {id: string}>(
        firestore ? collection(firestore, 'tasks') : null
    );

    const { data: users, loading: usersLoading, error: usersError } = useCollection<UserProfile & {id: string}>(
        firestore ? collection(firestore, 'users') : null
    );

    const addTask = useCallback((task: Omit<Task, 'id'>) => {
        if (!firestore || !user) return;
        
        const tasksCollection = collection(firestore, 'tasks');
        const newTask = {
            ...task,
            createdAt: serverTimestamp(),
        };

        addDoc(tasksCollection, newTask)
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: tasksCollection.path,
                    operation: 'create',
                    requestResourceData: newTask
                });
                errorEmitter.emit('permission-error', permissionError);
            });

    }, [firestore, user]);

    const updateTask = useCallback((taskId: string, taskUpdate: Partial<Task>) => {
        if (!firestore) return;

        const taskDocRef = doc(firestore, 'tasks', taskId);
        updateDoc(taskDocRef, taskUpdate)
         .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: taskDocRef.path,
                    operation: 'update',
                    requestResourceData: taskUpdate
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
        updateTask,
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
