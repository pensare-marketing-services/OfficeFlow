'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/shared/user-nav';
import { usePathname, useRouter } from 'next/navigation';

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/clients')) return 'Clients';
  if (pathname.startsWith('/website-listing')) return 'Website List';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/special-days')) return 'Special Days';
  if (pathname.startsWith('/seo-report')) return 'SEO / Keyword Report';
  return 'OfficeFlow';
}

export function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-10 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm print:hidden sm:px-6">
      <SidebarTrigger className="md:flex hidden" />
      <SidebarTrigger className="md:hidden" />
      <h1 className="font-headline text-xl font-semibold text-foreground">
        {title}
      </h1>
      <div className="ml-auto flex items-center gap-2">
        <UserNav />
      </div>
    </header>
  )
}
