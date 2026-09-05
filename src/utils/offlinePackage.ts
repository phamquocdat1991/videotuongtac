import type JSZipType from 'jszip';
import appCssUrl from '../index.css?url';
import katexCssUrl from 'katex/dist/katex.min.css?url';
import katexJsUrl from 'katex/dist/katex.min.js?url';
import confettiJsUrl from 'canvas-confetti/dist/confetti.browser.js?url';
import { InteractionPoint } from '../types';
import { generateOfflineExportHtml } from './exportEngine';
import { MAX_VIDEO_BYTES, sanitizeFileName } from './projectSafety';

async function fetchBytes(url: string): Promise<Uint8Array> { const response = await fetch(url); if (!response.ok) throw new Error(`Không thể đóng gói tài nguyên: ${response.status}`); return new Uint8Array(await response.arrayBuffer()); }
async function fetchText(url: string): Promise<string> { const response = await fetch(url); if (!response.ok) throw new Error(`Không thể đóng gói stylesheet: ${response.status}`); return response.text(); }
export const resolveAssetUrl = (assetUrl: string, pageUrl: string): string => new URL(assetUrl, pageUrl).toString();

async function validateVideoFile(file: File): Promise<'mp4' | 'webm'> {
  if (file.size > MAX_VIDEO_BYTES) throw new Error('Video vượt quá 250 MiB, chưa phù hợp để tạo gói offline trên trình duyệt.');
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const mp4 = header.length >= 12 && String.fromCharCode(...header.slice(4, 8)) === 'ftyp';
  const webm = header.length >= 4 && header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3;
  if (!mp4 && !webm) throw new Error('Gói offline chỉ hỗ trợ video MP4 hoặc WebM hợp lệ.');
  return mp4 ? 'mp4' : 'webm';
}

async function bundleKatexCss(zip: JSZipType): Promise<void> {
  const katexCssAbsoluteUrl = resolveAssetUrl(katexCssUrl, window.location.href);
  let css = await fetchText(katexCssAbsoluteUrl); const matches = [...css.matchAll(/url\(([^)]+)\)/g)]; const replacements = new Map<string,string>();
  await Promise.all(matches.map(async match => { const source = match[1].replace(/["']/g, ''); if (replacements.has(source) || source.startsWith('data:')) return;
    const absolute = new URL(source, katexCssAbsoluteUrl).toString(); const name = sanitizeFileName(new URL(absolute).pathname.split('/').pop() || 'font.woff2');
    zip.file(`assets/fonts/${name}`, await fetchBytes(absolute)); replacements.set(source, `./fonts/${name}`); }));
  replacements.forEach((target, source) => { css = css.split(source).join(target); }); zip.file('assets/katex.min.css', css);
}

export async function createOfflinePackage(input: { videoTitle: string; videoFile: File; videoFileName: string; interactions: InteractionPoint[] }): Promise<Blob> {
  const extension = await validateVideoFile(input.videoFile); const videoName = `${sanitizeFileName(input.videoFileName.replace(/\.[^/.]+$/, ''), 'video')}.${extension}`;
  const { default: JSZip } = await import('jszip'); const zip = new JSZip();
  zip.file('index.html', generateOfflineExportHtml(input.videoTitle, input.interactions, videoName, `./media/${videoName}`));
  zip.file(`media/${videoName}`, await input.videoFile.arrayBuffer()); zip.file('assets/app.css', await fetchText(appCssUrl));
  zip.file('assets/katex.min.js', await fetchBytes(katexJsUrl)); zip.file('assets/confetti.browser.min.js', await fetchBytes(confettiJsUrl)); await bundleKatexCss(zip);
  zip.file('README.txt', `GÓI BÀI GIẢNG TƯƠNG TÁC OFFLINE\n\n1. Giải nén toàn bộ thư mục.\n2. Mở index.html bằng Chrome, Edge hoặc Firefox.\n3. Không đổi vị trí thư mục media và assets.\n\nBài giảng: ${input.videoTitle}\nPhiên bản: 2.8\n`);
  zip.file('THIRD_PARTY_LICENSES.txt', 'KaTeX — MIT License\nCanvas Confetti — ISC License\nJSZip — MIT/GPLv3 dual license\n');
  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } }); return new Blob([bytes], { type: 'application/zip' });
}
export const offlinePackageFileName = (videoTitle: string) => `bai_giang_tuong_tac_${sanitizeFileName(videoTitle)}.zip`;
