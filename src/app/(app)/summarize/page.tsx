'use client';
import SummarizeProgressForm from "@/components/summarize/summarize-progress-form";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SummarizePage() {
    const { user } = useAuth();

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
        <div className="container mx-auto py-8">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8">
                    <h2 className="font-headline text-2xl font-semibold tracking-tight">
                        Summarize Project Progress
                    </h2>
                    <p className="text-muted-foreground">
                        Paste detailed project notes and let AI create a concise, client-friendly summary.
                    </p>
                </div>
                <SummarizeProgressForm />
            </div>
        </div>
    );
}
