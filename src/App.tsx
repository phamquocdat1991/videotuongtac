import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ScriptTable } from './components/ScriptTable';
import { InteractivePlayerPreview } from './components/InteractivePlayerPreview';
import { EditInteractionModal } from './components/EditInteractionModal';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { LmsEmbedModal } from './components/LmsEmbedModal';
import { InteractionPoint, LessonMaterial, AiProvider, AppSettings, ProjectData } from './types';
import { generateInteractionsWithGemini } from './services/geminiService';
import { generateExportHtml } from './utils/exportEngine';
import { GEMINI_DEFAULT_MODEL, isValidGoogleAiApiKey } from './services/aiClientFactory';
import { Check, AlertCircle, RefreshCw, Sparkles, Info, XCircle, Key } from 'lucide-react';

const STORAGE_KEYS = {
  GEMINI_KEY: 'gemini_api_key',
  AGENT_PLATFORM_KEY: 'agent_platform_api_key',
  PROVIDER: 'google_ai_provider',
  MODEL: 'google_ai_selected_model',
  PROJECT: 'videocreator_current_project',
  LEGACY_KEY: 'interactive_video_gemini_api_key',
};

export default function App() {
  // 1. Settings & API state
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || localStorage.getItem(STORAGE_KEYS.LEGACY_KEY) || '';
  });
  const [agentPlatformApiKey, setAgentPlatformApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.AGENT_PLATFORM_KEY) || '';
  });
  const [provider, setProvider] = useState<AiProvider>(() => {
    return (localStorage.getItem(STORAGE_KEYS.PROVIDER) as AiProvider) || 'gemini';
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.MODEL) || GEMINI_DEFAULT_MODEL;
  });

  // 2. Video & Lesson state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>(
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  );
  const [videoFileName, setVideoFileName] = useState<string>('sinh_hoc_quang_hop.mp4');
  const [videoDuration, setVideoDuration] = useState<number>(180);
  const [seekTimestampTarget, setSeekTimestampTarget] = useState<number | null>(null);

  const [subject, setSubject] = useState<string>('Sinh học');
  const [grade, setGrade] = useState<string>('Lớp 10');

  const [lessonMaterial, setLessonMaterial] = useState<LessonMaterial | null>({
    name: 'Giao_an_Sinh_hoc_10_Quang_hop.txt',
    type: 'text',
  });
  const [lessonText, setLessonText] = useState<string>(
    'Bài 11: Quang hợp ở thực vật. Tìm hiểu cấu tạo lục lạp, vai trò của sắc tố quang hợp, phân biệt pha sáng diễn ra tại Tilacôit và pha tối (chu trình Calvin) tại chất nền Stroma tạo đường Glucose $C_6H_{12}O_6$.'
  );

  // 3. Interaction points (Default high quality seed)
  const [interactions, setInteractions] = useState<InteractionPoint[]>([
    {
      id: 'point_initial_1',
      timestamp: 25,
      title: 'Khái niệm Lục lạp & Sắc tố',
      data: {
        type: 'quiz',
        question: 'Bào quan nào trong tế bào thực vật là nơi diễn ra quá trình quang hợp?',
        options: [
          'Ti thể (Mitochondria)',
          'Lục lạp (Chloroplast)',
          'Không bào (Vacuole)',
          'Nhân tế bào (Nucleus)',
        ],
        correctAnswer: 1,
        explanation: 'Lục lạp chứa chất diệp lục có khả năng hấp thụ quang năng ánh sáng mặt trời.',
      },
    },
    {
      id: 'point_initial_2',
      timestamp: 75,
      title: 'Phân loại Pha Sáng & Pha Tối',
      data: {
        type: 'drag_drop',
        instruction: 'Kéo các sản phẩm và phản ứng vào đúng pha quang hợp tương ứng:',
        categories: ['Pha Sáng (Tilacôit)', 'Pha Tối (Chất nền Stroma)'],
        items: [
          { id: 'dd_1', text: 'Quang phân ly $H_2O$ giải phóng $O_2$', targetCategory: 'Pha Sáng (Tilacôit)' },
          { id: 'dd_2', text: 'Cố định $CO_2$ tạo Glucose $C_6H_{12}O_6$', targetCategory: 'Pha Tối (Chất nền Stroma)' },
          { id: 'dd_3', text: 'Tổng hợp năng lượng ATP & NADPH', targetCategory: 'Pha Sáng (Tilacôit)' },
          { id: 'dd_4', text: 'Chu trình Calvin', targetCategory: 'Pha Tối (Chất nền Stroma)' },
        ],
        explanation: 'Pha sáng cần ánh sáng trực tiếp tại màng Tilacôit; pha tối diễn ra ở chất nền Stroma không cần ánh sáng trực tiếp.',
      },
    },
    {
      id: 'point_initial_3',
      timestamp: 125,
      title: 'Điền từ: Phương trình hóa học',
      data: {
        type: 'fill_blank',
        sentence: '$6CO_2 + 6H_2O + \\text{Ánh sáng} \\rightarrow {...} + 6O_2$',
        blankAnswer: 'C6H12O6',
        hint: 'Công thức phân tử của đường Glucose',
        explanation: 'Sản phẩm hữu cơ của quang hợp là đường Glucose ($C_6H_{12}O_6$).',
      },
    },
  ]);

  // 4. Modal states
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isLmsEmbedOpen, setIsLmsEmbedOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<InteractionPoint | null>(null);

  // 5. UI states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'info' | 'warn' } | null>(null);

  const activeApiKey = provider === 'gemini' ? geminiApiKey : agentPlatformApiKey;
  const hasValidApiKey = isValidGoogleAiApiKey(activeApiKey);

  // Toast notification helper
  const showToast = (text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Save project automatically to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const projectPayload = {
          videoTitle: videoFileName.replace(/\.[^/.]+$/, ''),
          videoUrl: videoFile ? '' : videoUrl,
          videoFileName,
          videoDuration,
          subject,
          grade,
          lessonText,
          interactions,
        };
        localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(projectPayload));
      } catch (err) {
        // storage quota
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [videoFileName, videoUrl, videoFile, videoDuration, subject, grade, lessonText, interactions]);

  // Handle Save API Settings
  const handleSaveApiSettings = (settings: {
    geminiApiKey: string;
    agentPlatformApiKey: string;
    provider: AiProvider;
    selectedModel: string;
  }) => {
    setGeminiApiKey(settings.geminiApiKey);
    setAgentPlatformApiKey(settings.agentPlatformApiKey);
    setProvider(settings.provider);
    setSelectedModel(settings.selectedModel);

    localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, settings.geminiApiKey);
    localStorage.setItem(STORAGE_KEYS.AGENT_PLATFORM_KEY, settings.agentPlatformApiKey);
    localStorage.setItem(STORAGE_KEYS.PROVIDER, settings.provider);
    localStorage.setItem(STORAGE_KEYS.MODEL, settings.selectedModel);

    showToast(`Đã lưu cấu hình: ${settings.provider === 'gemini' ? 'Gemini API' : 'Agent Platform'} (${settings.selectedModel})`);
  };

  // Video Selected
  const handleVideoSelected = (file: File | null, url: string, name: string) => {
    setVideoFile(file);
    setVideoUrl(url);
    setVideoFileName(name);
    showToast(`Đã nạp video: ${name}`);
  };

  // AI Analysis Action
  const handleAIAnalyze = async () => {
    // Nếu chưa có API key, tự động bật Modal cài đặt theo AI_INSTRUCTIONS.md
    if (!activeApiKey || !activeApiKey.trim()) {
      setIsApiSettingsOpen(true);
      showToast('Vui lòng nhập Gemini API Key từ https://aistudio.google.com/api-keys để tiếp tục.', 'warn');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const { interactions: generated, usedModel } = await generateInteractionsWithGemini({
        apiKey: activeApiKey,
        provider,
        selectedModel,
        videoTitle: videoFileName.replace(/\.[^/.]+$/, ''),
        videoDuration: videoDuration || 180,
        lessonContent: lessonText,
        subject,
        grade,
        interactionCount: 3,
        onModelFallbackNotice: (fromM, toM, reason) => {
          showToast(`Model ${fromM} quá tải; đã tự động chuyển sang ${toM}`, 'info');
        },
      });

      if (generated && generated.length > 0) {
        setInteractions(generated);
        setAnalysisError(null);
        showToast(`AI (${usedModel}) đã tự động tạo ${generated.length} mốc tương tác thành công!`);
      }
    } catch (err: any) {
      // Hiển thị nguyên văn lỗi từ API (VD: 429 RESOURCE_EXHAUSTED) theo AI_INSTRUCTIONS.md
      const rawError = err?.message || '429 RESOURCE_EXHAUSTED: Quota exceeded or Model request failed';
      setAnalysisError(rawError);
      showToast(`Lỗi: ${rawError}`, 'warn');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Interaction handlers
  const handleEditInteraction = (point: InteractionPoint) => {
    setEditingPoint(point);
    setIsEditModalOpen(true);
  };

  const handleAddNewInteraction = () => {
    const newPoint: InteractionPoint = {
      id: `point_${Date.now()}`,
      timestamp: Math.min(Math.round(videoDuration * 0.5), Math.max(10, Math.round(videoDuration - 20))),
      title: 'Câu hỏi mới',
      data: {
        type: 'quiz',
        question: 'Nhập nội dung câu hỏi trắc nghiệm...',
        options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
        correctAnswer: 0,
        explanation: 'Giải thích chi tiết câu trả lời...',
      },
    };
    setEditingPoint(newPoint);
    setIsEditModalOpen(true);
  };

  const handleDuplicateInteraction = (point: InteractionPoint) => {
    const duplicated: InteractionPoint = {
      ...JSON.parse(JSON.stringify(point)),
      id: `point_${Date.now()}`,
      timestamp: Math.min(Math.round(videoDuration - 5), point.timestamp + 10),
      title: `${point.title} (Bản sao)`,
    };
    const next = [...interactions, duplicated].sort((a, b) => a.timestamp - b.timestamp);
    setInteractions(next);
    showToast('Đã nhân bản mốc tương tác!');
  };

  const handleSaveInteraction = (updatedPoint: InteractionPoint) => {
    const exists = interactions.some((p) => p.id === updatedPoint.id);
    let updated: InteractionPoint[];
    if (exists) {
      updated = interactions.map((p) => (p.id === updatedPoint.id ? updatedPoint : p));
    } else {
      updated = [...interactions, updatedPoint];
    }
    updated.sort((a, b) => a.timestamp - b.timestamp);
    setInteractions(updated);
    showToast('Đã lưu điểm tương tác!');
  };

  const handleDeleteInteraction = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa điểm dừng tương tác này?')) {
      setInteractions(interactions.filter((p) => p.id !== id));
      showToast('Đã xóa điểm dừng tương tác.');
    }
  };

  const handleSeekToTimestamp = (seconds: number) => {
    setSeekTimestampTarget(seconds);
    setTimeout(() => setSeekTimestampTarget(null), 200);
  };

  // Load project from manager or JSON
  const handleLoadProject = (project: ProjectData) => {
    if (project.videoTitle) setVideoFileName(project.videoFileName || `${project.videoTitle}.mp4`);
    if (project.videoUrl) setVideoUrl(project.videoUrl);
    if (project.videoDuration) setVideoDuration(project.videoDuration);
    if (project.subject) setSubject(project.subject);
    if (project.grade) setGrade(project.grade);
    if (project.lessonText) setLessonText(project.lessonText);
    if (project.lessonMaterial) setLessonMaterial(project.lessonMaterial);
    if (project.interactions && Array.isArray(project.interactions) && project.interactions.length > 0) {
      setInteractions(project.interactions);
    }
  };

  // Export Engine: Generates standalone HTML
  const handleExportHtml = () => {
    const htmlCode = generateExportHtml(
      videoFileName.replace(/\.[^/.]+$/, ''),
      interactions,
      videoFile ? '' : videoUrl,
      videoFileName
    );

    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `video_tuong_tac_ai_${videoFileName.replace(/\.[^/.]+$/, '')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    showToast('🎉 Đã xuất file video_tuong_tac_ai.html thành công! Có thể mở chạy ngay trên trình duyệt.');
  };

  const handlePreviewStandalone = () => {
    const htmlCode = generateExportHtml(
      videoFileName.replace(/\.[^/.]+$/, ''),
      interactions,
      videoFile ? '' : videoUrl,
      videoFileName
    );
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  };

  const handleCopyHtml = async () => {
    const htmlCode = generateExportHtml(
      videoFileName.replace(/\.[^/.]+$/, ''),
      interactions,
      videoFile ? '' : videoUrl,
      videoFileName
    );
    try {
      await navigator.clipboard.writeText(htmlCode);
      showToast('Đã sao chép toàn bộ mã nguồn HTML vào Clipboard!');
    } catch {
      alert('Không thể sao chép tự động, vui lòng dùng nút Xuất File.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans antialiased">
      
      {/* Header with Mandatory Author Credit & Controls */}
      <Header
        authorName="PHẠM QUỐC ĐẠT"
        authorZalo="0705350000"
        hasApiKey={hasValidApiKey}
        onOpenApiSettings={() => setIsApiSettingsOpen(true)}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onOpenLmsEmbed={() => setIsLmsEmbedOpen(true)}
      />

      {/* Red Error State Banner (as required by AI_INSTRUCTIONS.md) */}
      {analysisError && (
        <div className="bg-rose-950/90 border-b border-rose-600/80 px-4 py-3 text-rose-100 shadow-xl animate-in slide-in-from-top-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>
                <span className="font-black text-rose-300 uppercase tracking-wider mr-2 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-500/40">
                  Đã dừng do lỗi
                </span>
                <span className="font-mono">{analysisError}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsApiSettingsOpen(true)}
                className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Đổi API Key / Model</span>
              </button>
              <button
                type="button"
                onClick={() => setAnalysisError(null)}
                className="p-1 text-rose-300 hover:text-white"
                title="Đóng cảnh báo"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 border ${
            toastMessage.type === 'warn'
              ? 'bg-rose-950/90 border-rose-500/60 text-rose-200'
              : toastMessage.type === 'info'
              ? 'bg-indigo-950/90 border-indigo-500/60 text-indigo-200'
              : 'bg-slate-900/95 border-emerald-500/60 text-white'
          }`}
        >
          <div
            className={`p-1 rounded-full ${
              toastMessage.type === 'warn'
                ? 'bg-rose-500/20 text-rose-400'
                : toastMessage.type === 'info'
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {toastMessage.type === 'warn' ? (
              <AlertCircle className="w-4 h-4" />
            ) : toastMessage.type === 'info' ? (
              <Info className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </div>
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Main Content: 2-Column Responsive Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* KHU VỰC 1: Cài đặt, Môn học & Tải lên (Cols 1 to 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <UploadSection
            apiKey={activeApiKey}
            provider={provider}
            selectedModel={selectedModel}
            onOpenApiSettings={() => setIsApiSettingsOpen(true)}
            videoFileName={videoFileName}
            videoUrl={videoUrl}
            videoDuration={videoDuration}
            onVideoSelected={handleVideoSelected}
            lessonMaterial={lessonMaterial}
            onLessonMaterialChange={setLessonMaterial}
            lessonText={lessonText}
            onLessonTextChange={setLessonText}
            subject={subject}
            onSubjectChange={setSubject}
            grade={grade}
            onGradeChange={setGrade}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAIAnalyze}
          />
        </div>

        {/* KHU VỰC 2: Trình phát trực quan & Bảng kịch bản (Cols 6 to 12) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Live Interactive Player Preview */}
          <InteractivePlayerPreview
            videoUrl={videoUrl}
            videoFileName={videoFileName}
            interactions={interactions}
            seekTimestampTarget={seekTimestampTarget}
            onDurationDetected={(dur) => setVideoDuration(dur)}
          />

          {/* Script Table (Bảng Kịch Bản) */}
          <ScriptTable
            interactions={interactions}
            onEditInteraction={handleEditInteraction}
            onDeleteInteraction={handleDeleteInteraction}
            onDuplicateInteraction={handleDuplicateInteraction}
            onAddNewInteraction={handleAddNewInteraction}
            onSeekToTimestamp={handleSeekToTimestamp}
            onExportHtml={handleExportHtml}
            onPreviewStandalone={handlePreviewStandalone}
            onCopyHtml={handleCopyHtml}
            onOpenLmsEmbed={() => setIsLmsEmbedOpen(true)}
          />

        </div>

      </main>

      {/* Footer Info with Author Attribution */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Interactive Video Studio for Teachers &bull; Bản quyền v2.6 Unlimited</span>
          <span className="text-slate-400">
            Tác giả: <strong className="text-indigo-400">PHẠM QUỐC ĐẠT</strong> (Zalo: 0705350000)
          </span>
        </div>
      </footer>

      {/* 1. API Settings Modal */}
      <ApiSettingsModal
        isOpen={isApiSettingsOpen}
        onClose={() => setIsApiSettingsOpen(false)}
        geminiApiKey={geminiApiKey}
        agentPlatformApiKey={agentPlatformApiKey}
        provider={provider}
        selectedModel={selectedModel}
        onSaveSettings={handleSaveApiSettings}
      />

      {/* 2. Project Manager Modal */}
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        currentProject={{
          videoTitle: videoFileName.replace(/\.[^/.]+$/, ''),
          videoUrl,
          videoFileName,
          videoDuration,
          subject,
          grade,
          lessonMaterial,
          lessonText,
          interactions,
          settings: {
            geminiApiKey,
            agentPlatformApiKey,
            provider,
            selectedModel,
            authorName: 'PHẠM QUỐC ĐẠT',
            authorZalo: '0705350000',
            allowSeekingPastUnanswered: false,
            passingScorePercent: 80,
          },
        }}
        onLoadProject={handleLoadProject}
        onShowToast={(msg) => showToast(msg)}
      />

      {/* 3. LMS Embed Modal */}
      <LmsEmbedModal
        isOpen={isLmsEmbedOpen}
        onClose={() => setIsLmsEmbedOpen(false)}
        videoTitle={videoFileName.replace(/\.[^/.]+$/, '')}
        onShowToast={(msg) => showToast(msg)}
      />

      {/* 4. Edit Interaction Modal */}
      <EditInteractionModal
        point={editingPoint}
        isOpen={isEditModalOpen}
        videoDuration={videoDuration}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPoint(null);
        }}
        onSave={handleSaveInteraction}
      />

    </div>
  );
}
