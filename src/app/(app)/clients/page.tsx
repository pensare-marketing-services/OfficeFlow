'use client';

import { useState, useEffect } from 'react';
import { allTasks, getUsers, clients } from '@/lib/data';
import type { Task, User, Client } from '@/lib/data';
import ClientSchedule from '@/components/dashboard/client-schedule';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ClientsPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    
    useEffect(() => {
        setTasks(allTasks);
        setUsers(getUsers());
    }, []);

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
        <div className="space-y-6">
            <ClientSchedule clients={clients} initialTasks={tasks} users={users.filter(u => u.role === 'employee')} />
        </div>
    );
}
