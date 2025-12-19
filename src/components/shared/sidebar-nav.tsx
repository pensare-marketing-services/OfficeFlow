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
import { LayoutDashboard, Settings, Briefcase, PanelLeftClose, PanelRightClose, Building, ChevronDown, Tags } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useClients } from '@/hooks/use-clients';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { AppLogo } from './app-logo';
import React, { useMemo } from 'react';


const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
];

const clientCategories = [
    { key: 'seo', label: 'Clients - SEO', icon: Briefcase },
    { key: 'digital marketing', label: 'Clients - DM', icon: Briefcase },
    { key: 'website', label: 'Clients - Web', icon: Briefcase },
]


export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { clients, loading: clientsLoading } = useClients();

  const filteredNavItems = navItems.filter(item => {
    if (!item.adminOnly) return true;
    return user?.role === 'admin';
  });

  const categorizedClients = useMemo(() => {
    return {
      seo: clients.filter(c => c.categories?.includes('seo')),
      'digital marketing': clients.filter(c => c.categories?.includes('digital marketing')),
      website: clients.filter(c => c.categories?.includes('website')),
    }
  }, [clients]);

  return (
    <>
      <SidebarHeader>
         <div className="items-center">
            <AppLogo />
           
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {filteredNavItems.map((item) => (
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
          {user?.role === 'admin' && clientCategories.map(category => {
            const categoryClients = categorizedClients[category.key as keyof typeof categorizedClients];
            if (clientsLoading || categoryClients.length > 0) {
              return (
                 <Collapsible key={category.key} className="w-full" defaultOpen={pathname.includes('/clients')}>
                    <SidebarMenuItem>
                       <CollapsibleTrigger asChild>
                           <SidebarMenuButton isActive={pathname.startsWith('/clients')} className="group justify-between">
                              <span className='flex items-center gap-2'>
                                <category.icon className="h-4 w-4"/>
                                <span>{category.label}</span>
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
                            {!clientsLoading && categoryClients.map(client => (
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
                       </SidebarMenuSub>
                    </CollapsibleContent>
                 </Collapsible>
              )
            }
            return null;
          })}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
