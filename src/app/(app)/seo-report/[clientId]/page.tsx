'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useClients } from '@/hooks/use-clients';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart2, ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy, doc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { Client, SeoKeyword, MonthData } from '@/lib/data';
import SeoKeywordTable from '@/components/dashboard/seo-keyword-table';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function SeoReportClientPage() {
    const { user, loading: authLoading } = useAuth();
    const { clients } = useClients();
    const router = useRouter();
    const params = useParams();
    const clientId = params.clientId as string;

    const [client, setClient] = useState<Client | null>(null);
    const [keywords, setKeywords] = useState<(SeoKeyword & { id: string })[]>([]);
    const [keywordsLoading, setKeywordsLoading] = useState(true);
    const [activeMonth, setActiveMonth] = useState("");
    const [pageLoading, setPageLoading] = useState(true);

    // Security & Load check
    useEffect(() => {
        if (!authLoading && user) {
            const isAuthorized = user.role === 'admin' || user.department === 'seo' || user.department === 'web';
            if (!isAuthorized) {
                router.replace('/dashboard');
                return;
            }
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!clientId) return;

        const unsubscribe = onSnapshot(doc(db, 'clients', clientId), (docSnap) => {
            if (docSnap.exists()) {
                const clientData = { ...docSnap.data() as Client, id: docSnap.id };
                setClient(clientData);
                
                if (clientData.months && clientData.months.length > 0) {
                    const lastMonthName = clientData.months[clientData.months.length - 1].name;
                    setActiveMonth(prev => prev || lastMonthName);
                } else {
                    setActiveMonth("Month 1");
                }
            }
            setPageLoading(false);
        });

        return () => unsubscribe();
    }, [clientId]);

    useEffect(() => {
        if (!clientId || !activeMonth) return;
        setKeywordsLoading(true);

        const q = query(
            collection(db, `clients/${clientId}/seoKeywords`),
            where('month', '==', activeMonth),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data() as SeoKeyword, id: doc.id }));
            setKeywords(data);
            setKeywordsLoading(false);
        }, (err) => {
            console.error("Keywords load error:", err);
            setKeywordsLoading(false);
        });

        return () => unsubscribe();
    }, [clientId, activeMonth]);

    if (pageLoading || authLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Client not found.</p>
                <Button variant="link" onClick={() => router.back()}>Go back</Button>
            </div>
        );
    }

    const months = client.months || [{ name: "Month 1" }];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/seo-report')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <div className="flex items-center gap-2">
                        <BarChart2 className="h-5 w-5 text-primary" />
                        <h2 className="text-2xl font-bold tracking-tight font-headline">{client.name}</h2>
                    </div>
                    <p className="text-muted-foreground text-sm">Detailed SEO Keyword Ranking Analysis</p>
                </div>
            </div>

            <Card className="border-none shadow-none bg-muted/30">
                <CardContent className="p-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background rounded-md border shadow-sm shrink-0">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium">Reporting Month:</span>
                        </div>
                        <Tabs value={activeMonth} onValueChange={setActiveMonth} className="flex-grow">
                            <ScrollArea className="w-full">
                                <TabsList className="bg-transparent gap-1 h-8 p-0">
                                    {months.map(m => (
                                        <TabsTrigger 
                                            key={m.name} 
                                            value={m.name}
                                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-7 text-[10px] px-4"
                                        >
                                            {m.name}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6">
                <SeoKeywordTable 
                    clientId={clientId}
                    keywords={keywords}
                    loading={keywordsLoading}
                    activeMonth={activeMonth}
                />
            </div>
        </div>
    );
}
