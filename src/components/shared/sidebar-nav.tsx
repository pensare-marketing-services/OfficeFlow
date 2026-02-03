
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
import { LayoutDashboard, Settings, Building, ChevronDown, User } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useClients } from '@/hooks/use-clients';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Skeleton } from '../ui/skeleton';
import { AppLogo } from './app-logo';
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';


const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
];

const accountNavItem = { href: '/account', label: 'Accounts', icon: User, adminOnly: true };

const settingsNavItem = { href: '/settings', label: 'Settings', icon: Settings, adminOnly: true };

type CategoryFilter = "all" | "digital marketing" | "seo" | "website" | "gd";

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { clients, loading: clientsLoading } = useClients();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [isClientCollapsibleOpen, setClientCollapsibleOpen] = useState(pathname.startsWith('/clients'));
  
  useEffect(() => {
    setClientCollapsibleOpen(pathname.startsWith('/clients'));
  }, [pathname]);


  const activeClients = useMemo(() => clients.filter(c => c.active !== false).sort((a, b) => (a.priority || 0) - (b.priority || 0)), [clients]);

  const filteredClients = useMemo(() => {
    if (categoryFilter === 'all') {
      return activeClients;
    }
    return activeClients.filter(client => 
        client.categories?.some(cat => cat.toLowerCase() === categoryFilter.toLowerCase())
    );
  }, [activeClients, categoryFilter]);
  
  const handleFilterClick = (filter: CategoryFilter) => {
    setCategoryFilter(prev => prev === filter ? 'all' : filter);
    if (!isClientCollapsibleOpen) {
      setClientCollapsibleOpen(true);
    }
  };
  
  return (
    <>
      <SidebarHeader>
         <div className="flex items-center group-data-[collapsible=icon]:justify-center">
            <AppLogo />
           
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {mainNavItems.map((item) => (
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
              <Collapsible 
                className="w-full" 
                open={isClientCollapsibleOpen}
                onOpenChange={setClientCollapsibleOpen}
              >
                <SidebarMenuItem>
                   <CollapsibleTrigger asChild>
                     <SidebarMenuButton asChild isActive={pathname.startsWith('/clients')} className="group justify-between">
                         <div className="flex w-full items-center justify-between">
                            <span className='flex items-center gap-2'>
                                <Building className="h-4 w-4"/>
                                <span>Clients</span>
                            </span>
                          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:-rotate-180" />
                        </div>
                    </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden px-2 pt-1">
                        <Button size="sm" variant={categoryFilter === 'digital marketing' ? 'secondary' : 'outline'} className={cn("h-5 px-1.5 text-[10px] border-sidebar-border w-full", categoryFilter === 'digital marketing' ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-transparent hover:bg-sidebar-accent')} onClick={(e) => { e.stopPropagation(); handleFilterClick('digital marketing'); }}>DM</Button>
                        <Button size="sm" variant={categoryFilter === 'seo' ? 'secondary' : 'outline'} className={cn("h-5 px-1.5 text-[10px] border-sidebar-border w-full", categoryFilter === 'seo' ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-transparent hover:bg-sidebar-accent')} onClick={(e) => { e.stopPropagation(); handleFilterClick('seo'); }}>SEO</Button>
                        <Button size="sm" variant={categoryFilter === 'website' ? 'secondary' : 'outline'} className={cn("h-5 px-1.5 text-[10px] border-sidebar-border w-full", categoryFilter === 'website' ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-transparent hover:bg-sidebar-accent')} onClick={(e) => { e.stopPropagation(); handleFilterClick('website'); }}>Web</Button>
                        <Button size="sm" variant={categoryFilter === 'gd' ? 'secondary' : 'outline'} className={cn("h-5 px-1.5 text-[10px] border-sidebar-border w-full", categoryFilter === 'gd' ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-transparent hover:bg-sidebar-accent')} onClick={(e) => { e.stopPropagation(); handleFilterClick('gd'); }}>GD</Button>
                    </div>
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
                        {!clientsLoading && filteredClients.map((client, index) => (
                            <SidebarMenuItem key={client.id}>
                                <Link href={`/clients/${client.id}`}>
                                    <SidebarMenuSubButton asChild isActive={pathname === `/clients/${client.id}`}>
                                        <span>
                                            <span className="flex h-4 w-4 items-center justify-center text-[10px]">{index + 1}</span>
                                            <span>{client.name}</span>
                                        </span>
                                    </SidebarMenuSubButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}
                        {!clientsLoading && filteredClients.length === 0 && (
                             <SidebarMenuItem>
                               <span
                                  aria-disabled="true"
                                  className="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-xs text-sidebar-foreground opacity-50 outline-none [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground"
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
              <Link href={accountNavItem.href!}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(accountNavItem.href!)}
                    tooltip={{
                      children: accountNavItem.label,
                    }}
                  >
                      <span>
                        <accountNavItem.icon />
                        <span>{accountNavItem.label}</span>
                      </span>
                  </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
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
