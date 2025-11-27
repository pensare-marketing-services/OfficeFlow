import { z } from 'zod';

export const CreateUserInputSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'employee']),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
