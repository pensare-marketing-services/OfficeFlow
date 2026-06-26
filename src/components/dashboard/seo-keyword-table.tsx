'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { SeoKeyword } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CalendarIcon, ExternalLink } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { format, isValid } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

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

export default function SeoKeywordTable({ clientId, keywords, loading, activeMonth }: SeoKeywordTableProps) {
    const { user: currentUser } = useAuth();
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const rankingDates = useMemo(() => {
        const dates = new Set<string>();
        keywords.forEach(kw => {
            if (kw.rankings) {
                Object.keys(kw.rankings).forEach(d => dates.add(d));
            }
        });
        return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }, [keywords]);

    const addKeyword = async () => {
        const newKeyword: Omit<SeoKeyword, 'id'> = {
            keyword: '',
            volume: '',
            difficulty: '',
            url: '',
            month: activeMonth || 'General',
            createdAt: serverTimestamp(),
            rankings: {},
        };
        await addDoc(collection(db, `clients/${clientId}/seoKeywords`), newKeyword);
    };

    const handleUpdate = async (id: string, field: keyof SeoKeyword, value: any) => {
        const ref = doc(db, `clients/${clientId}/seoKeywords`, id);
        await updateDoc(ref, { [field]: value });
    };

    const handleRankUpdate = async (kwId: string, dateKey: string, value: number | null) => {
        const kw = keywords.find(k => k.id === kwId);
        if (!kw) return;
        const newRankings = { ...(kw.rankings || {}), [dateKey]: value };
        const ref = doc(db, `clients/${clientId}/seoKeywords`, kwId);
        await updateDoc(ref, { rankings: newRankings });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this keyword?')) return;
        await deleteDoc(doc(db, `clients/${clientId}/seoKeywords`, id));
    };

    const handleAddDateColumn = async () => {
        if (!selectedDate) return;
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        
        // To "add" a column visually if no keywords have it, we'd need a central state.
        // For now, we'll just initialize it on the first keyword if it exists to ensure it appears.
        if (keywords.length > 0) {
            const firstKw = keywords[0];
            const newRankings = { ...(firstKw.rankings || {}), [dateKey]: null };
            await updateDoc(doc(db, `clients/${clientId}/seoKeywords`, firstKw.id), { rankings: newRankings });
        }
        setDatePopoverOpen(false);
    };

    const openLink = (url: string) => {
        if (!url) return;
        const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        window.open(formattedUrl, '_blank');
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3">
                <CardTitle className="text-base font-headline">Target Keywords Performance</CardTitle>
                <div className="flex gap-2">
                    <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                Add Date
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <div className="p-3 space-y-3">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    initialFocus
                                />
                                <Button className="w-full h-8 text-[10px]" onClick={handleAddDateColumn}>Confirm Column</Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button size="sm" onClick={addKeyword} className="h-7 gap-1">
                        <Plus className="h-4 w-4" />
                        Add Keyword
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto border-t">
                    <table className="w-max min-w-full text-[10px] border-collapse table-fixed">
                        <thead>
                            <tr className="h-8 bg-muted/50">
                                <th className="sticky left-0 z-20 w-[40px] px-2 text-center bg-muted/50 border-r border-b font-medium">No</th>
                                <th className="sticky left-[40px] z-20 w-[80px] px-2 text-left bg-muted/50 border-r border-b font-medium">Date</th>
                                <th className="sticky left-[120px] z-20 w-[200px] px-2 text-left bg-muted/50 border-r border-b font-medium">Keyword</th>
                                <th className="sticky left-[320px] z-20 w-[100px] px-2 text-right bg-muted/50 border-r border-b font-medium">Search Vol</th>
                                <th className="sticky left-[420px] z-20 w-[100px] px-2 text-center bg-muted/50 border-r-2 border-b border-border font-medium">Difficulty</th>
                                
                                {rankingDates.map(dateKey => (
                                    <th key={dateKey} className="w-[90px] px-2 text-center bg-blue-50/30 border-r border-b font-semibold text-blue-900">
                                        As on {format(new Date(dateKey), 'dd/MM/yy')}
                                    </th>
                                ))}
                                
                                <th className="w-[150px] px-2 text-left bg-muted/30 border-b font-medium">Target URL</th>
                                <th className="w-[40px] bg-muted/30 border-b"></th>
                            </tr>
                        </thead>
                        <TableBody>
                            {loading ? (
                                <tr><TableCell colSpan={rankingDates.length + 7} className="h-32 text-center">Loading keyword rankings...</TableCell></tr>
                            ) : keywords.map((k, index) => (
                                <tr key={k.id} className="h-8 group hover:bg-muted/10 transition-colors border-b">
                                    <td className="sticky left-0 z-10 bg-background text-center text-muted-foreground border-r font-medium">{index + 1}</td>
                                    <td className="sticky left-[40px] z-10 bg-background text-muted-foreground border-r px-2">
                                        {k.createdAt?.seconds ? format(new Date(k.createdAt.seconds * 1000), 'dd/MM/yy') : '-'}
                                    </td>
                                    <td className="sticky left-[120px] z-10 bg-background p-0 border-r">
                                        <EditableCell 
                                            value={k.keyword} 
                                            onSave={(v) => handleUpdate(k.id, 'keyword', v)} 
                                            placeholder="Keyword..."
                                            className="font-medium"
                                        />
                                    </td>
                                    <td className="sticky left-[320px] z-10 bg-background p-0 border-r">
                                        <EditableCell 
                                            value={k.volume} 
                                            onSave={(v) => handleUpdate(k.id, 'volume', v)} 
                                            placeholder="—"
                                            className="text-right"
                                        />
                                    </td>
                                    <td className="sticky left-[420px] z-10 bg-background p-0 border-r-2 border-border">
                                        <EditableCell 
                                            value={k.difficulty} 
                                            onSave={(v) => handleUpdate(k.id, 'difficulty', v)} 
                                            placeholder="—"
                                            className="text-center"
                                        />
                                    </td>

                                    {rankingDates.map(dateKey => (
                                        <td key={dateKey} className="p-0 border-r bg-blue-50/10">
                                            <EditableCell 
                                                value={k.rankings?.[dateKey] ?? null} 
                                                onSave={(v) => handleRankUpdate(k.id, dateKey, v)} 
                                                type="number"
                                                className="text-center placeholder:text-muted-foreground/30"
                                                placeholder="-"
                                            />
                                        </td>
                                    ))}

                                    <td className="p-0 relative group/url">
                                        <div className="flex items-center">
                                            <EditableCell 
                                                value={k.url} 
                                                onSave={(v) => handleUpdate(k.id, 'url', v)} 
                                                placeholder="Target URL..."
                                                className="flex-1"
                                            />
                                            {k.url && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 opacity-0 group-hover/url:opacity-100 shrink-0" 
                                                    onClick={() => openLink(k.url)}
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-0 text-center bg-background">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-destructive hover:bg-destructive/10" 
                                            onClick={() => handleDelete(k.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && keywords.length === 0 && (
                                <tr>
                                    <td colSpan={rankingDates.length + 7} className="h-24 text-center text-muted-foreground italic">
                                        No keywords added yet.
                                    </td>
                                </tr>
                            )}
                        </TableBody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
