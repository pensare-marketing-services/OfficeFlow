/**
 * @fileoverview This file initializes the Genkit AI instance and configures plugins.
 *
 * It sets up the Firebase plugin for backend operations.
 */
import { genkit } from 'genkit';

export const ai = genkit({
  plugins: [
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
