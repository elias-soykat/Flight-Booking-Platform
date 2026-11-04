import { z } from 'zod';

export const CreateCancellationRequestSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters long'),
});

export type CreateCancellationRequestInput = z.infer<typeof CreateCancellationRequestSchema>;

export const ReviewCancellationRequestSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  reviewNote: z.string().optional(),
});

export type ReviewCancellationRequestInput = z.infer<typeof ReviewCancellationRequestSchema>;
