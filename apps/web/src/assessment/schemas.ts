import { AssignmentDetailSchema, AssignmentSchema, AttemptSchema, BankItemSchema } from '@vidhyasaathy/contracts';
import { z } from 'zod';

export const AssignmentListSchema = z.array(AssignmentSchema);
export const AttemptListSchema = z.array(AttemptSchema);
export const BankListSchema = z.array(BankItemSchema);
export type AssignmentDetail = z.infer<typeof AssignmentDetailSchema>;
