'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { Client } from '@/lib/data';
import { collection, onSnapshot, query, orderBy, getDocs, where, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useAuth } from './use-auth';

type ClientWithId = Client & { id: string };

interface ClientContextType {
    clients: ClientWithId[];
    loading: boolean;
    error: Error | null;
    deleteClient: (clientId: string) => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user: currentUser } = useAuth();
    const [clients, setClients] = useState<ClientWithId[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!currentUser?.uid) {
            setClients([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const clientsQuery = query(collection(db, 'clients'), orderBy('name', 'asc'));

        const unsubClients = onSnapshot(clientsQuery, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ClientWithId));
            setClients(clientsData);
            setLoading(false);
        }, (err: any) => {
            console.error("Clients subscription error:", err);
            setError(new Error('Failed to load clients.'));
            setLoading(false);
        });

        return () => {
            unsubClients();
        };

    }, [currentUser?.uid]);

    const deleteClient = useCallback(async (clientId: string) => {
        if (!clientId) {
            throw new Error("Client ID is missing.");
        }
        
        const batch = writeBatch(db);

        // 1. Delete the client document itself
        const clientRef = doc(db, 'clients', clientId);
        batch.delete(clientRef);

        // 2. Delete tasks associated with the client
        const tasksRef = collection(db, 'tasks');
        const tasksQuery = query(tasksRef, where('clientId', '==', clientId));
        const tasksSnapshot = await getDocs(tasksQuery);
        tasksSnapshot.forEach(doc => batch.delete(doc.ref));

        // 3. Delete subcollections (promotions, cashIn, seoTasks)
        const subcollections = ['promotions', 'cashInTransactions', 'seoTasks'];
        for (const subcollectionName of subcollections) {
            const subcollectionRef = collection(db, 'clients', clientId, subcollectionName);
            const subcollectionSnapshot = await getDocs(subcollectionRef);
            subcollectionSnapshot.forEach(doc => batch.delete(doc.ref));
        }

        try {
            await batch.commit();
        } catch (e: any) {
            console.error("Error deleting client and associated data:", e);
            throw new Error("Failed to delete client data. Please check your Firestore security rules and network connection.");
        }
    }, []);

    const value = {
        clients,
        loading,
        error,
        deleteClient,
    };

    return (
        <ClientContext.Provider value={value}>
            {children}
        </ClientContext.Provider>
    );
};

export const useClients = () => {
    const context = useContext(ClientContext);
    if (context === undefined) {
        throw new Error('useClients must be used within a ClientProvider');
    }
    return context;
};
