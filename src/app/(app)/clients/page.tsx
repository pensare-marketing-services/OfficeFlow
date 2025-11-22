'use client';

import { useState, useMemo } from 'react';
import type { Task, UserProfile as User, Client } from '@/lib/data';
import { clients } from '@/lib/data';
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

type UserWithId = User & { id: string };

export default function ClientsPage() {
    const { tasks, users, loading, addTask, updateTask } = useTasks();
    const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);

    const handleTaskUpdate = (updatedTask: Partial<Task> & { id: string }) => {
        updateTask(updatedTask);
    };
    
    const handleAddTask = (client: Client) => {
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
            createdAt: new Date().toISOString(),
        };
        addTask(newTask);
    };

    const filteredTasks = useMemo(() => {
        if (!tasks || !selectedClient) return [];
        return tasks.filter(task => task.clientId === selectedClient.id);
    }, [tasks, selectedClient]);

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
                                <Button onClick={() => handleAddTask(selectedClient)} disabled={loading}>Add Content</Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {loading ? <div>Loading...</div> : selectedClient ? (
                <ContentSchedule 
                    tasks={filteredTasks} 
                    users={users as UserWithId[]} 
                    onTaskUpdate={handleTaskUpdate}
                />
            ) : (
                <div className="text-center text-muted-foreground py-16">Please select a client to view their schedule.</div>
            )}
        </div>
    );
}
