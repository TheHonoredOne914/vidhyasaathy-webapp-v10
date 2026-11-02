import { PublicItemSchema } from '@vidhyasaathy/contracts';
import { z } from 'zod';

// sourceClass belongs to the diagnostic envelope, not the strict public item.
const QuestionSchema = z.object({ sourceClass: z.number().nullable().optional() }).passthrough().transform(({ sourceClass, ...item }, ctx) => {
  const result = PublicItemSchema.safeParse(item);
  if (!result.success) {
    for (const issue of result.error.issues) ctx.addIssue(issue);
    return z.NEVER;
  }
  return { ...result.data, sourceClass };
});
const OfferSchema = z.object({ chapterId: z.string(), offered: z.boolean(), questions: z.array(QuestionSchema).default([]) });
// useRemote's ZodType<T> expects identical input/output; parsing still happens here.
export const DiagnosticOfferSchema = OfferSchema as unknown as z.ZodType<z.output<typeof OfferSchema>>;
