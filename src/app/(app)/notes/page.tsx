'use client';

import React, { useState, useMemo } from 'react';
import { useNotes } from '@/hooks/use-notes';
import { useClients } from '@/hooks/use-clients';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Search, Calendar, StickyNote, Building, Eye, Pen, GripVertical, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { capitalizeSentences } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { InternalNote } from '@/lib/data';

// DND Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableNoteCardProps {
    note: InternalNote;
    onView: (note: InternalNote) => void;
    onEdit: (note: InternalNote) => void;
    onDelete: (id: string) => void;
}

function SortableNoteCard({ note, onView, onEdit, onDelete }: SortableNoteCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: note.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Card 
            ref={setNodeRef}
            style={style}
            className="bg-card shadow-sm border transition-shadow hover:shadow-md flex flex-col min-h-[130px] group"
        >
            <CardHeader className="p-2 pb-1">
                <div className="flex justify-between items-start gap-1">
                    <div className="flex items-start gap-1 flex-1 min-w-0">
                        <div 
                            {...attributes} 
                            {...listeners} 
                            className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                        >
                            <GripVertical className="h-3 w-3" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                            <CardTitle className="text-[11px] font-bold truncate" title={note.title}>{note.title}</CardTitle>
                            {note.clientName && (
                                <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 font-normal flex items-center gap-1 w-fit bg-muted truncate max-w-full">
                                    <Building className="h-2 w-2" />
                                    {note.clientName}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center -mt-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" onClick={() => onView(note)}>
                            <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" onClick={() => onEdit(note)}>
                            <Pen className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5 text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Note?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the note "{note.title}".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={() => onDelete(note.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        Delete Note
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-2 pt-0 flex-1 overflow-hidden">
                <p className="text-[10px] text-muted-foreground line-clamp-3 whitespace-pre-wrap leading-tight">
                    {note.content}
                </p>
            </CardContent>
            <CardFooter className="p-2 pt-1 border-t bg-muted/5 flex items-center justify-between text-[8px] text-muted-foreground">
                <div className="truncate flex-1 mr-2 flex items-center gap-1">
                    <User className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate font-medium">{note.authorName}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-70">
                    <Calendar className="h-2 w-2" />
                    {note.createdAt?.seconds ? format(new Date(note.createdAt.seconds * 1000), 'MMM dd, yy') : 'Recently'}
                </div>
            </CardFooter>
        </Card>
    );
}

export default function NotesPage() {
    const { notes, loading, addNote, updateNote, deleteNote, reorderNotes } = useNotes();
    const { clients } = useClients();
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<InternalNote | null>(null);
    
    // Form state for creating/editing
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [noteClientId, setNoteClientId] = useState('none');
    
    const { toast } = useToast();

    // Sensors for DND
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const filteredNotes = useMemo(() => {
        return notes.filter(n => 
            n.title.toLowerCase().includes(search.toLowerCase()) || 
            n.content.toLowerCase().includes(search.toLowerCase()) ||
            (n.clientName && n.clientName.toLowerCase().includes(search.toLowerCase()))
        );
    }, [notes, search]);

    const resetForm = () => {
        setNoteTitle('');
        setNoteContent('');
        setNoteClientId('none');
    };

    const handleAddNote = async () => {
        if (!noteTitle.trim() || !noteContent.trim()) return;
        try {
            const client = clients.find(c => c.id === noteClientId);
            await addNote(
                capitalizeSentences(noteTitle), 
                capitalizeSentences(noteContent), 
                'bg-card',
                noteClientId === 'none' ? undefined : noteClientId,
                client?.name
            );
            resetForm();
            setIsCreateOpen(false);
            toast({ title: 'Note added successfully' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error adding note' });
        }
    };

    const handleEditNote = (note: InternalNote) => {
        setSelectedNote(note);
        setNoteTitle(note.title);
        setNoteContent(note.content);
        setNoteClientId(note.clientId || 'none');
        setIsEditOpen(true);
    };

    const handleUpdateNote = async () => {
        if (!selectedNote || !noteTitle.trim() || !noteContent.trim()) return;
        try {
            const client = clients.find(c => c.id === noteClientId);
            await updateNote(selectedNote.id, {
                title: capitalizeSentences(noteTitle),
                content: capitalizeSentences(noteContent),
                color: 'bg-card',
                clientId: noteClientId === 'none' ? null : noteClientId,
                clientName: noteClientId === 'none' ? null : client?.name
            } as any);
            setIsEditOpen(false);
            setSelectedNote(null);
            resetForm();
            toast({ title: 'Note updated successfully' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error updating note' });
        }
    };

    const handleViewNote = (note: InternalNote) => {
        setSelectedNote(note);
        setIsViewOpen(true);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = notes.findIndex((n) => n.id === active.id);
            const newIndex = notes.findIndex((n) => n.id === over.id);

            const newOrderedNotes = arrayMove(notes, oldIndex, newIndex);
            reorderNotes(newOrderedNotes);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search agency notes..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            New Note
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Internal Note</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input 
                                    placeholder="Note title..." 
                                    value={noteTitle}
                                    onChange={(e) => setNoteTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Link to Client (Optional)</label>
                                <Select value={noteClientId} onValueChange={setNoteClientId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a client..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Client (General)</SelectItem>
                                        {clients.filter(c => c.active !== false).map(client => (
                                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Content</label>
                                <Textarea 
                                    placeholder="Write your note here..." 
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    className="min-h-[150px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddNote} disabled={!noteTitle.trim() || !noteContent.trim()}>Add Note</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28 w-full" />)}
                </div>
            ) : (
                <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext 
                        items={filteredNotes.map(n => n.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {filteredNotes.map(note => (
                                <SortableNoteCard 
                                    key={note.id} 
                                    note={note} 
                                    onView={handleViewNote}
                                    onEdit={handleEditNote}
                                    onDelete={deleteNote}
                                />
                            ))}
                            {filteredNotes.length === 0 && (
                                <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                    <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No notes found. Create one to share agency information.</p>
                                </div>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* View Note Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="bg-card">
                    <DialogHeader>
                        <div className="flex flex-col gap-2">
                            <DialogTitle className="text-xl font-bold">{selectedNote?.title}</DialogTitle>
                            {selectedNote?.clientName && (
                                <Badge variant="secondary" className="w-fit flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {selectedNote?.clientName}
                                </Badge>
                            )}
                        </div>
                    </DialogHeader>
                    <div className="py-4 max-h-[60vh] overflow-y-auto">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {selectedNote?.content}
                        </p>
                    </div>
                    <DialogFooter className="text-xs text-muted-foreground items-center justify-between border-t pt-4">
                        <div className="flex flex-col items-start">
                            <span>Author: {selectedNote?.authorName}</span>
                            <span>Created on: {selectedNote?.createdAt?.seconds ? format(new Date(selectedNote.createdAt.seconds * 1000), 'MMMM dd, yyyy') : 'Recently'}</span>
                        </div>
                        <Button onClick={() => setIsViewOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Note Dialog */}
            <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) resetForm(); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Internal Note</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input 
                                placeholder="Note title..." 
                                value={noteTitle}
                                onChange={(e) => setNoteTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Link to Client (Optional)</label>
                            <Select value={noteClientId} onValueChange={setNoteClientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a client..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Client (General)</SelectItem>
                                    {clients.filter(c => c.active !== false).map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Content</label>
                            <Textarea 
                                placeholder="Write your note here..." 
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                className="min-h-[150px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setIsEditOpen(false); resetForm(); }}>Cancel</Button>
                        <Button onClick={handleUpdateNote} disabled={!noteTitle.trim() || !noteContent.trim()}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}