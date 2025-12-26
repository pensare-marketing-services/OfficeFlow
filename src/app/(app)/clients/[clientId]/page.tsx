'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { Task, UserProfile as User, Client, ClientNote, CashInTransaction } from '@/lib/data';
import ContentSchedule from '@/components/dashboard/content-schedule';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTasks } from '@/hooks/use-tasks';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc, getDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientPlanSummary } from '@/components/dashboard/client-plan-summary';
import { Input } from '@/components/ui/input';
import { Pen } from 'lucide-react';
import { useUsers } from '@/hooks/use-users';
import ClientNotesTable from '@/components/dashboard/client-notes-table';
import PaidPromotionsTable from '@/components/dashboard/paid-promotions-table';
import CashInLog from '@/components/dashboard/cash-in-log';
import SeoTable from '@/components/dashboard/seo-table';
import WebsiteTable from '@/components/dashboard/website-table';
import OtherTasksTable from '@/components/dashboard/other-tasks-table';


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

export default function ClientIdPage() {
    const { user: currentUser } = useAuth();
    const { tasks, addTask, updateTask, deleteTask, loading: tasksLoading } = useTasks();
    const { users, loading: usersLoading } = useUsers();
    const [client, setClient] = useState<ClientWithId | null>(null);
    const [loading, setLoading] = useState(true);
    const [cashInTransactions, setCashInTransactions] = useState<(CashInTransaction & { id: string })[]>([]);
    const [cashInLoading, setCashInLoading] = useState(true);
    
    const params = useParams();
    const clientId = params.clientId as string;

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
    
    useEffect(() => {
        if (!clientId) return;
        setCashInLoading(true);
        const cashInQuery = query(collection(db, `clients/${clientId}/cashInTransactions`), orderBy("date"));
        const unsubscribe = onSnapshot(cashInQuery, (snapshot) => {
            const transationsData = snapshot.docs.map(doc => ({ ...doc.data() as CashInTransaction, id: doc.id }));
            setCashInTransactions(transationsData);
            setCashInLoading(false);
        }, (error) => {
            console.error("Error fetching cash-in transactions:", error);
            setCashInLoading(false);
        });

        return () => unsubscribe();
    }, [clientId]);


    const handleTaskUpdate = (updatedTask: Partial<Task> & { id: string }) => {
        updateTask(updatedTask.id, updatedTask);
    };

    const handleTaskDelete = (taskId: string) => {
        deleteTask(taskId);
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
        const deadline = new Date();
        deadline.setHours(23, 59, 59, 999); // Set to end of today

        const newTask: Omit<Task, 'id' | 'createdAt'> = {
            title: '',
            description: '',
            status: 'Scheduled',
            priority: 99,
            contentType: 'Image Ad',
            deadline: deadline.toISOString(),
            assigneeIds: [],
            progressNotes: [],
            clientId: client.id,
        };
        addTask(newTask);
    };

    const handleNotesUpdate = (notes: ClientNote[]) => {
        handleClientUpdate({ notes });
    }

    const filteredTasks = useMemo(() => {
        if (!tasks || !client) return [];
        return tasks.filter(task => 
            task.clientId === client.id && 
            !['SEO', 'Website', 'Web Blogs', 'Other'].includes(task.contentType || '') &&
            task.description !== 'Paid Promotion'
        );
    }, [tasks, client]);
    
    const seoTasks = useMemo(() => {
        if (!tasks || !client) return [];
        return tasks.filter(task => task.clientId === client.id && task.contentType === 'SEO');
    }, [tasks, client]);
    
    const websiteTasks = useMemo(() => {
        if (!tasks || !client) return [];
        return tasks.filter(task => task.clientId === client.id && (task.contentType === 'Website' || task.contentType === 'Web Blogs'));
    }, [tasks, client]);
    
    const otherTasks = useMemo(() => {
        if (!tasks || !client) return [];
        return tasks.filter(task => task.clientId === client.id && task.contentType === 'Other');
    }, [tasks, client]);

    const totalCashIn = useMemo(() => {
        return cashInTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    }, [cashInTransactions]);

    const pageLoading = loading || tasksLoading || usersLoading || cashInLoading;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                        <div className="flex-1 space-y-1">
                             {pageLoading ? <Skeleton className="h-8 w-48 mb-2" /> : client ? (
                                <>
                                    <EditableTitle value={client.name} onSave={(newName) => handleClientUpdate({ name: newName })} />
                                    <CardDescription>Manage client plans and progress.</CardDescription>
                                </>
                             ) : (
                                <CardTitle className="font-headline">Client Not Found</CardTitle>
                             )}
                        </div>
                        
                        <div className="flex-grow">
                          {pageLoading ? <Skeleton className="h-24 w-full" /> : client && (
                                <ClientPlanSummary 
                                    client={client} 
                                    onUpdate={(id, data) => handleClientUpdate(data)} 
                                />
                            )}
                        </div>
                        
                        <div className="flex items-start gap-4">
                            {client && (
                                <Button onClick={handleAddTask} disabled={tasksLoading}>Add Task</Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    {pageLoading ? <Skeleton className="h-96 w-full" /> : client ? (
                        <ContentSchedule 
                            tasks={filteredTasks} 
                            users={users as UserWithId[]} 
                            onTaskUpdate={handleTaskUpdate}
                            onTaskDelete={handleTaskDelete}
                            showClient={false}
                        />
                    ) : (
                        <Card>
                            <CardContent className="text-center text-muted-foreground py-16">
                                Client not found or you do not have permission to view them.
                            </CardContent>
                        </Card>
                    )}
                </div>
                 <div className="lg:col-span-1 space-y-4">
                     {pageLoading ? <Skeleton className="h-48 w-full" /> : client && (
                       <OtherTasksTable
                            clientId={client.id}
                            users={users as UserWithId[]}
                            tasks={otherTasks}
                            onTaskAdd={addTask}
                            onTaskUpdate={updateTask}
                            onTaskDelete={deleteTask}
                        />
                    )}
                    {pageLoading ? <Skeleton className="h-48 w-full" /> : client && (
                       <ClientNotesTable 
                            notes={client.notes || []}
                            onUpdate={handleNotesUpdate}
                       />
                    )}
                </div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                 <div className="lg:col-span-2">
                    {pageLoading ? <Skeleton className="h-96 w-full" /> : client && (
                        <PaidPromotionsTable 
                            clientId={client.id}
                            users={users as UserWithId[]}
                            totalCashIn={totalCashIn}
                        />
                    )}
                 </div>
                 <div className="lg:col-span-1">
                    {pageLoading ? <Skeleton className="h-96 w-full" /> : client && (
                        <CashInLog
                            clientId={client.id}
                            transactions={cashInTransactions}
                            totalCashIn={totalCashIn}
                        />
                    )}
                 </div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="lg:col-span-1">
                    {pageLoading ? <Skeleton className="h-96 w-full" /> : client && (
                        <SeoTable 
                            clientId={client.id}
                            users={users as UserWithId[]}
                            tasks={seoTasks}
                            onTaskAdd={addTask}
                            onTaskUpdate={updateTask}
                            onTaskDelete={deleteTask}
                        />
                    )}
                </div>
                <div className="lg:col-span-1">
                    {pageLoading ? <Skeleton className="h-96 w-full" /> : client && (
                         <WebsiteTable
                            clientId={client.id}
                            users={users as UserWithId[]}
                            tasks={websiteTasks}
                            onTaskAdd={addTask}
                            onTaskUpdate={updateTask}
                            onTaskDelete={deleteTask}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
