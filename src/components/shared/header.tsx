'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/shared/user-nav';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Separator } from '../ui/separator';

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/tasks')) return 'Tasks';
  if (pathname.startsWith('/clients')) return 'Clients';
  if (pathname.startsWith('/reports')) return 'Create Client Report';
  if (pathname.startsWith('/summarize')) return 'Summarize Project Progress';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'OfficeFlow';
}

export function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm print:hidden sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <h1 className="font-headline text-xl font-semibold text-foreground">
        {title}
      </h1>
      <div className="ml-auto flex items-center gap-2">
         <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="p-4">
                <h3 className="font-headline text-lg font-medium">Notifications</h3>
                <p className="text-sm text-muted-foreground">You have 3 unread messages.</p>
            </div>
            <Separator />
            <div className="space-y-2 p-4">
                <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-accent"/>
                    <div>
                        <p className="text-sm font-medium">New task assigned</p>
                        <p className="text-xs text-muted-foreground">"Fix login authentication bug" was assigned to you.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-accent"/>
                    <div>
                        <p className="text-sm font-medium">Deadline approaching</p>
                        <p className="text-xs text-muted-foreground">"Client Meeting Preparation" is due tomorrow.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-accent"/>
                    <div>
                        <p className="text-sm font-medium">Report Generated</p>
                        <p className="text-xs text-muted-foreground">Your client report for Q3 is ready.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary/20"/>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Task Completed</p>
                        <p className="text-xs text-muted-foreground">Bob completed "Onboard new marketing intern".</p>
                    </div>
                </div>
            </div>
          </PopoverContent>
        </Popover>
        <UserNav />
      </div>
    </header>
  );
}
