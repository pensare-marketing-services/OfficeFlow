'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { SeoKeyword } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ExternalLink, Check, X, Loader2 } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, onSnapshot, setDoc } from 'firebase/firestore';
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
            finalValue = currentValue === '' ? null : Number(currentValue);
        } else {
            finalValue = String(currentValue);
            if (!className?.includes('difficulty')) {
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
            type={type === 'number' ? 'text' : type}
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
    const [dateColumns, setDateColumns] = useState<string[]>([]);
    const [isAddingDate, setIsAddingDate] = useState(false);
    const [newDateLabel, setNewDateLabel] = useState('');
    const [configLoading, setConfigLoading] = useState(true);

    // Fetch column configuration
    useEffect(() => {
        const configRef = doc(db, `clients/${clientId}/keywordRankingConfig`, 'config');
        const unsub = onSnapshot(configRef, (snap) => {
            if (snap.exists()) {
                setDateColumns(snap.data().dateColumns || []);
            } else {
                setDateColumns([]);
            }
            setConfigLoading(false);
        });
        return () => unsub();
    }, [clientId]);

    const addKeyword = async () => {
        const newKeyword: Omit<SeoKeyword, 'id'> = {
            keyword: '',
            volume: '',
            difficulty: '',
            url: '',
            month: 'General',
            createdAt: serverTimestamp(),
            dateText: 'As on ',
            rankings: {}, // Use rankings object
        };
        await addDoc(collection(db, `clients/${clientId}/seoKeywords`), newKeyword);
    };

    const handleUpdate = async (id: string, field: string, value: any) => {
        const ref = doc(db, `clients/${clientId}/seoKeywords`, id);
        await updateDoc(ref, { [field]: value });
    };

    const handleUpdateRanking = async (keywordId: string, dateKey: string, value: any) => {
        const ref = doc(db, `clients/${clientId}/seoKeywords`, keywordId);
        const val = value === '' ? null : Number(value);
        await updateDoc(ref, { [`rankings.${dateKey}`]: val });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this entry?')) return;
        await deleteDoc(doc(db, `clients/${clientId}/seoKeywords`, id));
    };

    const handleAddDateColumn = async () => {
        if (!newDateLabel.trim()) return;
        const updatedCols = [...dateColumns, newDateLabel.trim()];
        const configRef = doc(db, `clients/${clientId}/keywordRankingConfig`, 'config');
        await setDoc(configRef, { dateColumns: updatedCols }, { merge: true });
        setNewDateLabel('');
        setIsAddingDate(false);
    };

    const handleDeleteDateColumn = async (dateKey: string) => {
        if (!confirm(`Delete column "${dateKey}"? This will hide rankings for this date.`)) return;
        const updatedCols = dateColumns.filter(c => c !== dateKey);
        const configRef = doc(db, `clients/${clientId}/keywordRankingConfig`, 'config');
        await setDoc(configRef, { dateColumns: updatedCols }, { merge: true });
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
                <div className="flex items-center gap-2">
                    {isAddingDate ? (
                        <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                            <Input 
                                placeholder="Date label..." 
                                value={newDateLabel} 
                                onChange={(e) => setNewDateLabel(e.target.value)}
                                className="h-7 text-[10px] w-24"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleAddDateColumn()}
                            />
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={handleAddDateColumn}>
                                <Check className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600" onClick={() => setIsAddingDate(false)}>
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <Button size="sm" variant="outline" onClick={() => setIsAddingDate(true)} className="h-7 gap-1">
                            <Plus className="h-4 w-4" />
                            Add Date
                        </Button>
                    )}
                    <Button size="sm" onClick={addKeyword} className="h-7 gap-1">
                        <Plus className="h-4 w-4" />
                        Add Keyword
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto border rounded-md">
                    <table className="table-fixed min-w-max w-full border-collapse">
                        <thead>
                            <tr className="h-10 bg-[#ffff00]">
                                <th className="sticky left-0 z-40 w-[40px] border border-black bg-[#ffff00] px-2 text-center text-black font-bold">SI .NO</th>
                                <th className="sticky left-[40px] z-40 w-[80px] border border-black bg-[#ffff00] px-2 text-left text-black font-bold">Date</th>
                                <th className="sticky left-[120px] z-40 w-[200px] border border-black bg-[#ffff00] px-2 text-left text-black font-bold">KEYWORDS</th>
                                <th className="sticky left-[320px] z-40 w-[100px] border border-black bg-[#ffff00] px-2 text-center text-black font-bold">Search Vol</th>
                                <th className="sticky left-[420px] z-40 w-[100px] border border-black border-r-2 bg-[#ffff00] px-2 text-center text-black font-bold">Difficulty</th>
                                
                                {dateColumns.map(dateKey => (
                                    <th key={dateKey} className="group relative w-[90px] border border-black bg-[#ffff00] px-2 text-center text-black font-bold text-[10px]">
                                        As on {dateKey}
                                        <button 
                                            onClick={() => handleDeleteDateColumn(dateKey)}
                                            className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
                                        >
                                            <X className="h-2 w-2" />
                                        </button>
                                    </th>
                                ))}
                                
                                <th className="w-[40px] border border-black bg-white"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading || configLoading ? (
                                <tr><td colSpan={6 + dateColumns.length} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>
                            ) : keywords.map((k, index) => (
                                <tr key={k.id} className="h-9 hover:bg-muted/5 transition-colors group">
                                    <td className="sticky left-0 z-20 border border-slate-300 bg-background text-center font-bold text-black">{index + 1}</td>
                                    <td className="sticky left-[40px] z-20 border border-slate-300 bg-background p-0">
                                        <EditableCell 
                                            value={k.dateText || ''} 
                                            onSave={(v) => handleUpdate(k.id, 'dateText', v)} 
                                            placeholder="e.g. Aug 26"
                                        />
                                    </td>
                                    <td className="sticky left-[120px] z-20 border border-slate-300 bg-background p-0">
                                        <div className="flex items-center group/cell">
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
                                                    className="h-6 w-6 opacity-0 group-hover/cell:opacity-100 shrink-0 mr-1" 
                                                    onClick={() => window.open(k.url.startsWith('http') ? k.url : `https://${k.url}`, '_blank')}
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="sticky left-[320px] z-20 border border-slate-300 bg-background p-0">
                                        <EditableCell 
                                            value={k.volume} 
                                            onSave={(v) => handleUpdate(k.id, 'volume', v)} 
                                            placeholder="—"
                                            className="text-center"
                                        />
                                    </td>
                                    <td className={cn("sticky left-[420px] z-20 border border-slate-300 border-r-2 p-0", getDifficultyStyle(k.difficulty) || "bg-background")}>
                                        <EditableCell 
                                            value={k.difficulty} 
                                            onSave={(v) => handleUpdate(k.id, 'difficulty', v)} 
                                            placeholder="—"
                                            className={cn("text-center difficulty", getDifficultyStyle(k.difficulty))}
                                        />
                                    </td>

                                    {dateColumns.map(dateKey => (
                                        <td key={dateKey} className="border border-slate-300 p-0">
                                            <EditableCell 
                                                value={k.rankings?.[dateKey] ?? ''} 
                                                onSave={(v) => handleUpdateRanking(k.id, dateKey, v)}
                                                type="number"
                                                className="text-center font-bold text-primary"
                                                placeholder="-"
                                            />
                                        </td>
                                    ))}

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
                            {(!loading && !configLoading) && keywords.length === 0 && (
                                <tr>
                                    <td colSpan={6 + dateColumns.length} className="h-24 text-center text-muted-foreground italic">
                                        No keywords added yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}