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
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function AddEmployeeForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = getAuth();


  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: EmployeeFormValues) {
    if (!firestore) {
      setError('Database is not connected');
      return;
    }

    setLoading(true);
    setError(null);
    
    const userDocRef = doc(firestore, 'users', data.email);
    const newUser = {
      id: data.email,
      name: data.name,
      email: data.email,
      role: 'employee',
      avatar: `https://picsum.photos/seed/${data.name}/200/200`
    };

    try {
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            setError('An employee with this email already exists.');
            setLoading(false);
            return;
        }
      
      // We create the auth user here so they can log in.
      // In a real app, you would likely send an invitation email.
      try {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
      } catch (authError: any) {
        // If the user already exists in Auth (but not Firestore), we can still proceed
        // to create their profile, but we should let the admin know.
        if (authError.code !== 'auth/email-already-in-use') {
          throw authError; // Re-throw other auth errors
        }
      }
      
      // After successfully creating the auth user (or if they existed), create the Firestore profile.
      setDoc(userDocRef, newUser).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'create',
            requestResourceData: newUser,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

      toast({
          title: "Employee Added",
          description: `${newUser.name} has been added to the system.`
      });
      form.reset();

    } catch (e: any) {
      setError(e.message || 'Failed to add employee. Please try again.');
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
                     <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem><FormLabel>Temporary Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
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
