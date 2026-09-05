import { LessonMaterial } from '../types';
import { MAX_DOCUMENT_BYTES } from './projectSafety';

export const MAX_INLINE_DOCUMENT_BYTES = 14 * 1024 * 1024;
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const IMAGE_MIMES: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const extensionOf = (name: string) => name.includes('.') ? name.slice(name.lastIndexOf('.')).toLowerCase() : '';

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer); let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
  return btoa(binary);
}
async function sha256(input: ArrayBuffer | string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', typeof input === 'string' ? new TextEncoder().encode(input) : input);
  return Array.from(new Uint8Array(hash), value => value.toString(16).padStart(2, '0')).join('');
}
function validateImage(buffer: ArrayBuffer, mime: string): void {
  const b = new Uint8Array(buffer);
  const ok = (mime === 'image/png' && [137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v)) ||
    (mime === 'image/jpeg' && b[0]===255 && b[1]===216 && b[2]===255) ||
    (mime === 'image/webp' && String.fromCharCode(...b.slice(0,4))==='RIFF' && String.fromCharCode(...b.slice(8,12))==='WEBP');
  if (!ok) throw new Error('Chữ ký file ảnh không hợp lệ hoặc file đã bị giả mạo.');
}

export async function parseLessonFile(file: File): Promise<LessonMaterial> {
  const extension = extensionOf(file.name);
  if (file.type === 'application/pdf' || extension === '.pdf') {
    if (file.size > MAX_DOCUMENT_BYTES) throw new Error('PDF vượt quá 50 MB. Hãy giảm kích thước hoặc chia nhỏ tài liệu.');
    const buffer = await file.arrayBuffer();
    if (new TextDecoder('ascii').decode(buffer.slice(0, 5)) !== '%PDF-') throw new Error('File PDF không hợp lệ hoặc đã bị hỏng.');
    const useFilesApi = file.size > MAX_INLINE_DOCUMENT_BYTES;
    return { name: file.name, type: 'pdf', mimeType: 'application/pdf', fileSha256: await sha256(buffer), fileSize: file.size, size: file.size,
      uploadMode: useFilesApi ? 'files-api' : 'inline', requiresFilesApi: useFilesApi, requiresReupload: true,
      inlineData: useFilesApi ? undefined : { mimeType: 'application/pdf', data: toBase64(buffer) } };
  }
  if (file.size > MAX_INLINE_DOCUMENT_BYTES) throw new Error('Tài liệu vượt quá 14 MB. Chỉ PDF được hỗ trợ đến 50 MB qua Gemini Files API.');
  if (file.type === 'text/plain' || extension === '.txt' || extension === '.md') {
    const content = await file.text(); if (!content.trim()) throw new Error('Tài liệu văn bản không có nội dung.');
    return { name: file.name, type: 'text', mimeType: 'text/plain', content, fileSha256: await sha256(content), fileSize: file.size, size: file.size, uploadMode: 'inline' };
  }
  const expectedMime = IMAGE_MIMES[extension];
  if (file.type.startsWith('image/') || expectedMime) {
    if (!expectedMime) throw new Error('Chỉ hỗ trợ ảnh PNG, JPEG hoặc WebP.');
    if (file.type && file.type !== expectedMime) throw new Error('MIME của ảnh không khớp phần mở rộng.');
    const buffer = await file.arrayBuffer(); validateImage(buffer, expectedMime);
    return { name: file.name, type: 'image', mimeType: expectedMime, fileSha256: await sha256(buffer), fileSize: file.size, size: file.size,
      uploadMode: 'inline', requiresReupload: true, inlineData: { mimeType: expectedMime, data: toBase64(buffer) } };
  }
  if (file.type === DOCX_MIME || extension === '.docx') {
    const buffer = await file.arrayBuffer(); const bytes = new Uint8Array(buffer.slice(0, 2));
    if (bytes[0] !== 80 || bytes[1] !== 75) throw new Error('File DOCX không hợp lệ hoặc đã bị hỏng.');
    const module = await import('mammoth/mammoth.browser');
    const mammoth = (module.default || module) as unknown as { extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }> };
    const content = (await mammoth.extractRawText({ arrayBuffer: buffer })).value.trim();
    if (!content) throw new Error('Không đọc được nội dung văn bản trong file DOCX.');
    return { name: file.name, type: 'docx', mimeType: DOCX_MIME, content, fileSha256: await sha256(buffer), fileSize: file.size, size: file.size, uploadMode: 'inline' };
  }
  throw new Error('Định dạng không được hỗ trợ. Chỉ nhận PDF, TXT, MD, DOCX, PNG, JPEG và WebP.');
}
