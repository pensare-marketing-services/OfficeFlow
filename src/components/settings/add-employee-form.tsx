'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { createUser } from '@/ai/flows/user-flow';
import { CreateUserInput, CreateUserInputSchema } from '@/ai/flows/user-flow-schema';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/data';

const departments: Exclude<UserProfile['department'], undefined>[] = ['digitalmarketing', 'contentwriter', 'designers', 'videoeditor', 'web', 'seo'];

export default function AddEmployeeForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserInputSchema),
    defaultValues: {
      role: 'employee',
      username: '',
      password: '',
      department: 'digitalmarketing',
    },
  });

  async function onSubmit(data: CreateUserInput) {
    setLoading(true);
    setError(null);
    try {
        const result = await createUser(data);
        
        toast({
            title: "User Created Successfully",
            description: `User account for ${data.username} has been created. They can now log in.`,
            duration: 7000,
        });
        form.reset();

    } catch (e: any) {
       setError(e.message || 'Failed to add user. Please try again.');
    } finally {
        setLoading(false);
    }
  }

  return (
    <Card>
        <CardHeader className="p-2">
            <CardTitle className="font-headline text-base flex items-center gap-1 pb-0"><UserPlus /> Add New User</CardTitle>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-2 p-3">
                     <FormField control={form.control} name="username" render={({ field }) => (
                        <FormItem className="grid grid-cols-3 items-center gap-2 space-y-0">
                            <FormLabel className="col-span-1">Username</FormLabel>
                            <FormControl className="col-span-2">
                                <Input className="h-8 text-[10px]" placeholder="e.g., janedoe" {...field} />
                            </FormControl>
                            <div className="col-span-3"><FormMessage /></div>
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem className="grid grid-cols-3 items-center gap-2 space-y-0">
                            <FormLabel className="col-span-1">Password</FormLabel>
                            <FormControl className="col-span-2">
                                <div className="relative">
                                    <Input className="h-8 text-[10px]" type={isPasswordVisible ? 'text' : 'password'} placeholder="Set a password" {...field} />
                                    <Button 
                                        type="button"
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground"
                                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                    >
                                        {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </FormControl>
                             <div className="col-span-3"><FormMessage /></div>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="role" render={({ field }) => (
                        <FormItem className="grid grid-cols-3 items-center gap-2 space-y-0">
                            <FormLabel className="col-span-1">Role</FormLabel>
                            <div className="col-span-2">
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="h-8 text-[10px]">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="employee">Employee</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="col-span-3"><FormMessage /></div>
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="department" render={({ field }) => (
                        <FormItem className="grid grid-cols-3 items-center gap-2 space-y-0">
                            <FormLabel className="col-span-1">Department</FormLabel>
                            <div className="col-span-2">
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="h-8 text-[10px]">
                                        <SelectValue placeholder="Select a department" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {departments.map(dep => dep && <SelectItem key={dep} value={dep} className="capitalize">{dep}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="col-span-3"><FormMessage /></div>
                        </FormItem>
                    )} />
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-2 p-3">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Button type="submit" disabled={loading} className="w-full" size="sm">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                        {loading ? 'Adding...' : 'Add User'}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    </Card>
  );
}
