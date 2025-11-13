'use client';
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <p>Redirecting to dashboard...</p>
    </div>
  );
}
