import { z } from 'zod';

// Twitter handle validation regex (alphanumeric, underscore, 1-15 chars)
const twitterHandleRegex = /^[a-zA-Z0-9_]{1,15}$/;

export const sendTipSchema = z.object({
  recipientHandle: z
    .string()
    .min(1, 'Twitter handle is required')
    .max(15, 'Twitter handle must be 15 characters or less')
    .regex(twitterHandleRegex, 'Invalid Twitter handle format')
    .transform((val) => val.replace('@', '')), // Remove @ if present
  
  amount: z
    .number()
    .min(0.01, 'Amount must be at least $0.01')
    .max(1000, 'Amount cannot exceed $1000')
    .multipleOf(0.01, 'Amount must be in cents'),
  
  note: z
    .string()
    .max(280, 'Note cannot exceed 280 characters')
    .optional(),
});

export type SendTipFormData = z.infer<typeof sendTipSchema>;

// Preset amount options
export const PRESET_AMOUNTS = [1, 5, 10] as const;

// Custom amount validation
export const customAmountSchema = z
  .string()
  .min(1, 'Amount is required')
  .transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error('Invalid amount');
    return num;
  })
  .pipe(z.number().min(0.01).max(1000));
