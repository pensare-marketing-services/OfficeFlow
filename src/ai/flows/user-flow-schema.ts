/**
 * @fileoverview Defines the schema for creating a new user.
 */
import { z } from 'zod';

export const CreateUserInputSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email(),
  role: z.enum(['admin', 'employee']),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
