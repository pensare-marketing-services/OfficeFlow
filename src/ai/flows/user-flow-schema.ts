/**
 * @fileoverview Defines the schema for creating a new user.
 */
import { z } from 'zod';

export const CreateUserInputSchema = z.object({
  role: z.enum(['admin', 'employee']),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
