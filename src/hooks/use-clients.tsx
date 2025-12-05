'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { Client } from '@/lib/data';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useAuth } from './use-auth';

type ClientWithId = Client & { id: string };

interface ClientContextType {
    clients: ClientWithId[];
    loading: boolean;
    error: Error | null;
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

    const value = {
        clients,
        loading,
        error,
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
