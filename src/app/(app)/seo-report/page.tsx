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
            }
        });

        return () => unsubClient();
    }, [selectedClientId]);

    // Fetch Keywords & GMB (Removed Month Filtering)
    useEffect(() => {
        if (!selectedClientId) return;
        setDataLoading(true);

        const kwQuery = query(
            collection(db, `clients/${selectedClientId}/seoKeywords`)
        );

        const gmbQuery = query(
            collection(db, `clients/${selectedClientId}/gmbMetrics`)
        );

        const unsubKw = onSnapshot(kwQuery, (snap) => {
            const kwData = snap.docs.map(d => ({ ...d.data() as SeoKeyword, id: d.id }));
            // Perform sorting client-side
            const sortedKw = kwData.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeA - timeB;
            });
            setKeywords(sortedKw);
        });

        const unsubGmb = onSnapshot(gmbQuery, (snap) => {
            setGmbMetrics(snap.docs.map(d => ({ ...d.data() as GmbMetric, id: d.id })));
            setDataLoading(false);
        });

        return () => {
            unsubKw();
            unsubGmb();
        };
    }, [selectedClientId]);

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
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <SeoKeywordTable 
                                clientId={selectedClientId}
                                keywords={keywords}
                                loading={dataLoading}
                            />
                            
                            <GmbMetricsTable 
                                clientId={selectedClientId}
                                metrics={gmbMetrics}
                                loading={dataLoading}
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
