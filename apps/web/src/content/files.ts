import { MAX_UPLOAD_BYTES, UploadFileSchema } from '@vidhyasaathy/contracts';
import type { z } from 'zod';

const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'] as const;
export type AllowedType = (typeof ALLOWED)[number];

export function fileContentType(name: string, type: string): AllowedType | null {
  const normalized = type === 'image/jpg' ? 'image/jpeg' : type;
  if ((ALLOWED as readonly string[]).includes(normalized)) return normalized as AllowedType;
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.txt')) return 'text/plain';
  return null;
}

export function releaseInstant(value: string): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export async function filePayload(file: File): Promise<z.infer<typeof UploadFileSchema>> {
  const contentType = fileContentType(file.name, file.type);
  if (!contentType) throw new Error('Use a PDF, PNG, JPEG, or text file.');
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) throw new Error('Files must be 10 MiB or smaller.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return { filename: file.name, contentType, dataBase64: btoa(binary) };
}
