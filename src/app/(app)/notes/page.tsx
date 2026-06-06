'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotesIndexPage() {
    const router = useRouter();

    useEffect(() => {
        // Default to consolidated Web-SEO Notes when landing on /notes
        router.replace('/notes/web');
    }, [router]);

    return null;
}
