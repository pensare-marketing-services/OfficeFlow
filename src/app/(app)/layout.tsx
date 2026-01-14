'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/shared/sidebar-nav';
import { Header } from '@/components/shared/header';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskProvider } from '@/hooks/use-tasks';
import { UserProvider } from '@/hooks/use-users';
import { ClientProvider } from '@/hooks/use-clients';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    // This is a common pattern to handle chunk loading errors in Next.js
    // after a new deployment. When a user navigates, their browser might
    // request an old JS chunk that no longer exists. This catches the
    // error and forces a page reload to get the new assets.
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        return await originalFetch(...args);
      } catch (error: any) {
        if (error && (error.name === 'ChunkLoadError' || /Loading chunk .* failed/i.test(error.message))) {
            console.warn('Chunk load error detected, forcing page reload.');
            window.location.reload();
        }
        throw error;
      }
    };
     // A listener for Next.js's router events can also be effective
    const handleRouteChangeError = (err: any, url: string) => {
        if (err.cancelled) {
            return;
        }
        if (/Loading chunk .* failed/i.test(err.message)) {
            console.warn(`Chunk load error on route change to ${url}, forcing reload.`);
            window.location.href = url; // Use window.location to force a full reload
        }
    };

    // The 'next/router' events are not available in App Router,
    // so we rely on the fetch override which is a more general solution.
    // However, if using Pages Router, you could add:
    // router.events.on('routeChangeError', handleRouteChangeError);
    // return () => {
    //   router.events.off('routeChangeError', handleRouteChangeError);
    // };

  }, [pathname]);


  if (loading || !user) {
     return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <UserProvider>
      <TaskProvider>
        <ClientProvider>
            <SidebarProvider>
              <Sidebar>
                <SidebarNav />
              </Sidebar>
              <SidebarInset>
                <Header />
                <main className="p-2 sm:p-3 lg:p-4">{children}</main>
              </SidebarInset>
            </SidebarProvider>
        </ClientProvider>
      </TaskProvider>
    </UserProvider>
  );
}
