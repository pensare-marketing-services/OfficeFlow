'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
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
import { Terminal, Loader2 } from 'lucide-react';
import { users as mockUsers } from '@/lib/data';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

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
  const { auth } = useAuth();
  const firestore = useFirestore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password'); // Default for demo
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Function to create user profiles from mock data
  const seedUser = async (email: string) => {
    if (!firestore) return;
    const userToSeed = mockUsers.find((u) => u.email === email);
    if (userToSeed) {
      try {
        await setDoc(doc(firestore, 'users', userToSeed.email), {
          name: userToSeed.name,
          email: userToSeed.email,
          role: userToSeed.role,
          avatar: userToSeed.avatar,
        });
      } catch (e) {
        console.error('Error seeding user profile:', e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auth) {
      setError('Auth service is not available.');
      setLoading(false);
      return;
    }

    try {
      // Try to sign in
      await signInWithEmailAndPassword(auth, email, password);
    } catch (signInError: any) {
      // If sign-in fails because the user doesn't exist, create a new account
      if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
        const isMockUser = mockUsers.some((u) => u.email === email);
        if (isMockUser) {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
            await seedUser(email); // Create the user profile document
          } catch (signUpError: any) {
            setError(signUpError.message);
          }
        } else {
          setError(
            'Invalid email address. Please use one of the test accounts.'
          );
        }
      } else {
        setError(signInError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-2 text-primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8"
        >
          <path d="M2 22h20" />
          <path d="M7 22V6.27a1 1 0 0 1 .5-.87l6-3.46a1 1 0 0 1 1 0l6 3.46a1 1 0 0 1 .5.87V22" />
          <path d="M12 10a1.5 1.5 0 0 0-3 0v4a1.5 1.5 0 0 0 3 0v-4Z" />
          <path d="M12 10h3v4h-3" />
          <path d="M12 18a1.5 1.5 0 0 0-3 0v4h3v-4Z" />
          <path d="M12 18h3v4h-3" />
        </svg>
        <h1 className="font-headline text-4xl font-bold">OfficeFlow</h1>
      </div>
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Welcome</CardTitle>
          <CardDescription>
            Sign in or create an account to continue.
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
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
              />
               <p className="text-xs text-muted-foreground">
                Hint: The password is `password` for all test accounts.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full font-bold" type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
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
            {mockUsers.map((user) => (
              <li key={user.id}>
                <code className="font-semibold">{user.email}</code> ({user.role}
                )
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
