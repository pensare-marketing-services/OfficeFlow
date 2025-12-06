
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { Notification } from '@/lib/data';
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useAuth } from './use-auth';

type NotificationWithId = Notification & { id: string };

interface NotificationContextType {
    notifications: NotificationWithId[];
    unreadCount: number;
    loading: boolean;
    error: Error | null;
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user: currentUser } = useAuth();
    const [notifications, setNotifications] = useState<NotificationWithId[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!currentUser?.uid) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const notificationsQuery = query(
            collection(db, 'notifications'), 
            where('userId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const notificationsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as NotificationWithId));
            
            // Sort on the client side
            notificationsData.sort((a, b) => {
                const dateA = a.createdAt?.toDate() || 0;
                const dateB = b.createdAt?.toDate() || 0;
                return dateB - dateA;
            });
            
            setNotifications(notificationsData);
            setLoading(false);
        }, (err: any) => {
            console.error("Notifications subscription error:", err);
            setError(new Error('Failed to load notifications.'));
            setLoading(false);
        });

        return () => unsubscribe();

    }, [currentUser?.uid]);

    const markAsRead = useCallback(async (notificationId: string) => {
        const notifRef = doc(db, 'notifications', notificationId);
        try {
            await updateDoc(notifRef, { read: true });
        } catch (e) {
            console.error("Error marking notification as read:", e);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        if (unreadCount === 0) return;

        const batch = writeBatch(db);
        notifications.forEach(n => {
            if (!n.read) {
                const notifRef = doc(db, 'notifications', n.id);
                batch.update(notifRef, { read: true });
            }
        });
        
        try {
            await batch.commit();
        } catch (e) {
            console.error("Error marking all notifications as read:", e);
        }

    }, [notifications, unreadCount]);

    const value = {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
