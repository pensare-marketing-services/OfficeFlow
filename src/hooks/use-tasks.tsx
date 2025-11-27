'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import type { Task, UserProfile } from '@/lib/data';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useAuth } from './use-auth';

type UserWithId = UserProfile & { id: string };
type TaskWithId = Task & { id: string };

interface TaskContextType {
    tasks: TaskWithId[];
    users: UserWithId[];
    loading: boolean;
    error: Error | null;
    addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
    updateTask: (taskId: string, task: Partial<Task>) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user: currentUser } = useAuth();
    const [tasks, setTasks] = useState<TaskWithId[]>([]);
    const [users, setUsers] = useState<UserWithId[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        
        const tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
        const usersQuery = query(collection(db, 'users'), orderBy('name', 'asc'));

        const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
            const tasksData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TaskWithId));
            setTasks(tasksData);
            if (loading) setLoading(false);
        }, (err) => {
            console.error("Task subscription error:", err);
            setError(new Error('Failed to load tasks. A browser extension might be blocking network requests.'));
            setLoading(false);
        });

        const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserWithId));
            setUsers(usersData);
        }, (err) => {
            console.error("Users subscription error:", err);
            setError(new Error('Failed to load users. A browser extension might be blocking network requests.'));
            setLoading(false);
        });

        return () => {
            unsubTasks();
            unsubUsers();
        };

    }, [currentUser]);


    const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt'>) => {
        try {
            await addDoc(collection(db, 'tasks'), {
                ...task,
                createdAt: serverTimestamp(),
            });
        } catch (e) {
            console.error("Error adding document: ", e);
            setError(new Error('Failed to add task. Please check your network connection.'));
        }
    }, []);

    const updateTask = useCallback(async (taskId: string, taskUpdate: Partial<Task>) => {
        try {
            const taskRef = doc(db, 'tasks', taskId);
            await updateDoc(taskRef, taskUpdate);
        } catch (e) {
            console.error("Error updating document: ", e);
            setError(new Error('Failed to update task. Please check your network connection.'));
        }
    }, []);

    const value = {
        tasks,
        users,
        loading,
        error,
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
