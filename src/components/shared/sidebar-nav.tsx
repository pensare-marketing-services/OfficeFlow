'use client';

import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Settings, Briefcase, PanelLeftClose, PanelRightClose, Building, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useClients } from '@/hooks/use-clients';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { AppLogo } from './app-logo';


const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { name: 'clients', label: 'Clients', icon: Briefcase, adminOnly: true },
  { href: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
];


export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { clients, loading: clientsLoading } = useClients();

  const filteredNavItems = navItems.filter(item => {
    if (!item.adminOnly) return true;
    return user?.role === 'admin';
  });

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <AppLogo />
            <span className="font-headline text-lg font-semibold text-sidebar-foreground">OfficeFlow</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {filteredNavItems.map((item) => {
            if (item.name === 'clients') {
              return (
                 <Collapsible key={item.name} className="w-full">
                    <SidebarMenuItem>
                       <CollapsibleTrigger asChild>
                           <SidebarMenuButton isActive={pathname.startsWith('/clients')} className="justify-between">
                              <span className='flex items-center gap-2'>
                                <item.icon />
                                <span>{item.label}</span>
                              </span>
                              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:-rotate-180" />
                           </SidebarMenuButton>
                        </CollapsibleTrigger>
                    </SidebarMenuItem>
                    <CollapsibleContent>
                       <SidebarMenuSub>
                           {clientsLoading && (
                                <>
                                    <Skeleton className="h-7 w-full" />
                                    <Skeleton className="h-7 w-full" />
                                </>
                            )}
                            {clients.map(client => (
                                <SidebarMenuItem key={client.id}>
                                    <Link href={`/clients/${client.id}`} legacyBehavior passHref>
                                        <SidebarMenuSubButton as="a" isActive={pathname === `/clients/${client.id}`}>
                                            <Building />
                                            <span>{client.name}</span>
                                        </SidebarMenuSubButton>
                                    </Link>
                                </SidebarMenuItem>
                            ))}
                       </SidebarMenuSub>
                    </CollapsibleContent>
                 </Collapsible>
              )
            }
            
            return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href!}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href!)}
                      tooltip={{
                        children: item.label,
                      }}
                    >
                        <span>
                          <item.icon />
                          <span>{item.label}</span>
                        </span>
                    </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
