'use client';

import React, { useMemo } from 'react';
import { useClients } from '@/hooks/use-clients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BarChart2, ArrowRight, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function SeoReportIndexPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { clients, loading: clientsLoading } = useClients();
    const [search, setSearch] = React.useState('');

    // Security check: only admins, seo, or web department can view this page
    React.useEffect(() => {
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

    if (authLoading || (user && user.role !== 'admin' && user.department !== 'seo' && user.department !== 'web')) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Skeleton className="h-12 w-12 rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight font-headline">SEO / Keyword Reports</h2>
                    <p className="text-muted-foreground text-sm">Select a client to view their keyword ranking performance.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search clients..." 
                        className="pl-9 h-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {clientsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredClients.map(client => (
                        <Link key={client.id} href={`/seo-report/${client.id}`} className="group">
                            <Card className="hover:shadow-md transition-all group-hover:border-primary/50 border h-full">
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                                            <TrendingUp className="h-5 w-5 text-primary" />
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-1" />
                                    </div>
                                    <CardTitle className="text-base mt-2 group-hover:text-primary transition-colors">{client.name}</CardTitle>
                                    <CardDescription className="text-[10px] line-clamp-1">{client.address || 'No address provided'}</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {client.categories?.map(cat => (
                                            <Badge key={cat} variant="secondary" className="text-[8px] px-1 py-0 capitalize">
                                                {cat}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                    {filteredClients.length === 0 && (
                        <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            <BarChart2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No SEO/Website clients found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
