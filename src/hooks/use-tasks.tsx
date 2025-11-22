'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import type { Task, UserProfile } from '@/lib/data';
import { users as initialUsers, tasks as initialTasks } from '@/lib/data';

type UserWithId = UserProfile & { id: string };

interface TaskContextType {
    tasks: (Task & { id: string })[];
    users: UserWithId[];
    loading: boolean;
    error: Error | null;
    addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
    updateTask: (taskId: string, task: Partial<Task>) => void;
    addEmployee: (employeeData: Omit<UserWithId, 'id' | 'avatar'>) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<(Task & { id: string })[]>(initialTasks as (Task & {id: string})[]);
    const [users, setUsers] = useState<UserWithId[]>(initialUsers);
    const [loading] = useState(false);
    const [error] = useState<Error | null>(null);

    const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
        setTasks(prevTasks => {
            const newTask: Task & { id: string } = {
                ...task,
                id: `task-${Date.now()}-${Math.random()}`,
                createdAt: new Date().toISOString(),
            };
            return [...prevTasks, newTask];
        });
    }, []);

    const updateTask = useCallback((taskId: string, taskUpdate: Partial<Task>) => {
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId ? { ...task, ...taskUpdate } : task
            )
        );
    }, []);
    
    const addEmployee = useCallback((employeeData: Omit<UserWithId, 'id' | 'avatar'>) => {
        setUsers(prevUsers => {
            const newUser: UserWithId = {
                ...employeeData,
                id: employeeData.email,
                avatar: `https://picsum.photos/seed/${employeeData.name}/200/200`
            };
            // Prevent adding duplicates
            if (prevUsers.some(u => u.email === newUser.email)) {
                return prevUsers;
            }
            return [...prevUsers, newUser];
        });
    }, []);


    const value = {
        tasks,
        users,
        loading,
        error,
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
