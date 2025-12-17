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
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { Client } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

const getInitials = (name: string = '') => name ? name.charAt(0).toUpperCase() : '';

type ClientWithId = Client & { id: string };

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

export default function SettingsPage() {
    const { users, loading: usersLoading, error, deleteUser } = useUsers();
    const [clients, setClients] = useState<ClientWithId[]>([]);
    const [clientsLoading, setClientsLoading] = useState(true);

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
                            <CardDescription>View all your clients in one place.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">#</TableHead>
                                        <TableHead>Client Name</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clientsLoading && <TableRow><TableCell colSpan={2}><Skeleton className="h-8 w-full" /></TableCell></TableRow>}
                                    {!clientsLoading && clients.map((client, index) => (
                                        <TableRow key={client.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell className="font-medium">{client.name}</TableCell>
                                        </TableRow>
                                    ))}
                                    {!clientsLoading && clients.length === 0 && (
                                        <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No clients added yet.</TableCell></TableRow>
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
