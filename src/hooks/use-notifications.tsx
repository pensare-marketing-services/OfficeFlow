
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { Notification } from '@/lib/data';
import { collection, onSnapshot, query, where, updateDoc, doc, writeBatch, Timestamp } from 'firebase/firestore';
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
    const displayedToastsRef = useRef(new Set());

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);
    
    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!currentUser?.uid) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        displayedToastsRef.current.clear(); // Reset on user change

        const notificationsQuery = query(
            collection(db, 'notifications'), 
            where('userId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const serverNotifications = snapshot.docs.map(doc => {
                const data = doc.data();
                const createdAt = data.createdAt instanceof Timestamp 
                    ? data.createdAt.toDate() 
                    : new Date(); // Fallback for any non-timestamp values
                return { 
                    ...data, 
                    id: doc.id,
                    createdAt
                } as NotificationWithId;
            });
            
            serverNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const newNotif = change.doc.data() as Notification;
                    if (!newNotif.read) {
                        if ('Notification' in window && Notification.permission === 'granted') {
                           new Notification('OfficeFlow', {
                                body: newNotif.message,
                                icon: '/avatars/app-logo-black.png' 
                            });
                        }
                    }
                }
            });

            setNotifications(serverNotifications);
            setLoading(false);
        }, (err: any) => {
            console.error("Notifications subscription error:", err);
            if (err.code === 'failed-precondition' && err.message.includes('requires an index')) {
                 setError(new Error('Firestore needs an index for notifications. Please check the console for a link to create it.'));
            } else {
                 setError(new Error('Failed to load notifications. Please check your connection or browser extensions.'));
            }
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
