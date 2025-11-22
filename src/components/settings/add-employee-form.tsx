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
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/hooks/use-tasks';


const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function AddEmployeeForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  // const { addEmployee } = useTasks(); // This will be used to add employee to the mock data

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
        // Here you would typically call a function to add the employee to your state management
        // For example: addEmployee({ ...data, role: 'employee', avatar: `https://picsum.photos/seed/${data.name}/200/200` });
        
        // Simulating an async operation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast({
            title: "Employee Added (Simulation)",
            description: `${data.name} has been added. This is a simulation and will not persist on refresh.`
        });
        form.reset();

    } catch (e: any) {
        setError(e.message || 'Failed to add employee.');
    } finally {
        setLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><UserPlus /> Add New Employee</CardTitle>
            <CardDescription>Create a new employee account. This is a simulation.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="e.g., jane.doe@officeflow.com" {...field} /></FormControl><FormMessage /></FormItem>
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
