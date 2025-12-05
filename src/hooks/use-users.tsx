'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { UserProfile } from '@/lib/data';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useAuth } from './use-auth';

type UserWithId = UserProfile & { id: string };

interface UserContextType {
    users: UserWithId[];
    loading: boolean;
    error: Error | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserWithId[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!currentUser?.uid) {
            setUsers([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const usersQuery = query(collection(db, 'users'), orderBy('name', 'asc'));

        const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserWithId));
            setUsers(usersData);
            setLoading(false);
        }, (err: any) => {
            console.error("Users subscription error:", err);
            setError(new Error('Failed to load users. A browser extension (like an ad blocker) might be blocking network requests to Firebase. Please disable it for this site and refresh the page.'));
            setLoading(false);
        });

        return () => {
            unsubUsers();
        };

    }, [currentUser?.uid]);

    const value = {
        users,
        loading,
        error,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUsers = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUsers must be used within a UserProvider');
    }
    return context;
};
