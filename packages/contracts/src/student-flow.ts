import { z } from 'zod';

export const DiagnosticSkipSchema = z.object({}).strict();
export const DiagnosticSkipResultSchema = z.object({ offered: z.literal(false), nextOfferAt: z.string().datetime() });
