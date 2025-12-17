'use client';
import { useMemo, useState, useEffect } from 'react';
import { Users, Building } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import AddEmployeeForm from '@/components/settings/add-employee-form';
import AddClientForm from '@/components/settings/add-client-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUsers } from '@/hooks/use-users';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { Client } from '@/lib/data';

const getInitials = (name: string = '') => name ? name.charAt(0).toUpperCase() : '';

type ClientWithId = Client & { id: string };

export default function SettingsPage() {
    const { users, loading: usersLoading, error } = useUsers();
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usersLoading && Array.from({length: 3}).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                        </TableRow>
                                    ))}
                                    {error && <TableRow><TableCell colSpan={2} className="text-destructive">{error.message}</TableCell></TableRow>}
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
