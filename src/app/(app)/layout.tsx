'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/shared/sidebar-nav';
import { Header } from '@/components/shared/header';
import { TaskProvider } from '@/hooks/use-tasks';
import { AuthProvider } from '@/hooks/use-auth';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
        <TaskProvider>
            <SidebarProvider>
              <Sidebar>
                <SidebarNav />
              </Sidebar>
              <SidebarInset>
                <Header />
                <main className="p-4 sm:p-6 lg:p-8">{children}</main>
              </SidebarInset>
            </SidebarProvider>
        </TaskProvider>
    </AuthProvider>
  )
}
