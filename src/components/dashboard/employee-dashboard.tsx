'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Task, UserProfile as User, Client } from '@/lib/data';
import { StatsCard } from './stats-card';
import { ClipboardList, CheckCircle2, Hourglass, AlertTriangle, PauseCircle } from 'lucide-react';
import ContentSchedule from './content-schedule';
import { useTasks } from '@/hooks/use-tasks';
import { useUsers } from '@/hooks/use-users';

type UserWithId = User & { id: string };
type ClientWithId = Client & { id: string };

interface EmployeeDashboardProps {
  employeeTasks: (Task & {id: string})[];
  users: UserWithId[];
  clients: ClientWithId[];
  onTaskUpdate: (taskId: string, updatedData: Partial<Task>) => void;
}


type TaskFilter = 'all' | 'inProgress' | 'completed' | 'overdue' | 'onHold';

export default function EmployeeDashboard({ employeeTasks, onTaskUpdate, clients }: EmployeeDashboardProps) {
  const { user } = useAuth();
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const { users } = useUsers();


  if (!user) return null;

  const completedStatuses: Task['status'][] = ['Posted', 'Approved', 'Completed'];
  
  const overdueTasks = useMemo(() => {
    const now = new Date();
    return employeeTasks.filter(task => {
        const deadline = new Date(task.deadline);
        deadline.setHours(23, 59, 59, 999); // Consider deadline as end of day
        return deadline < now && !['For Approval', 'Approved', 'Posted', 'Completed'].includes(task.status);
    });
}, [employeeTasks]);

  const allNonCompletedTasks = useMemo(() => {
    return employeeTasks.filter(t => !completedStatuses.includes(t.status));
  }, [employeeTasks]);
  
  const overdueCount = overdueTasks.length;
  
  const allTasksCount = allNonCompletedTasks.length;
  const completedTasksCount = employeeTasks.filter(t => completedStatuses.includes(t.status)).length;
  const onHoldTasksCount = employeeTasks.filter(t => t.status === 'Hold').length;
  const inProgressTasksCount = employeeTasks.filter(t => t.status === 'On Work').length;
  
  const filteredTasks = useMemo(() => {
    const getSortedTasks = (tasksToSort: (Task & {id: string})[]) => {
        return tasksToSort.sort((a, b) => {
            // Sort by deadline: latest date first (descending)
            const dateA = new Date(a.deadline).getTime();
            const dateB = new Date(b.deadline).getTime();
            
            if (dateA !== dateB) {
                return dateB - dateA;
            }

            // Fallback to priority if deadlines are the same
            const priorityA = a.priority || 99;
            const priorityB = b.priority || 99;
            return priorityA - priorityB;
        });
    }

    switch (taskFilter) {
      case 'inProgress':
        return getSortedTasks(employeeTasks.filter(t => t.status === 'On Work'));
      case 'completed':
        return getSortedTasks(employeeTasks.filter(t => completedStatuses.includes(t.status)));
      case 'overdue':
        return getSortedTasks(overdueTasks);
      case 'onHold':
        return getSortedTasks(employeeTasks.filter(t => t.status === 'Hold'));
      case 'all':
      default:
        return getSortedTasks(allNonCompletedTasks);
    }
  }, [employeeTasks, taskFilter, overdueTasks, allNonCompletedTasks]);

  const filterTitles: Record<TaskFilter, string> = {
    all: "All My Tasks",
    inProgress: "My In Progress Tasks",
    completed: "My Approved Tasks",
    overdue: "My Overdue Tasks",
    onHold: "My On Hold Tasks",
  };

  const handleTaskUpdate = (updatedTask: Partial<Task> & { id: string }) => {
    onTaskUpdate(updatedTask.id, updatedTask);
  };
  

  return (
    <div className="space-y-4">
      <div className="w-3/4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard 
            title="All Tasks" 
            value={allTasksCount} 
            icon={ClipboardList} 
            onClick={() => setTaskFilter('all')}
            isActive={taskFilter === 'all'}
        />
        <StatsCard 
            title="On Work" 
            value={inProgressTasksCount} 
            icon={Hourglass} 
            variant="warning"
            onClick={() => setTaskFilter('inProgress')}
            isActive={taskFilter === 'inProgress'}
        />
        <StatsCard 
            title="Approved" 
            value={completedTasksCount} 
            icon={CheckCircle2} 
            variant="success"
            onClick={() => setTaskFilter('completed')}
            isActive={taskFilter === 'completed'}
        />
         <StatsCard
            title="Overdue"
            value={overdueCount}
            icon={AlertTriangle}
            variant="destructive"
            onClick={() => setTaskFilter('overdue')}
            isActive={taskFilter === 'overdue'}
        />
         <StatsCard
            title="On Hold"
            value={onHoldTasksCount}
            icon={PauseCircle}
            onClick={() => setTaskFilter('onHold')}
            isActive={taskFilter === 'onHold'}
        />
      </div>

      <div className="space-y-2">
         <h2 className="text-xl font-semibold tracking-tight font-headline">{filterTitles[taskFilter]}</h2>
         <ContentSchedule
            tasks={filteredTasks}
            users={users}
            onTaskUpdate={handleTaskUpdate}
            showClient={true}
            clients={clients}
        />
      </div>
    </div>
  );
}
