'use client';

import { useState, useMemo } from 'react';
import type { Task, User, Client } from '@/lib/data';
import { clients } from '@/lib/data';
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ClientsPage() {
    const firestore = useFirestore();

    const tasksQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'tasks') : null), [firestore]);
    const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);
    
    const usersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
    const { data: users, loading: usersLoading } = useCollection<User>(usersQuery);
    
    const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);

    const handleTaskUpdate = async (updatedTask: Partial<Task> & { id: string }) => {
        if (!firestore) return;
        const taskRef = doc(firestore, 'tasks', updatedTask.id);
        const { id, ...taskData } = updatedTask;
        updateDoc(taskRef, taskData).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: taskRef.path,
                operation: 'update',
                requestResourceData: taskData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    };
    
    const handleAddTask = async (client: Client) => {
        if (!firestore) return;
        const tasksCollection = collection(firestore, 'tasks');
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
        const taskPayload = {
            ...newTask,
            createdAt: serverTimestamp(),
        }

        addDoc(tasksCollection, taskPayload).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: tasksCollection.path,
                operation: 'create',
                requestResourceData: taskPayload
            });
            errorEmitter.emit('permission-error', permissionError);
        });
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
                                <Button onClick={() => handleAddTask(selectedClient)} disabled={tasksLoading}>Add Content</Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {(tasksLoading || usersLoading) ? <div>Loading...</div> : selectedClient ? (
                <ContentSchedule 
                    tasks={filteredTasks} 
                    users={users || []} 
                    onTaskUpdate={handleTaskUpdate}
                />
            ) : (
                <div className="text-center text-muted-foreground py-16">Please select a client to view their schedule.</div>
            )}
        </div>
    );
}
