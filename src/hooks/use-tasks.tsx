

'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import type { Task, UserProfile, TaskStatus } from '@/lib/data';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, getDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useAuth } from './use-auth';
import { useUsers } from './use-users';


type TaskWithId = Task & { id: string };

interface TaskContextType {
    tasks: TaskWithId[];
    loading: boolean;
    error: Error | null;
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'activeAssigneeIndex'>) => void;
    updateTask: (taskId: string, task: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    updateTaskStatus: (task: TaskWithId, newStatus: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);


const createNotification = async (userId: string, message: string) => {
    if (!userId) return;
    try {
        await addDoc(collection(db, 'notifications'), {
            userId,
            message,
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user: currentUser } = useAuth();
    const { users: allUsers } = useUsers();
    const [tasks, setTasks] = useState<TaskWithId[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!currentUser?.uid) {
            setTasks([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        
        const tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));

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

        return () => {
            unsubTasks();
        };

    }, [currentUser?.uid]);


    const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'activeAssigneeIndex'>) => {
        if (!currentUser) return;
        try {
            const docRef = await addDoc(collection(db, 'tasks'), {
                ...task,
                createdAt: serverTimestamp(),
                activeAssigneeIndex: 0,
            });

            if (task.assigneeIds && task.assigneeIds.length > 0) {
                 const client = (await getDoc(doc(db, 'clients', task.clientId!))).data();
                 const clientName = client?.name || 'a client';
                task.assigneeIds.forEach(userId => {
                     createNotification(userId, `You have been assigned a new task: "${task.title}" for ${clientName}.`);
                });
            }

        } catch (e) {
            console.error("Error adding document: ", e);
            setError(new Error('Failed to add task. Please check your network connection.'));
        }
    }, [currentUser]);

    const updateTask = useCallback(async (taskId: string, taskUpdate: Partial<Task>) => {
        if (!currentUser) return;
        try {
            const taskRef = doc(db, 'tasks', taskId);
            const docSnap = await getDoc(taskRef);

            if (docSnap.exists()) {
                const existingData = docSnap.data() as Task;
                const dataToUpdate = { ...taskUpdate };

                 if ('description' in dataToUpdate && dataToUpdate.description === undefined) {
                    dataToUpdate.description = existingData.description || '';
                }
                
                await updateDoc(taskRef, dataToUpdate);

                const client = (await getDoc(doc(db, 'clients', (dataToUpdate.clientId || existingData.clientId)!))).data();
                const clientName = client?.name || 'a client';
                const taskTitle = dataToUpdate.title || existingData.title;

                const wasRescheduled = currentUser?.role === 'admin' && 'status' in dataToUpdate && dataToUpdate.status === 'Scheduled' && 'activeAssigneeIndex' in dataToUpdate && dataToUpdate.activeAssigneeIndex === 0 && existingData.status !== 'Scheduled';
                if (wasRescheduled && (existingData.assigneeIds?.length ?? 0) > 0) {
                     const firstAssigneeId = existingData.assigneeIds![0];
                     createNotification(firstAssigneeId, `Task "${taskTitle}" for ${clientName} has been rescheduled and is back in your queue.`);
                }

                const oldAssignees = new Set(existingData.assigneeIds || []);
                const newAssignees = new Set(dataToUpdate.assigneeIds || []);
                const addedAssignees = [...newAssignees].filter(x => !oldAssignees.has(x));

                if (addedAssignees.length > 0) {
                    addedAssignees.forEach(userId => {
                         createNotification(userId, `You've been assigned a new task: "${taskTitle}" for ${clientName}.`);
                    });
                }
            }

        } catch (e) {
            console.error("Error updating document: ", e);
            setError(new Error('Failed to update task. Please check your network connection.'));
        }
    }, [currentUser]);
    
    const deleteTask = useCallback(async (taskId: string) => {
        try {
            await deleteDoc(doc(db, 'tasks', taskId));
        } catch (e) {
            console.error("Error deleting document: ", e);
            setError(new Error('Failed to delete task. Please check your network connection.'));
        }
    }, []);

    const updateTaskStatus = useCallback(async (task: TaskWithId, newStatus: string) => {
        const { id, assigneeIds = [], activeAssigneeIndex = 0, title, clientId } = task;
        if (!currentUser || currentUser.role !== 'employee') return;
    
        let updateData: Partial<Task> = {};
        const isMyTurn = assigneeIds[activeAssigneeIndex] === currentUser.uid;
        if (!isMyTurn) return;

        const isLastAssignee = activeAssigneeIndex === assigneeIds.length - 1;
        const client = (await getDoc(doc(db, 'clients', clientId!))).data();
        const clientName = client?.name || 'a client';

        if (newStatus === 'Ready for Next' && !isLastAssignee) {
            updateData.activeAssigneeIndex = activeAssigneeIndex + 1;
            updateData.status = 'On Work';
            const nextAssigneeId = assigneeIds[activeAssigneeIndex + 1];
            createNotification(nextAssigneeId, `Task "${title}" for ${clientName} is now ready for you.`);
        } else if (newStatus === 'For Approval') {
            updateData.status = 'For Approval';
            const admins = allUsers.filter(u => u.role === 'admin');
             admins.forEach(admin => {
                createNotification(admin.id, `Task by ${currentUser.name}: "${title}" for ${clientName} is ready for approval.`);
            });
           
        } else if (newStatus === 'On Work') {
            updateData.status = 'On Work';
        }
    
        if (Object.keys(updateData).length === 0) return;
    
        try {
            const taskRef = doc(db, 'tasks', id);
            await updateDoc(taskRef, updateData);
        } catch (e) {
            console.error("Error updating task status:", e);
            setError(new Error('Failed to update task status.'));
        }
    }, [currentUser, allUsers]);


    const value = {
        tasks,
        loading,
        error,
        addTask,
        updateTask,
        deleteTask,
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
