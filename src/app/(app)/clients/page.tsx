'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function ClientsPage() {
    return (
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-card">
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-secondary p-4">
                        <Briefcase className="h-8 w-8 text-muted-foreground" />
                    </div>
                </div>
                <h3 className="font-headline text-lg font-semibold">Select a Client</h3>
                <p className="text-muted-foreground">Please choose a client from the sidebar to view their details.</p>
            </div>
        </div>
    );
}
