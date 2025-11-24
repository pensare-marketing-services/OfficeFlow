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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/client';


const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  role: z.enum(['admin', 'employee']),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function AddEmployeeForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'employee',
    },
  });

  async function onSubmit(data: EmployeeFormValues) {
    setLoading(true);
    setError(null);
    try {
        // IMPORTANT: In a real production app, this should be a secure backend cloud function.
        // For development, we create the user on the client.
        // This will fail if you're not logged in as an authorized user with sufficient permissions.
        // We create the user with a temporary password, which they should change.
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, "password");
        const user = userCredential.user;

        const userProfile = {
            name: data.name,
            email: data.email,
            role: data.role,
            avatar: `https://picsum.photos/seed/${user.uid}/200/200`
        };

        // Create the user profile in Firestore
        // This will make the user data available to the app's auth context
        await setDoc(doc(db, "users", user.uid), userProfile);
        
        toast({
            title: "User Added",
            description: `${data.name} has been added as an ${data.role}. The default password is "password".`
        });
        form.reset();

    } catch (e: any) {
       // A more user-friendly error message
       if (e.code === 'auth/email-already-in-use') {
         setError('This email address is already in use by another account.');
       } else if (e.code === 'auth/requires-recent-login') {
         setError('This operation is sensitive and requires recent authentication. Please log out and log back in before creating a new user.');
       } else {
         setError(e.message || 'Failed to add user. You may not have permission to perform this action.');
       }
    } finally {
        setLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><UserPlus /> Add New User</CardTitle>
            <CardDescription>Create a new admin or employee account.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="e.g., jane@officeflow.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="role" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="employee">Employee</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
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
                        {loading ? 'Adding...' : 'Add User'}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    </Card>
  );
}
