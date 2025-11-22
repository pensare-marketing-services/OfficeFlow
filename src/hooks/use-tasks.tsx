'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import type { Task, User } from '@/lib/data';
import { tasks as mockTasks, users as mockUsers } from '@/lib/data';

interface TaskContextType {
  tasks: Task[];
  users: User[];
  loading: boolean;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (task: Task) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setTasks(mockTasks);
    setUsers(mockUsers);
    setLoading(false);
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id'>) => {
    setTasks(currentTasks => {
        const newId = `task-${Date.now()}`;
        const newTask: Task = { ...task, id: newId };
        return [...currentTasks, newTask];
    });
  }, []);

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks(currentTasks => 
        currentTasks.map(task => 
            task.id === updatedTask.id ? updatedTask : task
        )
    );
  }, []);

  const value = { tasks, users, loading, addTask, updateTask };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
