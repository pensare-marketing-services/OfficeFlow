'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { SeoKeyword } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { cn, capitalizeSentences } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface SeoKeywordTableProps {
    clientId: string;
    keywords: (SeoKeyword & { id: string })[];
    loading: boolean;
    activeMonth?: string;
}

const EditableCell: React.FC<{
    value: string | number | null;
    onSave: (value: any) => void;
    type?: 'text' | 'number';
    placeholder?: string;
    className?: string;
}> = ({ value, onSave, type = 'text', placeholder, className }) => {
    const [currentValue, setCurrentValue] = useState(value === null ? '' : value);

    useEffect(() => {
        setCurrentValue(value === null ? '' : value);
    }, [value]);

    const handleBlur = () => {
        let finalValue: any = currentValue;
        if (type === 'number') {
            finalValue = currentValue === '' ? null : Number(currentValue);
        } else {
            finalValue = String(currentValue);
        }
        
        if (finalValue !== value) {
            onSave(finalValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
        }
    };

    return (
        <Input
            type={type}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn("h-7 text-[10px] p-1 border-transparent hover:border-border focus:border-ring bg-transparent", className)}
        />
    );
};

const RankChange: React.FC<{ initial: number | null; current: number | null }> = ({ initial, current }) => {
    if (initial === null || current === null) return <Minus className="h-3 w-3 text-muted-foreground mx-auto" />;
    
    const change = initial - current; // Rank 1 is better than Rank 10, so positive result is good
    
    if (change > 0) return (
        <div className="flex items-center justify-center gap-1 text-green-600 font-bold">
            <TrendingUp className="h-3 w-3" />
            <span>{change}</span>
        </div>
    );
    if (change < 0) return (
        <div className="flex items-center justify-center gap-1 text-red-600 font-bold">
            <TrendingDown className="h-3 w-3" />
            <span>{Math.abs(change)}</span>
        </div>
    );
    return <Minus className="h-3 w-3 text-muted-foreground mx-auto" />;
};

export default function SeoKeywordTable({ clientId, keywords, loading, activeMonth }: SeoKeywordTableProps) {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'admin';

    const addKeyword = async () => {
        const newKeyword: Omit<SeoKeyword, 'id'> = {
            keyword: '',
            initialRank: null,
            currentRank: null,
            targetRank: null,
            volume: '',
            difficulty: '',
            url: '',
            month: activeMonth || 'General',
            createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, `clients/${clientId}/seoKeywords`), newKeyword);
    };

    const handleUpdate = async (id: string, field: keyof SeoKeyword, value: any) => {
        const ref = doc(db, `clients/${clientId}/seoKeywords`, id);
        await updateDoc(ref, { [field]: value });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this keyword?')) return;
        await deleteDoc(doc(db, `clients/${clientId}/seoKeywords`, id));
    };

    const openLink = (url: string) => {
        if (!url) return;
        const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        window.open(formattedUrl, '_blank');
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3">
                <div>
                    <CardTitle className="text-base font-headline">Target Keywords Performance</CardTitle>
                </div>
                <Button size="sm" onClick={addKeyword} className="h-7 gap-1">
                    <Plus className="h-4 w-4" />
                    Add Keyword
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table className="text-[10px]">
                    <TableHeader>
                        <TableRow className="h-8 bg-muted/50">
                            <TableHead className="w-[30px] px-2 text-center">No</TableHead>
                            <TableHead className="px-2 w-[180px]">Target Keyword</TableHead>
                            <TableHead className="w-[70px] text-center px-1 bg-blue-50/50">Initial Rank</TableHead>
                            <TableHead className="w-[70px] text-center px-1 bg-blue-50/50">Current Rank</TableHead>
                            <TableHead className="w-[70px] text-center px-1 bg-green-50/50">Target Rank</TableHead>
                            <TableHead className="w-[60px] text-center px-1 font-bold">Change</TableHead>
                            <TableHead className="w-[80px] text-right px-2">Volume</TableHead>
                            <TableHead className="w-[80px] text-center px-2">Difficulty</TableHead>
                            <TableHead className="px-2">Target URL</TableHead>
                            <TableHead className="w-[40px] text-center"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={10} className="h-32 text-center">Loading keyword rankings...</TableCell></TableRow>
                        ) : keywords.map((k, index) => (
                            <TableRow key={k.id} className="h-8 group hover:bg-muted/20 transition-colors">
                                <TableCell className="text-center text-muted-foreground border-r font-medium">{index + 1}</TableCell>
                                <TableCell className="p-0 border-r">
                                    <EditableCell 
                                        value={k.keyword} 
                                        onSave={(v) => handleUpdate(k.id, 'keyword', v)} 
                                        placeholder="e.g. SEO services Calicut"
                                        className="font-medium"
                                    />
                                </TableCell>
                                <TableCell className="p-0 text-center border-r bg-blue-50/20">
                                    <EditableCell 
                                        value={k.initialRank} 
                                        onSave={(v) => handleUpdate(k.id, 'initialRank', v)} 
                                        type="number"
                                        className="text-center"
                                    />
                                </TableCell>
                                <TableCell className="p-0 text-center border-r bg-blue-50/20">
                                    <EditableCell 
                                        value={k.currentRank} 
                                        onSave={(v) => handleUpdate(k.id, 'currentRank', v)} 
                                        type="number"
                                        className="text-center"
                                    />
                                </TableCell>
                                <TableCell className="p-0 text-center border-r bg-green-50/20">
                                    <EditableCell 
                                        value={k.targetRank} 
                                        onSave={(v) => handleUpdate(k.id, 'targetRank', v)} 
                                        type="number"
                                        className="text-center"
                                    />
                                </TableCell>
                                <TableCell className="p-0 border-r bg-muted/5">
                                    <RankChange initial={k.initialRank} current={k.currentRank} />
                                </TableCell>
                                <TableCell className="p-0 border-r">
                                    <EditableCell 
                                        value={k.volume} 
                                        onSave={(v) => handleUpdate(k.id, 'volume', v)} 
                                        placeholder="—"
                                        className="text-right"
                                    />
                                </TableCell>
                                <TableCell className="p-0 border-r">
                                    <EditableCell 
                                        value={k.difficulty} 
                                        onSave={(v) => handleUpdate(k.id, 'difficulty', v)} 
                                        placeholder="—"
                                        className="text-center"
                                    />
                                </TableCell>
                                <TableCell className="p-0 relative border-r">
                                    <div className="flex items-center">
                                        <EditableCell 
                                            value={k.url} 
                                            onSave={(v) => handleUpdate(k.id, 'url', v)} 
                                            placeholder="landing page..."
                                            className="flex-1"
                                        />
                                        {k.url && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0" 
                                                onClick={() => openLink(k.url)}
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="p-0 text-center">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-destructive hover:bg-destructive/10" 
                                        onClick={() => handleDelete(k.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && keywords.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground italic">
                                    No keywords added yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
