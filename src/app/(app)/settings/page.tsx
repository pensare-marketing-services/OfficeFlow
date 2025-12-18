'use client';
import { useMemo, useState, useEffect } from 'react';
import { Users, Building, Trash2, Eye, EyeOff, Pen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import AddEmployeeForm from '@/components/settings/add-employee-form';
import AddClientForm from '@/components/settings/add-client-form';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUsers } from '@/hooks/use-users';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { Client, UserProfile } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';


const getInitials = (name: string = '') => name ? name.charAt(0).toUpperCase() : '';

type ClientWithId = Client & { id: string };
type UserWithId = UserProfile & { id: string };

const editClientSchema = z.object({
  name: z.string().min(2, 'Client name must be at least 2 characters.'),
  employeeId1: z.string().optional(),
  employeeId2: z.string().optional(),
  employeeId3: z.string().optional(),
});

type EditClientFormValues = z.infer<typeof editClientSchema>;

const EditClientDialog = ({ client, allUsers, onUpdate }: { client: ClientWithId, allUsers: UserWithId[], onUpdate: (data: Partial<Client>) => Promise<void> }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const employeeOptions = useMemo(() => {
        return allUsers.filter(u => u.role === 'employee');
    }, [allUsers]);

    const form = useForm<EditClientFormValues>({
        resolver: zodResolver(editClientSchema),
        defaultValues: {
            name: client.name,
            employeeId1: client.employeeIds?.[0] || 'unassigned',
            employeeId2: client.employeeIds?.[1] || 'unassigned',
            employeeId3: client.employeeIds?.[2] || 'unassigned',
        },
    });
    
    useEffect(() => {
        if(open) {
            form.reset({
                name: client.name,
                employeeId1: client.employeeIds?.[0] || 'unassigned',
                employeeId2: client.employeeIds?.[1] || 'unassigned',
                employeeId3: client.employeeIds?.[2] || 'unassigned',
            });
        }
    }, [client, open, form]);

    const watchEmployee1 = form.watch('employeeId1');
    const watchEmployee2 = form.watch('employeeId2');
    const watchEmployee3 = form.watch('employeeId3');

    const onSubmit = async (data: EditClientFormValues) => {
        setLoading(true);
        const employeeIds = [data.employeeId1, data.employeeId2, data.employeeId3]
            .filter(id => id && id !== 'unassigned') as string[];
        const uniqueEmployeeIds = [...new Set(employeeIds)];

        try {
            await onUpdate({ name: data.name, employeeIds: uniqueEmployeeIds });
            toast({ title: "Client Updated", description: "The client's details have been saved." });
            setOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Update Failed", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pen className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Client: {client.name}</DialogTitle>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                        <Select onValueChange={field.onChange} value={field.value || 'unassigned'}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an employee" />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="unassigned">None</SelectItem>
                                                {filteredOptions.map((employee) => (
                                                    <SelectItem key={employee.id} value={employee.id}>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6 text-xs">
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
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                             <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

const EditablePasswordCell = ({ userId, initialPassword }: { userId: string, initialPassword?: string }) => {
    const { updateUserPassword } = useUsers();
    const [password, setPassword] = useState(initialPassword || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        if (password !== initialPassword) {
            try {
                await updateUserPassword(userId, password);
                toast({ title: "Password Updated", description: "The user's password has been successfully updated." });
            } catch (error: any) {
                toast({ variant: "destructive", title: "Update Failed", description: error.message });
            }
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setPassword(initialPassword || '');
            setIsEditing(false);
        }
    };
    
    return (
        <div className="flex items-center gap-2">
            {isEditing ? (
                <Input
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="h-8"
                />
            ) : (
                 <span className="text-sm font-mono flex-grow">
                    {isPasswordVisible ? password : '••••••••'}
                </span>
            )}
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
                {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(!isEditing)}>
                <Pen className="h-4 w-4" />
            </Button>
        </div>
    )
}

const AssignedEmployeesCell = ({ employeeIds, allUsers }: { employeeIds?: string[], allUsers: UserWithId[] }) => {
    const assignedEmployees = useMemo(() => {
        if (!employeeIds) return [];
        return employeeIds.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as UserWithId[];
    }, [employeeIds, allUsers]);

    if (assignedEmployees.length === 0) {
        return <TableCell className="text-muted-foreground text-xs">-</TableCell>;
    }

    return (
        <TableCell className="text-xs">
            {assignedEmployees.map(e => e.username).join(', ')}
        </TableCell>
    );
};

export default function SettingsPage() {
    const { users, loading: usersLoading, error, deleteUser } = useUsers();
    const [clients, setClients] = useState<ClientWithId[]>([]);
    const [clientsLoading, setClientsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const clientsQuery = collection(db, "clients");
        const unsubscribe = onSnapshot(clientsQuery, (querySnapshot) => {
            const clientsData = querySnapshot.docs.map(doc => ({ ...doc.data() as Client, id: doc.id }));
            setClients(clientsData);
            setClientsLoading(false);
        }, (error) => {
            console.error("Error fetching clients: ", error);
            setClientsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const employees = useMemo(() => {
        if (!users) return [];
        return users.filter(u => u.role === 'employee');
    }, [users]);
    
    const handleUpdateClient = async (clientId: string, data: Partial<Client>) => {
        const clientRef = doc(db, 'clients', clientId);
        await updateDoc(clientRef, data);
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="font-headline text-2xl font-semibold tracking-tight">
                    Settings
                </h2>
                <p className="text-muted-foreground">
                    Manage your team, clients, and application settings.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users /> Manage Employees</CardTitle>
                            <CardDescription>View and manage the employees in your organization.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">#</TableHead>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Password</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usersLoading && Array.from({length: 3}).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                        </TableRow>
                                    ))}
                                    {error && <TableRow><TableCell colSpan={4} className="text-destructive">{error.message}</TableCell></TableRow>}
                                    {!usersLoading && employees.map((employee, index) => (
                                        <TableRow key={employee.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>{getInitials(employee.username)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{employee.username}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <EditablePasswordCell userId={employee.id} initialPassword={employee.password} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the account for <strong>{employee.username}</strong>.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => deleteUser(employee.id)}
                                                                className="bg-destructive hover:bg-destructive/90"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Building /> Manage Clients</CardTitle>
                            <CardDescription>View and edit all your clients in one place.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">#</TableHead>
                                        <TableHead>Client Name</TableHead>
                                        <TableHead>Assigned Employees</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(clientsLoading || usersLoading) && Array.from({length: 3}).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                        </TableRow>
                                    ))}
                                    {!clientsLoading && !usersLoading && clients.map((client, index) => (
                                        <TableRow key={client.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell className="font-medium">{client.name}</TableCell>
                                            <AssignedEmployeesCell employeeIds={client.employeeIds} allUsers={users} />
                                             <TableCell className="text-right">
                                                 <EditClientDialog 
                                                    client={client} 
                                                    allUsers={users}
                                                    onUpdate={(data) => handleUpdateClient(client.id, data)}
                                                 />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!clientsLoading && clients.length === 0 && (
                                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No clients added yet.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-8">
                    <AddEmployeeForm />
                    <AddClientForm />
                </div>
            </div>
        </div>
    );
}
