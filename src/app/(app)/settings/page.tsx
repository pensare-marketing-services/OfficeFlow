'use client';
import { useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import AddEmployeeForm from '@/components/settings/add-employee-form';
import { getUsers } from '@/lib/data';
import type { User } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');

export default function SettingsPage() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<User[]>(getUsers().filter(u => u.role === 'employee'));

    const handleEmployeeAdded = (newUser: User) => {
        setEmployees(prev => [...prev, newUser]);
    }

    if (user?.role !== 'admin') {
        return (
             <div className="flex items-center justify-center h-[60vh]">
                <Alert variant="destructive" className="max-w-md">
                    <Lock className="h-4 w-4" />
                    <AlertTitle className="font-headline">Access Denied</AlertTitle>
                    <AlertDescription>
                        This page is only accessible to administrators.
                        <div className="mt-4">
                            <Button asChild>
                                <Link href="/dashboard">Go to Dashboard</Link>
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="font-headline text-2xl font-semibold tracking-tight">
                    Settings
                </h2>
                <p className="text-muted-foreground">
                    Manage your team and application settings.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users /> Manage Employees</CardTitle>
                            <CardDescription>View and manage the employees in your organization.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.map(employee => (
                                        <TableRow key={employee.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={employee.avatar} />
                                                        <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{employee.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{employee.email}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <AddEmployeeForm onEmployeeAdded={handleEmployeeAdded} />
                </div>
            </div>
        </div>
    );
}
