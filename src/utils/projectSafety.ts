import { AppSettings, InteractionPoint, LessonMaterial, ProjectData } from '../types';

export const PROJECT_VERSION = '2.8';
export const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v', '.ogv'];
const UNSUPPORTED_HOSTS = ['youtube.com', 'youtu.be', 'drive.google.com'];

export type ValidationResult = { ok: true; url: string; fileName: string } | { ok: false; message: string };

export function validateDirectVideoUrl(value: string): ValidationResult {
  const input = value.trim();
  if (!input) return { ok: false, message: 'Hãy nhập URL video.' };
  try {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol)) return { ok: false, message: 'URL video phải bắt đầu bằng http:// hoặc https://.' };
    if (url.username || url.password) return { ok: false, message: 'URL không được chứa thông tin đăng nhập.' };
    const host = url.hostname.toLowerCase();
    if (UNSUPPORTED_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
      return { ok: false, message: 'YouTube/Google Drive không cung cấp URL video trực tiếp. Hãy dùng URL .mp4/.webm hoặc tải file từ máy.' };
    }
    const rawName = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '');
    const cleanName = rawName.replace(/[\\/:*?"<>|]/g, '_');
    const path = url.pathname.toLowerCase();
    const hasVideoExtension = VIDEO_EXTENSIONS.some((extension) => path.endsWith(extension));
    const contentTypeHint = (url.searchParams.get('response-content-type') || url.searchParams.get('content-type') || '').toLowerCase();
    if (!hasVideoExtension && !contentTypeHint.startsWith('video/')) {
      return { ok: false, message: 'Đây chưa phải URL video trực tiếp. Đường dẫn cần kết thúc bằng .mp4, .webm, .mov, .m4v hoặc .ogv.' };
    }
    return { ok: true, url: url.toString(), fileName: cleanName || `video_truc_tuyen${VIDEO_EXTENSIONS.find((extension) => path.endsWith(extension)) || '.mp4'}` };
  } catch {
    return { ok: false, message: 'URL video không hợp lệ.' };
  }
}

export function sanitizeEmbedDimension(value: string, fallback: string): string {
  const trimmed = value.trim();
  return /^(?:100|[1-9]?\d)%$/.test(trimmed) || /^\d{2,4}px$/.test(trimmed) ? trimmed : fallback;
}

export function sanitizeFileName(value: string, fallback = 'bai_giang'): string {
  const sanitized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 100);
  return sanitized || fallback;
}

export function sanitizeInteraction(point: InteractionPoint, index: number, duration = 0): InteractionPoint {
  const maximum = duration > 10 ? Math.max(5, Math.round(duration - 5)) : Number.MAX_SAFE_INTEGER;
  return {
    ...structuredClone(point),
    id: String(point.id || `point_${Date.now()}_${index}`),
    title: String(point.title || `Điểm tương tác ${index + 1}`).trim(),
    timestamp: Math.max(0, Math.min(maximum, Number(point.timestamp) || 0)),
    learningObjective: point.learningObjective?.trim() || undefined,
    cognitiveLevel: ['unclassified', 'recognition', 'understanding', 'application'].includes(point.cognitiveLevel || '') ? point.cognitiveLevel : 'unclassified',
    completed: undefined,
  };
}

export function validateAndNormalizeInteractions(value: unknown, duration = 0): InteractionPoint[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.filter((item): item is InteractionPoint => Boolean(item && typeof item === 'object' && 'data' in item)).slice(0, 100).map((item, index) => {
    const normalized = sanitizeInteraction(item, index, duration);
    if (ids.has(normalized.id)) normalized.id = `${normalized.id}_${index + 1}`;
    ids.add(normalized.id);
    return normalized;
  }).sort((a, b) => a.timestamp - b.timestamp);
}

export interface ProjectDraft {
  videoTitle: string; videoUrl: string; videoFileName: string; videoDuration: number; subject: string; grade: string;
  lessonMaterial: LessonMaterial | null; lessonText: string; interactions: InteractionPoint[]; settings: AppSettings;
}

export function createSafeProject(draft: ProjectDraft): ProjectData {
  const { geminiApiKey: _geminiApiKey, agentPlatformApiKey: _agentPlatformApiKey, ...safeSettings } = draft.settings;
  const lessonMaterial = draft.lessonMaterial ? {
    name: String(draft.lessonMaterial.name || 'tai_lieu'), type: draft.lessonMaterial.type, content: draft.lessonMaterial.content,
    mimeType: draft.lessonMaterial.mimeType, size: draft.lessonMaterial.size,
    fileSha256: draft.lessonMaterial.fileSha256, fileSize: draft.lessonMaterial.fileSize,
    uploadMode: draft.lessonMaterial.uploadMode, requiresFilesApi: draft.lessonMaterial.requiresFilesApi,
    requiresReupload: draft.lessonMaterial.type === 'image' || draft.lessonMaterial.type === 'pdf' ? true : draft.lessonMaterial.requiresReupload,
  } : null;
  return {
    version: PROJECT_VERSION, videoTitle: String(draft.videoTitle || 'Bài giảng tương tác'),
    videoUrl: draft.videoUrl.startsWith('blob:') ? '' : draft.videoUrl,
    videoFileName: String(draft.videoFileName || 'video_bai_giang.mp4'), videoDuration: Math.max(0, Number(draft.videoDuration) || 0),
    subject: String(draft.subject || 'Tổng hợp'), grade: String(draft.grade || 'THPT'), lessonMaterial,
    lessonText: String(draft.lessonText || '').slice(0, 300_000), interactions: validateAndNormalizeInteractions(draft.interactions, draft.videoDuration),
    settings: { ...safeSettings, authorName: safeSettings.authorName || 'PHẠM QUỐC ĐẠT', authorZalo: safeSettings.authorZalo || '0705350000',
      passingScorePercent: Math.max(0, Math.min(100, Number(safeSettings.passingScorePercent) || 80)) },
    lastUpdated: new Date().toISOString(),
  };
}

export function parseProjectJson(text: string): ProjectData {
  const parsed = JSON.parse(text) as Partial<ProjectData>;
  if (!parsed || !Array.isArray(parsed.interactions)) throw new Error('File không có danh sách điểm tương tác hợp lệ.');
  return createSafeProject({
    videoTitle: String(parsed.videoTitle || 'Dự án video'), videoUrl: String(parsed.videoUrl || ''),
    videoFileName: String(parsed.videoFileName || 'video_bai_giang.mp4'), videoDuration: Number(parsed.videoDuration) || 0,
    subject: String(parsed.subject || 'Tổng hợp'), grade: String(parsed.grade || 'THPT'), lessonMaterial: parsed.lessonMaterial || null,
    lessonText: String(parsed.lessonText || ''), interactions: parsed.interactions,
    settings: { provider: parsed.settings?.provider === 'agent-platform' ? 'agent-platform' : 'gemini',
      selectedModel: String(parsed.settings?.selectedModel || 'gemini-3.8-flash'), authorName: String(parsed.settings?.authorName || 'PHẠM QUỐC ĐẠT'),
      authorZalo: String(parsed.settings?.authorZalo || '0705350000'), allowSeekingPastUnanswered: Boolean(parsed.settings?.allowSeekingPastUnanswered),
      passingScorePercent: Number(parsed.settings?.passingScorePercent) || 80 },
  });
}

export function getPedagogicalIssues(interactions: InteractionPoint[], duration: number): string[] {
  const issues: string[] = [];
  if (interactions.length < 2) issues.push('Nên có ít nhất 2 điểm tương tác để duy trì sự tham gia.');
  if (interactions.length > 8) issues.push('Có hơn 8 điểm tương tác; cân nhắc giảm tải nhận thức cho người học.');
  interactions.forEach((point, index) => {
    const label = `Mốc ${index + 1} (${Math.round(point.timestamp)}s)`; const data = point.data;
    if (!point.title.trim()) issues.push(`${label}: thiếu tiêu đề.`);
    if (duration > 0 && point.timestamp >= duration) issues.push(`${label}: nằm ngoài thời lượng video.`);
    if (data.type === 'quiz') { if (!data.question.trim()) issues.push(`${label}: thiếu câu hỏi.`); if (data.options.filter(Boolean).length < 2) issues.push(`${label}: cần ít nhất 2 lựa chọn.`); if (!data.options[data.correctAnswer]) issues.push(`${label}: đáp án đúng không hợp lệ.`); if (!data.explanation?.trim()) issues.push(`${label}: thiếu giải thích đáp án.`); }
    else if (data.type === 'multi_choice') { if (!data.question.trim()) issues.push(`${label}: thiếu câu hỏi.`); if (!data.correctAnswers?.length) issues.push(`${label}: chưa chọn đáp án đúng.`); if (!data.explanation?.trim()) issues.push(`${label}: thiếu giải thích đáp án.`); }
    else if (data.type === 'true_false' && !data.explanation?.trim()) issues.push(`${label}: thiếu giải thích nhận định.`);
    else if (data.type === 'drag_drop') { if (data.categories.length < 2 || data.items.length < 2) issues.push(`${label}: kéo thả cần ít nhất 2 nhóm và 2 thẻ.`); if (data.items.some((item) => !data.categories.includes(item.targetCategory))) issues.push(`${label}: có thẻ chưa gắn đúng nhóm.`); }
    else if (data.type === 'fill_blank') { if (!data.sentence.includes('{...}')) issues.push(`${label}: câu điền khuyết cần ký hiệu {...}.`); if (!data.blankAnswer.trim()) issues.push(`${label}: thiếu đáp án điền khuyết.`); }
    else if (data.type === 'checkpoint_note' && !data.keyTakeaways?.filter(Boolean).length) issues.push(`${label}: thẻ tóm tắt chưa có ý chính.`);
  });
  return issues;
}

export function projectFingerprint(project: ProjectData): string {
  const text = JSON.stringify({ videoUrl: project.videoUrl, videoFileName: project.videoFileName, videoDuration: project.videoDuration, lessonText: project.lessonText, interactions: project.interactions });
  let hash = 2166136261; for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(36);
}
