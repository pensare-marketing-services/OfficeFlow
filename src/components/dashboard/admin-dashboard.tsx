
'use client';

import { useState, useMemo } from 'react';
import { StatsCard } from './stats-card';
import { ClipboardList, Users, CheckCircle2, AlertTriangle, PauseCircle, ClipboardCheck, ListTodo, ArrowLeft } from 'lucide-react';
import RecentTasks from './recent-tasks';
import type { Task, UserProfile as User, Client } from '@/lib/data';
import EmployeeMasterView from './employee-master-view';
import { useTasks } from '@/hooks/use-tasks';
import SeoWebEmployeeMasterView from './seo-web-employee-master-view';
import { startOfDay, isSameDay } from 'date-fns';
import EmployeeDashboard from './employee-dashboard';
import { Button } from '../ui/button';

type UserWithId = User & { id: string };
type ClientWithId = Client & { id: string };

interface AdminDashboardProps {
  tasks: (Task & { id: string })[];
  users: UserWithId[];
  clients: ClientWithId[];
}

type TaskFilter = 'total' | 'approved' | 'posted' | 'overdue' | 'onHold' | 'toDo';
type ViewMode = 'tasks' | 'employees' | 'employees-seo-web';

export default function AdminDashboard({ tasks, users, clients }: AdminDashboardProps) {
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('total');
  const [viewMode, setViewMode] = useState<ViewMode>('employees');
  const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(null);
  const { deleteTask, updateTask } = useTasks();

  const activeTasks = useMemo(() => tasks.filter(t => t.status !== 'To Do'), [tasks]);
  const toDoTasks = useMemo(() => tasks.filter(t => t.status === 'To Do'), [tasks]);

  const tasksForToday = useMemo(() => {
    const today = startOfDay(new Date());
    // Incomplete statuses that should be rolled over to today if their deadline has passed
    const incompleteStatuses: Task['status'][] = ['Scheduled', 'On Work', 'For Approval', 'Hold', 'Ready for Next'];
    
    return activeTasks.filter(task => {
        if (!task.deadline) return false;
        const deadline = startOfDay(new Date(task.deadline));
        
        // A task belongs to today if its deadline is today, OR if its deadline was in the past but it's still incomplete.
        return isSameDay(deadline, today) || (deadline < today && incompleteStatuses.includes(task.status));
    });
  }, [activeTasks]);
  
  const dmTasksTodayCount = useMemo(() => {
    const nonDmContentTypes: (Task['contentType'])[] = ['SEO', 'Website', 'Web Blogs', 'Other'];
    return tasksForToday.filter(task => !nonDmContentTypes.includes(task.contentType!)).length;
  }, [tasksForToday]);

  const seoWebTasksTodayCount = useMemo(() => {
    const seoWebContentTypes: (Task['contentType'])[] = ['SEO', 'Website', 'Web Blogs'];
     return tasksForToday.filter(task => seoWebContentTypes.includes(task.contentType!)).length;
  }, [tasksForToday]);

  const totalTasks = activeTasks.length;
  const toDoTasksCount = toDoTasks.length;
  const approvedTasksCount = activeTasks.filter(t => t.status === 'Approved').length;
  const postedTasksCount = activeTasks.filter(t => t.status === 'Posted').length;
  const onHoldTasksCount = activeTasks.filter(t => t.status === 'Hold').length;
  
  const overdueTasks = useMemo(() => {
    const now = new Date();
    return activeTasks.filter(task => {
        if (task.description === 'Paid Promotion' || task.description === 'Plan Promotion') {
            return false;
        }
        const deadline = new Date(task.deadline);
        deadline.setHours(23, 59, 59, 999); // Consider deadline as end of day
        return deadline < now && !['For Approval', 'Approved', 'Posted', 'Completed'].includes(task.status);
    });
}, [activeTasks]);

  const overdueCount = overdueTasks.length;
  
  const filteredTasks = useMemo(() => {
    if (viewMode !== 'tasks') return [];
    let tasksToFilter: (Task & {id: string})[] = [];
     switch (taskFilter) {
      case 'approved':
        tasksToFilter = activeTasks.filter(t => t.status === 'Approved');
        break;
      case 'posted':
        tasksToFilter = activeTasks.filter(t => t.status === 'Posted');
        break;
      case 'overdue':
        tasksToFilter = overdueTasks;
        break;
      case 'onHold':
        tasksToFilter = activeTasks.filter(t => t.status === 'Hold');
        break;
      case 'toDo':
        tasksToFilter = toDoTasks;
        break;
      case 'total':
      default:
        tasksToFilter = activeTasks;
        break;
    }
    // Sorting will be handled by the RecentTasks component
    return tasksToFilter;
  }, [activeTasks, toDoTasks, taskFilter, viewMode, overdueTasks]);
  
  const dmTasks = filteredTasks.filter(task => !['SEO', 'Website', 'Web Blogs', 'Other'].includes(task.contentType || ''));
  const seoTasks = filteredTasks.filter(task => task.contentType === 'SEO');
  const webTasks = filteredTasks.filter(task => task.contentType === 'Website' || task.contentType === 'Web Blogs');
  const otherTasks = filteredTasks.filter(task => task.contentType === 'Other');


  const filterTitles: Record<TaskFilter, string> = {
    total: "All Recent Tasks",
    approved: "Approved Tasks",
    posted: "Posted Tasks",
    overdue: "Overdue Tasks",
    onHold: "On Hold Tasks",
    toDo: "To Do Tasks"
  };

  const handleTaskFilterClick = (filter: TaskFilter) => {
    setViewingEmployeeId(null);
    setViewMode('tasks');
    setTaskFilter(filter);
  };

  const handleEmployeeViewClick = () => {
    setViewingEmployeeId(null);
    setViewMode('employees');
  };

  const handleSeoWebViewClick = () => {
    setViewingEmployeeId(null);
    setViewMode('employees-seo-web');
  };

  const viewingEmployee = useMemo(() => {
    if (!viewingEmployeeId) return null;
    return users.find(u => u.id === viewingEmployeeId);
  }, [viewingEmployeeId, users]);

  const employeeTasksForViewing = useMemo(() => {
    if (!viewingEmployeeId) return [];
    return tasks.filter(task => (task.assigneeIds || []).includes(viewingEmployeeId));
  }, [tasks, viewingEmployeeId]);
  

  if (viewingEmployee) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 border-b pb-2">
           <Button variant="outline" onClick={() => setViewingEmployeeId(null)}>
             <ArrowLeft className="mr-2 h-4 w-4" />
             Back
           </Button>
           <h2 className="text-xl font-semibold tracking-tight">
             Dashboard of: <span className="font-bold text-primary">{viewingEmployee.username || viewingEmployee.nickname}</span>
           </h2>
        </div>
        <EmployeeDashboard 
          employeeTasks={employeeTasksForViewing}
          users={users}
          clients={clients}
          onTaskUpdate={updateTask}
          viewedUser={viewingEmployee}
        />
      </div>
    );
  }

  return (
    
    <div className="space-y-4">
     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
        <StatsCard 
            title="Digital Marketing" 
            value={dmTasksTodayCount} 
            icon={Users}
            onClick={handleEmployeeViewClick}
            isActive={viewMode === 'employees'} 
        />
        <StatsCard 
            title="Web - Seo" 
            value={seoWebTasksTodayCount} 
            icon={Users}
            onClick={handleSeoWebViewClick}
            isActive={viewMode === 'employees-seo-web'} 
        />
        <StatsCard 
            title="To Do" 
            value={toDoTasksCount} 
            icon={ListTodo} 
            onClick={() => handleTaskFilterClick('toDo')}
            isActive={viewMode === 'tasks' && taskFilter === 'toDo'}
        />
        <StatsCard 
            title="Total Tasks" 
            value={totalTasks} 
            icon={ClipboardList} 
            onClick={() => handleTaskFilterClick('total')}
            isActive={viewMode === 'tasks' && taskFilter === 'total'}
        />
        <StatsCard 
            title="Approved Tasks" 
            value={approvedTasksCount} 
            icon={CheckCircle2} 
            variant="success"
            onClick={() => handleTaskFilterClick('approved')}
            isActive={viewMode === 'tasks' && taskFilter === 'approved'}
        />
        <StatsCard 
            title="Posted Tasks" 
            value={postedTasksCount} 
            icon={ClipboardCheck} 
            variant="default"
            onClick={() => handleTaskFilterClick('posted')}
            isActive={viewMode === 'tasks' && taskFilter === 'posted'}
        />
        <StatsCard
            title="Overdue"
            value={overdueCount}
            icon={AlertTriangle}
            variant="destructive"
            onClick={() => handleTaskFilterClick('overdue')}
            isActive={viewMode === 'tasks' && taskFilter === 'overdue'}
        />
        <StatsCard
            title="On Hold"
            value={onHoldTasksCount}
            icon={PauseCircle}
            onClick={() => handleTaskFilterClick('onHold')}
            isActive={viewMode === 'tasks' && taskFilter === 'onHold'}
        />
      </div>
      
      {viewMode === 'tasks' && (
        <div className="flex w-full space-x-2 overflow-x-auto p-1">
            <div className="flex-shrink-0 w-[380px]">
                <RecentTasks tasks={dmTasks} users={users} title="Tasks - Digital Marketing" onTaskDelete={deleteTask} />
            </div>
            <div className="flex-shrink-0 w-[380px]">
                <RecentTasks tasks={seoTasks} users={users} title="Tasks - SEO" onTaskDelete={deleteTask} />
            </div>
            <div className="flex-shrink-0 w-[380px]">
                <RecentTasks tasks={webTasks} users={users} title="Tasks - Website" onTaskDelete={deleteTask} />
            </div>
             <div className="flex-shrink-0 w-[380px]">
                <RecentTasks tasks={otherTasks} users={users} title="Tasks - Other" onTaskDelete={deleteTask} />
            </div>
        </div>
      )}

      {viewMode === 'employees' && 
        <div className="w-full overflow-x-auto">
            <EmployeeMasterView tasks={tasks} users={users} clients={clients} onViewEmployee={setViewingEmployeeId} />
        </div>
      }

      {viewMode === 'employees-seo-web' && 
        <div className="w-full overflow-x-auto">
            <SeoWebEmployeeMasterView tasks={tasks} users={users} clients={clients} onViewEmployee={setViewingEmployeeId} />
        </div>
      }

    </div>
  );
}
