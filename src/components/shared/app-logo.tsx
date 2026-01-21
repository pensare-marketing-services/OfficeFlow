import Image from 'next/image';


export function AppLogo() {
    return (

        <div className="flex h-10 w-60 m-6 justify-start rounded-lg ">
            <Image src="/avatars/app-logo.png" alt="OfficeFlow Logo" width={200} height={90} />
        </div>

    );
}
export function AppLogoBlack() {
    return (
        <div className="flex h-10 w-60 m-6 justify-start rounded-lg ">
            <Image src="/avatars/app-logo.png" alt="OfficeFlow Logo" width={200} height={90} />
        </div>
    );
}
