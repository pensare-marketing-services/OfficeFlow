
'use client';

import React, { useState, useMemo } from 'react';
import { useNotes } from '@/hooks/use-notes';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Search, Calendar, User, StickyNote } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { capitalizeSentences } from '@/lib/utils';

const COLORS = [
    { name: 'Default', value: 'bg-card' },
    { name: 'Yellow', value: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { name: 'Blue', value: 'bg-blue-100 dark:bg-blue-900/30' },
    { name: 'Green', value: 'bg-green-100 dark:bg-green-900/30' },
    { name: 'Red', value: 'bg-red-100 dark:bg-red-900/30' },
];

export default function NotesPage() {
    const { notes, loading, addNote, deleteNote } = useNotes();
    const [search, setSearch] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newColor, setNewColor] = useState('bg-card');
    const [isDialogOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const filteredNotes = useMemo(() => {
        return notes.filter(n => 
            n.title.toLowerCase().includes(search.toLowerCase()) || 
            n.content.toLowerCase().includes(search.toLowerCase())
        );
    }, [notes, search]);

    const handleAddNote = async () => {
        if (!newTitle.trim() || !newContent.trim()) return;
        try {
            await addNote(capitalizeSentences(newTitle), capitalizeSentences(newContent), newColor);
            setNewTitle('');
            setNewContent('');
            setIsOpen(false);
            toast({ title: 'Note added successfully' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error adding note' });
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
                <Dialog open={isDialogOpen} onOpenChange={setIsOpen}>
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
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Content</label>
                                <Textarea 
                                    placeholder="Write your note here..." 
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    className="min-h-[150px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category Color</label>
                                <div className="flex gap-2">
                                    {COLORS.map(c => (
                                        <button
                                            key={c.value}
                                            onClick={() => setNewColor(c.value)}
                                            className={`h-8 w-8 rounded-full border-2 ${c.value} ${newColor === c.value ? 'border-primary' : 'border-transparent'}`}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddNote} disabled={!newTitle.trim() || !newContent.trim()}>Add Note</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNotes.map(note => (
                        <Card key={note.id} className={`${note.color || 'bg-card'} shadow-sm border transition-shadow hover:shadow-md flex flex-col`}>
                            <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg font-semibold">{note.title}</CardTitle>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => deleteNote(note.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 flex-1">
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {note.content}
                                </p>
                            </CardContent>
                            <CardFooter className="p-4 pt-2 border-t bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {note.authorName}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {note.createdAt?.seconds ? format(new Date(note.createdAt.seconds * 1000), 'MMM dd, yyyy') : 'Recently'}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                    {filteredNotes.length === 0 && (
                        <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No notes found. Create one to share agency information.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
