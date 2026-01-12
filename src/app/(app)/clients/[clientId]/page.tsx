

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
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';


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

const EditableTabTrigger: React.FC<{
  value: string;
  onSave: (value: string) => void;
  onDelete: (monthName: string) => Promise<void>;
  isOnlyMonth: boolean;
}> = ({ value, onSave, onDelete, isOnlyMonth }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [isDeleting, setIsDeleting] = useState(false);
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
    if (currentValue !== value && currentValue.trim() !== '') {
      onSave(currentValue.trim());
    } else {
        setCurrentValue(value);
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
  
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    await onDelete(value);
    // No need to set isDeleting to false as the component will unmount
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="h-7 w-auto text-xs px-2"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div 
        className="relative group flex items-center pr-1"
        onDoubleClick={() => setIsEditing(true)}
    >
      <TabsTrigger value={value} className="text-xs pr-6">
        {value}
      </TabsTrigger>
      {!isOnlyMonth && (
         <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={(e) => e.stopPropagation()}
            >
                <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the month "{value}" and all of its associated tasks and promotions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                 {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Yes, delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
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
    const { toast } = useToast();
    
    const params = useParams();
    const clientId = params.clientId as string;

    const [monthlyTabs, setMonthlyTabs] = useState<MonthData[]>([{ name: "Month 1", notes: [] }]);
    
    const [activeMonth, setActiveMonth] = useState(() => {
        if (typeof window !== 'undefined' && clientId) {
            return sessionStorage.getItem(`activeMonth_${clientId}`) || "Month 1";
        }
        return "Month 1";
    });

    useEffect(() => {
        if (clientId) {
            sessionStorage.setItem(`activeMonth_${clientId}`, activeMonth);
        }
    }, [activeMonth, clientId]);

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
            notes: []
        }];
        handleClientUpdate({ months: newTabs }).then(() => {
            setActiveMonth(newMonthName);
        });
    };

    const handleMonthNameChange = (oldName: string, newName: string) => {
        if(monthlyTabs.some(tab => tab.name === newName)) {
            toast({ variant: 'destructive', title: 'Duplicate Name', description: 'Month names must be unique.' });
            return;
        }

        const newTabs = monthlyTabs.map(month => month.name === oldName ? { ...month, name: newName } : month);
        
        handleClientUpdate({ months: newTabs }).then(() => {
             if(activeMonth === oldName) {
                setActiveMonth(newName);
            }
        });
    };

    const handleDeleteMonth = async (monthName: string) => {
        try {
            const batch = writeBatch(db);

            const tasksQuery = query(collection(db, 'tasks'), where('clientId', '==', clientId), where('month', '==', monthName));
            const tasksSnapshot = await getDocs(tasksQuery);
            tasksSnapshot.forEach(doc => batch.delete(doc.ref));

            const paidPromosQuery = query(collection(db, `clients/${clientId}/promotions`), where('month', '==', monthName));
            const paidPromosSnapshot = await getDocs(paidPromosQuery);
            paidPromosSnapshot.forEach(doc => batch.delete(doc.ref));
            
            const planPromosQuery = query(collection(db, `clients/${clientId}/planPromotions`), where('month', '==', monthName));
            const planPromosSnapshot = await getDocs(planPromosQuery);
            planPromosSnapshot.forEach(doc => batch.delete(doc.ref));

            const newTabs = monthlyTabs.filter(month => month.name !== monthName);
            
            batch.update(doc(db, 'clients', clientId), { months: newTabs });

            await batch.commit();

            if (activeMonth === monthName) {
                const newActiveMonth = newTabs.length > 0 ? newTabs[0].name : "Month 1";
                setActiveMonth(newActiveMonth);
            }
            toast({ title: "Month Deleted", description: `"${monthName}" has been successfully deleted.` });

        } catch (error) {
            console.error("Failed to delete month:", error);
            toast({ variant: 'destructive', title: "Deletion Failed", description: "There was an error deleting the month." });
        }
    };

    const handleMonthDataUpdate = (updatedData: Partial<MonthData>) => {
        const newTabs = monthlyTabs.map(month => {
            if (month.name === activeMonth) {
                return { ...month, ...updatedData };
            }
            return month;
        });
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
                     const savedMonth = sessionStorage.getItem(`activeMonth_${clientId}`);
                    if (savedMonth && clientData.months.some(m => m.name === savedMonth)) {
                        setActiveMonth(savedMonth);
                    } else if (!clientData.months.some(m => m.name === activeMonth)) {
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
                        notes: clientData.notes || [] // Migrate old global notes
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
        handleMonthDataUpdate({ notes });
    }

    const tasksForCurrentMonth = useMemo(() => {
        if (monthlyTabs.length <= 1 && activeMonth === "Month 1") {
            return allClientTasks.filter(task => !task.month || task.month === "Month 1");
        }
        return allClientTasks.filter(task => task.month === activeMonth);
    }, [allClientTasks, activeMonth, monthlyTabs]);

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
    const activeMonthData = useMemo(() => monthlyTabs.find(m => m.name === activeMonth), [monthlyTabs, activeMonth]);

    return (
        <div className="space-y-4">
            
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
                {/* Left Column */}
                <div className="lg:col-span-3 space-y-4">
                    <Card>
                        <CardContent className="p-2">
                         {pageLoading ? <Skeleton className="h-36 w-full" /> : client && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center gap-4">
                                        <div className='flex-shrink-0 w-[150px]'>
                                            <EditableTitle value={client.name} onSave={(newName) => handleClientUpdate({ name: newName })} />
                                        </div>
                                         <Tabs value={activeMonth} onValueChange={setActiveMonth} className="flex-grow min-w-0">
                                            <ScrollArea className="w-full whitespace-nowrap">
                                                <TabsList>
                                                    {monthlyTabs.map(month => (
                                                        <EditableTabTrigger 
                                                            key={month.name}
                                                            value={month.name}
                                                            onSave={(newName) => handleMonthNameChange(month.name, newName)}
                                                            onDelete={handleDeleteMonth}
                                                            isOnlyMonth={monthlyTabs.length === 1}
                                                        />
                                                    ))}
                                                </TabsList>
                                                <ScrollBar orientation="horizontal" />
                                            </ScrollArea>
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

                    {pageLoading ? <Skeleton className="h-96 w-full" /> : client && activeMonthData && (
                       <ClientNotesTable 
                            notes={activeMonthData.notes || []}
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
