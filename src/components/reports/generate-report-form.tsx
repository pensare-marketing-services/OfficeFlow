'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateClientReport } from '@/ai/flows/generate-client-report';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, FileText, Printer } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const reportSchema = z.object({
  projectOverview: z.string().min(20, 'Please provide a more detailed project overview.'),
  taskSummaries: z.string().min(20, 'Please provide more detail on task summaries.'),
  employeePerformance: z.string().min(20, 'Please provide more detail on employee performance.'),
  timelineSummary: z.string().min(20, 'Please provide a more detailed timeline summary.'),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function GenerateReportForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportSummary, setReportSummary] = useState<string | null>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      projectOverview: 'The OfficeFlow project aims to build a comprehensive management system. Key goals include task management, user roles, and a client reporting tool.',
      taskSummaries: 'Frontend development is 80% complete. Backend for task management is done. AI integration for summarization is in progress. Some bugs were found in the login system and have been patched.',
      employeePerformance: 'Alice has excelled in UI development. Bob was instrumental in fixing a critical authentication bug. Charlie is on track with financial projections.',
      timelineSummary: 'Project is currently on schedule. The expected completion date for the main features is in 3 weeks. Client demonstration is scheduled for the end of the month.',
    },
  });

  async function onSubmit(data: ReportFormValues) {
    setLoading(true);
    setError(null);
    setReportSummary(null);
    try {
      const result = await generateClientReport(data);
      setReportSummary(result.reportSummary);
    } catch (e) {
      console.error(e);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  const handlePrint = () => {
    window.print();
  };

  if (reportSummary) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2"><FileText/> Client Report Summary</CardTitle>
                        <CardDescription>AI-generated summary ready for client presentation.</CardDescription>
                    </div>
                     <Button variant="outline" size="sm" onClick={handlePrint} className="hidden print:hidden">
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="prose prose-sm max-w-none rounded-md border bg-muted/30 p-4 whitespace-pre-wrap">
                    {reportSummary}
                </div>
            </CardContent>
             <CardFooter className="print:hidden">
                <Button variant="ghost" onClick={() => setReportSummary(null)}>
                    Create another report
                </Button>
            </CardFooter>
        </Card>
    );
  }

  return (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-xl">Report Details</CardTitle>
            <CardDescription>Provide the details for the report. Pre-filled with sample data.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="projectOverview" render={({ field }) => (
                        <FormItem><FormLabel>Project Overview</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="taskSummaries" render={({ field }) => (
                        <FormItem><FormLabel>Task Summaries</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="employeePerformance" render={({ field }) => (
                        <FormItem><FormLabel>Employee Performance</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="timelineSummary" render={({ field }) => (
                        <FormItem><FormLabel>Timeline Summary</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
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
                        {loading ? 'Generating...' : 'Generate AI Summary'}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    </Card>
  );
}
