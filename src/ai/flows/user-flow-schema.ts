/**
 * @fileoverview Defines the schema for creating a new user.
 */
import { z } from 'zod';

export const CreateUserInputSchema = z.object({
  role: z.enum(['admin', 'employee']),
  username: z.string().min(3, "Username must be at least 3 characters"),
  nickname: z.string().min(2, "Nickname must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  department: z.enum(['digitalmarketing', 'contentwriter', 'designers', 'videoeditor', 'web', 'seo']).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
