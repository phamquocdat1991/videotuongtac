import { describe, expect, it } from 'vitest';
import { generateExportHtml } from './exportEngine';
import { createSafeProject, getPedagogicalIssues, sanitizeEmbedDimension, validateDirectVideoUrl } from './projectSafety';
import { InteractionPoint } from '../types';

const point: InteractionPoint = {
  id: 'p1', timestamp: 10, title: 'Kiểm tra',
  data: { type: 'quiz', question: '2 + 2 = ?', options: ['3', '4'], correctAnswer: 1, explanation: '2 + 2 bằng 4.' },
};

describe('validateDirectVideoUrl', () => {
  it('accepts direct video URLs with query strings', () => {
    const result = validateDirectVideoUrl('https://cdn.example.edu/lesson.mp4?token=abc');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.fileName).toBe('lesson.mp4');
  });

  it.each([
    'https://example.com/not-a-video.txt',
    'https://youtube.com/watch?v=abc',
    'javascript:alert(1)',
    'https://user:password@example.com/video.mp4',
  ])('rejects unsafe or non-direct source %s', (url) => {
    expect(validateDirectVideoUrl(url).ok).toBe(false);
  });
});

describe('project safety', () => {
  it('removes API keys and transient binary data from saved projects', () => {
    const project = createSafeProject({
      videoTitle: 'Bài học', videoUrl: 'blob:local', videoFileName: 'lesson.mp4', videoDuration: 60,
      subject: 'Toán', grade: 'Lớp 6', lessonText: 'Nội dung', interactions: [point],
      lessonMaterial: { name: 'page.png', type: 'image', previewUrl: 'blob:image', inlineData: { mimeType: 'image/png', data: 'secret-binary' } },
      settings: { geminiApiKey: 'AIzaSy-secret', agentPlatformApiKey: 'AQ-secret', provider: 'gemini', selectedModel: 'gemini-3.8-flash', authorName: 'Tác giả', authorZalo: '0123', allowSeekingPastUnanswered: false, passingScorePercent: 80 },
    });
    const serialized = JSON.stringify(project);
    expect(project.videoUrl).toBe('');
    expect(serialized).not.toContain('AIzaSy-secret');
    expect(serialized).not.toContain('secret-binary');
    expect(serialized).not.toContain('blob:image');
  });

  it('sanitizes LMS dimensions', () => {
    expect(sanitizeEmbedDimension('90%', '100%')).toBe('90%');
    expect(sanitizeEmbedDimension('640px', '600px')).toBe('640px');
    expect(sanitizeEmbedDimension('" onload="alert(1)', '100%')).toBe('100%');
  });
});

describe('quality and export', () => {
  it('reports incomplete assessment content', () => {
    const broken: InteractionPoint = { ...point, data: { type: 'quiz', question: '2 + 2 = ?', options: ['3', '4'], correctAnswer: 1, explanation: '' } };
    expect(getPedagogicalIssues([broken], 60).join(' ')).toContain('thiếu giải thích');
  });

  it('escapes authored HTML and inline script terminators', () => {
    const hostile: InteractionPoint = { ...point, title: '<img src=x onerror=alert(1)>', data: { type: 'quiz', question: '</script><script>alert(1)</script>', options: ['3', '4'], correctAnswer: 1, explanation: 'safe' } };
    const html = generateExportHtml('</title><script>alert(1)</script>', [hostile], 'https://example.com/video.mp4', 'video.mp4');
    expect(html).not.toContain('const RAW_INTERACTIONS = [\n  {\n    "id": "p1",\n    "timestamp": 10,\n    "title": "<img');
    expect(html).toContain('\\u003c/script\\u003e');
    expect(html).toContain('&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});
