
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import type { Task, UserProfile as User, Client, ClientNote, CashInTransaction, MonthData } from '@/lib/data';
import ContentSchedule from '@/components/dashboard/content-schedule';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTasks } from '@/hooks/use-tasks';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc, onSnapshot, collection, query, orderBy, writeBatch, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientPlanSummary } from '@/components/dashboard/client-plan-summary';
import { Input } from '@/components/ui/input';
import { Pen, Plus, Trash2 } from 'lucide-react';
import { useUsers } from '@/hooks/use-users';
import ClientNotesTable from '@/components/dashboard/client-notes-table';
import PaidPromotionsTable from '@/components/dashboard/paid-promotions-table';
import CashInLog from '@/components/dashboard/cash-in-log';
import SeoTable from '@/components/dashboard/seo-table';
import WebsiteTable from '@/components/dashboard/website-table';
import OtherTaskTable from '@/components/dashboard/other-task-table';
import PlanPromotionsTable from '@/components/dashboard/plan-promotions-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';


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

const EditableTabTrigger: React.FC<{
  value: string;
  onSave: (value: string) => void;
  onDelete: () => void;
  isOnlyMonth: boolean;
}> = ({ value, onSave, onDelete, isOnlyMonth }) => {
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
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div className="relative group flex items-center">
      <TabsTrigger value={value} className="text-xs pr-7">
        {value}
      </TabsTrigger>
      <div className="absolute right-0.5 flex items-center">
         <button onClick={() => setIsEditing(true)} className="p-0.5 rounded-full bg-background/50 hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity">
            <Pen className="h-3 w-3 text-muted-foreground" />
        </button>
        {!isOnlyMonth && (
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <button className="p-0.5 rounded-full bg-background/50 text-destructive/80 hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3 w-3" />
                    </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the month "<strong>{value}</strong>" and all of its associated tasks and promotions. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                            Yes, delete month
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </div>
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
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();
    
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
        const newTabs = [...monthlyTabs, { 
            name: newMonthName,
            plan: '',
            billDuration: '',
            socialPlatforms: '',
            monthlyReach: '',
            paidPromotionsMainBudget: 0,
            planPromotionsMainBudget: 0,
        }];
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

    const handleDeleteMonth = async (monthName: string) => {
        setIsDeleting(true);
        try {
            const batch = writeBatch(db);

            // 1. Delete tasks for this month
            const tasksQuery = query(collection(db, 'tasks'), where('clientId', '==', clientId), where('month', '==', monthName));
            const tasksSnapshot = await getDocs(tasksQuery);
            tasksSnapshot.forEach(doc => batch.delete(doc.ref));

            // 2. Delete paid promotions for this month
            const paidPromosQuery = query(collection(db, `clients/${clientId}/promotions`), where('month', '==', monthName));
            const paidPromosSnapshot = await getDocs(paidPromosQuery);
            paidPromosSnapshot.forEach(doc => batch.delete(doc.ref));
            
            // 3. Delete plan promotions for this month
            const planPromosQuery = query(collection(db, `clients/${clientId}/planPromotions`), where('month', '==', monthName));
            const planPromosSnapshot = await getDocs(planPromosQuery);
            planPromosSnapshot.forEach(doc => batch.delete(doc.ref));

            // 4. Update client document to remove the month from the array
            const newTabs = monthlyTabs.filter(month => month.name !== monthName);
            const newActiveMonth = newTabs.length > 0 ? newTabs[0].name : "Month 1";
            
            batch.update(doc(db, 'clients', clientId), { months: newTabs });

            await batch.commit();

            setActiveMonth(newActiveMonth);
            toast({ title: "Month Deleted", description: `"${monthName}" has been successfully deleted.` });

        } catch (error) {
            console.error("Failed to delete month:", error);
            toast({ variant: 'destructive', title: "Deletion Failed", description: "There was an error deleting the month." });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleMonthDataUpdate = (updatedData: Partial<MonthData>) => {
        const newTabs = monthlyTabs.map(month => {
            if (month.name === activeMonth) {
                return { ...month, ...updatedData };
            }
            return month;
        });
        setMonthlyTabs(newTabs);
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
                     const initialMonth: MonthData = {
                        name: "Month 1",
                        plan: clientData.plan || '',
                        billDuration: clientData.billDuration || '',
                        socialPlatforms: clientData.socialPlatforms || '',
                        monthlyReach: clientData.monthlyReach || '',
                        paidPromotionsMainBudget: clientData.paidPromotionsMainBudget || 0,
                        planPromotionsMainBudget: clientData.planPromotionsMainBudget || 0,
                    };
                    setMonthlyTabs([initialMonth]);
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
        if (activeMonth === "Month 1" && (!client?.months || client.months.length <= 1)) {
            return allClientTasks.filter(task => !task.month || task.month === "Month 1");
        }
        return allClientTasks.filter(task => task.month === activeMonth);
    }, [allClientTasks, activeMonth, client?.months]);

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

    const pageLoading = loading || tasksLoading || usersLoading || cashInLoading || isDeleting;
    const activeMonthData = useMemo(() => monthlyTabs.find(m => m.name === activeMonth), [monthlyTabs, activeMonth]);

    return (
        <div className="space-y-4">
            {isDeleting && (
                <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}
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
                                        </div>
                                         <Tabs value={activeMonth} onValueChange={setActiveMonth} className="w-full max-w-md mx-auto">
                                            <TabsList>
                                                {monthlyTabs.map(month => (
                                                    <EditableTabTrigger 
                                                        key={month.name}
                                                        value={month.name}
                                                        onSave={(newName) => handleMonthNameChange(month.name, newName)}
                                                        onDelete={() => handleDeleteMonth(month.name)}
                                                        isOnlyMonth={monthlyTabs.length === 1}
                                                    />
                                                ))}
                                            </TabsList>
                                        </Tabs>
                                        <Button size="sm" onClick={handleAddNewMonth} className="h-7 gap-1">
                                            <Plus className="h-4 w-4" />
                                            Add Month
                                        </Button>
                                    </div>
                                   
                                    <div className="flex flex-row items-center gap-4">
                                        <ClientPlanSummary 
                                            monthData={activeMonthData} 
                                            onUpdate={handleMonthDataUpdate} 
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
                            activeMonth={activeMonth}
                            monthData={activeMonthData}
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
                            activeMonth={activeMonth}
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
                            activeMonth={activeMonth}
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
                            activeMonth={activeMonth}
                            monthData={activeMonthData}
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
                            activeMonth={activeMonth}
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
