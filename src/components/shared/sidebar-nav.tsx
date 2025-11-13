'use client';

import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Settings, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/clients', label: 'Clients', icon: Briefcase, adminOnly: true },
  { href: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
];

function OfficeIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 22h20"/><path d="M7 22V6.27a1 1 0 0 1 .5-.87l6-3.46a1 1 0 0 1 1 0l6 3.46a1 1 0 0 1 .5.87V22"/><path d="M12 10a1.5 1.5 0 0 0-3 0v4a1.5 1.5 0 0 0 3 0v-4Z"/><path d="M12 10h3v4h-3"/><path d="M12 18a1.5 1.5 0 0 0-3 0v4h3v-4Z"/><path d="M12 18h3v4h-3"/>
      </svg>
    )
}

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredNavItems = navItems.filter(item => !item.adminOnly || user?.role === 'admin');

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <OfficeIcon className="h-6 w-6"/>
            </div>
            <span className="font-headline text-lg font-semibold text-sidebar-foreground">OfficeFlow</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {filteredNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{
                    children: item.label,
                  }}
                >
                    <item.icon />
                    <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
