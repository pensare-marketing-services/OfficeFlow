'use client';
import { useState, useMemo } from 'react';
import { Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import AddEmployeeForm from '@/components/settings/add-employee-form';
import type { User as UserType } from '@/lib/data';
import { users as mockUsers } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase();

export default function SettingsPage() {
    const [users, setUsers] = useState<UserType[]>(mockUsers);
    const [loading, setLoading] = useState(false); // Can be used for simulated loading
    const [error, setError] = useState<string | null>(null);

    const employees = useMemo(() => {
        return users.filter(u => u.role === 'employee');
    }, [users]);

    const handleAddEmployee = (newEmployee: Omit<UserType, 'id' | 'role' | 'avatar'| 'email'>) => {
        setLoading(true);
        const email = `${newEmployee.name.toLowerCase().replace(/\s/g, '.')}@officeflow.com`;
        
        if (users.some(u => u.email === email)) {
            setError('An employee with this name already exists.');
            setLoading(false);
            return;
        }

        const employee: UserType = {
            id: email,
            email: email,
            ...newEmployee,
            role: 'employee',
            avatar: `https://picsum.photos/seed/${newEmployee.name}/200/200`
        };

        setUsers(currentUsers => [...currentUsers, employee]);
        setError(null);
        setLoading(false);
    };
    
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
                                    {loading && <TableRow><TableCell colSpan={2}>Loading...</TableCell></TableRow>}
                                    {error && <TableRow><TableCell colSpan={2} className="text-destructive">{error}</TableCell></TableRow>}
                                    {!loading && employees.map(employee => (
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
                    <AddEmployeeForm onAddEmployee={handleAddEmployee} />
                </div>
            </div>
        </div>
    );
}
