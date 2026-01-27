

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { Task, UserProfile as User, Client, ClientNote, CashInTransaction, MonthData, PaidPromotion, PlanPromotion } from '@/lib/data';
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
import { Pen, Plus, Trash2, MoreVertical, Download } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2 } from 'lucide-react';
import { generateClientReportPDF } from '@/components/dashboard/client-report-pdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';


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
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
  
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
      try {
        await onDelete(value);
        setShowDeleteDialog(false);
      } catch (error) {
        console.error(error);
      } finally {
        setIsDeleting(false);
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
          className="h-7 w-auto text-xs px-2"
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
  
    return (
      <>
        <div className="relative group flex items-center pr-1">
          <TabsTrigger value={value} className="text-xs pr-7">
            {value}
          </TabsTrigger>
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 h-5 w-5 opacity-60 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDropdownOpen(true);
                }}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              align="end"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuItem 
                onSelect={(e) => {
                  e.preventDefault();
                  setDropdownOpen(false);
                  setIsEditing(true);
                }}
              >
                <Pen className="mr-2 h-3 w-3" />
                Edit
              </DropdownMenuItem>
              {!isOnlyMonth && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setDropdownOpen(false);
                    // Small delay to allow dropdown to close before opening dialog
                    setTimeout(() => {
                      setShowDeleteDialog(true);
                    }, 50);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
  
        {/* AlertDialog moved outside to avoid nesting issues */}
        <AlertDialog 
          open={showDeleteDialog} 
          onOpenChange={setShowDeleteDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete
                the month "{value}" and all of its associated tasks and
                promotions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Yes, delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  };

  async function createReportImage(
    title: string,
    headers: string[],
    rows: (string | number)[][],
    footerData: { label: string; value: string; isTotal?: boolean }[] = []
): Promise<Blob | null> {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.backgroundColor = 'white';
    container.style.padding = '20px';
    container.style.fontFamily = 'Helvetica, Arial, sans-serif';
    container.style.width = '800px'; 
    container.style.border = '1px solid transparent'; 

    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    titleElement.style.fontSize = '1.25rem';
    titleElement.style.fontWeight = '600';
    titleElement.style.marginBottom = '1rem';
    titleElement.style.color = '#333';
    container.appendChild(titleElement);

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '0.875rem';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.backgroundColor = '#2980b9'; 
    headerRow.style.color = 'white';
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.padding = '10px 12px';
        th.style.textAlign = 'left';
        th.style.fontWeight = '600';
        th.style.border = '1px solid #ddd';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    if (rows.length > 0) {
        rows.forEach(rowData => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #ddd';
            rowData.forEach((cellData) => {
                const td = document.createElement('td');
                td.textContent = String(cellData);
                td.style.padding = '10px 12px';
                td.style.border = '1px solid #ddd';
                if (typeof cellData === 'number' || (typeof cellData === 'string' && !isNaN(parseFloat(cellData)))) {
                    td.style.textAlign = 'right';
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    } else {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = headers.length;
        td.textContent = 'No data available.';
        td.style.padding = '20px';
        td.style.textAlign = 'center';
        td.style.color = '#777';
        tr.appendChild(td);
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    if (footerData.length > 0) {
        const tfoot = document.createElement('tfoot');
        footerData.forEach(item => {
            const tr = document.createElement('tr');
             tr.style.borderTop = item.isTotal ? '2px solid #555' : '1px solid #ddd';
             tr.style.backgroundColor = '#f9f9f9';
             if(item.isTotal) {
                tr.style.fontWeight = 'bold';
             }

            const labelTd = document.createElement('td');
            labelTd.textContent = item.label;
            labelTd.colSpan = headers.length - 1;
            labelTd.style.textAlign = 'right';
            labelTd.style.padding = '10px 12px';
            labelTd.style.border = '1px solid #ddd';

            const valueTd = document.createElement('td');
            valueTd.textContent = item.value;
            valueTd.style.textAlign = 'right';
            valueTd.style.padding = '10px 12px';
            valueTd.style.border = '1px solid #ddd';

            tr.appendChild(labelTd);
            tr.appendChild(valueTd);
            tfoot.appendChild(tr);
        });
        table.appendChild(tfoot);
    }

    container.appendChild(table);
    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: 'white'
    });

    document.body.removeChild(container);

    return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/png');
    });
}
  
export default function ClientIdPage() {
    const { user: currentUser } = useAuth();
    const { tasks, addTask, updateTask, deleteTask, loading: tasksLoading } = useTasks();
    const { users, loading: usersLoading } = useUsers();
    const [client, setClient] = useState<ClientWithId | null>(null);
    const [loading, setLoading] = useState(true);
    const [cashInTransactions, setCashInTransactions] = useState<(CashInTransaction & { id: string })[]>([]);
    const [cashInLoading, setCashInLoading] = useState(true);
    const [paidPromotions, setPaidPromotions] = useState<(PaidPromotion & { id: string })[]>([]);
    const [paidPromotionsLoading, setPaidPromotionsLoading] = useState(true);
    const [planPromotions, setPlanPromotions] = useState<(PlanPromotion & { id: string })[]>([]);
    const [planPromotionsLoading, setPlanPromotionsLoading] = useState(true);
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

    const [isDownloading, setIsDownloading] = useState(false);
    
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

    const handleMonthNameChange = async (oldName: string, newName: string) => {
        if (oldName === newName) return;
        if (monthlyTabs.some(tab => tab.name === newName)) {
          toast({
            variant: 'destructive',
            title: 'Duplicate Name',
            description: 'Month names must be unique.',
          });
          return;
        }
      
        try {
          const batch = writeBatch(db);
      
          // 1. Update client months array
          const newTabs = monthlyTabs.map(month =>
            month.name === oldName ? { ...month, name: newName } : month
          );
      
          batch.update(doc(db, 'clients', clientId), { months: newTabs });
      
          // 2. Find and update all associated TASKS
          const tasksQuery = query(
            collection(db, 'tasks'),
            where('clientId', '==', clientId),
            where('month', '==', oldName)
          );
          const tasksSnap = await getDocs(tasksQuery);
          tasksSnap.forEach(docSnap => {
            batch.update(docSnap.ref, { month: newName });
          });
      
          // 3. Find and update all associated PAID PROMOTIONS
          const paidPromoQuery = query(
            collection(db, `clients/${clientId}/promotions`),
            where('month', '==', oldName)
          );
          const paidPromoSnap = await getDocs(paidPromoQuery);
          paidPromoSnap.forEach(docSnap => {
            batch.update(docSnap.ref, { month: newName });
          });
      
          // 4. Find and update all associated PLAN PROMOTIONS
          const planPromoQuery = query(
            collection(db, `clients/${clientId}/planPromotions`),
            where('month', '==', oldName)
          );
          const planPromoSnap = await getDocs(planPromoQuery);
          planPromoSnap.forEach(docSnap => {
            batch.update(docSnap.ref, { month: newName });
          });
      
          await batch.commit();
      
          if (activeMonth === oldName) {
            setActiveMonth(newName);
          }
      
          toast({
            title: 'Month renamed',
            description: `"${oldName}" was successfully renamed to "${newName}" and all associated data was updated.`,
          });
        } catch (error) {
          console.error("Error renaming month and associated data:", error);
          toast({
            variant: 'destructive',
            title: 'Rename failed',
            description: 'Could not update all associated tasks and promotions. Please try again.',
          });
        }
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

    useEffect(() => {
        if (!clientId || !activeMonth) return;
        setPaidPromotionsLoading(true);
        const promotionsQuery = query(collection(db, `clients/${clientId}/promotions`), where("month", "==", activeMonth));
        const unsubscribe = onSnapshot(promotionsQuery, (snapshot) => {
            const promotionsData = snapshot.docs.map(doc => ({ ...doc.data() as PaidPromotion, id: doc.id }));
            setPaidPromotions(promotionsData);
            setPaidPromotionsLoading(false);
        }, (error) => {
            console.error("Error fetching paid promotions:", error);
            setPaidPromotionsLoading(false);
        });

        return () => unsubscribe();
    }, [clientId, activeMonth]);

    useEffect(() => {
        if (!clientId || !activeMonth) return;
        setPlanPromotionsLoading(true);
        const promotionsQuery = query(collection(db, `clients/${clientId}/planPromotions`), where("month", "==", activeMonth));
        const unsubscribe = onSnapshot(promotionsQuery, (snapshot) => {
            const promotionsData = snapshot.docs.map(doc => ({ ...doc.data() as PlanPromotion, id: doc.id }));
            setPlanPromotions(promotionsData);
            setPlanPromotionsLoading(false);
        }, (error) => {
            console.error("Error fetching plan promotions:", error);
            setPlanPromotionsLoading(false);
        });

        return () => unsubscribe();
    }, [clientId, activeMonth]);


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
            status: 'To Do',
            priority: 9,
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
            // For brand new or non-migrated clients, show tasks with "Month 1" or no month at all
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

    const pageLoading = loading || tasksLoading || usersLoading || cashInLoading || paidPromotionsLoading || planPromotionsLoading;
    const activeMonthData = useMemo(() => monthlyTabs.find(m => m.name === activeMonth), [monthlyTabs, activeMonth]);

    const handleDownloadBundle = async () => {
        if (!client || !activeMonthData) {
            toast({ variant: 'destructive', title: 'Cannot Download', description: 'Client data is not fully loaded.' });
            return;
        }
        
        setIsDownloading(true);

        try {
            const zip = new JSZip();

            // 1. Generate PNGs from data
            if (filteredTasks.length > 0) {
                const dmBlob = await createReportImage(
                    'Digital Marketing Tasks',
                    ['Date', 'Title', 'Type', 'Status'],
                    filteredTasks.map(task => [
                        format(new Date(task.deadline), 'MMM dd, yyyy'),
                        task.title,
                        task.contentType || '-',
                        task.status
                    ])
                );
                if (dmBlob) zip.file('digital-marketing-tasks.png', dmBlob);
            }
    
            if (otherTasks.length > 0) {
                const otherBlob = await createReportImage(
                    'Other Works',
                    ['Date', 'Task', 'Status'],
                    otherTasks.map(task => [
                        format(new Date(task.deadline), 'MMM dd, yyyy'),
                        task.title,
                        task.status
                    ])
                );
                if (otherBlob) zip.file('other-tasks.png', otherBlob);
            }
            
            if (paidPromotions.length > 0) {
                const paidPromoBlob = await createReportImage(
                    'Paid Promotions',
                    ['Date', 'Campaign', 'Type', 'Budget', 'Status', 'Spent'],
                    paidPromotions.map(p => [
                        format(new Date(p.date), 'MMM dd, yyyy'),
                        p.campaign,
                        p.adType,
                        p.budget.toFixed(2),
                        p.status,
                        p.spent.toFixed(2),
                    ])
                );
                if (paidPromoBlob) zip.file('paid-promotions.png', paidPromoBlob);
            }

            const totalSpent = paidPromotions.reduce((acc, p) => acc + Number(p.spent || 0), 0);
            const gst = totalSpent * 0.18;
            const grandTotal = totalSpent + gst;
            const oldBalanceVal = client.paidPromotionsOldBalance || 0;
            const balance = (totalCashIn + oldBalanceVal) - grandTotal;
            const cashInBlob = await createReportImage(
                'Paid Ads - Budget',
                ['Date', 'Amount', 'Status'],
                cashInTransactions.map(t => [format(new Date(t.date), 'MMM dd, yyyy'), t.amount.toFixed(2), t.status]),
                [
                    { label: 'Total Spent', value: totalSpent.toFixed(2) },
                    { label: 'Old Balance', value: oldBalanceVal.toFixed(2) },
                    { label: 'GST 18%', value: gst.toFixed(2) },
                    { label: 'Grand Total', value: grandTotal.toFixed(2), isTotal: true },
                    { label: 'Total Cash In', value: totalCashIn.toFixed(2) },
                    { label: 'Balance', value: balance.toFixed(2), isTotal: true },
                ]
            );
            if (cashInBlob) zip.file('paid-ads-budget.png', cashInBlob);

            
            // 2. Generate PDF blob
            const pdfBlob = generateClientReportPDF({
                client,
                monthData: activeMonthData,
                dmTasks: filteredTasks,
                otherTasks: otherTasks,
                cashIn: cashInTransactions,
                paidPromotions: paidPromotions,
            });
            zip.file(`${client.name}_Report_${activeMonthData.name}.pdf`, pdfBlob);

            // 3. Generate and download zip
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            saveAs(zipBlob, `${client.name}_Report_${activeMonthData.name}.zip`);

        } catch (error) {
            console.error("Failed to generate report bundle:", error);
            toast({
                variant: 'destructive',
                title: 'Download Failed',
                description: 'There was an error creating the report bundle.',
            });
        } finally {
            setIsDownloading(false);
        }
    };


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
                        <div>
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
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="text-center text-muted-foreground py-16">
                                Client not found or you do not have permission to view them.
                            </CardContent>
                        </Card>
                    )}
                    <div>
                       {pageLoading ? <Skeleton className="h-96 w-full" /> : client && (
                        <PaidPromotionsTable 
                            client={client}
                            users={users as UserWithId[]}
                            promotions={paidPromotions}
                            loading={paidPromotionsLoading}
                            totalCashIn={totalCashIn}
                            onClientUpdate={handleClientUpdate}
                            activeMonth={activeMonth}
                            monthData={activeMonthData}
                        />
                    )}
                    </div>

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
                            promotions={planPromotions}
                            loading={planPromotionsLoading}
                            totalCashIn={totalCashIn}
                            onClientUpdate={handleClientUpdate}
                            activeMonth={activeMonth}
                            monthData={activeMonthData}
                        />
                    )}
                    
                     <div>
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
                    </div>

                    {pageLoading ? <Skeleton className="h-96 w-full" /> : client && activeMonthData && (
                       <ClientNotesTable 
                            notes={activeMonthData.notes || []}
                            onUpdate={handleNotesUpdate}
                       />
                    )}
                    <div>
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
            <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-14">
    <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
        onClick={handleDownloadBundle}
        disabled={pageLoading || isDownloading}
        aria-label="Download Report"
    >
        {isDownloading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
    </Button>
</div>
        </div>
    );
}
