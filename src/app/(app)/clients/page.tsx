'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Task, UserProfile as User, Client } from '@/lib/data';
import ContentSchedule from '@/components/dashboard/content-schedule';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTasks } from '@/hooks/use-tasks';
import { useAuth } from '@/hooks/use-auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Skeleton } from '@/components/ui/skeleton';


type UserWithId = User & { id: string };
type ClientWithId = Client & { id: string };

export default function ClientsPage() {
    const { user: currentUser } = useAuth();
    const { tasks, users, addTask, updateTask, loading: tasksLoading } = useTasks();
    const [clients, setClients] = useState<ClientWithId[]>([]);
    const [selectedClient, setSelectedClient] = useState<ClientWithId | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, "clients"));
                const clientsData = querySnapshot.docs.map(doc => ({ ...doc.data() as Client, id: doc.id }));
                setClients(clientsData);
                if (clientsData.length > 0) {
                    setSelectedClient(clientsData[0]);
                }
            } catch (error) {
                console.error("Error fetching clients: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    const handleTaskUpdate = (updatedTask: Partial<Task> & { id: string }) => {
        updateTask(updatedTask.id, updatedTask);
    };
    
    const handleAddTask = (client: ClientWithId) => {
        if (!currentUser) return;

        const newTask: Omit<Task, 'id' | 'createdAt'> = {
            title: 'New Content Title',
            description: 'A brief description of the content.',
            status: 'Scheduled',
            priority: 'Medium',
            contentType: 'Image Ad',
            deadline: new Date().toISOString(),
            assigneeId: '',
            progressNotes: [],
            clientId: client.id,
        };
        addTask(newTask);
    };

    const filteredTasks = useMemo(() => {
        if (!tasks || !selectedClient) return [];
        return tasks.filter(task => task.clientId === selectedClient.id);
    }, [tasks, selectedClient]);

    const pageLoading = loading || tasksLoading;

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
                            {loading ? <Skeleton className="h-10 w-[180px]" /> :
                                <Select
                                    value={selectedClient?.id}
                                    onValueChange={(clientId) => setSelectedClient(clients.find(c => c.id === clientId) || null)}
                                    disabled={clients.length === 0}
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
                            }
                            {selectedClient && (
                                <Button onClick={() => handleAddTask(selectedClient)} disabled={tasksLoading}>Add Content</Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {pageLoading ? <Skeleton className="h-96 w-full" /> : selectedClient ? (
                <ContentSchedule 
                    tasks={filteredTasks} 
                    users={users as UserWithId[]} 
                    onTaskUpdate={handleTaskUpdate}
                />
            ) : (
                <div className="text-center text-muted-foreground py-16">
                    {clients.length === 0 ? "No clients found. Add clients in Settings to get started." : "Please select a client to view their schedule."}
                </div>
            )}
        </div>
    );
}
