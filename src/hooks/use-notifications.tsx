
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { Notification } from '@/lib/data';
import { collection, onSnapshot, query, where, updateDoc, doc, writeBatch, orderBy, Timestamp } from 'firebase/firestore';
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

        const notificationsQuery = query(
            collection(db, 'notifications'), 
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const serverNotifications = snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    ...data, 
                    id: doc.id,
                    // Ensure createdAt is a JS Date object for sorting
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date()
                } as NotificationWithId;
            });
            
            // Handle new notifications for toasts
            serverNotifications.forEach(notif => {
                if (!notif.read && !displayedToastsRef.current.has(notif.id)) {
                    // Check if it's a reasonably new notification to avoid toasting old ones on login
                    const tenMinutes = 10 * 60 * 1000;
                    if (new Date().getTime() - new Date(notif.createdAt).getTime() < tenMinutes) {
                        toast({
                            title: 'New Notification',
                            description: notif.message,
                        });
                         if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('OfficeFlow', {
                                body: notif.message,
                                icon: '/avatars/app-logo.png' 
                            });
                        }
                    }
                    displayedToastsRef.current.add(notif.id);
                }
            });

            // Update displayed notifications and mark all as "toasted"
            serverNotifications.forEach(notif => displayedToastsRef.current.add(notif.id));

            setNotifications(serverNotifications);
            setLoading(false);
        }, (err: any) => {
            console.error("Notifications subscription error:", err);
            if (err.code === 'failed-precondition') {
                 setError(new Error('Query requires an index. Sorting on client.'));
                 // Fallback to client-side sorting
                 const fallbackQuery = query(collection(db, 'notifications'), where('userId', '==', currentUser.uid));
                 const fallbackUnsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
                    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as NotificationWithId))
                                             .sort((a,b) => b.createdAt.toDate() - a.createdAt.toDate());
                    setNotifications(data);
                    setLoading(false);
                 });
                 return () => fallbackUnsubscribe();
            } else {
                setError(new Error('Failed to load notifications.'));
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
