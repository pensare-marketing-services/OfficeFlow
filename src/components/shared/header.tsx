'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/shared/user-nav';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/clients')) return 'Clients';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'OfficeFlow';
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-10 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm print:hidden sm:px-6">
      <SidebarTrigger className="md:flex hidden" />
      <SidebarTrigger className="md:hidden" />
      <h1 className="font-headline text-xl font-semibold text-foreground">
        {title}
      </h1>
      <div className="ml-auto flex items-center gap-2">
        <UserNav />
      </div>
    </header>
  );
}
