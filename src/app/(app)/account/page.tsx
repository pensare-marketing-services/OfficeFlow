'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { User } from "lucide-react";

export default function AccountPage() {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                    <CardDescription>Manage your account settings and profile information.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-card">
                        <div className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="rounded-full bg-secondary p-4">
                                    <User className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </div>
                            <h3 className="font-headline text-lg font-semibold">Account Functionality</h3>
                            <p className="text-muted-foreground">This page is under construction.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
