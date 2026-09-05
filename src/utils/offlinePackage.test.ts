import JSZip from 'jszip';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOfflinePackage, resolveAssetUrl } from './offlinePackage';

afterEach(() => vi.unstubAllGlobals());

describe('resolveAssetUrl', () => {
  it('resolves Vite asset paths against the deployed page URL', () => {
    expect(resolveAssetUrl('/assets/katex.css', 'https://lesson.example.edu/editor/')).toBe(
      'https://lesson.example.edu/assets/katex.css',
    );
  });

  it('keeps absolute asset URLs unchanged', () => {
    expect(resolveAssetUrl('https://cdn.example.edu/katex.css', 'https://lesson.example.edu/')).toBe(
      'https://cdn.example.edu/katex.css',
    );
  });

  it('builds a ZIP when deployed asset URLs are relative', async () => {
    vi.stubGlobal('window', { location: { href: 'https://lesson.example.edu/editor/' } });
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      return new Response(
        url.includes('.css') ? '@font-face{src:url("./font.woff2")}' : new Uint8Array([1, 2, 3]),
        { status: 200 },
      );
    }));

    const video = new File([new Uint8Array([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0, 0, 0, 0])], 'lesson.mp4', { type: 'video/mp4' });
    const blob = await createOfflinePackage({ videoTitle: 'Bài học', videoFile: video, videoFileName: video.name, interactions: [] });
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());

    expect(Object.keys(zip.files)).toEqual(expect.arrayContaining([
      'index.html', 'media/lesson.mp4', 'assets/app.css', 'assets/katex.min.css', 'README.txt',
    ]));
  });
});
