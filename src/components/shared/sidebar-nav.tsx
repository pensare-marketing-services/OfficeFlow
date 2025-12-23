'use client';

import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Settings, Briefcase, Building, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useClients } from '@/hooks/use-clients';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Skeleton } from '../ui/skeleton';
import { AppLogo } from './app-logo';
import React from 'react';


const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
];

const settingsNavItem = { href: '/settings', label: 'Settings', icon: Settings, adminOnly: true };


export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { clients, loading: clientsLoading } = useClients();

  const filteredMainNavItems = mainNavItems.filter(item => {
    if (!item.adminOnly) return true;
    return user?.role === 'admin';
  });
  
  return (
    <>
      <SidebarHeader>
         <div className="items-center">
            <AppLogo />
           
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {filteredMainNavItems.map((item) => (
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
          ))}
          {user?.role === 'admin' && (
              <Collapsible className="w-full" defaultOpen={pathname.startsWith('/clients')}>
                <SidebarMenuItem>
                   <CollapsibleTrigger asChild>
                       <SidebarMenuButton isActive={pathname.startsWith('/clients')} className="group justify-between">
                          <span className='flex items-center gap-2'>
                            <Briefcase className="h-4 w-4"/>
                            <span>Clients</span>
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
                                <Skeleton className="h-7 w-full" />
                            </>
                        )}
                        {!clientsLoading && clients.map(client => (
                            <SidebarMenuItem key={client.id}>
                                <Link href={`/clients/${client.id}`}>
                                    <SidebarMenuSubButton asChild isActive={pathname === `/clients/${client.id}`}>
                                        <span>
                                            <Building />
                                            <span>{client.name}</span>
                                        </span>
                                    </SidebarMenuSubButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}
                        {!clientsLoading && clients.length === 0 && (
                             <SidebarMenuItem>
                               <span
                                  aria-disabled="true"
                                  className="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sm text-sidebar-foreground opacity-50 outline-none [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground"
                                >
                                  No clients found
                                </span>
                            </SidebarMenuItem>
                        )}
                   </SidebarMenuSub>
                </CollapsibleContent>
             </Collapsible>
          )}
           {user?.role === 'admin' && (
             <SidebarMenuItem>
                <Link href={settingsNavItem.href!}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(settingsNavItem.href!)}
                      tooltip={{
                        children: settingsNavItem.label,
                      }}
                    >
                        <span>
                          <settingsNavItem.icon />
                          <span>{settingsNavItem.label}</span>
                        </span>
                    </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
           )}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
