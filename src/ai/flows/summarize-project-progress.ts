'use server';
/**
 * @fileOverview This file defines a Genkit flow for summarizing project progress.
 *
 * - summarizeProjectProgress - A function that takes project details and returns a client-friendly summary.
 * - SummarizeProjectProgressInput - The input type for the summarizeProjectProgress function.
 * - SummarizeProjectProgressOutput - The return type for the summarizeProjectProgress function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeProjectProgressInputSchema = z.object({
  projectDetails: z
    .string()
    .describe('Detailed information about the project progress, including tasks completed, ongoing issues, and upcoming milestones.'),
});
export type SummarizeProjectProgressInput = z.infer<typeof SummarizeProjectProgressInputSchema>;

const SummarizeProjectProgressOutputSchema = z.object({
  summary: z.string().describe('A client-friendly summary of the project progress.'),
  progress: z.string().describe('A short summary of what was generated.'),
});
export type SummarizeProjectProgressOutput = z.infer<typeof SummarizeProjectProgressOutputSchema>;

export async function summarizeProjectProgress(input: SummarizeProjectProgressInput): Promise<SummarizeProjectProgressOutput> {
  return summarizeProjectProgressFlow(input);
}

const summarizeProjectProgressPrompt = ai.definePrompt({
  name: 'summarizeProjectProgressPrompt',
  input: {schema: SummarizeProjectProgressInputSchema},
  output: {schema: SummarizeProjectProgressOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing project progress for clients. Your goal is to provide a clear, concise, and positive overview of the project's status, highlighting key achievements and milestones while downplaying any setbacks or technical jargon. The summary should be easily understandable by non-technical stakeholders and should instill confidence in the project's success.

Project Details: {{{projectDetails}}}`,
});

const summarizeProjectProgressFlow = ai.defineFlow(
  {
    name: 'summarizeProjectProgressFlow',
    inputSchema: SummarizeProjectProgressInputSchema,
    outputSchema: SummarizeProjectProgressOutputSchema,
  },
  async input => {
    const {output} = await summarizeProjectProgressPrompt(input);
    return {
      ...output!,
      progress: 'Generated a client-friendly summary of the project progress.',
    };
  }
);
