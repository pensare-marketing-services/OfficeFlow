'use client';

import React, { useState, useEffect } from 'react';
import type { ClientNote, ClientNoteStatus, ProgressNote, UserProfile } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useUsers } from '@/hooks/use-users';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { format } from 'date-fns';


const noteStatuses: ClientNoteStatus[] = ["Pending", "On Work", "For Approval", "Done", "Scheduled"];

const statusColors: Record<ClientNoteStatus, string> = {
    "Done": "bg-green-500",
    "On Work": "bg-gray-500",
    "Pending": "bg-blue-500",
    "Scheduled": "bg-gray-400",
    "For Approval": "bg-orange-500",
};

interface ClientNotesTableProps {
  notes: ClientNote[];
  onUpdate: (notes: ClientNote[]) => void;
}

const getInitials = (name: string = '') => name ? name.charAt(0).toUpperCase() : '';

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
  const [noteInput, setNoteInput] = useState('');
  const [openedChats, setOpenedChats] = useState<Set<string>>(new Set());
  const { user: currentUser } = useAuth();
  const { users } = useUsers();

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const handleNoteChange = (index: number, field: keyof ClientNote, value: any) => {
    const updatedNotes = [...localNotes];
    updatedNotes[index] = { ...updatedNotes[index], [field]: value };
    onUpdate(updatedNotes);
  };
  
   const addRemark = (noteIndex: number, remarkText: string) => {
    if (!currentUser || !remarkText.trim()) return;

    const newRemark: ProgressNote = {
      note: remarkText.trim(),
      date: new Date().toISOString(),
      authorId: currentUser.uid,
      authorName: currentUser.username,
    };
    
    const existingRemarks = localNotes[noteIndex].remarks || [];
    handleNoteChange(noteIndex, 'remarks', [...existingRemarks, newRemark]);
  };
  
  const handleNewRemark = (e: React.KeyboardEvent<HTMLTextAreaElement>, noteIndex: number) => {
        if (e.key === 'Enter' && !e.shiftKey && currentUser) {
            e.preventDefault();
            const text = noteInput.trim();
            if(text){
                addRemark(noteIndex, text);
                setNoteInput('');
            }
        }
    }

  const addNote = () => {
    const newNote: ClientNote = {
      id: Date.now().toString(),
      note: '',
      update: 'Pending',
      remarks: [],
    };
    onUpdate([...localNotes, newNote]);
  };

  const deleteNote = (index: number) => {
    const updatedNotes = localNotes.filter((_, i) => i !== index);
    onUpdate(updatedNotes);
  };
  
  const handlePopoverOpen = (noteId: string) => {
        setOpenedChats(prev => new Set(prev.add(noteId)));
        setNoteInput('');
    }

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
              <TableHead className="p-1 h-8 text-xs w-[80px]">Remarks</TableHead>
              <TableHead className="p-1 h-8 text-xs w-[130px]">Status</TableHead>
              <TableHead className="w-[40px] p-1"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localNotes.map((note, index) => {
              const lastRemark = (note.remarks?.length ?? 0) > 0 ? note.remarks![note.remarks!.length - 1] : null;
              const hasUnreadMessage = lastRemark && lastRemark.authorId !== currentUser?.uid && !openedChats.has(note.id);

              return (
              <TableRow key={note.id}>
                <TableCell className="p-1 text-xs text-muted-foreground font-medium text-center">{index + 1}</TableCell>
                <TableCell className="p-0">
                  <EditableCell
                    value={note.note}
                    onSave={(value) => handleNoteChange(index, 'note', value)}
                  />
                </TableCell>
                <TableCell className="p-0 text-center">
                    <Popover onOpenChange={(open) => { if (open) handlePopoverOpen(note.id); }}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-7 w-7">
                                <MessageSquare className="h-4 w-4" />
                                {hasUnreadMessage && (
                                    <span className="absolute top-1 right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" side="left" align="end">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none text-xs">Remarks for "{note.note}"</h4>
                                <div className="max-h-60 space-y-3 overflow-y-auto p-1">
                                    {(note.remarks || []).map((remark, i) => {
                                        const author = users.find(u => u.id === remark.authorId);
                                        const authorName = author ? author.username : remark.authorName;
                                        return (
                                            <div key={i} className={cn("flex items-start gap-2 text-xs", remark.authorId === currentUser?.uid ? 'justify-end' : '')}>
                                                {remark.authorId !== currentUser?.uid && (
                                                    <Avatar className="h-6 w-6 border">
                                                        <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={cn("max-w-[75%] rounded-lg p-2", remark.authorId === currentUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                                    <p className="font-bold text-xs mb-1">{remark.authorId === currentUser?.uid ? 'You' : authorName}</p>
                                                    {remark.note && <p className="text-[11px]">{remark.note}</p>}
                                                    <p className={cn("text-right text-[9px] mt-1 opacity-70", remark.authorId === currentUser?.uid ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>{format(new Date(remark.date), "MMM d, HH:mm")}</p>
                                                </div>
                                                {remark.authorId === currentUser?.uid && (
                                                    <Avatar className="h-6 w-6 border">
                                                        <AvatarFallback>{getInitials(currentUser.username)}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                            </div>
                                        )
                                    })}
                                     {(note.remarks || []).length === 0 && (
                                        <p className="text-center text-xs text-muted-foreground py-4">No remarks yet.</p>
                                     )}
                                </div>
                                <div className="relative">
                                    <Textarea 
                                        placeholder="Add a remark..."
                                        value={noteInput}
                                        onChange={(e) => setNoteInput(e.target.value)}
                                        onKeyDown={(e) => handleNewRemark(e, index)}
                                        className="pr-2 text-xs"
                                    />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </TableCell>
                <TableCell className="p-1">
                  <Select value={note.update} onValueChange={(value: ClientNoteStatus) => handleNoteChange(index, 'update', value as any)}>
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
            )})}
            {localNotes.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground p-4 h-24">
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
