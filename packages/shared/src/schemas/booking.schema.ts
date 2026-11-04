import { z } from 'zod';

export const PassengerTypeEnum = z.enum(['ADULT', 'CHILD', 'INFANT']);

export const PassengerSchema = z.object({
  passengerType: PassengerTypeEnum,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
  passportNumber: z.string().max(20).optional()
});

export const CreateBookingSchema = z.object({
  offerId: z.string().min(1, 'Flight offer ID is required'),
  customerUserId: z.string().min(1, 'Customer user ID is required').optional(),
  passengers: z.array(PassengerSchema).min(1, 'At least one passenger is required').max(9)
});


export type PassengerInput = z.infer<typeof PassengerSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

