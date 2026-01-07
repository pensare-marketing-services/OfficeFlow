

'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { ClientNote, ClientNoteStatus, ProgressNote, UserProfile } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, MessageSquare, Pen } from 'lucide-react';
import { cn, capitalizeSentences } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useUsers } from '@/hooks/use-users';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { LinkifiedText } from '@/components/shared/linkified-text';
import { InsertLinkPopover } from '../shared/insert-link-popover';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';


const noteStatuses: ClientNoteStatus[] = ["Pending", "On Work", "For Approval", "Done", "Scheduled"];
const MAX_IMAGE_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5MB

const statusColors: Record<ClientNoteStatus, string> = {
    "Pending": "bg-transparent",
    "Scheduled": "bg-gray-500",
    "On Work": "bg-orange-500",
    "For Approval": "bg-orange-500",
    "Done": "bg-red-500",
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
    const formattedValue = capitalizeSentences(currentValue);
    if (formattedValue !== value) {
      onSave(formattedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const formattedValue = capitalizeSentences(e.currentTarget.value);
      onSave(formattedValue);
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
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [editingRemark, setEditingRemark] = useState<{ noteId: string; remarkIndex: number } | null>(null);
  const [editingText, setEditingText] = useState('');
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const handleNoteChange = (index: number, field: keyof ClientNote, value: any) => {
    const updatedNotes = [...localNotes];
    updatedNotes[index] = { ...updatedNotes[index], [field]: value };
    // Firestore does not support `undefined` values.
    const cleanNotes = JSON.parse(JSON.stringify(updatedNotes));
    onUpdate(cleanNotes);
  };
  
   const addRemark = (noteIndex: number, remark: Partial<Omit<ProgressNote, 'date' | 'authorId' | 'authorName'>>) => {
    if (!currentUser) return;
    if (!remark.note?.trim() && !remark.imageUrl) return;

    const newRemark: ProgressNote = {
      note: remark.note ? capitalizeSentences(remark.note) : '',
      imageUrl: remark.imageUrl || '',
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
                addRemark(noteIndex, { note: text });
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

  const handleEditRemark = (note: ClientNote, remarkIndex: number) => {
    const remark = note.remarks?.[remarkIndex];
    if (!remark) return;
    setEditingRemark({ noteId: note.id, remarkIndex });
    setEditingText(remark.note || '');
  };

  const handleSaveRemark = (noteIndex: number, remarkIndex: number) => {
    if (!editingRemark) return;
    const note = localNotes[noteIndex];
    if (!note || !note.remarks) return;

    const updatedRemarks = [...note.remarks];
    updatedRemarks[remarkIndex] = { ...updatedRemarks[remarkIndex], note: editingText };
    handleNoteChange(noteIndex, 'remarks', updatedRemarks);
    setEditingRemark(null);
    setEditingText('');
  };
  
  const handlePopoverOpen = (noteId: string) => {
        setOpenedChats(prev => new Set(prev.add(noteId)));
        setNoteInput('');
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, noteIndex: number) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (!file) return;

                if (file.size > MAX_IMAGE_SIZE_BYTES) {
                    toast({
                        variant: 'destructive',
                        title: 'Image too large',
                        description: `Please paste an image smaller than ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB.`
                    });
                    e.preventDefault();
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    if(event.target && typeof event.target.result === 'string') {
                       addRemark(noteIndex, { imageUrl: event.target.result });
                    }
                };
                reader.readAsDataURL(file);
                e.preventDefault();
                return;
            }
        }
    };

    const handleStatusClick = (noteIndex: number) => {
      if (!isAdmin) return;
      const currentStatus = localNotes[noteIndex].update;
      const statusCycle: ClientNoteStatus[] = ["Pending", "Scheduled", "On Work", "Done"];
      const currentIndex = statusCycle.indexOf(currentStatus);
      const nextIndex = (currentIndex + 1) % statusCycle.length;
      handleNoteChange(noteIndex, 'update', statusCycle[nextIndex]);
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
       <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[10px] p-1">No</TableHead>
              <TableHead className="p-1 h-8 text-xs">Note</TableHead>
              <TableHead className="p-1 h-8 text-xs w-[80px]">Status</TableHead>
              <TableHead className="p-1 h-8 text-xs w-[80px]">Remarks</TableHead>
              <TableHead className="w-[40px] p-1"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localNotes.map((note, index) => {
              const lastRemark = (note.remarks?.length ?? 0) > 0 ? note.remarks![note.remarks!.length - 1] : null;
              const hasUnreadMessage = lastRemark && lastRemark.authorId !== currentUser?.uid && !openedChats.has(note.id);
              const noteStatus = note.update;
              const dotColor = statusColors[noteStatus] || "bg-gray-400";


              return (
              <TableRow key={note.id}>
                <TableCell className="p-1 text-xs text-muted-foreground font-medium text-center">{index + 1}</TableCell>
                <TableCell className="p-0">
                  <EditableCell
                    value={note.note}
                    onSave={(value) => handleNoteChange(index, 'note', value)}
                  />
                </TableCell>
                
                <TableCell className="p-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div 
                                className={cn("flex items-center justify-center h-7 w-full", isAdmin && "cursor-pointer")}
                                onClick={() => handleStatusClick(index)}
                            >
                                <div className={cn("h-3 w-5 ", dotColor)} />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{noteStatus}</p>
                        </TooltipContent>
                    </Tooltip>
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
                                    {(note.remarks || []).map((remark, remarkIndex) => {
                                        const author = users.find(u => u.id === remark.authorId);
                                        const authorName = author ? author.username : remark.authorName;
                                        const isEditing = editingRemark?.noteId === note.id && editingRemark?.remarkIndex === remarkIndex;

                                        return (
                                            <div key={remarkIndex} className={cn("flex items-start gap-2 text-xs group/remark", remark.authorId === currentUser?.uid ? 'justify-end' : '')}>
                                                {remark.authorId !== currentUser?.uid && (
                                                    <Avatar className="h-6 w-6 border">
                                                        <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={cn("max-w-[75%] rounded-lg p-2 relative", remark.authorId === currentUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                                    {currentUser?.role === 'admin' && !isEditing && (
                                                      <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover/remark:opacity-100" onClick={() => handleEditRemark(note, remarkIndex)}>
                                                        <Pen className="h-3 w-3"/>
                                                      </Button>
                                                    )}
                                                    <p className="font-bold text-xs mb-1">{remark.authorId === currentUser?.uid ? 'You' : authorName}</p>
                                                    
                                                    {isEditing ? (
                                                        <Textarea
                                                          value={editingText}
                                                          onChange={(e) => setEditingText(e.target.value)}
                                                          onBlur={() => handleSaveRemark(index, remarkIndex)}
                                                          onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                              e.preventDefault();
                                                              handleSaveRemark(index, remarkIndex);
                                                            } else if (e.key === 'Escape') {
                                                              setEditingRemark(null);
                                                            }
                                                          }}
                                                          autoFocus
                                                          className="text-xs h-auto bg-background/80 text-foreground"
                                                        />
                                                    ) : (
                                                      <>
                                                        {remark.note && <div className="text-[11px] whitespace-pre-wrap break-words"><LinkifiedText text={remark.note} /></div>}
                                                        {remark.imageUrl && (
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <img src={remark.imageUrl} alt="remark" className="mt-1 rounded-md max-w-full h-auto cursor-pointer" />
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                                                                    <DialogHeader className="sr-only">
                                                                        <DialogTitle>Image Preview</DialogTitle>
                                                                        <DialogDescription>A full-screen view of the image attached to the remark.</DialogDescription>
                                                                    </DialogHeader>
                                                                    <img src={remark.imageUrl} alt="remark full view" className="max-w-full max-h-full object-contain" />
                                                                </DialogContent>
                                                            </Dialog>
                                                        )}
                                                      </>
                                                    )}
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
                                        ref={textareaRef}
                                        placeholder="Add a remark or paste an image..."
                                        value={noteInput}
                                        onChange={(e) => setNoteInput(e.target.value)}
                                        onKeyDown={(e) => handleNewRemark(e, index)}
                                        onPaste={(e) => handlePaste(e, index)}
                                        className="pr-2 text-xs"
                                    />
                                    <div className="absolute bottom-1 right-1">
                                        <InsertLinkPopover 
                                            textareaRef={textareaRef} 
                                            onValueChange={setNoteInput} 
                                            onSend={(message) => addRemark(index, {note: message})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
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
       </TooltipProvider>
      </CardContent>
    </Card>
  );
}
