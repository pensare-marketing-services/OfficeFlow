'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Building } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useUsers } from '@/hooks/use-users';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';


const clientSchema = z.object({
  name: z.string().min(2, 'Client name must be at least 2 characters.'),
  employeeId1: z.string().optional(),
  employeeId2: z.string().optional(),
  employeeId3: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

const getInitials = (name: string = '') => name ? name.charAt(0).toUpperCase() : '';

export default function AddClientForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { users, loading: usersLoading } = useUsers();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      employeeId1: '',
      employeeId2: '',
      employeeId3: '',
    },
  });

  const employeeOptions = useMemo(() => {
    return users.filter(u => u.role === 'employee');
  }, [users]);
  
  const watchEmployee1 = form.watch('employeeId1');
  const watchEmployee2 = form.watch('employeeId2');
  const watchEmployee3 = form.watch('employeeId3');


  async function onSubmit(data: ClientFormValues) {
    setLoading(true);
    setError(null);

    const employeeIds = [data.employeeId1, data.employeeId2, data.employeeId3]
      .filter(id => id && id !== 'unassigned') as string[];
    const uniqueEmployeeIds = [...new Set(employeeIds)];

    try {
        await addDoc(collection(db, 'clients'), { 
            name: data.name,
            employeeIds: uniqueEmployeeIds
        });
        
        toast({
            title: "Client Added",
            description: `${data.name} has been added to your client list.`
        });
        form.reset();

    } catch (e: any) {
       setError(e.message || 'Failed to add client. Please try again.');
    } finally {
        setLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><Building /> Add New Client</CardTitle>
            <CardDescription>Add a new client and assign employees to them.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Client Name</FormLabel><FormControl><Input placeholder="e.g., Acme Inc." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    {[1, 2, 3].map((num) => {
                        const fieldName = `employeeId${num}` as const;
                        const watchedIds = [watchEmployee1, watchEmployee2, watchEmployee3];
                        const filteredOptions = employeeOptions.filter(
                            (emp) => !watchedIds.includes(emp.id) || watchedIds[num - 1] === emp.id
                        );

                        return (
                            <FormField
                                key={num}
                                control={form.control}
                                name={fieldName}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assign Employee {num}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={usersLoading}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={usersLoading ? "Loading..." : "Select an employee"} />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="unassigned">None</SelectItem>
                                            {filteredOptions.map((employee) => (
                                                <SelectItem key={employee.id} value={employee.id}>
                                                     <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarFallback>{getInitials(employee.username)}</AvatarFallback>
                                                        </Avatar>
                                                        <span>{employee.username}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        )
                    })}
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building className="mr-2 h-4 w-4" />}
                        {loading ? 'Adding...' : 'Add Client'}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    </Card>
  );
}
