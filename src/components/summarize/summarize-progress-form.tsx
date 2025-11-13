'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { summarizeProjectProgress } from '@/ai/flows/summarize-project-progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const summarizeSchema = z.object({
  projectDetails: z.string().min(50, 'Please provide more details for a better summary.'),
});

type SummarizeFormValues = z.infer<typeof summarizeSchema>;

export default function SummarizeProgressForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const form = useForm<SummarizeFormValues>({
    resolver: zodResolver(summarizeSchema),
    defaultValues: {
      projectDetails: 'Project "Apollo" update: Completed sprint 3 tasks including user authentication refactor (now uses OAuth 2.0) and database migration from MongoDB to PostgreSQL. Encountered a minor blocker with the CI/CD pipeline, which delayed deployment by 2 hours, but it is now resolved. Next sprint will focus on implementing the real-time notification system using WebSockets.',
    },
  });

  async function onSubmit(data: SummarizeFormValues) {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const result = await summarizeProjectProgress(data);
      setSummary(result.summary);
    } catch (e) {
      console.error(e);
      setError('Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (summary) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2"><FileText/> AI-Generated Summary</CardTitle>
                <CardDescription>A client-friendly summary of the project progress.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="prose prose-sm max-w-none rounded-md border bg-muted/30 p-4 whitespace-pre-wrap">
                    {summary}
                </div>
            </CardContent>
             <CardFooter>
                <Button variant="ghost" onClick={() => setSummary(null)}>
                    Summarize another update
                </Button>
            </CardFooter>
        </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Project Details</CardTitle>
        <CardDescription>Enter the raw project progress details below. Pre-filled with sample data.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="projectDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Progress Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={10}
                      placeholder="e.g., 'Completed sprint tasks, fixed bugs, upcoming features...'"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
             {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              {loading ? 'Summarizing...' : 'Generate AI Summary'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
