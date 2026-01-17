'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/lib/data';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useAuth } from './use-auth';

type UserWithId = UserProfile & { id: string };

interface UserContextType {
    users: UserWithId[];
    loading: boolean;
    error: Error | null;
    deleteUser: (userId: string) => Promise<void>;
    updateUserPassword: (userId: string, newPassword: string) => Promise<void>;
    updateUserPriority: (userId: string, newPriority: number) => Promise<void>;
    updateUserNickname: (userId: string, newNickname: string) => Promise<void>;
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

        const usersQuery = query(collection(db, 'users'), orderBy('username', 'asc'));

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
    
    const deleteUser = useCallback(async (userId: string) => {
        try {
            const userDocRef = doc(db, 'users', userId);
            await deleteDoc(userDocRef);
        } catch (e: any) {
            console.error("Error deleting user:", e);
            throw new Error("Failed to delete user. Please try again.");
        }
    }, []);

    const updateUserPassword = useCallback(async (userId: string, newPassword: string) => {
        if (newPassword.length < 6) {
            throw new Error("Password must be at least 6 characters long.");
        }
        try {
            const userDocRef = doc(db, 'users', userId);
            await updateDoc(userDocRef, { password: newPassword });
        } catch (e: any) {
            console.error("Error updating password:", e);
            throw new Error("Failed to update password. Please try again.");
        }
    }, []);

    const updateUserPriority = useCallback(async (userId: string, newPriority: number) => {
         try {
            const userDocRef = doc(db, 'users', userId);
            await updateDoc(userDocRef, { priority: newPriority });
        } catch (e: any) {
            console.error("Error updating user priority:", e);
            throw new Error("Failed to update priority. Please try again.");
        }
    }, []);

    const updateUserNickname = useCallback(async (userId: string, newNickname: string) => {
        if (!newNickname || newNickname.trim().length < 2) {
            throw new Error("Nickname must be at least 2 characters long.");
        }
        try {
            const userDocRef = doc(db, 'users', userId);
            await updateDoc(userDocRef, { nickname: newNickname });
        } catch (e: any) {
            console.error("Error updating nickname:", e);
            throw new Error("Failed to update nickname. Please try again.");
        }
    }, []);

    const value = {
        users,
        loading,
        error,
        deleteUser,
        updateUserPassword,
        updateUserPriority,
        updateUserNickname,
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
