'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { InternalNote } from '@/lib/data';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useAuth } from './use-auth';

interface NoteContextType {
    notes: InternalNote[];
    loading: boolean;
    error: Error | null;
    addNote: (title: string, content: string, color?: string, clientId?: string, clientName?: string) => Promise<void>;
    updateNote: (noteId: string, data: Partial<InternalNote>) => Promise<void>;
    deleteNote: (noteId: string) => Promise<void>;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export const NoteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user: currentUser } = useAuth();
    const [notes, setNotes] = useState<InternalNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!currentUser?.uid) {
            setNotes([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const notesQuery = query(collection(db, 'internalNotes'), orderBy('createdAt', 'desc'));

        const unsub = onSnapshot(notesQuery, (snapshot) => {
            const notesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as InternalNote));
            setNotes(notesData);
            setLoading(false);
        }, (err) => {
            console.error("Notes subscription error:", err);
            setError(new Error('Failed to load notes.'));
            setLoading(false);
        });

        return () => unsub();
    }, [currentUser?.uid]);

    const addNote = useCallback(async (title: string, content: string, color: string = 'bg-card', clientId?: string, clientName?: string) => {
        if (!currentUser) return;
        try {
            await addDoc(collection(db, 'internalNotes'), {
                title,
                content,
                color,
                clientId: clientId || null,
                clientName: clientName || null,
                authorId: currentUser.uid,
                authorName: currentUser.nickname || currentUser.username,
                createdAt: serverTimestamp(),
            });
        } catch (e) {
            console.error("Error adding note:", e);
            throw new Error('Failed to add note.');
        }
    }, [currentUser]);

    const updateNote = useCallback(async (noteId: string, data: Partial<InternalNote>) => {
        try {
            const noteRef = doc(db, 'internalNotes', noteId);
            await updateDoc(noteRef, data);
        } catch (e) {
            console.error("Error updating note:", e);
            throw new Error('Failed to update note.');
        }
    }, []);

    const deleteNote = useCallback(async (noteId: string) => {
        try {
            await deleteDoc(doc(db, 'internalNotes', noteId));
        } catch (e) {
            console.error("Error deleting note:", e);
            throw new Error('Failed to delete note.');
        }
    }, []);

    return (
        <NoteContext.Provider value={{ notes, loading, error, addNote, updateNote, deleteNote }}>
            {children}
        </NoteContext.Provider>
    );
};

export const useNotes = () => {
    const context = useContext(NoteContext);
    if (context === undefined) {
        throw new Error('useNotes must be used within a NoteProvider');
    }
    return context;
};
