import { Workflow } from 'lucide-react';
import Image from 'next/image';


export function AppLogo() {
    return (
        // <div className="flex h-10 items-center gap-2">
        //     <Workflow className="h-6 w-6 shrink-0 text-sidebar-primary" />
        //     <span className="font-headline text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
        //         OfficeFlow
        //     </span>
        // </div>

<div className="flex h-10 w-60 m-6 justify-start rounded-lg ">
<Image src="/avatars/app-logo.png" alt="OfficeFlow Logo" width={200} height={90} />
</div>

    );
}
export function AppLogoBlack() {
    return (
        //  <div className="flex items-center gap-2">
        //     <Workflow className="h-6 w-6 text-primary" />
        //     <span className="font-headline text-xl font-semibold text-foreground">
        //         OfficeFlow
        //     </span>
        // </div>
        <div className="flex h-10 w-60 m-6 justify-start rounded-lg ">
<Image src="/avatars/app-logo.png" alt="OfficeFlow Logo" width={200} height={90} />
</div>
    );
}
