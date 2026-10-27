import { AcademicYearSchema, ClassSchema, SectionSchema, SubjectSchema } from '@vidhyasaathy/contracts';
import { z } from 'zod';

export const AcademicYearListSchema = z.array(AcademicYearSchema);
export const ClassListSchema = z.array(ClassSchema);
export const SectionListSchema = z.array(SectionSchema);
export const SubjectListSchema = z.array(SubjectSchema);
