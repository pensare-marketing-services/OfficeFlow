import Image from 'next/image';

export function AppLogo() {
    return (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Image src="/avatars/app-logo.png" alt="OfficeFlow Logo" width={24} height={24} />
        </div>
    );
}
