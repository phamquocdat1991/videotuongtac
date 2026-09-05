import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, Cloud, Info, Key, Sparkles, XCircle } from 'lucide-react';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { EditInteractionModal } from './components/EditInteractionModal';
import { Header } from './components/Header';
import { InteractivePlayerPreview } from './components/InteractivePlayerPreview';
import { LmsEmbedModal } from './components/LmsEmbedModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { QualityReviewModal } from './components/QualityReviewModal';
import { ScriptTable } from './components/ScriptTable';
import { UploadSection } from './components/UploadSection';
import { WorkflowRail } from './components/WorkflowRail';
import { AiProvider, GeminiFileReference, InteractionPoint, LessonMaterial, ProjectData } from './types';
import { GEMINI_DEFAULT_MODEL, isValidGoogleAiApiKey } from './services/aiClientFactory';
import { uploadPdfToGemini, waitForGeminiFileReady } from './services/geminiFileService';
import { generateInteractionsWithGemini } from './services/geminiService';
import { generateExportHtml } from './utils/exportEngine';
import { createSafeProject, parseProjectJson, projectFingerprint, sanitizeFileName, validateAndNormalizeInteractions } from './utils/projectSafety';

const STORAGE_KEYS = {
  PROVIDER: 'google_ai_provider',
  MODEL: 'google_ai_selected_model',
  PROJECT: 'videocreator_current_project_v28',
  REVIEWED: 'videocreator_reviewed_fingerprint_v28',
  GENERATION_LOGS: 'videocreator_generation_logs_v28',
};
const LEGACY_SECRET_KEYS = ['gemini_api_key', 'agent_platform_api_key', 'interactive_video_gemini_api_key'];

const DEFAULT_INTERACTIONS: InteractionPoint[] = [
  {
    id: 'point_initial_1', timestamp: 25, title: 'Khái niệm lục lạp và sắc tố',
    learningObjective: 'Nhận biết bào quan thực hiện quang hợp', cognitiveLevel: 'recognition',
    data: { type: 'quiz', question: 'Bào quan nào trong tế bào thực vật là nơi diễn ra quá trình quang hợp?',
      options: ['Ti thể (Mitochondria)', 'Lục lạp (Chloroplast)', 'Không bào (Vacuole)', 'Nhân tế bào (Nucleus)'], correctAnswer: 1,
      explanation: 'Lục lạp chứa chất diệp lục có khả năng hấp thụ quang năng ánh sáng mặt trời.' },
  },
  {
    id: 'point_initial_2', timestamp: 75, title: 'Phân loại pha sáng và pha tối',
    learningObjective: 'Phân biệt vị trí và sản phẩm của hai pha quang hợp', cognitiveLevel: 'understanding',
    data: { type: 'drag_drop', instruction: 'Xếp các sản phẩm và phản ứng vào đúng pha quang hợp:', categories: ['Pha Sáng (Tilacôit)', 'Pha Tối (Chất nền Stroma)'],
      items: [
        { id: 'dd_1', text: 'Quang phân ly $H_2O$ giải phóng $O_2$', targetCategory: 'Pha Sáng (Tilacôit)' },
        { id: 'dd_2', text: 'Cố định $CO_2$ tạo Glucose $C_6H_{12}O_6$', targetCategory: 'Pha Tối (Chất nền Stroma)' },
        { id: 'dd_3', text: 'Tổng hợp năng lượng ATP & NADPH', targetCategory: 'Pha Sáng (Tilacôit)' },
        { id: 'dd_4', text: 'Chu trình Calvin', targetCategory: 'Pha Tối (Chất nền Stroma)' },
      ], explanation: 'Pha sáng diễn ra tại màng Tilacôit; pha tối diễn ra ở chất nền Stroma.' },
  },
  {
    id: 'point_initial_3', timestamp: 125, title: 'Hoàn thiện phương trình quang hợp',
    learningObjective: 'Vận dụng kiến thức để hoàn thiện phương trình', cognitiveLevel: 'application',
    data: { type: 'fill_blank', sentence: '$6CO_2 + 6H_2O + \\text{Ánh sáng} \\rightarrow {...} + 6O_2$', blankAnswer: 'C6H12O6',
      hint: 'Công thức phân tử của đường Glucose', explanation: 'Sản phẩm hữu cơ của quang hợp là đường Glucose ($C_6H_{12}O_6$).' },
  },
];

type Toast = { text: string; type: 'success' | 'info' | 'warn' };

export default function App() {
  // API key chỉ sống trong bộ nhớ của tab hiện tại.
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [agentPlatformApiKey, setAgentPlatformApiKey] = useState('');
  const [provider, setProvider] = useState<AiProvider>(() => (localStorage.getItem(STORAGE_KEYS.PROVIDER) as AiProvider) || 'gemini');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem(STORAGE_KEYS.MODEL) || GEMINI_DEFAULT_MODEL);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [videoFileName, setVideoFileName] = useState('sinh_hoc_quang_hop.mp4');
  const [videoDuration, setVideoDuration] = useState(180);
  const [seekTimestampTarget, setSeekTimestampTarget] = useState<number | null>(null);
  const [subject, setSubject] = useState('Sinh học');
  const [grade, setGrade] = useState('Lớp 10');
  const [lessonMaterial, setLessonMaterial] = useState<LessonMaterial | null>({ name: 'Giao_an_Sinh_hoc_10_Quang_hop.txt', type: 'text' });
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [lessonText, setLessonText] = useState('Bài 11: Quang hợp ở thực vật. Tìm hiểu cấu tạo lục lạp, vai trò của sắc tố quang hợp, phân biệt pha sáng diễn ra tại Tilacôit và pha tối (chu trình Calvin) tại chất nền Stroma tạo đường Glucose $C_6H_{12}O_6$.');
  const [interactions, setInteractions] = useState<InteractionPoint[]>(DEFAULT_INTERACTIONS);

  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isLmsEmbedOpen, setIsLmsEmbedOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<InteractionPoint | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExportingOffline, setIsExportingOffline] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<Toast | null>(null);
  const [saveLabel, setSaveLabel] = useState('Sẵn sàng');
  const [reviewedFingerprint, setReviewedFingerprint] = useState(() => localStorage.getItem(STORAGE_KEYS.REVIEWED) || '');
  const pendingReviewedAction = useRef<null | (() => void)>(null);
  const toastTimer = useRef<number | null>(null);
  const hydrated = useRef(false);

  const activeApiKey = provider === 'gemini' ? geminiApiKey : agentPlatformApiKey;
  const hasValidApiKey = isValidGoogleAiApiKey(activeApiKey);
  const project = useMemo(() => createSafeProject({
    videoTitle: videoFileName.replace(/\.[^/.]+$/, ''), videoUrl: videoFile ? '' : videoUrl, videoFileName, videoDuration,
    subject, grade, lessonMaterial, lessonText, interactions,
    settings: { provider, selectedModel, authorName: 'PHẠM QUỐC ĐẠT', authorZalo: '0705350000', allowSeekingPastUnanswered: false, passingScorePercent: 80 },
  }), [videoFileName, videoUrl, videoFile, videoDuration, subject, grade, lessonMaterial, lessonText, interactions, provider, selectedModel]);
  const fingerprint = useMemo(() => projectFingerprint(project), [project]);
  const isReviewed = reviewedFingerprint === fingerprint;

  const showToast = (text: string, type: Toast['type'] = 'success') => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToastMessage({ text, type });
    toastTimer.current = window.setTimeout(() => setToastMessage(null), 3800);
  };

  const handleLoadProject = (next: ProjectData) => {
    setVideoFile(null); setLessonFile(null); setVideoFileName(next.videoFileName || `${next.videoTitle || 'video_bai_giang'}.mp4`);
    setVideoUrl(next.videoUrl || ''); setVideoDuration(next.videoDuration || 180); setSubject(next.subject || 'Tổng hợp'); setGrade(next.grade || 'THPT');
    setLessonText(next.lessonText || ''); setLessonMaterial(next.lessonMaterial || null);
    setInteractions(validateAndNormalizeInteractions(next.interactions, next.videoDuration));
    if (next.settings?.provider) setProvider(next.settings.provider); if (next.settings?.selectedModel) setSelectedModel(next.settings.selectedModel);
  };

  useEffect(() => {
    LEGACY_SECRET_KEYS.forEach((key) => localStorage.removeItem(key));
    const stored = localStorage.getItem(STORAGE_KEYS.PROJECT);
    if (stored) { try { handleLoadProject(parseProjectJson(stored)); } catch { localStorage.removeItem(STORAGE_KEYS.PROJECT); } }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    setSaveLabel('Đang lưu…');
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(project)); setSaveLabel(`Đã lưu ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`); }
      catch { setSaveLabel('Không đủ dung lượng lưu'); }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [project]);

  const logGeneration = (entry: Record<string, unknown>) => {
    try { const previous = JSON.parse(localStorage.getItem(STORAGE_KEYS.GENERATION_LOGS) || '[]'); localStorage.setItem(STORAGE_KEYS.GENERATION_LOGS, JSON.stringify([{ at: new Date().toISOString(), ...entry }, ...previous].slice(0, 50))); } catch { /* optional audit log */ }
  };

  const handleSaveApiSettings = (settings: { geminiApiKey: string; agentPlatformApiKey: string; provider: AiProvider; selectedModel: string }) => {
    setGeminiApiKey(settings.geminiApiKey); setAgentPlatformApiKey(settings.agentPlatformApiKey); setProvider(settings.provider); setSelectedModel(settings.selectedModel);
    localStorage.setItem(STORAGE_KEYS.PROVIDER, settings.provider); localStorage.setItem(STORAGE_KEYS.MODEL, settings.selectedModel);
    showToast(`Đã kết nối ${settings.provider === 'gemini' ? 'Gemini API' : 'Agent Platform'} trong tab hiện tại.`);
  };

  const handleVideoSelected = (file: File | null, url: string, name: string) => { setVideoFile(file); setVideoUrl(url); setVideoFileName(name); showToast(`Đã nạp video: ${name}`); };

  const handleAIAnalyze = async () => {
    if (!hasValidApiKey) { setIsApiSettingsOpen(true); showToast('Hãy nhập API key hợp lệ để phân tích bằng AI.', 'warn'); return; }
    setIsAnalyzing(true); setAnalysisError(null);
    try {
      let fileReference: GeminiFileReference | null = null;
      if (lessonMaterial?.requiresFilesApi) {
        if (provider !== 'gemini') throw new Error('PDF lớn chỉ được hỗ trợ qua Gemini API.');
        if (!lessonFile || !lessonMaterial.fileSha256) throw new Error('Hãy tải lại PDF trước khi phân tích.');
        showToast('Đang tải PDF lớn lên Gemini để xử lý…', 'info');
        const uploaded = await uploadPdfToGemini({ apiKey: activeApiKey, file: lessonFile, projectFingerprint: fingerprint, fileSha256: lessonMaterial.fileSha256 });
        fileReference = await waitForGeminiFileReady({ apiKey: activeApiKey, reference: uploaded });
      }
      const result = await generateInteractionsWithGemini({ apiKey: activeApiKey, provider, selectedModel, videoTitle: project.videoTitle,
        videoDuration: videoDuration || 180, lessonContent: lessonText, lessonMaterial, geminiFileReference: fileReference, subject, grade, interactionCount: 3,
        onModelFallbackNotice: (fromModel, toModel) => showToast(`Đã chuyển ${fromModel} → ${toModel}.`, 'info') });
      setInteractions(result.interactions); logGeneration({ status: 'success', provider, requestedModel: selectedModel, usedModel: result.usedModel, count: result.interactions.length });
      showToast(`Đã tạo ${result.interactions.length} mốc bằng ${result.usedModel}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo kịch bản.'; setAnalysisError(message); logGeneration({ status: 'error', provider, requestedModel: selectedModel, message }); showToast(message, 'warn');
    } finally { setIsAnalyzing(false); }
  };

  const handleAddNewInteraction = () => {
    setEditingPoint({ id: `point_${Date.now()}`, timestamp: Math.min(Math.max(10, Math.round(videoDuration / 2)), Math.max(10, Math.round(videoDuration - 5))), title: 'Câu hỏi mới',
      cognitiveLevel: 'unclassified', data: { type: 'quiz', question: 'Nhập nội dung câu hỏi…', options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'], correctAnswer: 0, explanation: 'Giải thích đáp án…' } });
    setIsEditModalOpen(true);
  };
  const handleSaveInteraction = (point: InteractionPoint) => { const exists = interactions.some(item => item.id === point.id); setInteractions(validateAndNormalizeInteractions(exists ? interactions.map(item => item.id === point.id ? point : item) : [...interactions, point], videoDuration)); showToast('Đã lưu điểm tương tác.'); };
  const handleDuplicateInteraction = (point: InteractionPoint) => { const duplicate = structuredClone(point); duplicate.id = `point_${Date.now()}`; duplicate.timestamp = Math.min(Math.max(0, videoDuration - 5), point.timestamp + 10); duplicate.title = `${point.title} (bản sao)`; setInteractions(validateAndNormalizeInteractions([...interactions, duplicate], videoDuration)); showToast('Đã nhân bản điểm tương tác.'); };
  const handleDeleteInteraction = (id: string) => { if (window.confirm('Xóa điểm tương tác này?')) { setInteractions(interactions.filter(point => point.id !== id)); showToast('Đã xóa điểm tương tác.', 'info'); } };
  const handleSeek = (seconds: number) => { setSeekTimestampTarget(seconds); window.setTimeout(() => setSeekTimestampTarget(null), 200); };

  const buildHtml = () => generateExportHtml(project.videoTitle, interactions, videoFile ? '' : videoUrl, videoFileName);
  const performExportHtml = () => { const url = URL.createObjectURL(new Blob([buildHtml()], { type: 'text/html;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `video_tuong_tac_ai_${sanitizeFileName(project.videoTitle)}.html`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); showToast('Đã xuất file HTML tương tác.'); };
  const performPreview = () => { const url = URL.createObjectURL(new Blob([buildHtml()], { type: 'text/html;charset=utf-8' })); const opened = window.open(url, '_blank', 'noopener,noreferrer'); window.setTimeout(() => URL.revokeObjectURL(url), 60_000); if (!opened) showToast('Trình duyệt đang chặn tab xem trước.', 'warn'); };
  const performCopyHtml = () => { void navigator.clipboard.writeText(buildHtml()).then(() => showToast('Đã sao chép mã HTML.')).catch(() => showToast('Không thể sao chép; hãy dùng nút xuất file.', 'warn')); };
  const performOfflineExport = async () => {
    if (!videoFile) { showToast('Gói offline cần video MP4/WebM tải từ máy.', 'warn'); return; }
    setIsExportingOffline(true);
    try { const { createOfflinePackage, offlinePackageFileName } = await import('./utils/offlinePackage'); const blob = await createOfflinePackage({ videoTitle: project.videoTitle, videoFile, videoFileName, interactions });
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = offlinePackageFileName(project.videoTitle); document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); showToast('Đã tạo gói bài giảng offline.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể tạo gói offline.', 'warn'); } finally { setIsExportingOffline(false); }
  };

  const requestReviewedAction = (action?: () => void) => {
    if (!interactions.length) { showToast('Kịch bản chưa có điểm tương tác.', 'warn'); return; }
    if (action && isReviewed) { action(); return; }
    pendingReviewedAction.current = action || null; setIsReviewOpen(true);
  };
  const approveReview = () => { localStorage.setItem(STORAGE_KEYS.REVIEWED, fingerprint); setReviewedFingerprint(fingerprint); setIsReviewOpen(false); const action = pendingReviewedAction.current; pendingReviewedAction.current = null; if (action) window.setTimeout(action, 0); else showToast('Đã ghi nhận rà soát kịch bản.'); };
  const requestLms = () => requestReviewedAction(() => setIsLmsEmbedOpen(true));

  return (
    <div className="academic-theme app-shell flex min-h-screen flex-col font-sans text-slate-900 antialiased selection:bg-blue-200">
      <Header authorName="PHẠM QUỐC ĐẠT" authorZalo="0705350000" hasApiKey={hasValidApiKey} onOpenApiSettings={() => setIsApiSettingsOpen(true)} onOpenProjectManager={() => setIsProjectManagerOpen(true)} onOpenLmsEmbed={requestLms} />

      {analysisError && <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-rose-800"><div className="mx-auto flex max-w-[1480px] items-start justify-between gap-3 text-xs"><div className="flex items-start gap-2"><XCircle className="mt-0.5 h-4 w-4 flex-none text-rose-500" /><span><strong className="mr-2 text-rose-700">Phân tích đã dừng.</strong>{analysisError}</span></div><div className="flex items-center gap-2"><button type="button" onClick={() => setIsApiSettingsOpen(true)} className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 font-bold text-white"><Key className="h-3 w-3" />Cài đặt</button><button type="button" onClick={() => setAnalysisError(null)} aria-label="Đóng cảnh báo" className="rounded p-1 hover:bg-rose-100">×</button></div></div></div>}

      {toastMessage && <div role="status" aria-live="polite" className={`fixed bottom-5 left-1/2 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-2xl backdrop-blur-xl sm:left-auto sm:right-6 sm:translate-x-0 ${toastMessage.type === 'warn' ? 'border-rose-400/30 bg-rose-950/95 text-rose-100' : toastMessage.type === 'info' ? 'border-cyan-400/30 bg-slate-900/95 text-cyan-100' : 'border-emerald-400/30 bg-slate-900/95 text-white'}`}>{toastMessage.type === 'warn' ? <AlertCircle className="h-4 w-4 text-rose-300" /> : toastMessage.type === 'info' ? <Info className="h-4 w-4 text-cyan-300" /> : <Check className="h-4 w-4 text-emerald-300" />}<span>{toastMessage.text}</span></div>}

      <main className="mx-auto flex w-full max-w-[1560px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <section className="flex flex-col gap-3 rounded-3xl border border-blue-100 bg-gradient-to-r from-white via-blue-50/70 to-indigo-50/70 px-5 py-5 shadow-[0_20px_55px_rgba(30,64,175,0.07)] sm:flex-row sm:items-end sm:justify-between">
          <div><div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-600"><Sparkles className="h-3.5 w-3.5" />Academic Workspace</div><h2 className="max-w-3xl text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">Thiết kế trải nghiệm học tập rõ ràng, trực quan</h2><p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">Video ở trung tâm, quy trình bên trái và toàn bộ công cụ biên tập ở bên phải.</p></div>
          <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[11px] text-slate-600 shadow-sm"><Cloud className="h-3.5 w-3.5 text-emerald-600" />{saveLabel}</span><span className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-blue-700 shadow-sm">{subject} · {grade}</span></div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-start">
          <aside className="flex flex-col gap-4 xl:sticky xl:top-[84px] xl:col-span-2">
            <WorkflowRail hasSource={Boolean(videoUrl || videoFile)} interactionCount={interactions.length} isReviewed={isReviewed} saveLabel={saveLabel} />
            <section className="hidden rounded-3xl border border-blue-100 bg-blue-50/70 p-4 xl:block"><div className="flex items-center gap-2 text-xs font-extrabold text-blue-800"><Info className="h-4 w-4" />Gợi ý thao tác</div><p className="mt-2 text-[11px] leading-relaxed text-slate-600">Chọn một mốc trong kịch bản để xem đúng vị trí trên video. Hãy rà soát trước khi xuất HTML hoặc LMS.</p></section>
          </aside>
          <div className="flex min-w-0 flex-col gap-5 xl:col-span-5">
            <InteractivePlayerPreview videoUrl={videoUrl} videoFileName={videoFileName} interactions={interactions} seekTimestampTarget={seekTimestampTarget} onDurationDetected={setVideoDuration} />
            <UploadSection apiKey={activeApiKey} provider={provider} selectedModel={selectedModel} onOpenApiSettings={() => setIsApiSettingsOpen(true)} videoFileName={videoFileName} videoUrl={videoUrl} videoDuration={videoDuration} onVideoSelected={handleVideoSelected} lessonMaterial={lessonMaterial} onLessonMaterialChange={setLessonMaterial} onLessonFileChange={setLessonFile} lessonText={lessonText} onLessonTextChange={setLessonText} subject={subject} onSubjectChange={setSubject} grade={grade} onGradeChange={setGrade} isAnalyzing={isAnalyzing} onAnalyze={handleAIAnalyze} />
          </div>
          <div className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-[84px] xl:col-span-5">
            <ScriptTable interactions={interactions} onEditInteraction={(point) => { setEditingPoint(point); setIsEditModalOpen(true); }} onDeleteInteraction={handleDeleteInteraction} onDuplicateInteraction={handleDuplicateInteraction} onAddNewInteraction={handleAddNewInteraction} onSeekToTimestamp={handleSeek} onExportHtml={() => requestReviewedAction(performExportHtml)} onPreviewStandalone={() => requestReviewedAction(performPreview)} onCopyHtml={() => requestReviewedAction(performCopyHtml)} onOpenLmsEmbed={requestLms} onReview={() => requestReviewedAction()} onExportOffline={() => requestReviewedAction(() => void performOfflineExport())} isReviewed={isReviewed} isExportingOffline={isExportingOffline} />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/70 px-6 py-5 text-[11px] text-slate-500"><div className="mx-auto flex max-w-[1480px] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><span>Interactive Video Studio · Academic Workspace v2.8</span><span>Thiết kế bởi <strong className="text-slate-700">PHẠM QUỐC ĐẠT</strong> · Zalo 0705350000</span></div></footer>

      <ApiSettingsModal isOpen={isApiSettingsOpen} onClose={() => setIsApiSettingsOpen(false)} geminiApiKey={geminiApiKey} agentPlatformApiKey={agentPlatformApiKey} provider={provider} selectedModel={selectedModel} onSaveSettings={handleSaveApiSettings} />
      <ProjectManagerModal isOpen={isProjectManagerOpen} onClose={() => setIsProjectManagerOpen(false)} currentProject={project} onLoadProject={handleLoadProject} onShowToast={showToast} />
      <LmsEmbedModal isOpen={isLmsEmbedOpen} onClose={() => setIsLmsEmbedOpen(false)} videoTitle={project.videoTitle} onShowToast={showToast} />
      <EditInteractionModal point={editingPoint} isOpen={isEditModalOpen} videoDuration={videoDuration} onClose={() => { setIsEditModalOpen(false); setEditingPoint(null); }} onSave={handleSaveInteraction} />
      <QualityReviewModal isOpen={isReviewOpen} interactions={interactions} videoDuration={videoDuration} onClose={() => { setIsReviewOpen(false); pendingReviewedAction.current = null; }} onApprove={approveReview} />
    </div>
  );
}
