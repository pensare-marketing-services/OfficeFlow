'use client';

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { collection, addDoc, updateDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useFirestore, useCollection, useAuth as useFirebaseAuth } from '@/firebase';
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
    addEmployee: (employeeData: Omit<UserProfile, 'id' | 'role' | 'avatar'>) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const firestore = useFirestore();
    const { auth } = useFirebaseAuth();
    const { user } = useAuth();
    
    const { data: tasks, loading: tasksLoading, error: tasksError } = useCollection<Task & {id: string}>(
        firestore ? collection(firestore, 'tasks') : null
    );

    const { data: users, loading: usersLoading, error: usersError } = useCollection<UserProfile & {id: string}>(
        firestore ? collection(firestore, 'users') : null
    );

    const addEmployee = useCallback(async (employeeData: Omit<UserProfile, 'id' | 'role' | 'avatar'>) => {
        if (!auth || !firestore) {
            throw new Error("Firebase not initialized.");
        }
        
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, employeeData.email, "password");
        const newUserId = userCredential.user.uid;

        // 2. Create user profile in Firestore
        const userDocRef = doc(firestore, 'users', newUserId);
        const newUserProfile: UserProfile = {
            name: employeeData.name,
            email: employeeData.email,
            role: 'employee',
            avatar: `https://picsum.photos/seed/${employeeData.name}/200/200`
        };
        
        setDoc(userDocRef, newUserProfile)
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'create',
                    requestResourceData: newUserProfile
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    }, [auth, firestore]);

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
        addEmployee,
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
