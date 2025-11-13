'use client';

import { useState, useMemo } from 'react';
import type { Task, User, Client } from '@/lib/data';
import { clients, users as mockUsers } from '@/lib/data';
import ContentSchedule from '@/components/dashboard/content-schedule';
import { useCollection, useFirestore } from '@/firebase';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';


export default function ClientsPage() {
    const firestore = useFirestore();
    
    // Mocking an admin user to bypass login
    const user = { data: { role: 'admin' } };

    const tasksQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'tasks') : null), [firestore]);
    const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);
    
    const usersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
    const { data: usersData, loading: usersLoading } = useCollection<User>(usersQuery);
    
    const users = usersData?.length ? usersData : mockUsers;

    const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);

    const handleTaskUpdate = async (updatedTask: Partial<Task> & { id: string }) => {
        if (!firestore) return;
        const taskRef = doc(firestore, 'tasks', updatedTask.id);
        await updateDoc(taskRef, updatedTask);
    };
    
    const handleAddTask = async (client: Client) => {
        if (!firestore) return;
        const newTask: Omit<Task, 'id'> = {
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
        try {
            await addDoc(collection(firestore, 'tasks'), {
                ...newTask,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error adding task: ", error);
        }
    };

    const filteredTasks = useMemo(() => {
        if (!tasks || !selectedClient) return [];
        return tasks.filter(task => task.clientId === selectedClient.id);
    }, [tasks, selectedClient]);
    
    const employeeUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u => u.role === 'employee');
    }, [users]);


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
                                <Button onClick={() => handleAddTask(selectedClient)} disabled={tasksLoading}>Add Content</Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {(tasksLoading || usersLoading) ? <div>Loading...</div> : selectedClient ? (
                <ContentSchedule 
                    tasks={filteredTasks} 
                    users={employeeUsers} 
                    onTaskUpdate={handleTaskUpdate}
                />
            ) : (
                <div className="text-center text-muted-foreground py-16">Please select a client to view their schedule.</div>
            )}
        </div>
    );
}
