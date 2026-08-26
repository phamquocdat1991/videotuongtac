import { GoogleGenAI } from '@google/genai';
import { AiProvider } from '../types';

// ============================================================================
// 1. API KEY VALIDATION REGEX (Hỗ trợ cả AIzaSy... và auth key mới AQ...)
// Nguồn: google-api/SKILL.md + api.md mục V
// ============================================================================
export const GOOGLE_AI_API_KEY_PATTERN = /^(?:AIzaSy|AQ)\S{8,}$/;

export const isValidGoogleAiApiKey = (key: string): boolean => {
  if (!key || typeof key !== 'string') return false;
  return GOOGLE_AI_API_KEY_PATTERN.test(key.trim());
};

// ============================================================================
// 2. MODEL CONFIGURATION
// Nguồn: api.md v4.1 — Mục I (Chuỗi model ổn định cho production)
//
// MÔ HÌNH ĐÃ SHUTDOWN (KHÔNG DÙNG):
//   - gemini-3-pro-preview    → Shutdown 09/03/2026
//   - gemini-3-flash-preview  → Preview, đã có bản GA thay thế (gemini-3.6-flash)
//   - gemini-2.0-flash        → Shutdown 01/06/2026
//   - gemini-2.0-flash-lite   → Shutdown 01/06/2026
// ============================================================================

/** Model mặc định: gemini-3.6-flash — Stable/GA kể từ 21/07/2026 */
export const GEMINI_DEFAULT_MODEL = 'gemini-3.6-flash';

/**
 * Chuỗi fallback Gemini API (chỉ dùng model GA/stable):
 * Ưu tiên 1: gemini-3.6-flash — mới nhất, tốt nhất cho agentic tasks
 * Ưu tiên 2: gemini-3.5-flash — dự phòng chất lượng cao
 * Ưu tiên 3: gemini-3.5-flash-lite — nhanh, chi phí thấp
 * Ưu tiên 4: gemini-3.1-flash-lite — tương thích ngược
 * Ưu tiên 5: gemini-2.5-flash — dự phòng cuối chuỗi
 */
export const GEMINI_FALLBACK_MODELS: string[] = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
];

/** Model mặc định Agent Platform API */
export const AGENT_PLATFORM_DEFAULT_MODEL = 'gemini-2.5-flash';

export const AGENT_PLATFORM_MODELS: string[] = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-3.1-pro-preview',
];

export const AGENT_PLATFORM_FALLBACK_MODELS: string[] = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

// ============================================================================
// 3. MODEL CARD METADATA (Hiển thị trực quan dạng Cards trên UI)
// ============================================================================
export interface ModelCardInfo {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  isDefault?: boolean;
}

/** Danh sách model Gemini API hiển thị trên giao diện cài đặt */
export const GEMINI_MODEL_DETAILS: ModelCardInfo[] = [
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    badge: 'Mặc định — GA (21/07/2026)',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Model thế hệ mới nhất (Stable/GA). Tốc độ phản hồi tức thì, tối ưu phân tích sư phạm đa bước, chi phí thấp hơn 3.5 Flash.',
    isDefault: true,
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    badge: 'Dự phòng cao cấp',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    description: 'Mạnh mẽ trong xử lý tài liệu đa phương tiện và tạo câu hỏi tương tác chi tiết. Luôn sẵn sàng khi model chính quá tải.',
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    badge: 'Nhanh & Tiết kiệm',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    description: 'Stable/GA. Tốc độ cao, chi phí thấp nhất ($0.30/1M input). Phù hợp đọc và trích xuất tài liệu bài giảng.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'Tương thích ngược',
    badgeColor: 'bg-slate-600/50 text-slate-300 border-slate-600',
    description: 'Stable. Tương thích ngược, dự kiến ngừng sớm nhất 07/05/2027. Dùng khi các model 3.5+ không khả dụng.',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Dự phòng ổn định',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Dự phòng cuối chuỗi. Luôn sẵn sàng bất kể tình trạng tải của dòng Gemini 3.x.',
  },
];

/** Danh sách model Agent Platform API */
export const AGENT_PLATFORM_MODEL_DETAILS: ModelCardInfo[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Mặc định',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Tốc độ cao, tối ưu chi phí cho Agent Platform. Mặc định khuyên dùng.',
    isDefault: true,
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    badge: 'Tiết kiệm',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    description: 'Chi phí thấp nhất trên Agent Platform. Phù hợp tác vụ đơn giản, xử lý số lượng lớn.',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    badge: 'Chất lượng cao',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'Phân tích tài liệu và sinh kịch bản sư phạm chuyên sâu. Suy luận logic mạnh mẽ nhất.',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    badge: 'Preview Pro',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    description: 'Khả năng lập luận cao cấp trên nền tảng doanh nghiệp Agent Platform.',
  },
];

// ============================================================================
// 4. CLIENT FACTORY — Tập trung toàn bộ việc khởi tạo SDK
// Nguồn: api.md mục III — Không tạo new GoogleGenAI() ngoài factory này!
// ============================================================================
export const createGoogleAiClient = (
  apiKey: string,
  provider: AiProvider = 'gemini'
): GoogleGenAI => {
  const cleanKey = apiKey.trim();
  if (provider === 'agent-platform') {
    // vertexai: true là cờ định tuyến tới aiplatform.googleapis.com
    // KHÔNG phải "Vertex AI Express" — xem api.md mục III
    return new GoogleGenAI({ vertexai: true, apiKey: cleanKey });
  }
  return new GoogleGenAI({ apiKey: cleanKey });
};

// ============================================================================
// 5. API ERROR PARSING & CLASSIFICATION
// Nguồn: api.md mục II — Lỗi được phép chuyển model vs phải dừng ngay
// ============================================================================
export type ApiErrorType =
  | 'INVALID_API_KEY'
  | 'QUOTA_EXHAUSTED'
  | 'MODEL_OVERLOADED'
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export const parseApiError = (error: any): { type: ApiErrorType; message: string } => {
  const message = error?.message || error?.toString() || '';
  const serialized = JSON.stringify(error) || '';
  const lower = (message + ' ' + serialized).toLowerCase();

  // 1. Quota / Rate limit (429) → Phải dừng ngay, KHÔNG đánh dấu key invalid!
  if (
    lower.includes('429') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('rate limit')
  ) {
    return {
      type: 'QUOTA_EXHAUSTED',
      message: 'Đã hết hạn mức (Quota) hoặc vượt giới hạn tốc độ API. Vui lòng đổi API key hoặc đợi vài phút.',
    };
  }

  // 2. Model Quá tải / Tạm không khả dụng (503, 500, 504) → Fallback model!
  if (
    lower.includes('503') ||
    lower.includes('500') ||
    lower.includes('504') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('overloaded') ||
    lower.includes('temporarily unavailable') ||
    lower.includes('deadline_exceeded') ||
    lower.includes('try again later')
  ) {
    return {
      type: 'MODEL_OVERLOADED',
      message: 'Model AI đang quá tải trên máy chủ Google; hệ thống đang tự động thử model dự phòng...',
    };
  }

  // 3. Endpoint / Model không tồn tại (404) → Fallback model!
  if (lower.includes('404') || lower.includes('not_found')) {
    return {
      type: 'NOT_FOUND',
      message: 'Model không tồn tại hoặc đã ngừng cung cấp; đang chuyển sang model thay thế...',
    };
  }

  // 4. Key sai hoặc không có quyền (401) → Dừng ngay!
  if (
    lower.includes('401') ||
    lower.includes('api_key_invalid') ||
    lower.includes('invalid api key')
  ) {
    return {
      type: 'INVALID_API_KEY',
      message: 'API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại trong Cài đặt.',
    };
  }

  // 5. Không có quyền (403) → Dừng ngay, gợi ý kiểm tra billing
  if (lower.includes('403') || lower.includes('permission_denied')) {
    return {
      type: 'INVALID_API_KEY',
      message: 'API Key không có quyền gọi dịch vụ này. Vui lòng kiểm tra: billing đã bật, API restrictions và quyền sử dụng model tại Google Cloud Console.',
    };
  }

  // 6. Network error
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network error')) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Lỗi kết nối mạng internet. Vui lòng kiểm tra lại đường truyền.',
    };
  }

  return {
    type: 'UNKNOWN',
    message: message || 'Đã xảy ra lỗi không xác định khi gọi AI.',
  };
};

// ============================================================================
// 6. ORDERED MODEL LIST — Luôn thử model người dùng chọn trước
// Nguồn: api.md mục II — "Model người dùng chọn luôn được thử trước"
// ============================================================================
export const getOrderedModelList = (
  selectedModel: string,
  provider: AiProvider = 'gemini'
): string[] => {
  const fallbackList = provider === 'agent-platform'
    ? AGENT_PLATFORM_FALLBACK_MODELS
    : GEMINI_FALLBACK_MODELS;

  if (!selectedModel) return fallbackList;
  // Đưa model người dùng chọn lên đầu, loại trùng
  return [selectedModel, ...fallbackList.filter((m) => m !== selectedModel)];
};

// ============================================================================
// 7. GENERATION HELPER WITH AUTOMATIC MULTI-TIER FALLBACK
// Nguồn: api.md mục II + IV — Tất cả generateContent phải qua hàm này
//
// LƯU Ý QUAN TRỌNG (api.md mục IV):
//   - Từ Gemini 3.6 Flash và 3.5 Flash-Lite: KHÔNG gửi temperature, topP, topK
//   - Gemini 3: dùng thinkingConfig.thinkingLevel cho tác vụ giáo án/planning
// ============================================================================
export interface GenerateWithFallbackParams {
  apiKey: string;
  provider?: AiProvider;
  selectedModel?: string;
  systemInstruction?: string;
  contents: string | any[];
  responseMimeType?: string;
  maxOutputTokens?: number;
  useThinking?: boolean; // Bật thinking mode cho Gemini 3.x
  onModelFallbackNotice?: (fromModel: string, toModel: string, reason: string) => void;
}

/** Kiểm tra model có hỗ trợ thinking mode không (Gemini 3.x) */
const supportsThinking = (model: string): boolean => {
  return (
    model.startsWith('gemini-3') &&
    !model.includes('lite') // Flash-Lite không hỗ trợ thinking
  );
};

export const generateContentWithFallback = async (
  params: GenerateWithFallbackParams
): Promise<{ text: string; usedModel: string }> => {
  const {
    apiKey,
    provider = 'gemini',
    selectedModel = GEMINI_DEFAULT_MODEL,
    systemInstruction,
    contents,
    responseMimeType = 'application/json',
    maxOutputTokens,
    useThinking = false,
    onModelFallbackNotice,
  } = params;

  if (!apiKey || !apiKey.trim()) {
    throw new Error('Vui lòng cấu hình API Key trước khi sử dụng tính năng này.');
  }

  const ai = createGoogleAiClient(apiKey, provider);
  const modelsToTry = getOrderedModelList(selectedModel, provider);
  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    try {
      // Chuẩn hóa config theo api.md mục IV:
      // - Không truyền temperature/topP/topK cho Gemini 3.x
      // - Dùng thinkingConfig nếu model hỗ trợ và useThinking=true
      const config: any = {};

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (responseMimeType) {
        config.responseMimeType = responseMimeType;
      }
      if (maxOutputTokens) {
        config.maxOutputTokens = maxOutputTokens;
      }
      // Bật thinking mode cho Gemini 3.x (không phải Lite) khi được yêu cầu
      if (useThinking && supportsThinking(currentModel)) {
        config.thinkingConfig = { thinkingLevel: 'HIGH' };
      }

      const response = await ai.models.generateContent({
        model: currentModel,
        contents: contents,
        config,
      });

      const responseText = response.text || '';
      return { text: responseText, usedModel: currentModel };
    } catch (err: any) {
      lastError = err;
      const { type, message } = parseApiError(err);

      // Nếu lỗi do Key sai, không có quyền, hoặc Quota hết → Dừng ngay
      if (type === 'INVALID_API_KEY' || type === 'QUOTA_EXHAUSTED') {
        throw new Error(message);
      }

      // Nếu model quá tải hoặc 404 và còn model tiếp theo → Chuyển sang dự phòng
      if (i < modelsToTry.length - 1) {
        const nextModel = modelsToTry[i + 1];
        if (onModelFallbackNotice) {
          onModelFallbackNotice(currentModel, nextModel, message);
        }
        console.warn(`[AI Fallback] ${currentModel} → ${nextModel} (${type}: ${message})`);
        continue;
      }
    }
  }

  const finalParsed = parseApiError(lastError);
  throw new Error(finalParsed.message || 'Tất cả model AI đều gặp lỗi. Vui lòng thử lại sau.');
};
