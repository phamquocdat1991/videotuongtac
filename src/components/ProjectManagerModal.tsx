import React, { useRef } from 'react';
import {
  X,
  FolderOpen,
  Save,
  Download,
  Upload,
  BookOpen,
  FileJson,
  CheckCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { InteractionPoint, ProjectData, AppSettings, LessonMaterial } from '../types';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: {
    videoTitle: string;
    videoUrl: string;
    videoFileName: string;
    videoDuration: number;
    subject: string;
    grade: string;
    lessonMaterial: LessonMaterial | null;
    lessonText: string;
    interactions: InteractionPoint[];
    settings: AppSettings;
  };
  onLoadProject: (project: ProjectData) => void;
  onShowToast: (msg: string) => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onLoadProject,
  onShowToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Export current project as JSON file
  const handleExportJson = () => {
    const projectData: ProjectData = {
      version: '2.5',
      ...currentProject,
      lastUpdated: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kich_ban_tuong_tac_${currentProject.videoFileName.replace(/\.[^/.]+$/, '')}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onShowToast('Đã xuất file kịch bản dự án (.json) thành công!');
  };

  // 2. Import project from JSON file
  const handleImportJson = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as ProjectData;
        if (parsed && parsed.interactions && Array.isArray(parsed.interactions)) {
          onLoadProject(parsed);
          onShowToast(`Đã nạp thành công dự án: ${parsed.videoTitle || 'Dự án video'}`);
          onClose();
        } else {
          alert('File JSON không đúng định dạng kịch bản video tương tác!');
        }
      } catch (err) {
        alert('Lỗi đọc file JSON. Vui lòng kiểm tra lại file!');
      }
    };
    reader.readAsText(file);
  };

  // 3. Subject preset templates
  const presets = [
    {
      title: 'Sinh học 10: Quá trình Quang hợp ở Thực vật',
      subject: 'Sinh học',
      grade: 'Lớp 10',
      fileName: 'sinh_hoc_quang_hop.mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      duration: 180,
      lessonText:
        'Bài 11: Quang hợp ở thực vật. Khái niệm quang hợp, vai trò của sắc tố diệp lục, cấu tạo lục lạp. Phân biệt pha sáng (quang phân ly H2O tạo O2, NADPH, ATP) tại tilacôit và pha tối (chu trình Calvin cố định CO2 thành Glucose C6H12O6) tại chất nền Stroma.',
      interactionsCount: 3,
    },
    {
      title: 'Toán học 11: Công thức Lượng giác & Phương trình',
      subject: 'Toán học',
      grade: 'Lớp 11',
      fileName: 'toan_luong_giac.mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      duration: 240,
      lessonText:
        'Chương Lượng giác: Đường tròn lượng giác, công thức cơ bản $\\sin^2(x) + \\cos^2(x) = 1$, $\\tan(x) = \\frac{\\sin(x)}{\\cos(x)}$. Các phương trình lượng giác cơ bản $\\sin(x) = m$ và điều kiện có nghiệm thuộc đoạn $[-1, 1]$.',
      interactionsCount: 3,
    },
    {
      title: 'Vật lý 10: Ba Định luật Newton & Lực cơ học',
      subject: 'Vật lý',
      grade: 'Lớp 10',
      fileName: 'vat_ly_newton.mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration: 200,
      lessonText:
        'Chương Động lực học: Định luật I Newton (Quán tính), Định luật II Newton ($\\vec{F} = m\\vec{a}$), Định luật III Newton (Lực và phản lực). Ứng dụng tính gia tốc và lực ma sát trong chuyển động trên mặt phẳng nghiêng.',
      interactionsCount: 2,
    },
    {
      title: 'Tiếng Anh 10: Tenses & Grammar Classification',
      subject: 'Tiếng Anh',
      grade: 'Lớp 10',
      fileName: 'english_grammar_review.mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      duration: 190,
      lessonText:
        'Unit 3: Present Perfect vs Past Simple tenses. Identifying key signals (since, for, already, yet, yesterday). Vocabulary classification: Noun suffixes (-tion, -ment, -ness) vs Adjective suffixes (-ful, -ive, -ous).',
      interactionsCount: 2,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Quản Lý Dự Án &amp; Kịch Bản Bài Học</h3>
              <p className="text-xs text-slate-400">Lưu dự án, xuất nhập file JSON và nạp các kịch bản mẫu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs">
          
          {/* Section 1: Backup & Restore */}
          <div>
            <h4 className="text-slate-200 font-bold text-sm mb-3 flex items-center gap-2">
              <FileJson className="w-4 h-4 text-indigo-400" />
              <span>1. Lưu Trữ &amp; Khôi Phục Kịch Bản Dự Án</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export JSON */}
              <button
                type="button"
                onClick={handleExportJson}
                className="p-4 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left transition-all group flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 group-hover:scale-110 transition-transform">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs mb-0.5">Xuất File Dự Án (.json)</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Tải về toàn bộ kịch bản, câu hỏi và thiết lập video để lưu trữ trên máy tính.
                  </p>
                </div>
              </button>

              {/* Import JSON */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-all group flex items-start gap-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImportJson(e.target.files[0]);
                    }
                  }}
                />
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs mb-0.5">Nhập File Dự Án (.json)</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Mở lại một kịch bản đã lưu trước đó để tiếp tục chỉnh sửa hoặc xuất bản.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Preset Subject Templates */}
          <div>
            <h4 className="text-slate-200 font-bold text-sm mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>2. Kịch Bản Mẫu Theo Môn Học (Sẵn sàng chạy thử)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presets.map((preset, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        {preset.subject} &bull; {preset.grade}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {preset.duration}s
                      </span>
                    </div>
                    <div className="font-bold text-white text-xs mb-1 line-clamp-1">
                      {preset.title}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {preset.lessonText}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {preset.interactionsCount} mốc tương tác
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onLoadProject({
                          version: '2.5',
                          videoTitle: preset.title,
                          videoUrl: preset.url,
                          videoFileName: preset.fileName,
                          videoDuration: preset.duration,
                          subject: preset.subject,
                          grade: preset.grade,
                          lessonMaterial: {
                            name: `Giao_an_${preset.subject}_Chuan.txt`,
                            type: 'text',
                            content: preset.lessonText,
                          },
                          lessonText: preset.lessonText,
                          interactions: [], // Sẽ được sinh tự động hoặc dùng mẫu
                          settings: currentProject.settings,
                          lastUpdated: new Date().toISOString(),
                        });
                        onShowToast(`Đã tải mẫu bài học: ${preset.title}`);
                        onClose();
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-all"
                    >
                      Nạp Mẫu Này →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
