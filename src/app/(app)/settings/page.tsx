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
import { collection, onSnapshot, doc, updateDoc, query, orderBy, writeBatch } from 'firebase/firestore';
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
import { useClients } from '@/hooks/use-clients';


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

const EditClientDialog = ({ client, allUsers, onUpdate }: { client: ClientWithId, allUsers: UserWithId[], onUpdate: (clientId: string, data: Partial<Client>) => Promise<void> }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { deleteClient } = useClients();
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
            await onUpdate(client.id, { name: data.name, employeeIds: uniqueEmployeeIds });
            toast({ title: "Client Updated", description: "The client's details have been saved." });
            setOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Update Failed", description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    const handleDelete = async () => {
        setLoading(true);
        try {
            await deleteClient(client.id);
            toast({ title: "Client Deleted", description: `${client.name} and all associated data have been permanently deleted.` });
            setOpen(false);
        } catch(error: any) {
             toast({ variant: 'destructive', title: "Deletion Failed", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
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
                        <DialogFooter className="justify-between sm:justify-between">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="destructive" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the client <strong>{client.name}</strong> and all of their associated data, including tasks, promotions, and notes.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                            Yes, delete client
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
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
        <div className="flex items-center gap-1">
            {isEditing ? (
                <Input
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="h-7 text-xs"
                />
            ) : (
                 <span className="text-xs font-mono flex-grow">
                    {isPasswordVisible ? password : '••••••••'}
                </span>
            )}
             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
                {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(!isEditing)}>
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
        return <TableCell className="text-muted-foreground text-xs p-1">-</TableCell>;
    }

    return (
        <TableCell className="text-xs p-1">
            {assignedEmployees.map(e => e.username).join(', ')}
        </TableCell>
    );
};

const ClientTable = ({ clients, users, loading, onUpdate }: { clients: ClientWithId[], users: UserWithId[], loading: boolean, onUpdate: (clientId: string, data: Partial<Client>) => Promise<void> }) => {
    return (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="px-2 text-xs h-8">Client Name</TableHead>
                    <TableHead className="px-2 text-xs h-8">Assigned Employees</TableHead>
                    <TableHead className="text-right px-2 text-xs h-8">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && Array.from({length: 8}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={3} className="p-1"><Skeleton className="h-7 w-full" /></TableCell>
                    </TableRow>
                ))}
                {!loading && clients.map((client) => (
                    <TableRow key={client.id}>
                        <TableCell className="font-medium text-xs py-1 px-2">{client.name}</TableCell>
                        <AssignedEmployeesCell employeeIds={client.employeeIds} allUsers={users} />
                         <TableCell className="text-right px-2 py-1">
                             <EditClientDialog 
                                client={client} 
                                allUsers={users}
                                onUpdate={onUpdate}
                             />
                        </TableCell>
                    </TableRow>
                ))}
                {!loading && clients.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground p-4">No clients in this column.</TableCell></TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default function SettingsPage() {
    const { users, loading: usersLoading, error, deleteUser } = useUsers();
    const { clients, loading: clientsLoading, updateClientPriority } = useClients();
    const { toast } = useToast();

    const handleUpdateClient = async (clientId: string, data: Partial<Client>) => {
        const clientRef = doc(db, 'clients', clientId);
        await updateDoc(clientRef, data);
    };

    const midPoint = Math.ceil(clients.length / 2);
    const firstColumnClients = clients.slice(0, midPoint);
    const secondColumnClients = clients.slice(midPoint);
    const pageLoading = clientsLoading || usersLoading;

    return (
        <div className="space-y-4">
             <Card>
                <CardHeader className="p-3">
                    <CardTitle className="flex items-center gap-2 text-base"><Building /> Manage Clients</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4">
                        <div>
                             <ClientTable 
                                clients={firstColumnClients}
                                users={users}
                                loading={pageLoading}
                                onUpdate={handleUpdateClient}
                            />
                        </div>
                         <div>
                             <ClientTable 
                                clients={secondColumnClients}
                                users={users}
                                loading={pageLoading}
                                onUpdate={handleUpdateClient}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                    <AddEmployeeForm />
                </div>
                <div className="lg:col-span-1">
                    <AddClientForm clientCount={clients.length}/>
                </div>
                <div className="lg:col-span-1">
                     <Card>
                        <CardHeader className="p-3">
                            <CardTitle className="flex items-center gap-2 text-base"><Users /> Manage Employees</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40px] px-2 text-xs h-8">#</TableHead>
                                        <TableHead className="px-2 text-xs h-8">Username</TableHead>
                                        <TableHead className="px-2 text-xs h-8">Password</TableHead>
                                        <TableHead className="text-right px-2 text-xs h-8">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usersLoading && Array.from({length: 3}).map((_, i) => (
                                        <TableRow key={i}>
                                             <TableCell colSpan={4} className="p-1"><Skeleton className="h-7 w-full" /></TableCell>
                                        </TableRow>
                                    ))}
                                    {error && <TableRow><TableCell colSpan={4} className="text-destructive p-4">{error.message}</TableCell></TableRow>}
                                    {!usersLoading && users.filter(u => u.role === 'employee').map((employee, index) => (
                                        <TableRow key={employee.id}>
                                            <TableCell className="px-2 py-1 text-xs">{index + 1}</TableCell>
                                            <TableCell className="py-1 px-2">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-xs">{getInitials(employee.username)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-xs">{employee.username}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-1 px-2">
                                                <EditablePasswordCell userId={employee.id} initialPassword={employee.password} />
                                            </TableCell>
                                            <TableCell className="text-right px-2 py-1">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7">
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
                                                                onClick={async () => {
                                                                    try {
                                                                        await deleteUser(employee.id);
                                                                        toast({title: "User deleted"});
                                                                    } catch (e: any) {
                                                                        console.error(e);
                                                                        toast({ variant: 'destructive', title: "Deletion Failed", description: e.message });
                                                                    }
                                                                }}
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
                </div>
            </div>
        </div>
    );
}
