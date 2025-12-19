'use client';

import React, { useState, useEffect } from 'react';
import type { ClientNote, ClientNoteStatus } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


const noteStatuses: ClientNoteStatus[] = ["Pending", "On Work", "For Approval", "Done", "Scheduled"];

const statusColors: Record<ClientNoteStatus, string> = {
    "Done": "bg-green-500",
    "On Work": "bg-gray-500",
    "Pending": "bg-blue-500",
    "Scheduled": "bg-gray-400",
    "For Approval": "bg-orange-500",
};

const statusBadgeVariants: Record<ClientNoteStatus, "default" | "secondary" | "destructive" | "outline"> = {
    "Done": "default",
    "On Work": "secondary",
    "Pending": "outline",
    "Scheduled": "outline",
    "For Approval": "secondary",
};


interface ClientNotesTableProps {
  notes: ClientNote[];
  onUpdate: (notes: ClientNote[]) => void;
}

const EditableCell: React.FC<{ value: string; onSave: (value: string) => void }> = ({ value, onSave }) => {
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleBlur = () => {
    if (currentValue !== value) {
      onSave(currentValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(e.currentTarget.value);
      e.currentTarget.blur();
    }
  };

  return (
    <Input
      value={currentValue}
      onChange={(e) => setCurrentValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="h-7 text-xs p-1 border-transparent hover:border-border focus:border-ring focus:bg-background"
    />
  );
};

export default function ClientNotesTable({ notes, onUpdate }: ClientNotesTableProps) {
  const [localNotes, setLocalNotes] = useState(notes);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const handleNoteChange = (index: number, field: keyof ClientNote, value: string) => {
    const updatedNotes = [...localNotes];
    updatedNotes[index] = { ...updatedNotes[index], [field]: value };
    onUpdate(updatedNotes);
  };

  const addNote = () => {
    const newNote: ClientNote = {
      id: Date.now().toString(),
      note: '',
      update: 'Pending',
    };
    onUpdate([...localNotes, newNote]);
  };

  const deleteNote = (index: number) => {
    const updatedNotes = localNotes.filter((_, i) => i !== index);
    onUpdate(updatedNotes);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-3">
        <CardTitle className="text-base font-headline">Notes</CardTitle>
        <Button size="sm" onClick={addNote} className="h-7 gap-1">
          <Plus className="h-4 w-4" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[10px] p-1"></TableHead>
              <TableHead className="p-1 h-8 text-xs">Note</TableHead>
              <TableHead className="p-1 h-8 text-xs w-[150px]">Status</TableHead>
              <TableHead className="w-[40px] p-1"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localNotes.map((note, index) => (
              <TableRow key={note.id}>
                <TableCell className="p-1 text-xs text-muted-foreground font-medium text-center">{index + 1}</TableCell>
                <TableCell className="p-0">
                  <EditableCell
                    value={note.note}
                    onSave={(value) => handleNoteChange(index, 'note', value)}
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Select value={note.update} onValueChange={(value: ClientNoteStatus) => handleNoteChange(index, 'update', value)}>
                      <SelectTrigger className="h-7 text-xs px-2 py-1 w-full focus:ring-1 focus:ring-ring">
                          <SelectValue>
                              <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", statusColors[note.update])} />
                                {note.update}
                              </div>
                          </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                          {noteStatuses.map(status => (
                              <SelectItem key={status} value={status}>
                                  <div className="flex items-center gap-2">
                                      <div className={cn("h-2 w-2 rounded-full", statusColors[status])} />
                                      {status}
                                  </div>
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-0 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteNote(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {localNotes.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground p-4 h-24">
                        No notes for this client yet.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
