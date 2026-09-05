import { GeminiFileReference } from '../types';
import { createGoogleAiClient, parseApiError } from './aiClientFactory';

function normalize(response: any, metadata: { projectFingerprint: string; fileSha256: string; fileSize: number }, fallback?: GeminiFileReference): GeminiFileReference {
  const resourceName = String(response.name || '').trim(); const uri = String(response.uri || '').trim(); const mimeType = String(response.mimeType || '').trim();
  if (!resourceName || !uri || !mimeType) throw new Error('Gemini không trả về metadata file đầy đủ.');
  const createdAt = new Date(response.createTime || fallback?.createdAt || Date.now());
  const expiresAt = new Date(response.expirationTime || fallback?.expiresAt || createdAt.getTime() + 48 * 60 * 60 * 1000);
  return { id: `${metadata.projectFingerprint}:${metadata.fileSha256}`, projectFingerprint: metadata.projectFingerprint, fileSha256: metadata.fileSha256,
    resourceName, uri, mimeType, sizeBytes: Number(response.sizeBytes) || metadata.fileSize, createdAt: createdAt.toISOString(), expiresAt: expiresAt.toISOString() };
}
function friendly(error: unknown): Error { const raw = error instanceof Error ? error.message : JSON.stringify(error); return /1000/i.test(raw) && /page/i.test(raw) ? new Error('PDF vượt quá giới hạn 1.000 trang của Gemini. Hãy chia nhỏ tài liệu.') : new Error(parseApiError(error).message); }

export async function uploadPdfToGemini(input: { apiKey: string; file: File; projectFingerprint: string; fileSha256: string }): Promise<GeminiFileReference> {
  try { const client = createGoogleAiClient(input.apiKey, 'gemini'); const result = await client.files.upload({ file: input.file, config: { mimeType: 'application/pdf', displayName: input.file.name.slice(0, 200) } });
    return normalize(result, { projectFingerprint: input.projectFingerprint, fileSha256: input.fileSha256, fileSize: input.file.size }); } catch (error) { throw friendly(error); }
}
export async function waitForGeminiFileReady(input: { apiKey: string; reference: GeminiFileReference; signal?: AbortSignal }): Promise<GeminiFileReference> {
  const client = createGoogleAiClient(input.apiKey, 'gemini');
  for (let attempt = 0; attempt < 60; attempt += 1) { if (input.signal?.aborted) throw new Error('Đã hủy xác minh file Gemini.');
    try { const current = await client.files.get({ name: input.reference.resourceName }); const state = String(current.state || '');
      if (state === 'FAILED') throw new Error('Gemini không thể xử lý PDF. Hãy kiểm tra hoặc chia nhỏ tài liệu.');
      if (state === 'ACTIVE') return normalize(current, { projectFingerprint: input.reference.projectFingerprint, fileSha256: input.reference.fileSha256, fileSize: input.reference.sizeBytes }, input.reference);
    } catch (error) { throw friendly(error); }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Gemini xử lý PDF quá thời gian chờ. Hãy thử lại sau.');
}
