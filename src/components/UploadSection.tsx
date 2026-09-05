import React, { useState, useRef } from 'react';
import {
  Key,
  Video,
  FileText,
  Sparkles,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Film,
  FileCheck,
  RefreshCw,
  Sliders,
  BookOpen,
  GraduationCap,
  Cpu,
  Link,
  ArrowRight,
} from 'lucide-react';
import { LessonMaterial, AiProvider } from '../types';
import { isValidGoogleAiApiKey } from '../services/aiClientFactory';
import { parseLessonFile } from '../utils/documentParser';
import { MAX_VIDEO_BYTES, validateDirectVideoUrl } from '../utils/projectSafety';

interface UploadSectionProps {
  apiKey: string;
  provider: AiProvider;
  selectedModel: string;
  onOpenApiSettings: () => void;
  videoFileName: string;
  videoUrl: string;
  videoDuration: number;
  onVideoSelected: (file: File | null, url: string, name: string) => void;
  lessonMaterial: LessonMaterial | null;
  onLessonMaterialChange: (material: LessonMaterial | null) => void;
  onLessonFileChange: (file: File | null) => void;
  lessonText: string;
  onLessonTextChange: (text: string) => void;
  subject: string;
  onSubjectChange: (s: string) => void;
  grade: string;
  onGradeChange: (g: string) => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  apiKey,
  provider,
  selectedModel,
  onOpenApiSettings,
  videoFileName,
  videoUrl,
  videoDuration,
  onVideoSelected,
  lessonMaterial,
  onLessonMaterialChange,
  onLessonFileChange,
  lessonText,
  onLessonTextChange,
  subject,
  onSubjectChange,
  grade,
  onGradeChange,
  isAnalyzing,
  onAnalyze,
}) => {
  const [dragActiveVideo, setDragActiveVideo] = useState(false);
  const [urlInput, setUrlInput] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [documentState, setDocumentState] = useState<{ status: 'idle' | 'reading' | 'error'; message?: string }>({ status: 'idle' });
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const subjectsList = [
    'Sinh học',
    'Toán học',
    'Vật lý',
    'Hóa học',
    'Tiếng Anh',
    'Lịch sử & Địa lý',
    'Ngữ văn',
    'Tin học',
    'Kỹ năng sống',
  ];

  const gradesList = [
    'Tiểu học (Lớp 1-5)',
    'Lớp 6',
    'Lớp 7',
    'Lớp 8',
    'Lớp 9',
    'Lớp 10',
    'Lớp 11',
    'Lớp 12',
    'Đại học / Chuyên ngành',
  ];

  // Sample educational videos for immediate demonstration
  const sampleVideos = [
    {
      title: 'Sinh học: Quang hợp ở Thực vật',
      subject: 'Sinh học',
      grade: 'Lớp 10',
      fileName: 'sinh_hoc_quang_hop.mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      lessonSnippet:
        'Bài 11: Quang hợp ở thực vật. Khái niệm quang hợp, vai trò của sắc tố diệp lục, cấu tạo lục lạp. Phân biệt pha sáng (quang phân ly H2O tạo O2, NADPH, ATP) tại tilacôit và pha tối (chu trình Calvin cố định CO2 thành Glucose C6H12O6) tại chất nền Stroma.',
    },
    {
      title: 'Toán học: Lượng giác cơ bản',
      subject: 'Toán học',
      grade: 'Lớp 11',
      fileName: 'toan_luong_giac.mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      lessonSnippet:
        'Chương Lượng giác: Đường tròn lượng giác, công thức cơ bản $\\sin^2(x) + \\cos^2(x) = 1$, $\\tan(x) = \\frac{\\sin(x)}{\\cos(x)}$. Các phương trình lượng giác cơ bản $\\sin(x) = m$ và điều kiện có nghiệm thuộc đoạn $[-1, 1]$.',
    },
    {
      title: 'Tiếng Anh: Grammar Tenses',
      subject: 'Tiếng Anh',
      grade: 'Lớp 10',
      fileName: 'english_grammar_review.mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      lessonSnippet:
        'Unit 3: Present Perfect vs Past Simple tenses. Identifying key signals (since, for, already, yet, yesterday). Vocabulary classification: Noun suffixes (-tion, -ment, -ness) vs Adjective suffixes (-ful, -ive, -ous).',
    },
  ];

  const handleVideoFile = (file: File) => {
    const supported = ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type) || /\.(mp4|webm|mov)$/i.test(file.name);
    if (supported && file.size <= MAX_VIDEO_BYTES) {
      const url = URL.createObjectURL(file);
      onVideoSelected(file, url, file.name);
      setUrlError(null);
    } else if (file.size > MAX_VIDEO_BYTES) {
      setUrlError('Video vượt quá 250 MiB. Hãy nén video trước khi tải lên.');
    } else {
      setUrlError('Vui lòng chọn đúng định dạng video MP4, WebM hoặc MOV.');
    }
  };

  /** Xử lý URL video trực tuyến nhập tay */
  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    const result = validateDirectVideoUrl(trimmed);
    if ('message' in result) { setUrlError(result.message); return; }
    onVideoSelected(null, result.url, result.fileName);
    setUrlError(null);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleDocFile = async (file: File) => {
    if (!file) return;
    setDocumentState({ status: 'reading' });
    try { const material = await parseLessonFile(file); if (material.type === 'image') material.previewUrl = URL.createObjectURL(file);
      onLessonMaterialChange(material); onLessonFileChange(material.type === 'pdf' ? file : null);
      if (material.content) onLessonTextChange(material.content); else if (!lessonText.trim()) onLessonTextChange(material.type === 'image' ? `[Ảnh bài giảng: ${file.name}] Phân tích nội dung kiến thức trong ảnh để tạo câu hỏi.` : `[Tài liệu PDF: ${file.name}] Phân tích nội dung tài liệu để tạo câu hỏi.`);
      setDocumentState({ status: 'idle' });
    } catch (error) { setDocumentState({ status: 'error', message: error instanceof Error ? error.message : 'Không thể đọc tài liệu đã chọn.' }); }
  };

  const isKeyValid = apiKey ? isValidGoogleAiApiKey(apiKey) : false;

  return (
    <section aria-labelledby="source-panel-title" className="academic-panel academic-source flex flex-col gap-5 rounded-3xl border border-white/[0.075] bg-[#0b1627]/95 p-5 shadow-[0_24px_70px_rgba(2,8,23,0.32)] lg:p-6">
      
      {/* Section Header with Active Model Status */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 id="source-panel-title" className="text-base font-bold text-white">Nguồn bài học</h2>
            <p className="text-xs text-slate-400">Chọn video, ngữ cảnh lớp học và tài liệu nền</p>
          </div>
        </div>

        {/* Quick Model Badge */}
        <button
          type="button"
          onClick={onOpenApiSettings}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-[11px] font-semibold text-indigo-300 transition-colors"
          title="Nhấp để cấu hình Model &amp; API Key"
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="truncate max-w-[110px]">{selectedModel}</span>
        </button>
      </div>

      {/* 1. Subject & Grade Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-indigo-400" />
            <span>Môn học:</span>
          </label>
          <select
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {subjectsList.map((s, i) => (
              <option key={i} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <GraduationCap className="w-3 h-3 text-indigo-400" />
            <span>Khối lớp / Cấp học:</span>
          </label>
          <select
            value={grade}
            onChange={(e) => onGradeChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {gradesList.map((g, i) => (
              <option key={i} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Video Upload Area */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tải Lên Video Bài Giảng (.mp4, .webm)</span>
          </span>
          {videoFileName && (
            <span className="text-[11px] text-emerald-400 font-medium truncate max-w-[200px]">
              ✓ {videoFileName}
            </span>
          )}
        </label>

        {/* Drag Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActiveVideo(true);
          }}
          onDragLeave={() => setDragActiveVideo(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActiveVideo(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleVideoFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => videoInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            dragActiveVideo
              ? 'border-indigo-500 bg-indigo-500/10'
              : videoUrl
              ? 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10'
              : 'border-slate-700/80 bg-slate-950/40 hover:bg-slate-800/60 hover:border-slate-600'
          }`}
        >
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleVideoFile(e.target.files[0]);
              }
            }}
          />

          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-1.5">
            <Film className="w-5 h-5" />
          </div>

          {videoFileName ? (
            <div>
              <p className="text-xs font-bold text-slate-900 truncate max-w-xs">{videoFileName}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Nhấp để chọn video khác</p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-slate-200">
                Kéo thả video vào đây hoặc <span className="text-indigo-400 underline">chọn từ máy tính</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Định dạng hỗ trợ: MP4, WebM, MOV</p>
            </div>
          )}
        </div>

        {/* URL Video Input (toggle) */}
        <div className="mt-1.5">
          {!showUrlInput ? (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-[11px] text-slate-400 hover:text-indigo-300 border border-dashed border-slate-700/60 hover:border-indigo-500/40 rounded-lg transition-all"
            >
              <Link className="w-3.5 h-3.5" />
              <span>Hoặc nhập URL trực tiếp tới video MP4/WebM</span>
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setUrlError(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="Dán URL video trực tiếp (https://...mp4)"
                className="flex-1 bg-slate-950/80 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                autoFocus
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors"
                title="Tải video từ URL"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => { setShowUrlInput(false); setUrlInput(''); setUrlError(null); }}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs"
                aria-label="Đóng nhập URL"
              >
                ✕
              </button>
            </div>
          )}
          {urlError && <p role="alert" className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-rose-300"><AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-none" /><span>{urlError}</span></p>}
        </div>

        {/* Quick Sample Video Buttons */}
        <div className="flex flex-col gap-1.5 mt-0.5">
          <span className="text-[11px] text-slate-400 font-medium">Hoặc dùng video mẫu giáo dục:</span>
          <div className="flex flex-wrap gap-1.5">
            {sampleVideos.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onVideoSelected(null, sample.url, sample.fileName);
                  onSubjectChange(sample.subject);
                  onGradeChange(sample.grade);
                  onLessonTextChange(sample.lessonSnippet);
                  onLessonMaterialChange(null);
                  onLessonFileChange(null);
                }}
                className="text-xs bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5"
              >
                <span>🎥</span>
                <span className="truncate max-w-[130px]">{sample.title.split(':')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Lesson Material Upload / Text */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nội Dung Bài Học / Giáo Án Đính Kèm</span>
          </span>
          {lessonMaterial && (
            <span className="text-[11px] text-indigo-300 font-medium">
              ✓ {lessonMaterial.name}
            </span>
          )}
        </label>

        {/* File upload button */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            className="flex-1 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>{documentState.status === 'reading' ? 'Đang kiểm tra và đọc tài liệu…' : lessonMaterial ? `Đã đính kèm: ${lessonMaterial.name}` : 'Tải giáo án PDF, TXT, DOCX hoặc ảnh'}</span>
          </button>
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.txt,.docx,.md,image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                void handleDocFile(e.target.files[0]);
              }
            }}
          />
        </div>
        {documentState.status === 'error' && <p role="alert" className="flex items-start gap-1.5 text-[11px] leading-relaxed text-rose-300"><AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-none" /><span>{documentState.message}</span></p>}
        {lessonMaterial?.requiresFilesApi && <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-[11px] leading-relaxed text-cyan-200">PDF lớn sẽ được tải tạm lên Gemini Files API khi phân tích và tự hết hạn sau khoảng 48 giờ.</p>}

        {/* Text Area Content */}
        <textarea
          rows={3}
          value={lessonText}
          onChange={(e) => onLessonTextChange(e.target.value)}
          placeholder="Nhập nội dung trọng tâm bài giảng, tóm tắt giáo án hoặc dán các câu hỏi trắc nghiệm bạn muốn AI tích hợp..."
          className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none custom-scrollbar"
        />
      </div>

      {/* 4. AI Action Button */}
      <div className="pt-1">
        <button
          type="button"
          disabled={isAnalyzing}
          onClick={onAnalyze}
          className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:brightness-110 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-950/60 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>AI Đang Phân Tích &amp; Lên Kịch Bản...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Phân Tích Bằng AI (Tự Động Tạo Kịch Bản)</span>
            </>
          )}
        </button>
        <p className="text-[11px] text-center text-slate-500 mt-2">
          {apiKey && isKeyValid
            ? `Đang kết nối: ${selectedModel} (Tự động fallback nếu quá tải)`
            : 'Chưa có API Key: mở Cài đặt AI để nhập key; chỉnh sửa thủ công vẫn dùng bình thường.'}
        </p>
      </div>

    </section>
  );
};
