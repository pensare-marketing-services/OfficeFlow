import { Workflow } from 'lucide-react';

export function AppLogo() {
    return (
        <div className="flex h-10 items-center gap-2">
            <Workflow className="h-6 w-6 shrink-0 text-sidebar-primary" />
            <span className="font-headline text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                OfficeFlow
            </span>
        </div>
    );
}
export function AppLogoBlack() {
    return (
         <div className="flex items-center gap-2">
            <Workflow className="h-6 w-6 text-primary" />
            <span className="font-headline text-xl font-semibold text-foreground">
                OfficeFlow
            </span>
        </div>
    );
}
