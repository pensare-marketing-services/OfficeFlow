'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useClients } from '@/hooks/use-clients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BarChart2, TrendingUp, Calendar, Loader2, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, orderBy, doc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { Client, SeoKeyword, GmbMetric, MonthData } from '@/lib/data';
import SeoKeywordTable from '@/components/dashboard/seo-keyword-table';
import GmbMetricsTable from '@/components/dashboard/gmb-metrics-table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function SeoReportPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { clients, loading: clientsLoading } = useClients();
    const [search, setSearch] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    
    // Detailed Data State
    const [activeClient, setActiveClient] = useState<Client | null>(null);
    const [keywords, setKeywords] = useState<(SeoKeyword & { id: string })[]>([]);
    const [gmbMetrics, setGmbMetrics] = useState<(GmbMetric & { id: string })[]>([]);
    const [activeMonth, setActiveMonth] = useState("");
    const [dataLoading, setDataLoading] = useState(false);

    // Security check
    useEffect(() => {
        if (!authLoading && user) {
            const isAuthorized = user.role === 'admin' || user.department === 'seo' || user.department === 'web';
            if (!isAuthorized) {
                router.replace('/dashboard');
            }
        }
    }, [user, authLoading, router]);

    const filteredClients = useMemo(() => {
        return clients
            .filter(c => c.active !== false)
            .filter(c => 
                c.name.toLowerCase().includes(search.toLowerCase()) &&
                (c.categories?.includes('seo') || c.categories?.includes('website'))
            )
            .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
    }, [clients, search]);

    // Handle Client Selection & Data Sync
    useEffect(() => {
        if (!selectedClientId) {
            setActiveClient(null);
            setKeywords([]);
            setGmbMetrics([]);
            return;
        }

        const unsubClient = onSnapshot(doc(db, 'clients', selectedClientId), (snap) => {
            if (snap.exists()) {
                const cData = { ...snap.data() as Client, id: snap.id };
                setActiveClient(cData);
                if (cData.months && cData.months.length > 0) {
                    const lastMonth = cData.months[cData.months.length - 1].name;
                    setActiveMonth(prev => prev || lastMonth);
                } else {
                    setActiveMonth("Month 1");
                }
            }
        });

        return () => unsubClient();
    }, [selectedClientId]);

    // Fetch Keywords & GMB
    useEffect(() => {
        if (!selectedClientId || !activeMonth) return;
        setDataLoading(true);

        const kwQuery = query(
            collection(db, `clients/${selectedClientId}/seoKeywords`),
            where('month', '==', activeMonth),
            orderBy('createdAt', 'asc')
        );

        const gmbQuery = query(
            collection(db, `clients/${selectedClientId}/gmbMetrics`),
            where('month', '==', activeMonth)
        );

        const unsubKw = onSnapshot(kwQuery, (snap) => {
            setKeywords(snap.docs.map(d => ({ ...d.data() as SeoKeyword, id: d.id })));
        });

        const unsubGmb = onSnapshot(gmbQuery, (snap) => {
            setGmbMetrics(snap.docs.map(d => ({ ...d.data() as GmbMetric, id: d.id })));
            setDataLoading(false);
        });

        return () => {
            unsubKw();
            unsubGmb();
        };
    }, [selectedClientId, activeMonth]);

    if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden -m-4">
            {/* Left Sidebar - Client List (25%) */}
            <div className="w-1/4 border-r bg-card flex flex-col">
                <div className="p-4 border-b space-y-3">
                    <div className="flex items-center gap-2">
                        <BarChart2 className="h-5 w-5 text-primary" />
                        <h2 className="font-headline font-bold text-lg">SEO Reports</h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input 
                            placeholder="Search clients..." 
                            className="pl-8 h-8 text-xs"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {clientsLoading ? (
                            Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-10 w-full mb-1" />)
                        ) : filteredClients.map(client => (
                            <button
                                key={client.id}
                                onClick={() => setSelectedClientId(client.id)}
                                className={cn(
                                    "w-full text-left p-3 rounded-md transition-all group hover:bg-accent",
                                    selectedClientId === client.id ? "bg-accent shadow-sm border" : "transparent"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={cn("text-xs font-semibold", selectedClientId === client.id ? "text-primary" : "text-foreground")}>
                                        {client.name}
                                    </span>
                                    <TrendingUp className={cn("h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity", selectedClientId === client.id && "opacity-100 text-primary")} />
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {client.categories?.map(cat => (
                                        <Badge key={cat} variant="outline" className="text-[8px] px-1 py-0 capitalize opacity-70">
                                            {cat}
                                        </Badge>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Right Side - Dashboard Content (75%) */}
            <div className="flex-1 overflow-y-auto bg-muted/20">
                {selectedClientId && activeClient ? (
                    <div className="p-6 space-y-6 max-w-6xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold font-headline tracking-tight">{activeClient.name}</h1>
                                <p className="text-sm text-muted-foreground">SEO Ranking and Google My Business Overview</p>
                            </div>
                            
                            <Card className="shadow-none border bg-background/50">
                                <CardContent className="p-2 flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded border text-[10px] font-medium shrink-0">
                                        <Calendar className="h-3 w-3" />
                                        Month:
                                    </div>
                                    <Tabs value={activeMonth} onValueChange={setActiveMonth}>
                                        <ScrollArea className="w-full">
                                            <TabsList className="bg-transparent h-8 gap-1">
                                                {(activeClient.months || [{name: "Month 1"}]).map(m => (
                                                    <TabsTrigger 
                                                        key={m.name} 
                                                        value={m.name}
                                                        className="h-7 text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                                    >
                                                        {m.name}
                                                    </TabsTrigger>
                                                ))}
                                            </TabsList>
                                            <ScrollBar orientation="horizontal" />
                                        </ScrollArea>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <SeoKeywordTable 
                                clientId={selectedClientId}
                                keywords={keywords}
                                loading={dataLoading}
                                activeMonth={activeMonth}
                            />
                            
                            <GmbMetricsTable 
                                clientId={selectedClientId}
                                metrics={gmbMetrics}
                                loading={dataLoading}
                                activeMonth={activeMonth}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-10 text-center">
                        <div className="p-4 rounded-full bg-muted mb-4">
                            <BarChart2 className="h-12 w-12 opacity-20" />
                        </div>
                        <h3 className="text-lg font-headline font-semibold text-foreground">Select a Client</h3>
                        <p className="max-w-xs text-sm">Please choose a client from the left sidebar to view their SEO and keyword performance reports.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
