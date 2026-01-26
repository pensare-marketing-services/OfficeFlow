import Image from 'next/image';

export function AppLogo() {
    return (
        <div className="flex h-12 items-center justify-start px-4">
            <Image src="/avatars/app-logo-black.png" alt="OfficeFlow Logo" width={150} height={40} style={{ objectFit: 'contain' }} />
        </div>
    );
}
export function AppLogoBlack() {
    return (
        <div className="flex h-15 w-60 m-6 justify-start rounded-lg ">
            <Image src="/avatars/app-logo-black.png" alt="OfficeFlow Logo" width={200} height={90} />
        </div>
    );
}
