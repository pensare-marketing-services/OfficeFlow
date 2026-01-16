

'use client';
import { useMemo, useState, useEffect } from 'react';
import { Users, Building, Trash2, Eye, EyeOff, Pen, Settings  } from "lucide-react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useClients } from '@/hooks/use-clients';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';


const getInitials = (name: string = '') => name ? name.charAt(0).toUpperCase() : '';

type ClientWithId = Client & { id: string };
type UserWithId = UserProfile & { id: string };

const categories = ["seo", "website", "digital marketing", "gd"] as const;

const editClientSchema = z.object({
  name: z.string().min(2, 'Client name must be at least 2 characters.'),
  employeeId1: z.string().optional(),
  employeeId2: z.string().optional(),
  employeeId3: z.string().optional(),
  categories: z.array(z.string()).optional(),
  active: z.boolean(),
  deactivationReason: z.string().optional(),
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
            categories: client.categories || [],
            active: client.active !== false,
            deactivationReason: client.deactivationReason || '',
        },
    });
    
    useEffect(() => {
        if(open) {
            form.reset({
                name: client.name,
                employeeId1: client.employeeIds?.[0] || 'unassigned',
                employeeId2: client.employeeIds?.[1] || 'unassigned',
                employeeId3: client.employeeIds?.[2] || 'unassigned',
                categories: client.categories || [],
                active: client.active !== false,
                deactivationReason: client.deactivationReason || '',
            });
        }
    }, [client, open, form]);

    const watchEmployee1 = form.watch('employeeId1');
    const watchEmployee2 = form.watch('employeeId2');
    const watchEmployee3 = form.watch('employeeId3');
    const watchActive = form.watch('active');

    const onSubmit = async (data: EditClientFormValues) => {
        setLoading(true);
        const employeeIds = [data.employeeId1, data.employeeId2, data.employeeId3]
            .filter(id => id && id !== 'unassigned') as string[];
        const uniqueEmployeeIds = [...new Set(employeeIds)];

        const updateData: Partial<Client> = {
            name: data.name, 
            employeeIds: uniqueEmployeeIds,
            categories: data.categories || [],
            active: data.active,
            deactivationReason: data.deactivationReason,
        };

        if (data.active) {
            updateData.deactivationReason = '';
        }

        try {
            await onUpdate(client.id, updateData);
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
                    {/* <Pen className="h-4 w-4" /> */}
                    <Settings className="h-4 w-4" />
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

                        <div className="space-y-2">
                            <FormLabel>Assign Employees</FormLabel>
                            <div className="flex items-start gap-2">
                                {[1, 2, 3].map((num) => {
                                    const fieldName = `employeeId${num}` as 'employeeId1' | 'employeeId2' | 'employeeId3';
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
                                                <Select onValueChange={field.onChange} value={field.value || 'unassigned'}>
                                                    <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Unassigned" />
                                                    </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                                        {filteredOptions.map((employee) => (
                                                            <SelectItem key={employee.id} value={employee.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="h-6 w-6 text-[10px]">
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
                                    );
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
                                        <FormLabel>Categories</FormLabel>
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
                                                <FormLabel className="font-normal text-sm capitalize">
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

                         <Separator />

                         <FormField
                            control={form.control}
                            name="active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-sm font-normal">{field.value ? 'Client is currently Active.' : 'Client is currently Inactive.'}</FormLabel>
                                     
                                    </div>
                                    <FormControl>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                {/* This div prevents the FormItem's label click from triggering the switch */}
                                                <div onClick={(e) => e.preventDefault()}>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </div>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        {field.value ? 'Deactivate Client?' : 'Activate Client?'}
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {field.value 
                                                            ? `Deactivating this client will hide them from the sidebar and master views. No data will be deleted.` 
                                                            : `Activating this client will make them visible in the sidebar and master views again.`
                                                        }
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={() => field.onChange(field.value)}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => field.onChange(!field.value)}>
                                                        Yes, {field.value ? 'Deactivate' : 'Activate'}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </FormControl>
                                </FormItem>
                            )}
                            />

                        {!watchActive && (
                            <FormField
                                control={form.control}
                                name="deactivationReason"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason for Deactivation</FormLabel>
                                    <FormControl>
                                    <Textarea
                                        placeholder="Explain why this client is being deactivated..."
                                        {...field}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        )}


                        <DialogFooter className="justify-between sm:justify-between pt-4">
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="destructive" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
                    className="h-7 text-[10px]"
                />
            ) : (
                 <span className="text-[10px] font-mono flex-grow">
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

const EditablePriorityCell = ({ userId, initialPriority }: { userId: string, initialPriority?: number }) => {
    const { updateUserPriority } = useUsers();
    const [priority, setPriority] = useState(initialPriority ?? 99);
    const { toast } = useToast();

    const handleSave = async () => {
        const newPriority = Number(priority);
        if (newPriority !== (initialPriority ?? 99)) {
            try {
                await updateUserPriority(userId, newPriority);
                toast({ title: "Priority Updated", description: "The user's priority has been saved." });
            } catch (error: any) {
                toast({ variant: "destructive", title: "Update Failed", description: error.message });
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        } else if (e.key === 'Escape') {
            setPriority(initialPriority ?? 99);
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <Input
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value) || 99)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-7 text-[10px] w-16 text-center"
        />
    );
};

const AssignedEmployeesCell = ({ employeeIds, allUsers }: { employeeIds?: string[], allUsers: UserWithId[] }) => {
    const assignedEmployees = useMemo(() => {
        if (!employeeIds) return [];
        return employeeIds.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as UserWithId[];
    }, [employeeIds, allUsers]);

    if (assignedEmployees.length === 0) {
        return <TableCell className="text-muted-foreground text-[10px] p-1">-</TableCell>;
    }

    return (
        <TableCell className="text-[10px] p-1">
            {assignedEmployees.map(e => e.username).join(', ')}
        </TableCell>
    );
};

const ClientTable = ({ clients, users, loading, onUpdate }: { clients: ClientWithId[], users: UserWithId[], loading: boolean, onUpdate: (clientId: string, data: Partial<Client>) => Promise<void> }) => {
    return (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="px-2 text-[10px] h-8">Client Name</TableHead>
                    <TableHead className="px-2 text-[10px] h-8">Assigned Employees</TableHead>
                    <TableHead className="text-right px-2 text-[10px] h-8">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && Array.from({length: 8}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={3} className="p-1"><Skeleton className="h-7 w-full" /></TableCell>
                    </TableRow>
                ))}
                {!loading && clients.map((client) => (
                    <TableRow key={client.id} className={cn(client.active === false && "bg-muted/30 opacity-50")}>
                        <TableCell className="font-medium text-[10px] py-1 px-2">{client.name}</TableCell>
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
    
    const sortedClients = useMemo(() => {
        return [...clients].sort((a,b) => {
            if (a.active !== b.active) {
                return (a.active === false ? 1 : -1) - (b.active === false ? 1 : -1);
            }
            return (a.priority || 0) - (b.priority || 0);
        });
    }, [clients]);

    const midPoint = Math.ceil(sortedClients.length / 2);
    const firstColumnClients = sortedClients.slice(0, midPoint);
    const secondColumnClients = sortedClients.slice(midPoint);
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
                                        <TableHead className="w-[10px] px-2 text-[10px] h-8">#</TableHead>
                                        <TableHead className="px-2 text-[10px] h-8">Username</TableHead>
                                        <TableHead className="px-2 text-[10px] h-8">Password</TableHead>
                                        <TableHead className="px-2 text-[10px] h-8 w-[10]">Priority</TableHead>
                                        <TableHead className="text-right px-2 text-[10px] h-8">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usersLoading && Array.from({length: 3}).map((_, i) => (
                                        <TableRow key={i}>
                                             <TableCell colSpan={5} className="p-1"><Skeleton className="h-7 w-full" /></TableCell>
                                        </TableRow>
                                    ))}
                                    {error && <TableRow><TableCell colSpan={5} className="text-destructive p-4">{error.message}</TableCell></TableRow>}
                                    {!usersLoading && users.filter(u => u.role === 'employee').map((employee, index) => (
                                        <TableRow key={employee.id}>
                                            <TableCell className="px-2 py-1 text-[10px]">{index + 1}</TableCell>
                                            <TableCell className="py-1 px-2">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-[10px]">{getInitials(employee.username)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-[10px]">{employee.username}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-1 px-2">
                                                <EditablePasswordCell userId={employee.id} initialPassword={employee.password} />
                                            </TableCell>
                                            <TableCell className="py-1 px-2">
                                                <EditablePriorityCell userId={employee.id} initialPriority={employee.priority} />
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

    

    

    

