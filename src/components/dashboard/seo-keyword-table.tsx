'use client';

import React, { useState, useEffect } from 'react';
import type { SeoKeyword } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { cn, capitalizeSentences } from '@/lib/utils';

interface SeoKeywordTableProps {
    clientId: string;
    keywords: (SeoKeyword & { id: string })[];
    loading: boolean;
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
            finalValue = currentValue === '' ? null : String(currentValue);
        } else {
            finalValue = String(currentValue);
            // Don't auto-capitalize difficulty colors to keep matching simple
            if (className?.includes('difficulty')) {
                 // No transform for consistency
            } else {
                finalValue = capitalizeSentences(finalValue);
            }
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
            className={cn("h-8 text-[11px] p-1 border-transparent hover:border-border focus:border-ring bg-transparent", className)}
        />
    );
};

export default function SeoKeywordTable({ clientId, keywords, loading }: SeoKeywordTableProps) {
    const addKeyword = async () => {
        const newKeyword: Omit<SeoKeyword, 'id'> = {
            keyword: '',
            volume: '',
            difficulty: '',
            url: '',
            month: 'General',
            createdAt: serverTimestamp(),
            dateText: 'As on ',
            rank: '',
        };
        await addDoc(collection(db, `clients/${clientId}/seoKeywords`), newKeyword);
    };

    const handleUpdate = async (id: string, field: keyof SeoKeyword, value: any) => {
        const ref = doc(db, `clients/${clientId}/seoKeywords`, id);
        await updateDoc(ref, { [field]: value });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this entry?')) return;
        await deleteDoc(doc(db, `clients/${clientId}/seoKeywords`, id));
    };

    const getDifficultyStyle = (val: string) => {
        const clean = (val || '').toLowerCase().trim();
        if (clean === 'high') return 'bg-[#ff0000] text-white font-bold';
        if (clean === 'medium') return 'bg-[#00ff00] text-black font-bold';
        if (clean === 'low') return 'bg-[#00ffff] text-black font-bold';
        return '';
    };

    return (
        <Card className="border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between p-3">
                <CardTitle className="text-base font-headline">Keyword Performance</CardTitle>
                <Button size="sm" onClick={addKeyword} className="h-7 gap-1">
                    <Plus className="h-4 w-4" />
                    Add Keyword
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto border rounded-md">
                    <table className="w-full text-[11px] border-collapse table-fixed min-w-[800px]">
                        <thead>
                            <tr className="h-10 bg-[#ffff00]">
                                <th className="w-[50px] border border-black px-2 text-center text-black font-bold">SI .NO</th>
                                <th className="w-[120px] border border-black px-2 text-left text-black font-bold">Date</th>
                                <th className="border border-black px-2 text-left text-black font-bold">KEYWORDS</th>
                                <th className="w-[80px] border border-black px-2 text-center text-black font-bold">Rank</th>
                                <th className="w-[120px] border border-black px-2 text-center text-black font-bold">Search Volume</th>
                                <th className="w-[120px] border border-black px-2 text-center text-black font-bold">Difficulty</th>
                                <th className="w-[40px] border border-black bg-white"></th>
                            </tr>
                        </thead>
                        <TableBody>
                            {loading ? (
                                <tr><TableCell colSpan={7} className="h-32 text-center">Loading keywords...</TableCell></tr>
                            ) : keywords.map((k, index) => (
                                <tr key={k.id} className="h-9 hover:bg-muted/10 transition-colors">
                                    <td className="border border-slate-300 text-center font-bold text-black">{index + 1}</td>
                                    <td className="border border-slate-300 p-0">
                                        <EditableCell 
                                            value={k.dateText || ''} 
                                            onSave={(v) => handleUpdate(k.id, 'dateText', v)} 
                                            placeholder="e.g. Aug 26"
                                        />
                                    </td>
                                    <td className="border border-slate-300 p-0">
                                        <div className="flex items-center group">
                                            <EditableCell 
                                                value={k.keyword} 
                                                onSave={(v) => handleUpdate(k.id, 'keyword', v)} 
                                                placeholder="Keyword..."
                                                className="flex-1"
                                            />
                                            {k.url && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 mr-1" 
                                                    onClick={() => window.open(k.url.startsWith('http') ? k.url : `https://${k.url}`, '_blank')}
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="border border-slate-300 p-0">
                                        <EditableCell 
                                            value={k.rank || ''} 
                                            onSave={(v) => handleUpdate(k.id, 'rank', v)} 
                                            className="text-center"
                                            placeholder="-"
                                        />
                                    </td>
                                    <td className="border border-slate-300 p-0">
                                        <EditableCell 
                                            value={k.volume} 
                                            onSave={(v) => handleUpdate(k.id, 'volume', v)} 
                                            placeholder="—"
                                            className="text-center"
                                        />
                                    </td>
                                    <td className={cn("border border-slate-300 p-0", getDifficultyStyle(k.difficulty))}>
                                        <EditableCell 
                                            value={k.difficulty} 
                                            onSave={(v) => handleUpdate(k.id, 'difficulty', v)} 
                                            placeholder="—"
                                            className={cn("text-center difficulty", getDifficultyStyle(k.difficulty))}
                                        />
                                    </td>
                                    <td className="border border-slate-300 p-0 text-center bg-background">
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
                                    <td colSpan={7} className="h-24 text-center text-muted-foreground italic">
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