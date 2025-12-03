'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import type { Task, UserProfile, TaskStatus } from '@/lib/data';
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
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'activeAssigneeIndex'>) => void;
    updateTask: (taskId: string, task: Partial<Task>) => void;
    updateTaskStatus: (task: TaskWithId, newStatus: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user: currentUser } = useAuth();
    const [tasks, setTasks] = useState<TaskWithId[]>([]);
    const [users, setUsers] = useState<UserWithId[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!currentUser?.uid) {
            setTasks([]);
            setUsers([]);
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
            setError(null); // Clear error on successful fetch
            setLoading(false);
        }, (err: any) => {
            console.error("Task subscription error:", err);
            setError(new Error('Failed to load tasks. A browser extension (like an ad blocker) might be blocking network requests to Firebase. Please disable it for this site and refresh the page.'));
            setLoading(false);
        });

        const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserWithId));
            setUsers(usersData);
        }, (err: any) => {
            console.error("Users subscription error:", err);
             setError(new Error('Failed to load users. A browser extension (like an ad blocker) might be blocking network requests to Firebase. Please disable it for this site and refresh the page.'));
            setLoading(false);
        });

        return () => {
            unsubTasks();
            unsubUsers();
        };

    }, [currentUser?.uid]);


    const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'activeAssigneeIndex'>) => {
        try {
            await addDoc(collection(db, 'tasks'), {
                ...task,
                createdAt: serverTimestamp(),
                activeAssigneeIndex: 0,
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
    
    const updateTaskStatus = useCallback(async (task: TaskWithId, newStatus: string) => {
        const { id, assigneeIds = [], activeAssigneeIndex = 0 } = task;
        const taskRef = doc(db, 'tasks', id);

        let updateData: Partial<Task> = { status: newStatus as TaskStatus };

        // Admin workflow
        if (currentUser?.role === 'admin') {
             if (newStatus.startsWith('reschedule_')) {
                const rescheduleValue = newStatus.split('_')[1];
                updateData.status = 'Scheduled';
                if(rescheduleValue === 'all') {
                    updateData.activeAssigneeIndex = 0;
                } else {
                    const assigneeIndex = parseInt(rescheduleValue, 10);
                    if (!isNaN(assigneeIndex)) {
                        updateData.activeAssigneeIndex = assigneeIndex;
                    }
                }
            } else {
                updateData.status = newStatus as TaskStatus;
            }
            await updateDoc(taskRef, updateData);
            return;
        }

        // Employee workflow
        const isMyTurn = assigneeIds[activeAssigneeIndex] === currentUser?.uid;
        if (!isMyTurn) return; // Not my turn, do nothing.

        const isLastAssignee = activeAssigneeIndex === assigneeIds.length - 1;

        if (newStatus === 'Ready for Next' && !isLastAssignee) {
            // Hand off to the next person
            updateData.activeAssigneeIndex = activeAssigneeIndex + 1;
            updateData.status = 'In Progress'; // Set status for the next person
        } else if (newStatus === 'For Approval' && isLastAssignee) {
            // Final step, send for approval
            updateData.status = 'For Approval';
        } else {
            // Just a regular status update for the current assignee
            updateData.status = newStatus as TaskStatus;
        }
        
        await updateDoc(taskRef, updateData);

    }, [currentUser]);


    const value = {
        tasks,
        users,
        loading,
        error,
        addTask,
        updateTask,
        updateTaskStatus,
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
