'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { users } from '@/lib/data';

function AtSignIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(email);
    if (!success) {
      setError('Invalid email address. Please use one of the test accounts.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-2 text-primary">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M2 22h20"/><path d="M7 22V6.27a1 1 0 0 1 .5-.87l6-3.46a1 1 0 0 1 1 0l6 3.46a1 1 0 0 1 .5.87V22"/><path d="M12 10a1.5 1.5 0 0 0-3 0v4a1.5 1.5 0 0 0 3 0v-4Z"/><path d="M12 10h3v4h-3"/><path d="M12 18a1.5 1.5 0 0 0-3 0v4h3v-4Z"/><path d="M12 18h3v4h-3"/></svg>
        <h1 className="font-headline text-4xl font-bold">OfficeFlow</h1>
      </div>
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Enter your email to sign in to your account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                 <AtSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full font-bold" type="submit">
              Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>
      <Alert className="mt-8 max-w-sm">
        <Terminal className="h-4 w-4" />
        <AlertTitle className="font-headline">Test Accounts</AlertTitle>
        <AlertDescription>
          You can use the following emails to log in:
          <ul className="mt-2 list-disc pl-5 text-xs">
            {users.map(user => (
              <li key={user.id}><code className="font-semibold">{user.email}</code> ({user.role})</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
