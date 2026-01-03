'use client';

import { useState, useMemo } from 'react';
import { StatsCard } from './stats-card';
import { ClipboardList, Users, CheckCircle2, AlertTriangle, PauseCircle } from 'lucide-react';
import RecentTasks from './recent-tasks';
import type { Task, UserProfile as User, Client } from '@/lib/data';
import EmployeeMasterView from './employee-master-view';
import { useTasks } from '@/hooks/use-tasks';

type UserWithId = User & { id: string };
type ClientWithId = Client & { id: string };

interface AdminDashboardProps {
  tasks: (Task & { id: string })[];
  users: UserWithId[];
  clients: ClientWithId[];
}

type TaskFilter = 'total' | 'completed' | 'overdue' | 'onHold';
type ViewMode = 'tasks' | 'employees';

export default function AdminDashboard({ tasks, users, clients }: AdminDashboardProps) {
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('total');
  const [viewMode, setViewMode] = useState<ViewMode>('employees');
  const { deleteTask, updateTask } = useTasks();

  const totalTasks = tasks.length;
  const totalEmployees = users.filter(u => u.role === 'employee').length;
  const completedTasks = tasks.filter(t => t.status === 'Approved' || t.status === 'Posted').length;
  const onHoldTasksCount = tasks.filter(t => t.status === 'Hold').length;
  
  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter(task => {
        const deadline = new Date(task.deadline);
        deadline.setHours(23, 59, 59, 999); // Consider deadline as end of day
        return deadline < now && !['For Approval', 'Approved', 'Posted', 'Completed'].includes(task.status);
    });
}, [tasks]);

  const overdueCount = overdueTasks.length;
  
  const filteredTasks = useMemo(() => {
    if (viewMode !== 'tasks') return [];
    let tasksToFilter = tasks;
     switch (taskFilter) {
      case 'completed':
        tasksToFilter = tasks.filter(t => t.status === 'Approved' || t.status === 'Posted');
        break;
      case 'overdue':
        tasksToFilter = overdueTasks;
        break;
      case 'onHold':
        tasksToFilter = tasks.filter(t => t.status === 'Hold');
        break;
      case 'total':
      default:
        tasksToFilter = tasks;
        break;
    }

    return tasksToFilter.sort((a,b) => {
        const priorityA = a.priority || 99;
        const priorityB = b.priority || 99;
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
    });

  }, [tasks, taskFilter, viewMode, overdueTasks]);
  
  const dmTasks = filteredTasks.filter(task => !['SEO', 'Website', 'Web Blogs', 'Other'].includes(task.contentType || ''));
  const seoTasks = filteredTasks.filter(task => task.contentType === 'SEO');
  const webTasks = filteredTasks.filter(task => task.contentType === 'Website' || task.contentType === 'Web Blogs');
  const otherTasks = filteredTasks.filter(task => task.contentType === 'Other');


  const filterTitles: Record<TaskFilter, string> = {
    total: "All Recent Tasks",
    completed: "Completed Tasks",
    overdue: "Overdue Tasks",
    onHold: "On Hold Tasks"
  };

  const handleTaskFilterClick = (filter: TaskFilter) => {
    setViewMode('tasks');
    setTaskFilter(filter);
  };

  const handleEmployeeViewClick = () => {
    setViewMode('employees');
  };

  return (
    
    <div className="space-y-4">
     <div className="w-3/4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">

        <StatsCard 
            title="Total Tasks" 
            value={totalTasks} 
            icon={ClipboardList} 
            onClick={() => handleTaskFilterClick('total')}
            isActive={viewMode === 'tasks' && taskFilter === 'total'}
        />
        <StatsCard 
            title="Employees" 
            value={totalEmployees} 
            icon={Users}
            onClick={handleEmployeeViewClick}
            isActive={viewMode === 'employees'} 
        />
        <StatsCard 
            title="Completed Tasks" 
            value={completedTasks} 
            icon={CheckCircle2} 
            variant="success"
            onClick={() => handleTaskFilterClick('completed')}
            isActive={viewMode === 'tasks' && taskFilter === 'completed'}
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
            <div className="flex-shrink-0 w-[310px]">
                <RecentTasks tasks={dmTasks} users={users} title="Tasks - Digital Marketing" onTaskDelete={deleteTask} />
            </div>
            <div className="flex-shrink-0 w-[310px]">
                <RecentTasks tasks={seoTasks} users={users} title="Tasks - SEO" onTaskDelete={deleteTask} />
            </div>
            <div className="flex-shrink-0 w-[310px]">
                <RecentTasks tasks={webTasks} users={users} title="Tasks - Website" onTaskDelete={deleteTask} />
            </div>
             <div className="flex-shrink-0 w-[310px]">
                <RecentTasks tasks={otherTasks} users={users} title="Tasks - Other" onTaskDelete={deleteTask} />
            </div>
        </div>
      )}

      {viewMode === 'employees' && 
        <div className="w-full overflow-x-auto">
            <EmployeeMasterView tasks={tasks} users={users} clients={clients} />
        </div>
      }

    </div>
  );
}
