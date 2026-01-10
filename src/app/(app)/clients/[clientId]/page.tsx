'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import type { Task, UserProfile as User, Client, ClientNote, CashInTransaction, MonthData } from '@/lib/data';
import ContentSchedule from '@/components/dashboard/content-schedule';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTasks } from '@/hooks/use-tasks';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientPlanSummary } from '@/components/dashboard/client-plan-summary';
import { Input } from '@/components/ui/input';
import { Pen, Plus } from 'lucide-react';
import { useUsers } from '@/hooks/use-users';
import ClientNotesTable from '@/components/dashboard/client-notes-table';
import PaidPromotionsTable from '@/components/dashboard/paid-promotions-table';
import CashInLog from '@/components/dashboard/cash-in-log';
import SeoTable from '@/components/dashboard/seo-table';
import WebsiteTable from '@/components/dashboard/website-table';
import OtherTaskTable from '@/components/dashboard/other-task-table';
import PlanPromotionsTable from '@/components/dashboard/plan-promotions-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


type UserWithId = User & { id: string };
type ClientWithId = Client & { id: string };
type TaskWithId = Task & { id: string };


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

const EditableTabTrigger: React.FC<{ value: string; onSave: (value: string) => void }> = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (currentValue !== value) {
      onSave(currentValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="h-7 w-auto text-[10px] px-2"
      />
    );
  }

  return (
    <div className="relative group flex items-center">
      <TabsTrigger value={value} className="text-xs">
        {value}
      </TabsTrigger>
      <button onClick={() => setIsEditing(true)} className="absolute right-1 p-0.5 rounded-full bg-background/50 hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity">
        <Pen className="h-3 w-3 text-muted-foreground" />
      </button>
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

    const [monthlyTabs, setMonthlyTabs] = useState<MonthData[]>([{ name: "Month 1" }]);
    const [activeMonth, setActiveMonth] = useState("Month 1");

    const allClientTasks = useMemo(() => {
        if (!tasks || !clientId) return [];
        return tasks.filter(task => task.clientId === clientId);
    }, [tasks, clientId]);


    const handleAddNewMonth = () => {
        const newMonthName = `Month ${monthlyTabs.length + 1}`;
        const newTabs = [...monthlyTabs, { name: newMonthName }];
        setMonthlyTabs(newTabs);
        setActiveMonth(newMonthName);
        handleClientUpdate({ months: newTabs });
    };

    const handleMonthNameChange = (oldName: string, newName: string) => {
        const newTabs = monthlyTabs.map(month => month.name === oldName ? { ...month, name: newName } : month);
        setMonthlyTabs(newTabs);
        if(activeMonth === oldName) {
            setActiveMonth(newName);
        }
        handleClientUpdate({ months: newTabs });
    };


    useEffect(() => {
        if (!clientId) return;
        setLoading(true);
        const clientDocRef = doc(db, 'clients', clientId);
        
        const unsubscribe = onSnapshot(clientDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const clientData = { ...docSnap.data() as Client, id: docSnap.id };
                setClient(clientData);
                if (clientData.months && clientData.months.length > 0) {
                    setMonthlyTabs(clientData.months);
                    if (!clientData.months.some(m => m.name === activeMonth)) {
                        setActiveMonth(clientData.months[0].name);
                    }
                } else {
                    setMonthlyTabs([{ name: "Month 1" }]);
                    setActiveMonth("Month 1");
                }
            } else {
                console.error("No such client!");
                setClient(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [clientId, activeMonth]);
    
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
        } catch (error) {
            console.error("Error updating client:", error);
        }
    };
    
    const handleAddTask = async () => {
        if (!currentUser || !client) return;
        const deadline = new Date();
        deadline.setHours(23, 59, 59, 999);

        const currentMonthName = activeMonth;

        const newTaskData: Omit<Task, 'id' | 'createdAt'> = {
            title: '',
            description: '',
            status: 'Scheduled',
            priority: 99,
            contentType: 'Image Ad',
            deadline: deadline.toISOString(),
            assigneeIds: [],
            progressNotes: [],
            clientId: client.id,
            month: currentMonthName,
        };

        await addTask(newTaskData);
    };

    const handleNotesUpdate = (notes: ClientNote[]) => {
        handleClientUpdate({ notes });
    }

    const tasksForCurrentMonth = useMemo(() => {
        if (activeMonth === "Month 1") {
            return allClientTasks.filter(task => !task.month || task.month === "Month 1");
        }
        return allClientTasks.filter(task => task.month === activeMonth);
    }, [allClientTasks, activeMonth]);

    const filteredTasks = useMemo(() => {
        if (!tasksForCurrentMonth || !client) return [];
        return tasksForCurrentMonth.filter(task => 
            task.clientId === client.id &&
            task.description !== 'Paid Promotion' &&
            task.description !== 'Plan Promotion' &&
            task.contentType !== 'Other' &&
            task.contentType !== 'SEO' &&
            task.contentType !== 'Website' &&
            task.contentType !== 'Web Blogs'
        );
    }, [tasksForCurrentMonth, client]);
    
    const seoTasks = useMemo(() => {
        if (!tasksForCurrentMonth || !client) return [];
        return tasksForCurrentMonth.filter(task => task.clientId === client.id && task.contentType === 'SEO');
    }, [tasksForCurrentMonth, client]);
    
    const websiteTasks = useMemo(() => {
        if (!tasksForCurrentMonth || !client) return [];
        return tasksForCurrentMonth.filter(task => task.clientId === client.id && (task.contentType === 'Website' || task.contentType === 'Web Blogs'));
    }, [tasksForCurrentMonth, client]);

    const otherTasks = useMemo(() => {
        if (!tasksForCurrentMonth || !client) return [];
        return tasksForCurrentMonth.filter(task => task.clientId === client.id && task.contentType === 'Other');
    }, [tasksForCurrentMonth, client]);


    const totalCashIn = useMemo(() => {
        return cashInTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    }, [cashInTransactions]);

    const pageLoading = loading || tasksLoading || usersLoading || cashInLoading;

    return (
        <div className="space-y-4">
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
                {/* Left Column */}
                <div className="lg:col-span-3 space-y-4">
                    <Card>
                        <CardContent className="p-2">
                         {pageLoading ? <Skeleton className="h-36 w-full" /> : client && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className='flex-shrink-0'>
                                            <EditableTitle value={client.name} onSave={(newName) => handleClientUpdate({ name: newName })} />
                                            <CardDescription>Manage client plans and progress.</CardDescription>
                                        </div>
                                        <Button size="sm" onClick={handleAddNewMonth} className="h-7 gap-1">
                                            <Plus className="h-4 w-4" />
                                            Add Month
                                        </Button>
                                    </div>
                                    <Tabs value={activeMonth} onValueChange={setActiveMonth} className="w-full">
                                        <TabsList>
                                            {monthlyTabs.map(month => (
                                                <EditableTabTrigger 
                                                    key={month.name}
                                                    value={month.name}
                                                    onSave={(newName) => handleMonthNameChange(month.name, newName)}
                                                />
                                            ))}
                                        </TabsList>
                                    </Tabs>
                                    <div className="flex flex-row items-center gap-4">
                                        <ClientPlanSummary 
                                            client={client} 
                                            onUpdate={(id, data) => handleClientUpdate(data)} 
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                     {pageLoading ? <Skeleton className="h-96 w-full" /> : client ? (
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between p-3">
                                <CardTitle className="text-base font-headline">Digital Marketing</CardTitle>
                                <Button size="sm" onClick={handleAddTask} disabled={tasksLoading} className="h-7 gap-1">
                                    <Plus className="h-4 w-4" />
                                    Add Task
                                </Button>
                            </CardHeader>
                            <CardContent className='p-0'>
                                <ContentSchedule 
                                    tasks={filteredTasks} 
                                    users={users as UserWithId[]} 
                                    onTaskUpdate={handleTaskUpdate}
                                    onTaskDelete={handleTaskDelete}
                                    showClient={false}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="text-center text-muted-foreground py-16">
                                Client not found or you do not have permission to view them.
                            </CardContent>
                        </Card>
                    )}
                       {pageLoading ? <Skeleton className="h-96 w-full" /> : client && (
                        <PaidPromotionsTable 
                            client={client}
                            users={users as UserWithId[]}
                            totalCashIn={totalCashIn}
                            onClientUpdate={handleClientUpdate}
                        />
                    )}

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

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-4">
                    {pageLoading ? <Skeleton className="h-96 w-full" /> : client && (
                        <PlanPromotionsTable 
                            client={client}
                            users={users as UserWithId[]}
                            totalCashIn={totalCashIn}
                            onClientUpdate={handleClientUpdate}
                        />
                    )}
                    
                     {pageLoading ? <Skeleton className="h-96 w-full" /> : client && (
                       <OtherTaskTable
                            clientId={client.id}
                            users={users as UserWithId[]}
                            tasks={otherTasks}
                            onTaskAdd={addTask}
                            onTaskUpdate={updateTask}
                            onTaskDelete={deleteTask}
                        />
                    )}

                    {pageLoading ? <Skeleton className="h-96 w-full" /> : client && (
                       <ClientNotesTable 
                            notes={client.notes || []}
                            onUpdate={handleNotesUpdate}
                       />
                    )}

                     {pageLoading ? <Skeleton className="h-96 w-full" /> : client && (
                        <CashInLog
                            clientId={client.id}
                            transactions={cashInTransactions}
                            totalCashIn={totalCashIn}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
