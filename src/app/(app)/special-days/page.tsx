
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, Save, X, CalendarDays, Loader2 } from 'lucide-react';
import { db } from '@/firebase/client';
import { collection, onSnapshot, doc, updateDoc, writeBatch, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { SpecialDayMonth, SpecialDayRow } from '@/lib/data';

// Sub-component: CellContent
const CellContent: React.FC<{ events?: string[] }> = ({ events }) => {
  if (!events || events.length === 0) return <div className="min-h-[24px] w-full" />;
  if (events.length === 1) return <div className="text-[10px] break-words">{events[0]}</div>;
  return (
    <ul className="list-disc list-inside text-[10px] space-y-0.5">
      {events.map((e, i) => (
        <li key={i} className="break-words">
          <span className="ml-[-4px]">{e}</span>
        </li>
      ))}
    </ul>
  );
};

// Sub-component: CellEditor
const CellEditor: React.FC<{
  initialEvents: string[];
  onSave: (events: string[]) => void;
  onCancel: () => void;
}> = ({ initialEvents, onSave, onCancel }) => {
  const [inputs, setInputs] = useState<string[]>(initialEvents.length > 0 ? initialEvents : ['']);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newInputs = [...inputs];
      newInputs.splice(index + 1, 0, '');
      setInputs(newInputs);
      setTimeout(() => {
        const nextInput = document.getElementById(`event-input-${index + 1}`);
        nextInput?.focus();
      }, 0);
    } else if (e.key === 'Backspace' && inputs[index] === '' && inputs.length > 1) {
      e.preventDefault();
      const newInputs = inputs.filter((_, i) => i !== index);
      setInputs(newInputs);
      setTimeout(() => {
        const prevInput = document.getElementById(`event-input-${index - 1}`);
        prevInput?.focus();
      }, 0);
    }
  };

  const updateInput = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  return (
    <div className="space-y-3 p-1">
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {inputs.map((val, i) => (
          <Input
            key={i}
            id={`event-input-${i}`}
            value={val}
            onChange={(e) => updateInput(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            placeholder="Event description..."
            className="h-8 text-[11px]"
            autoFocus={i === inputs.length - 1}
          />
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-[10px]">
          <X className="mr-1 h-3 w-3" /> Cancel
        </Button>
        <Button size="sm" onClick={() => onSave(inputs.filter(i => i.trim() !== ''))} className="h-7 text-[10px]">
          <Save className="mr-1 h-3 w-3" /> Save
        </Button>
      </div>
    </div>
  );
};

export default function SpecialDaysPage() {
  const [months, setMonths] = useState<SpecialDayMonth[]>([]);
  const [rows, setRows] = useState<SpecialDayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMonthName, setNewMonthName] = useState('');
  const [isAddingMonth, setIsAddingMonth] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'specialDaysData', 'config'), (snap) => {
      if (snap.exists()) {
        setMonths(snap.data().months || []);
      }
    });

    const q = query(collection(db, 'specialDays'), orderBy('day', 'asc'));
    const unsubRows = onSnapshot(q, (snap) => {
      const rowsData = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as SpecialDayRow));
      if (rowsData.length === 0) {
        initializeRows();
      } else {
        setRows(rowsData);
        setLoading(false);
      }
    });

    return () => {
      unsubConfig();
      unsubRows();
    };
  }, []);

  const initializeRows = async () => {
    const batch = writeBatch(db);
    for (let i = 1; i <= 31; i++) {
      const ref = doc(db, 'specialDays', i.toString());
      batch.set(ref, { day: i, events: {} });
    }
    await batch.commit();
  };

  const handleAddMonth = async () => {
    if (!newMonthName.trim()) return;
    setIsAddingMonth(true);

    try {
      const monthId = Date.now().toString();
      const newMonth: SpecialDayMonth = { id: monthId, name: newMonthName.trim() };
      const updatedMonths = [...months, newMonth];

      const batch = writeBatch(db);
      batch.set(doc(db, 'specialDaysData', 'config'), { months: updatedMonths });

      rows.forEach(row => {
        const rowRef = doc(db, 'specialDays', row.id);
        batch.update(rowRef, {
          [`events.${monthId}`]: []
        });
      });

      await batch.commit();
      setNewMonthName('');
      toast({ title: 'Month Added', description: `${newMonthName} has been added.` });

      if (scrollRef.current) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'smooth' });
        }, 150);
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add month.' });
    } finally {
      setIsAddingMonth(false);
    }
  };

  const handleSaveCell = async (dayId: string, monthId: string, events: string[]) => {
    try {
      const rowRef = doc(db, 'specialDays', dayId);
      await updateDoc(rowRef, {
        [`events.${monthId}`]: events
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save events.' });
    }
  };

  const handleDeleteMonth = async (monthId: string) => {
    if (!confirm('Delete this month and all its events?')) return;
    try {
      const updatedMonths = months.filter(m => m.id !== monthId);
      const batch = writeBatch(db);
      batch.set(doc(db, 'specialDaysData', 'config'), { months: updatedMonths });
      rows.forEach(row => {
        const rowRef = doc(db, 'specialDays', row.id);
        const newEvents = { ...row.events };
        delete newEvents[monthId];
        batch.update(rowRef, { events: newEvents });
      });
      await batch.commit();
      toast({ title: 'Month Deleted' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete month.' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      <Card className="shrink-0">
        <CardHeader className="p-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-headline">Special Days Planner</CardTitle>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="New Month (e.g., Oct 2024)"
                value={newMonthName}
                onChange={(e) => setNewMonthName(e.target.value)}
                className="h-8 text-[11px] w-full sm:w-48"
                onKeyDown={(e) => e.key === 'Enter' && handleAddMonth()}
              />
              <Button size="sm" onClick={handleAddMonth} disabled={isAddingMonth || !newMonthName.trim()} className="h-8 gap-1 shrink-0">
                {isAddingMonth ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Add Month
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="p-0 flex-1 overflow-hidden relative">
          <div ref={scrollRef} className="overflow-auto h-full scrollbar-thin scrollbar-thumb-muted-foreground/20">
            <table className="w-full text-[10px] border-collapse min-w-full table-fixed">
              <thead className="sticky top-0 z-30 shadow-sm">
                <tr className="h-8 bg-muted">
                  <th className="sticky left-0 bg-muted border-r border-b p-1 w-[50px] z-40 text-muted-foreground font-medium text-center">Day</th>
                  {months.map(month => (
                    <th key={month.id} className="border-r border-b p-1 w-[200px] text-left group">
                      <div className="flex items-center justify-between px-1">
                        <span className="truncate">{month.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteMonth(month.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </th>
                  ))}
                  {months.length === 0 && (
                    <th className="border-b p-4 text-muted-foreground font-normal italic">
                      Add a month to start planning...
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-background">
                {rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-muted/30">
                    <td className="sticky left-0 bg-background border-r p-1 text-center font-bold text-muted-foreground z-20">
                      {row.day}
                    </td>
                    {months.map(month => (
                      <td key={month.id} className="border-r p-0 align-top relative group">
                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="w-full min-h-[40px] p-1.5 cursor-pointer transition-colors group-hover:bg-accent/10">
                              <CellContent events={row.events?.[month.id] || []} />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-2" side="bottom" align="start">
                            <CellEditor
                              initialEvents={row.events?.[month.id] || []}
                              onSave={(events) => handleSaveCell(row.id, month.id, events)}
                              onCancel={() => {}}
                            />
                          </PopoverContent>
                        </Popover>
                      </td>
                    ))}
                    {months.length === 0 && <td className="p-4" />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
