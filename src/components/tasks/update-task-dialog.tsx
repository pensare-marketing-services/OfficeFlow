'use client';

import { useState } from 'react';
import * as z from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Task, User } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { format, formatDistanceToNow } from 'date-fns';
import { CalendarIcon, Flag, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { getUsers } from '@/lib/data';

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');

const formSchema = z.object({
  status: z.enum(['To Do', 'In Progress', 'Done', 'Overdue']),
  newNote: z.string().optional(),
  // Admin-only fields
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  assigneeId: z.string(),
  priority: z.enum(['Low', 'Medium', 'High']),
  deadline: z.date(),
});


interface UpdateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onTaskUpdate: (task: Task) => void;
  assignee?: User;
}

export function UpdateTaskDialog({ open, onOpenChange, task, onTaskUpdate, assignee }: UpdateTaskDialogProps) {
  const { user } = useAuth();
  const users = getUsers();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...task,
      deadline: new Date(task.deadline),
      newNote: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const updatedTask: Task = {
      ...task,
      title: values.title,
      description: values.description,
      status: values.status,
      priority: values.priority,
      deadline: values.deadline.toISOString(),
      assigneeId: values.assigneeId,
      progressNotes: values.newNote
        ? [...task.progressNotes, { note: values.newNote, date: new Date().toISOString() }]
        : task.progressNotes,
    };
    onTaskUpdate(updatedTask);
    form.reset({ ...updatedTask, deadline: new Date(updatedTask.deadline), newNote: '' });
    onOpenChange(false);
  }

  const isEmployee = user?.role === 'employee';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              {isEmployee ? (
                <DialogTitle className="font-headline">{task.title}</DialogTitle>
              ) : (
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} className="text-lg font-headline font-semibold tracking-tight border-0 shadow-none px-0 focus-visible:ring-0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
               <DialogDescription>{task.id}</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                <div className="md:col-span-2 space-y-4">
                    <div>
                        <Label className="text-sm font-semibold">Description</Label>
                         {isEmployee ? (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                         ) : (
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormControl><Textarea {...field} className="mt-1" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                         )}
                    </div>
                    <Separator/>
                     <div>
                        <h4 className="text-sm font-semibold mb-2">Progress Notes</h4>
                        <ScrollArea className="h-40 w-full rounded-md border p-4">
                            {task.progressNotes.length > 0 ? (
                                <div className="space-y-4">
                                    {task.progressNotes.map((note, index) => (
                                        <div key={index} className="text-sm">
                                            <p className="text-foreground">{note.note}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{format(new Date(note.date), "PPP p")}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No progress notes yet.</p>
                            )}
                        </ScrollArea>
                    </div>

                     <FormField
                        control={form.control}
                        name="newNote"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Add a new note</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Type your progress update here..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEmployee && task.status === 'Done'}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="To Do">To Do</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Done">Done</SelectItem>
                                <SelectItem value="Overdue">Overdue</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="assigneeId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Assignee</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEmployee}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an employee" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {users.filter(u => u.role === 'employee').map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEmployee}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel className="mb-1">Deadline</FormLabel>
                             <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={'outline'}
                                    className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                                    disabled={isEmployee}
                                    >
                                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date() && !isEmployee}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
