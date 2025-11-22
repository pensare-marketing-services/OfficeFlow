'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { tasks as initialTasks, users as initialUsers } from '@/lib/data';
import type { Task, UserProfile as User } from '@/lib/data';

// Ensure tasks have unique IDs
let taskCounter = initialTasks.length;
const generateTaskId = () => `task-${++taskCounter}`;


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
    const [tasks, setTasks] = useState<Task[]>(initialTasks.map(t => ({...t, id: t.id || generateTaskId()})));
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const addTask = useCallback((task: Omit<Task, 'id'>) => {
        setTasks(prevTasks => {
            const newTask: Task = {
                ...task,
                id: generateTaskId(),
            };
            return [...prevTasks, newTask];
        });
    }, []);

    const updateTask = useCallback((updatedTask: Partial<Task> & { id: string }) => {
        setTasks(prevTasks => 
            prevTasks.map(task => 
                task.id === updatedTask.id ? { ...task, ...updatedTask } : task
            )
        );
    }, []);

    const value = { 
        tasks, 
        users, 
        loading,
        error,
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
