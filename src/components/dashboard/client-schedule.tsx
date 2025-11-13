'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EditableCell from './editable-cell';
import { addDays, format, startOfToday } from 'date-fns';
import type { Client, Task, User } from '@/lib/data';
import { updateTask } from '@/lib/data';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ClientScheduleProps {
  clients: Client[];
  initialTasks: Task[];
  users: User[];
}

const getWeekDates = (startDate: Date) => {
  return Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
};

export default function ClientSchedule({ clients, initialTasks, users }: ClientScheduleProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [startDate, setStartDate] = useState(startOfToday());

  const dates = useMemo(() => getWeekDates(startDate), [startDate]);

  const handleUpdate = (clientId: string, date: Date, partialTask: Partial<Task>) => {
    const dateString = format(date, 'yyyy-MM-dd');
    let task = tasks.find(t => t.clientId === clientId && t.date === dateString);

    if (task) {
      // Update existing task
      task = { ...task, ...partialTask };
    } else {
      // Create new task
      task = {
        id: `TASK-${Date.now()}-${Math.random()}`,
        title: `Task for ${clients.find(c=>c.id === clientId)?.name} on ${format(date, 'MMM d')}`,
        description: `Work for ${clients.find(c=>c.id === clientId)?.name}`,
        status: 'To Do',
        priority: 'Medium',
        deadline: date.toISOString(),
        progressNotes: [],
        clientId,
        date: dateString,
        ...partialTask,
      } as Task;
    }
    
    updateTask(task); // Update the central data source
    setTasks(prev => {
        const existing = prev.find(t => t.id === task!.id);
        if (existing) {
            return prev.map(t => t.id === task!.id ? task! : t);
        }
        return [...prev, task!];
    });
  };

  const handleAssign = (clientId: string, date: Date, userId: string) => {
    handleUpdate(clientId, date, { assigneeId: userId });
  };

  const handleAddNote = (clientId: string, date: Date, note: string) => {
      const existingTask = tasks.find(t => t.clientId === clientId && t.date === format(date, 'yyyy-MM-dd'));
      if(existingTask) {
        const newNotes = [...existingTask.progressNotes, { note, date: new Date().toISOString() }];
        handleUpdate(clientId, date, { progressNotes: newNotes });
      }
  };
  
  const handlePrevWeek = () => setStartDate(prev => addDays(prev, -7));
  const handleNextWeek = () => setStartDate(prev => addDays(prev, 7));

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="font-headline">Client Schedule</CardTitle>
                <CardDescription>Assign daily tasks to employees for each client.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevWeek}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={handleNextWeek}><ChevronRight className="h-4 w-4" /></Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[180px] font-semibold">Clients</TableHead>
                {dates.map((date) => (
                    <TableHead key={date.toString()} className="text-center">
                        <div className="font-semibold">{format(date, 'EEE')}</div>
                        <div className="text-xs text-muted-foreground">{format(date, 'd MMM')}</div>
                    </TableHead>
                ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {clients.map((client) => (
                <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    {dates.map((date) => {
                        const dateString = format(date, 'yyyy-MM-dd');
                        const task = tasks.find(t => t.clientId === client.id && t.date === dateString);
                        return (
                            <TableCell key={date.toString()} className="p-0 h-12">
                            <EditableCell
                                task={task}
                                users={users}
                                onAssign={(userId) => handleAssign(client.id, date, userId)}
                                onAddNote={(note) => handleAddNote(client.id, date, note)}
                            />
                            </TableCell>
                        );
                    })}
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
