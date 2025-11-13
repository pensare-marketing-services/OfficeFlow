'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating client-friendly reports summarizing project progress.
 *
 * generateClientReport - A function that generates the report.
 * GenerateClientReportInput - The input type for the generateClientReport function.
 * GenerateClientReportOutput - The return type for the generateClientReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateClientReportInputSchema = z.object({
  projectOverview: z
    .string()
    .describe('Overview of the project, its goals, and key milestones.'),
  taskSummaries: z
    .string()
    .describe(
      'Summaries of tasks completed, including achievements and challenges encountered.'
    ),
  employeePerformance: z
    .string()
    .describe('Summary of employee performance and contributions to the project.'),
  timelineSummary: z
    .string()
    .describe('Summary of the project timeline and key dates.'),
});
export type GenerateClientReportInput = z.infer<typeof GenerateClientReportInputSchema>;

const GenerateClientReportOutputSchema = z.object({
  reportSummary: z.string().describe('A concise, client-friendly summary of the project.'),
});
export type GenerateClientReportOutput = z.infer<typeof GenerateClientReportOutputSchema>;

export async function generateClientReport(
  input: GenerateClientReportInput
): Promise<GenerateClientReportOutput> {
  return generateClientReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateClientReportPrompt',
  input: {schema: GenerateClientReportInputSchema},
  output: {schema: GenerateClientReportOutputSchema},
  prompt: `You are an AI assistant tasked with generating client-friendly project reports.

  Based on the following information, create a concise and professional summary suitable for clients.

  Project Overview: {{{projectOverview}}}
  Task Summaries: {{{taskSummaries}}}
  Employee Performance: {{{employeePerformance}}}
  Timeline Summary: {{{timelineSummary}}}

  Report Summary:`,
});

const generateClientReportFlow = ai.defineFlow(
  {
    name: 'generateClientReportFlow',
    inputSchema: GenerateClientReportInputSchema,
    outputSchema: GenerateClientReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
