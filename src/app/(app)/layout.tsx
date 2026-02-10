
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
import { NoteProvider } from '@/hooks/use-notes';

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
          <NoteProvider>
            <SidebarProvider>
              <Sidebar>
                <SidebarNav />
              </Sidebar>
              <SidebarInset>
                <Header />
                <main className="flex-1 overflow-y-auto p-1 sm:p-3 lg:p-4">{children}</main>
              </SidebarInset>
            </SidebarProvider>
          </NoteProvider>
        </ClientProvider>
      </TaskProvider>
    </UserProvider>
  );
}
