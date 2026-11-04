import { z } from 'zod';

export const CreateAgencySchema = z.object({
  name: z.string().min(2, 'Agency name must be at least 2 characters').max(100)
});

export const InviteCustomerSchema = z.object({
  email: z.string().email('Invalid email address')
});

export const RespondInvitationSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT'])
});

export type CreateAgencyInput = z.infer<typeof CreateAgencySchema>;
export type InviteCustomerInput = z.infer<typeof InviteCustomerSchema>;
export type RespondInvitationInput = z.infer<typeof RespondInvitationSchema>;

