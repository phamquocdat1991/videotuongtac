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
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      onVideoSelected(file, url, file.name);
    } else {
      alert('Vui lòng chọn đúng định dạng file video (.mp4, .webm, .mov)!');
    }
  };

  /** Xử lý URL video trực tuyến nhập tay */
  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    // Trích tên file từ URL để hiển thị
    let displayName = 'video_truc_tuyen.mp4';
    try {
      const u = new URL(trimmed);
      const pathParts = u.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.includes('.')) displayName = lastPart;
      else if (u.hostname.includes('youtube')) displayName = 'YouTube_Video.mp4';
      else if (u.hostname.includes('drive.google')) displayName = 'Google_Drive_Video.mp4';
    } catch {
      // URL không hợp lệ dùng tên mặc định
    }

    onVideoSelected(null, trimmed, displayName);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleDocFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();

    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onLessonTextChange(text);
        onLessonMaterialChange({
          name: file.name,
          type: 'text',
          content: text,
        });
      };
      reader.readAsText(file);
    } else if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      onLessonMaterialChange({
        name: file.name,
        type: 'image',
        previewUrl,
      });
      if (!lessonText) {
        onLessonTextChange(`[Ảnh bài giảng: ${file.name}] Phân tích nội dung kiến thức hiển thị trên ảnh bài giảng để tạo câu hỏi.`);
      }
    } else {
      onLessonMaterialChange({
        name: file.name,
        type: 'pdf',
      });
      if (!lessonText) {
        onLessonTextChange(`[Tài liệu đính kèm: ${file.name}] Tóm tắt nội dung bài học và tạo các câu hỏi trắc nghiệm kiểm tra độ hiểu bài.`);
      }
    }
  };

  const isKeyValid = apiKey ? isValidGoogleAiApiKey(apiKey) : false;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:p-6 shadow-xl flex flex-col gap-5">
      
      {/* Section Header with Active Model Status */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Khu Vực 1: Cài Đặt &amp; Nguồn Bài Học</h2>
            <p className="text-xs text-slate-400">Thiết lập kết nối AI, video bài giảng và nội dung kiến thức</p>
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
              <p className="text-xs font-bold text-white truncate max-w-xs">{videoFileName}</p>
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
              <span>Hoặc nhập URL video trực tuyến (MP4, Google Drive, v.v.)</span>
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
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
                onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs"
              >
                ✕
              </button>
            </div>
          )}
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
            <span>{lessonMaterial ? `Đã đính kèm: ${lessonMaterial.name}` : 'Tải file Giáo án (.pdf, .txt, .docx, ảnh)'}</span>
          </button>
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.txt,.docx,.md,image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleDocFile(e.target.files[0]);
              }
            }}
          />
        </div>

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
          className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
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
            : 'Chưa có API Key: Hệ thống sẽ tạo kịch bản sư phạm mẫu có sẵn'}
        </p>
      </div>

    </div>
  );
};
