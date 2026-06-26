'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SeoReportClientRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the main unified SEO report page
        router.replace('/seo-report');
    }, [router]);

    return null;
}
