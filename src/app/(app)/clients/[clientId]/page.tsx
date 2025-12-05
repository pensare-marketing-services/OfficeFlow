'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Task, UserProfile as User, Client } from '@/lib/data';
import ContentSchedule from '@/components/dashboard/content-schedule';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTasks } from '@/hooks/use-tasks';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientPlanSummary } from '@/components/dashboard/client-plan-summary';
import { Input } from '@/components/ui/input';
import { Pen } from 'lucide-react';
import { useUsers } from '@/hooks/use-users';


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

export default function ClientIdPage({ params }: { params: { clientId: string } }) {
    const { user: currentUser } = useAuth();
    const { tasks, addTask, updateTask, loading: tasksLoading } = useTasks();
    const { users, loading: usersLoading } = useUsers();
    const [client, setClient] = useState<ClientWithId | null>(null);
    const [loading, setLoading] = useState(true);
    
    const { clientId } = params;

    useEffect(() => {
        if (!clientId) return;

        setLoading(true);
        const clientDocRef = doc(db, 'clients', clientId);
        
        const fetchClient = async () => {
            const docSnap = await getDoc(clientDocRef);
            if (docSnap.exists()) {
                setClient({ ...docSnap.data() as Client, id: docSnap.id });
            } else {
                console.error("No such client!");
                setClient(null);
            }
            setLoading(false);
        };

        fetchClient();

    }, [clientId]);


    const handleTaskUpdate = (updatedTask: Partial<Task> & { id: string }) => {
        updateTask(updatedTask.id, updatedTask);
    };
    
    const handleClientUpdate = async (updatedData: Partial<Client>) => {
        if (!clientId) return;
        const clientRef = doc(db, 'clients', clientId);
        try {
            await updateDoc(clientRef, updatedData);
             setClient(prev => prev ? { ...prev, ...updatedData } : null);
        } catch (error) {
            console.error("Error updating client:", error);
        }
    };
    
    const handleAddTask = () => {
        if (!currentUser || !client) return;

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
        if (!tasks || !client) return [];
        return tasks.filter(task => task.clientId === client.id);
    }, [tasks, client]);

    const pageLoading = loading || tasksLoading || usersLoading;

    return (
        <div className="space-y-0">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                             {pageLoading ? <Skeleton className="h-8 w-48 mb-2" /> : client ? (
                                <EditableTitle value={client.name} onSave={(newName) => handleClientUpdate({ name: newName })} />
                             ) : (
                                <CardTitle className="font-headline">Client Not Found</CardTitle>
                             )}
                            <CardDescription>Manage client plans and progress.</CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            {client && (
                                <Button onClick={handleAddTask} disabled={tasksLoading}>Add Task</Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="space-y-0">
                {pageLoading ? <Skeleton className="h-96 w-full mt-4" /> : client ? (
                    <>
                        <ClientPlanSummary 
                            client={client} 
                            onUpdate={(id, data) => handleClientUpdate(data)} 
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
                        Client not found or you do not have permission to view them.
                    </div>
                )}
            </div>
        </div>
    );
}
