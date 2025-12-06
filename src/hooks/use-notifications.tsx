
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { Notification } from '@/lib/data';
import { collection, onSnapshot, query, where, updateDoc, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

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
    const { toast } = useToast();
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

        // Query without ordering to avoid composite index requirement
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
            
            // Sort on the client
            serverNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            // Handle new notifications for toasts
            serverNotifications.forEach(notif => {
                if (!notif.read && !displayedToastsRef.current.has(notif.id)) {
                    // Check if it's a reasonably new notification to avoid toasting old ones on login
                    const tenMinutes = 10 * 60 * 1000;
                    if (new Date().getTime() - new Date(notif.createdAt).getTime() < tenMinutes) {
                         if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('OfficeFlow', {
                                body: notif.message,
                                icon: '/avatars/app-logo-black.png' 
                            });
                        }
                    }
                    displayedToastsRef.current.add(notif.id);
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

    }, [currentUser?.uid, toast]);

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
