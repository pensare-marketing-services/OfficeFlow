'use server';
/**
 * @fileoverview Defines the schema for creating a new user.
 */
import { z } from 'zod';

export const CreateUserInputSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email(),
  role: z.enum(['admin', 'employee']),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
