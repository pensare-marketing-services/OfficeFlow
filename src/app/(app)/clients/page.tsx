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
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientPlanSummary } from '@/components/dashboard/client-plan-summary';
import { Input } from '@/components/ui/input';
import { Pen } from 'lucide-react';


type UserWithId = User & { id: string };
type ClientWithId = Client & { id: string };


const EditableTitle: React.FC<{ value: string; onSave: (value: string) => void }> = ({ value, onSave }) => {
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if(currentValue !== value) {
            onSave(currentValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSave(e.currentTarget.value);
            e.currentTarget.blur();
        }
    };
    
    return (
      <div className="relative group flex items-center gap-2">
        <Input 
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleBlur} 
          onKeyDown={handleKeyDown} 
          className="border-0 focus-visible:ring-1 h-auto p-1 rounded-md text-2xl font-semibold tracking-tight font-headline text-foreground bg-transparent" 
        />
        <Pen className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
};

export default function ClientsPage() {
    const { user: currentUser } = useAuth();
    const { tasks, users, addTask, updateTask, loading: tasksLoading } = useTasks();
    const [clients, setClients] = useState<ClientWithId[]>([]);
    const [selectedClient, setSelectedClient] = useState<ClientWithId | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const clientsQuery = collection(db, "clients");
        const unsubscribe = onSnapshot(clientsQuery, (querySnapshot) => {
            const clientsData = querySnapshot.docs.map(doc => ({ ...doc.data() as Client, id: doc.id }));
            setClients(clientsData);
            if (clientsData.length > 0 && !selectedClient) {
                setSelectedClient(clientsData[0]);
            } else if (clientsData.length > 0 && selectedClient) {
                // If there's a selected client, make sure it's up-to-date
                setSelectedClient(prev => clientsData.find(c => c.id === prev?.id) || clientsData[0]);
            } else if (clientsData.length === 0) {
                setSelectedClient(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching clients: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleTaskUpdate = (updatedTask: Partial<Task> & { id: string }) => {
        updateTask(updatedTask.id, updatedTask);
    };
    
    const handleClientUpdate = async (clientId: string, updatedData: Partial<Client>) => {
        const clientRef = doc(db, 'clients', clientId);
        try {
            await updateDoc(clientRef, updatedData);
        } catch (error) {
            console.error("Error updating client:", error);
        }
    };
    
    const handleAddTask = (client: ClientWithId) => {
        if (!currentUser) return;

        const newTask: Omit<Task, 'id' | 'createdAt'> = {
            title: '',
            description: '',
            status: 'Scheduled',
            priority: 'Medium',
            contentType: 'Image Ad',
            deadline: new Date().toISOString(),
            assigneeIds: [],
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
                             {selectedClient ? (
                                <EditableTitle value={selectedClient.name} onSave={(newName) => handleClientUpdate(selectedClient.id, { name: newName })} />
                             ) : (
                                <CardTitle className="font-headline">Clients</CardTitle>
                             )}
                            <CardDescription>Manage client plans and progress.</CardDescription>
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
                                <Button onClick={() => handleAddTask(selectedClient)} disabled={tasksLoading}>Schedule</Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="space-y-2">
                {pageLoading ? <Skeleton className="h-96 w-full" /> : selectedClient ? (
                    <>
                        <ClientPlanSummary 
                            client={selectedClient} 
                            onUpdate={handleClientUpdate} 
                        />
                        <ContentSchedule 
                            tasks={filteredTasks} 
                            users={users as UserWithId[]} 
                            onTaskUpdate={handleTaskUpdate}
                            showClient={false}
                        />
                    </>
                ) : (
                    <div className="text-center text-muted-foreground py-16">
                        {clients.length === 0 ? "No clients found. Add clients in Settings to get started." : "Please select a client to view their schedule."}
                    </div>
                )}
            </div>
        </div>
    );
}
