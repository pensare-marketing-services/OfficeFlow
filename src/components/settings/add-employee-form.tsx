'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { User } from '@/lib/data';
import { addUser, getUsers } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface AddEmployeeFormProps {
    onEmployeeAdded: (newUser: User) => void;
}

export default function AddEmployeeForm({ onEmployeeAdded }: AddEmployeeFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  async function onSubmit(data: EmployeeFormValues) {
    setLoading(true);
    setError(null);
    try {
        const users = getUsers();
        if (users.find(u => u.email === data.email)) {
            setError('An employee with this email already exists.');
            setLoading(false);
            return;
        }

      // In a real app, this would be an API call.
      // We simulate a delay.
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: (users.length + 1).toString(),
        name: data.name,
        email: data.email,
        role: 'employee',
        avatar: `https://picsum.photos/seed/${Math.random()}/200/200`
      };
      
      addUser(newUser);
      onEmployeeAdded(newUser);

      toast({
          title: "Employee Added",
          description: `${newUser.name} has been added to the system.`
      });
      form.reset();

    } catch (e) {
      console.error(e);
      setError('Failed to add employee. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><UserPlus /> Add New Employee</CardTitle>
            <CardDescription>Enter the details for the new employee.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input placeholder="e.g., jane.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                        {loading ? 'Adding...' : 'Add Employee'}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    </Card>
  );
}
