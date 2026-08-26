import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Sparkles,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Cpu,
  Layers,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { AiProvider } from '../types';
import {
  isValidGoogleAiApiKey,
  GEMINI_MODEL_DETAILS,
  AGENT_PLATFORM_MODEL_DETAILS,
  GEMINI_DEFAULT_MODEL,
  AGENT_PLATFORM_DEFAULT_MODEL,
} from '../services/aiClientFactory';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiApiKey: string;
  agentPlatformApiKey: string;
  provider: AiProvider;
  selectedModel: string;
  onSaveSettings: (settings: {
    geminiApiKey: string;
    agentPlatformApiKey: string;
    provider: AiProvider;
    selectedModel: string;
  }) => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  geminiApiKey: initialGeminiKey,
  agentPlatformApiKey: initialAgentPlatformKey,
  provider: initialProvider,
  selectedModel: initialModel,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<AiProvider>(initialProvider || 'gemini');
  const [geminiKey, setGeminiKey] = useState<string>(initialGeminiKey || '');
  const [agentPlatformKey, setAgentPlatformKey] = useState<string>(initialAgentPlatformKey || '');
  const [selectedModel, setSelectedModel] = useState<string>(initialModel || GEMINI_DEFAULT_MODEL);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialProvider || 'gemini');
      setGeminiKey(initialGeminiKey || '');
      setAgentPlatformKey(initialAgentPlatformKey || '');
      setSelectedModel(initialModel || (initialProvider === 'agent-platform' ? AGENT_PLATFORM_DEFAULT_MODEL : GEMINI_DEFAULT_MODEL));
      setSaveSuccess(false);
    }
  }, [isOpen, initialGeminiKey, initialAgentPlatformKey, initialProvider, initialModel]);

  // Khi chuyển tab, tự động cập nhật model tương thích nếu model cũ không thuộc provider mới
  const handleTabChange = (tab: AiProvider) => {
    setActiveTab(tab);
    if (tab === 'agent-platform') {
      const isCompatible = AGENT_PLATFORM_MODEL_DETAILS.some((m) => m.id === selectedModel);
      if (!isCompatible) {
        setSelectedModel(AGENT_PLATFORM_DEFAULT_MODEL);
      }
    } else {
      const isCompatible = GEMINI_MODEL_DETAILS.some((m) => m.id === selectedModel);
      if (!isCompatible) {
        setSelectedModel(GEMINI_DEFAULT_MODEL);
      }
    }
  };

  const currentKey = activeTab === 'gemini' ? geminiKey : agentPlatformKey;
  const isKeyValid = currentKey ? isValidGoogleAiApiKey(currentKey) : false;

  const handleSave = () => {
    onSaveSettings({
      geminiApiKey: geminiKey.trim(),
      agentPlatformApiKey: agentPlatformKey.trim(),
      provider: activeTab,
      selectedModel,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cấu Hình Kết Nối Model AI</h3>
              <p className="text-xs text-slate-400">Chọn nhà cung cấp, cấu hình API Key và model xử lý bài giảng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs">
          
          {/* 1. Dual Provider Tabs */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              1. Chọn Nhà Cung Cấp Dịch Vụ AI:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Tab Gemini API */}
              <button
                type="button"
                onClick={() => handleTabChange('gemini')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  activeTab === 'gemini'
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">Google Gemini API</span>
                  {activeTab === 'gemini' && (
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Google AI Studio (Miễn phí &amp; Trả phí) &bull; Mặc định khuyên dùng
                </p>
              </button>

              {/* Tab Agent Platform API */}
              <button
                type="button"
                onClick={() => handleTabChange('agent-platform')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  activeTab === 'agent-platform'
                    ? 'bg-violet-950/60 border-violet-500 shadow-md shadow-violet-500/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">Agent Platform API</span>
                  {activeTab === 'agent-platform' && (
                    <span className="w-4 h-4 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Google Cloud Agent Platform API (Enterprise / Express Mode)
                </p>
              </button>
            </div>
          </div>

          {/* 2. API Key Input */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Key className="w-4 h-4 text-indigo-400" />
                <span>
                  {activeTab === 'gemini' ? 'Gemini API Key' : 'Agent Platform API Key'}
                </span>
              </label>

              <a
                href={
                  activeTab === 'gemini'
                    ? 'https://aistudio.google.com/apikey'
                    : 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/api-keys'
                }
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 text-[11px]"
              >
                <span>Lấy API Key Miễn Phí</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={activeTab === 'gemini' ? geminiKey : agentPlatformKey}
                onChange={(e) => {
                  if (activeTab === 'gemini') {
                    setGeminiKey(e.target.value);
                  } else {
                    setAgentPlatformKey(e.target.value);
                  }
                }}
                placeholder="Dán mã API Key (bắt đầu bằng AIzaSy... hoặc AQ...)"
                className="w-full bg-slate-900 border border-slate-700/90 rounded-xl px-4 py-2.5 text-slate-100 font-mono text-xs focus:border-indigo-500 focus:outline-none pr-20"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-200"
                  title={showKey ? 'Ẩn Key' : 'Hiện Key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {currentKey && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'gemini') setGeminiKey('');
                      else setAgentPlatformKey('');
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                    title="Xóa Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Validation State Badge */}
            <div className="flex items-center justify-between text-[11px]">
              {currentKey ? (
                isKeyValid ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Định dạng Key hợp lệ (Chấp nhận AIzaSy... và AQ...)</span>
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Key chưa đúng định dạng chuẩn của Google AI (phải bắt đầu bằng AIzaSy hoặc AQ)</span>
                  </span>
                )
              ) : (
                <span className="text-slate-400">
                  (Nếu không nhập key, hệ thống sẽ sử dụng thuật toán tạo mẫu sư phạm có sẵn)
                </span>
              )}

              <span className="text-slate-500">Lưu an toàn tại LocalStorage</span>
            </div>
          </div>

          {/* 3. Model Selection Cards */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2 flex items-center justify-between">
              <span>2. Chọn Model AI Ưu Tiên:</span>
              <span className="text-slate-400 text-[11px] font-normal">
                Tự động chuyển model dự phòng nếu model chính quá tải
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(activeTab === 'gemini' ? GEMINI_MODEL_DETAILS : AGENT_PLATFORM_MODEL_DETAILS).map(
                (model) => {
                  const isSelected = selectedModel === model.id;
                  return (
                    <div
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-950/70 border-indigo-500 shadow-md'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-white text-xs">{model.name}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${model.badgeColor}`}
                          >
                            {model.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {model.description}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>ID: {model.id}</span>
                        {isSelected && (
                          <span className="text-indigo-400 font-bold">Đang chọn ✓</span>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Fallback info note */}
          <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Cơ chế tự phục hồi thông minh:</strong> Khi máy chủ Google gặp tình trạng quá tải (Lỗi 503/Unavailable), hệ thống sẽ tự động chuyển tiếp yêu cầu sang chuỗi model dự phòng mà không làm gián đoạn bài giảng.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {saveSuccess ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã lưu cấu hình thành công!</span>
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Cấu Hình</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
