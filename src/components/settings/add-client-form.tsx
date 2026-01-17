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
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';

const categories = ["seo", "website", "digital marketing", "gd"] as const;

const clientSchema = z.object({
  name: z.string().min(2, 'Client name must be at least 2 characters.'),
  employeeId1: z.string().optional(),
  employeeId2: z.string().optional(),
  employeeId3: z.string().optional(),
  categories: z.array(z.string()).optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

const getInitials = (name: string = '') => name ? name.charAt(0).toUpperCase() : '';

export default function AddClientForm({ clientCount }: { clientCount: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { users, loading: usersLoading } = useUsers();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      employeeId1: 'unassigned',
      employeeId2: 'unassigned',
      employeeId3: 'unassigned',
      categories: [],
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
            employeeIds: uniqueEmployeeIds,
            priority: clientCount + 1,
            categories: data.categories || []
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
    <Card>
        <CardHeader className="p-3">
            <CardTitle className="font-headline text-base flex items-center gap-2"><Building /> Add New Client</CardTitle>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-3 p-3">
                    <FormField control={form.control} name="name" render={({ field }) => (
                         <FormItem className="grid grid-cols-3 items-center gap-2 space-y-0">
                            <FormLabel className="col-span-1 text-[10px]">Client Name</FormLabel>
                            <FormControl className="col-span-2">
                                <Input placeholder="e.g., Acme Inc." {...field} className="h-8 text-[10px]" />
                            </FormControl>
                            <div className="col-span-3 col-start-2"><FormMessage /></div>
                        </FormItem>
                    )} />

                    <div className="space-y-1">
                        <FormLabel className="text-[10px]">Assign Employees</FormLabel>
                        <div className="flex gap-2">
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
                                        <FormItem className="flex-1">
                                            <Select onValueChange={field.onChange} value={field.value || 'unassigned'} disabled={usersLoading}>
                                                <FormControl>
                                                <SelectTrigger className="h-8 text-[10px]">
                                                    <SelectValue placeholder="Unassigned" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                                    {filteredOptions.map((employee) => (
                                                        <SelectItem key={employee.id} value={employee.id}>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6 text-[10px]">
                                                                    <AvatarFallback>{getInitials(employee.nickname || employee.username)}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-[10px]">{employee.nickname || employee.username}</span>
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
                        </div>
                    </div>
                     <Separator />
                     <FormField
                        control={form.control}
                        name="categories"
                        render={() => (
                            <FormItem>
                                <div className="mb-2">
                                    <FormLabel className="text-[10px]">Categories</FormLabel>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                {categories.map((item) => (
                                    <FormField
                                    key={item}
                                    control={form.control}
                                    name="categories"
                                    render={({ field }) => {
                                        return (
                                        <FormItem
                                            key={item}
                                            className="flex flex-row items-start space-x-2 space-y-0"
                                        >
                                            <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(item)}
                                                onCheckedChange={(checked) => {
                                                return checked
                                                    ? field.onChange([...(field.value || []), item])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                        (value) => value !== item
                                                        )
                                                    )
                                                }}
                                            />
                                            </FormControl>
                                            <FormLabel className="font-normal text-[10px] capitalize">
                                            {item}
                                            </FormLabel>
                                        </FormItem>
                                        )
                                    }}
                                    />
                                ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                        />


                </CardContent>
                <CardFooter className="flex-col items-stretch gap-2 p-3">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Button type="submit" disabled={loading} className="w-full" size="sm">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building className="mr-2 h-4 w-4" />}
                        {loading ? 'Adding...' : 'Add Client'}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    </Card>
  );
}
