'use client';

import { useState, useEffect } from 'react';
import { allTasks, getUsers, clients, addTask } from '@/lib/data';
import type { Task, User, Client } from '@/lib/data';
import ContentSchedule from '@/components/dashboard/content-schedule';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ClientsPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);

    useEffect(() => {
        setTasks(allTasks);
        setUsers(getUsers());
    }, []);

    const handleTaskUpdate = (updatedTask: Task) => {
        setTasks(prevTasks => {
            const newTasks = prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task));
            // This is a mock update. In a real app, you would persist this change.
            const taskIndex = allTasks.findIndex(t => t.id === updatedTask.id);
            if (taskIndex !== -1) {
                allTasks[taskIndex] = updatedTask;
            }
            return newTasks;
        });
    };
    
    const handleAddTask = (client: Client) => {
        const newTask: Task = {
            id: `TASK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            title: 'New Content Title',
            description: 'A brief description of the content.',
            status: 'Scheduled',
            priority: 'Medium',
            contentType: 'Image Ad',
            deadline: new Date().toISOString(),
            assigneeId: '',
            progressNotes: [],
            clientId: client.id,
            date: new Date().toISOString(),
        };
        addTask(newTask);
        setTasks(prev => [newTask, ...prev]);
    };

    if (user?.role !== 'admin') {
        return (
             <div className="flex items-center justify-center h-[60vh]">
                <Alert variant="destructive" className="max-w-md">
                    <Lock className="h-4 w-4" />
                    <AlertTitle className="font-headline">Access Denied</AlertTitle>
                    <AlertDescription>
                        This page is only accessible to administrators.
                        <div className="mt-4">
                            <Button asChild>
                                <Link href="/dashboard">Go to Dashboard</Link>
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const filteredTasks = selectedClient ? tasks.filter(task => task.clientId === selectedClient.id) : [];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <CardTitle className="font-headline">Client Content Schedule</CardTitle>
                            <CardDescription>Manage content plans and progress for your clients.</CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <Select
                                value={selectedClient?.id}
                                onValueChange={(clientId) => setSelectedClient(clients.find(c => c.id === clientId) || null)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedClient && (
                                <Button onClick={() => handleAddTask(selectedClient)}>Add Content</Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {selectedClient ? (
                <ContentSchedule 
                    tasks={filteredTasks} 
                    users={users.filter(u => u.role === 'employee')} 
                    onTaskUpdate={handleTaskUpdate}
                />
            ) : (
                <div className="text-center text-muted-foreground py-16">Please select a client to view their schedule.</div>
            )}
        </div>
    );
}
