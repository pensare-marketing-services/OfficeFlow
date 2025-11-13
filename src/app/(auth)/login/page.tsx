'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { users } from '@/lib/data';

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

export default function LoginPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Find the user by name (case-insensitive)
    const userToLogin = users.find(u => u.name.toLowerCase() === name.toLowerCase());

    if (userToLogin) {
      const success = login(userToLogin.name);
      if (success) {
        router.push('/dashboard');
      } else {
        // This case should ideally not happen if user is found, but as a fallback
        setError('Login failed. Please try again.');
        setLoading(false);
      }
    } else {
      setError('User not found. Please check the name.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-8 left-8 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <OfficeIcon className="h-6 w-6"/>
            </div>
            <span className="font-headline text-lg font-semibold text-foreground">OfficeFlow</span>
        </div>
      <Card className="w-full max-w-sm shadow-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
            <CardDescription>Enter your name to sign in to your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Admin User"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <p className="text-xs text-muted-foreground text-center">
                Available users: {users.map(u => u.name).join(', ')}
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
