'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/shared/user-nav';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, CircleDot, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Separator } from '../ui/separator';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/clients')) return 'Clients';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'OfficeFlow';
}

const NotificationTime = ({ date }: { date: string | Date }) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    setTimeAgo(formatDistanceToNow(new Date(date), { addSuffix: true }));
  }, [date]);

  if (!timeAgo) {
    return null; // Render nothing on the server and initial client render
  }

  return <p className="text-xs text-muted-foreground">{timeAgo}</p>;
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = (notification: { id: string, link?: string, read: boolean }) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-10 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm print:hidden sm:px-6">
      <SidebarTrigger className="md:flex hidden" />
      <SidebarTrigger className="md:hidden" />
      <h1 className="font-headline text-xl font-semibold text-foreground">
        {title}
      </h1>
      <div className="ml-auto flex items-center gap-2">
         <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                 <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 items-center justify-center bg-accent text-accent-foreground text-[8px]">
                      {unreadCount}
                    </span>
                  </span>
              )}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0">
            <div className="flex items-center justify-between p-4">
                <h3 className="font-headline text-lg font-medium">Notifications</h3>
                {unreadCount > 0 && (
                  <Button variant="link" size="sm" className="h-auto p-0" onClick={markAllAsRead}>
                    Mark all as read
                  </Button>
                )}
            </div>
            <Separator />
             {notifications.length === 0 ? (
                <div className="text-center text-muted-foreground p-8">
                  <div className="flex justify-center mb-4">
                      <div className="rounded-full bg-secondary p-4">
                          <Bell className="h-8 w-8 text-muted-foreground" />
                      </div>
                  </div>
                  <h3 className="font-semibold">No notifications yet</h3>
                  <p className="text-sm">We'll let you know when something comes up.</p>
                </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={cn(
                      "flex items-start gap-3 p-4 border-b hover:bg-muted/50 cursor-pointer",
                      notif.read && "opacity-60"
                    )}
                    onClick={() => handleNotificationClick(notif)}
                  >
                      {!notif.read && <div className="mt-1 h-2 w-2 rounded-full bg-accent flex-shrink-0"/>}
                      <Mail className={cn("h-4 w-4 flex-shrink-0 mt-0.5", notif.read && "ml-[16px]")} />
                      <div className="flex-1">
                          <p className="text-sm">{notif.message}</p>
                          <NotificationTime date={notif.createdAt} />
                      </div>
                  </div>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
        <UserNav />
      </div>
    </header>
  );
}
