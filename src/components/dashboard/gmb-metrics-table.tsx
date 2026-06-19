
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { GmbMetric } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { cn, capitalizeSentences } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface GmbMetricsTableProps {
    clientId: string;
    metrics: (GmbMetric & { id: string })[];
    loading: boolean;
    activeMonth: string;
}

const EditableCell: React.FC<{
    value: string | number | null;
    onSave: (value: any) => void;
    type?: 'text' | 'number';
    placeholder?: string;
}> = ({ value, onSave, type = 'text', placeholder }) => {
    const [currentValue, setCurrentValue] = useState(value === null ? '' : value);

    useEffect(() => {
        setCurrentValue(value === null ? '' : value);
    }, [value]);

    const handleBlur = () => {
        let finalValue: any = currentValue;
        if (type === 'number') {
            finalValue = currentValue === '' ? null : Number(currentValue);
        } else {
            finalValue = capitalizeSentences(String(currentValue));
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
            className="h-7 text-[10px] p-1 border-transparent hover:border-border focus:border-ring bg-transparent text-right"
        />
    );
};

export default function GmbMetricsTable({ clientId, metrics, loading, activeMonth }: GmbMetricsTableProps) {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'admin';

    const addMetricRow = async () => {
        const newMetric: Omit<GmbMetric, 'id'> = {
            monthLabel: '',
            overview: null,
            calls: null,
            bookings: null,
            directions: null,
            websiteClicks: null,
            remarks: '',
            month: activeMonth,
        };
        await addDoc(collection(db, `clients/${clientId}/gmbMetrics`), newMetric);
    };

    const handleMetricChange = async (id: string, field: keyof GmbMetric, value: any) => {
        const metricRef = doc(db, `clients/${clientId}/gmbMetrics`, id);
        await updateDoc(metricRef, { [field]: value });
    };

    const deleteMetricRow = async (id: string) => {
        await deleteDoc(doc(db, `clients/${clientId}/gmbMetrics`, id));
    };

    const averages = useMemo(() => {
        const count = metrics.length;
        if (count === 0) return { overview: 0, calls: 0, bookings: 0, directions: 0, websiteClicks: 0 };

        const sums = metrics.reduce((acc, m) => {
            acc.overview += m.overview || 0;
            acc.calls += m.calls || 0;
            acc.bookings += m.bookings || 0;
            acc.directions += m.directions || 0;
            acc.websiteClicks += m.websiteClicks || 0;
            return acc;
        }, { overview: 0, calls: 0, bookings: 0, directions: 0, websiteClicks: 0 });

        const validCounts = {
            overview: metrics.filter(m => m.overview !== null).length || 1,
            calls: metrics.filter(m => m.calls !== null).length || 1,
            bookings: metrics.filter(m => m.bookings !== null).length || 1,
            directions: metrics.filter(m => m.directions !== null).length || 1,
            websiteClicks: metrics.filter(m => m.websiteClicks !== null).length || 1,
        };

        return {
            overview: Math.round(sums.overview / validCounts.overview),
            calls: Math.round(sums.calls / validCounts.calls),
            bookings: Math.round(sums.bookings / validCounts.bookings),
            directions: Math.round(sums.directions / validCounts.directions),
            websiteClicks: Math.round(sums.websiteClicks / validCounts.websiteClicks),
        };
    }, [metrics]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3">
                <CardTitle className="text-base font-headline">Google My Business</CardTitle>
                <Button size="sm" onClick={addMetricRow} className="h-7 gap-1">
                    <Plus className="h-4 w-4" />
                    Add Row
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table className="text-[10px]">
                    <TableHeader>
                        <TableRow className="h-8 bg-muted/50">
                            <TableHead className="w-[120px] px-2">Month</TableHead>
                            <TableHead className="text-right px-2">Overview</TableHead>
                            <TableHead className="text-right px-2">Calls</TableHead>
                            <TableHead className="text-right px-2">Bookings</TableHead>
                            <TableHead className="text-right px-2">Directions</TableHead>
                            <TableHead className="text-right px-2">Web clicks</TableHead>
                            <TableHead className="px-2">Remarks</TableHead>
                            <TableHead className="w-[40px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={8} className="h-24 text-center">Loading GMB metrics...</TableCell></TableRow>
                        ) : metrics.map((m) => (
                            <TableRow key={m.id} className="h-8">
                                <TableCell className="p-0">
                                    <EditableCell 
                                        value={m.monthLabel} 
                                        onSave={(v) => handleMetricChange(m.id, 'monthLabel', v)} 
                                        placeholder="e.g. August 2024"
                                    />
                                </TableCell>
                                <TableCell className="p-0">
                                    <EditableCell 
                                        value={m.overview} 
                                        onSave={(v) => handleMetricChange(m.id, 'overview', v)} 
                                        type="number"
                                    />
                                </TableCell>
                                <TableCell className="p-0">
                                    <EditableCell 
                                        value={m.calls} 
                                        onSave={(v) => handleMetricChange(m.id, 'calls', v)} 
                                        type="number"
                                    />
                                </TableCell>
                                <TableCell className="p-0">
                                    <EditableCell 
                                        value={m.bookings} 
                                        onSave={(v) => handleMetricChange(m.id, 'bookings', v)} 
                                        type="number"
                                    />
                                </TableCell>
                                <TableCell className="p-0">
                                    <EditableCell 
                                        value={m.directions} 
                                        onSave={(v) => handleMetricChange(m.id, 'directions', v)} 
                                        type="number"
                                    />
                                </TableCell>
                                <TableCell className="p-0">
                                    <EditableCell 
                                        value={m.websiteClicks} 
                                        onSave={(v) => handleMetricChange(m.id, 'websiteClicks', v)} 
                                        type="number"
                                    />
                                </TableCell>
                                <TableCell className="p-0">
                                    <EditableCell 
                                        value={m.remarks} 
                                        onSave={(v) => handleMetricChange(m.id, 'remarks', v)} 
                                        placeholder="—"
                                    />
                                </TableCell>
                                <TableCell className="p-0 text-center">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-destructive" 
                                        onClick={() => deleteMetricRow(m.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && metrics.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No GMB data for this month.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    {metrics.length > 0 && (
                        <TableFooter>
                            <TableRow className="h-8 font-bold bg-muted/30">
                                <TableCell className="px-2">Average</TableCell>
                                <TableCell className="text-right px-2">{averages.overview}</TableCell>
                                <TableCell className="text-right px-2">{averages.calls}</TableCell>
                                <TableCell className="text-right px-2">{averages.bookings}</TableCell>
                                <TableCell className="text-right px-2">{averages.directions}</TableCell>
                                <TableCell className="text-right px-2">{averages.websiteClicks}</TableCell>
                                <TableCell colSpan={2}></TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </CardContent>
        </Card>
    );
}
