import { ChapterSchema, ConceptSchema, LearningSessionSchema, LearningSessionSummarySchema, NoteSchema } from '@vidhyasaathy/contracts';
import { z } from 'zod';

export const ChapterListSchema = z.array(ChapterSchema);
export const ConceptListSchema = z.array(ConceptSchema);
export const NoteListSchema = z.array(NoteSchema);
export const SessionListSchema = z.array(LearningSessionSummarySchema);
export { LearningSessionSchema };
