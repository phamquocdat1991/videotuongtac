import React, { useEffect, useState } from 'react';
import { X, Code, Copy, Check, ExternalLink, HelpCircle, Layers } from 'lucide-react';
import { sanitizeEmbedDimension, sanitizeFileName } from '../utils/projectSafety';

interface LmsEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  onShowToast: (msg: string) => void;
}

export const LmsEmbedModal: React.FC<LmsEmbedModalProps> = ({
  isOpen,
  onClose,
  videoTitle,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [embedWidth, setEmbedWidth] = useState('100%');
  const [embedHeight, setEmbedHeight] = useState('600px');

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const safeWidth = sanitizeEmbedDimension(embedWidth, '100%');
  const safeHeight = sanitizeEmbedDimension(embedHeight, '600px');
  const safeTitle = sanitizeFileName(videoTitle || 'bai_giang');
  const embedCode = `<!-- AI Interactive Video Player Embed -->
<iframe 
  src="./video_tuong_tac_ai_${safeTitle}.html"
  width="${safeWidth}"
  height="${safeHeight}"
  style="border: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3);" 
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
  allowfullscreen
></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      onShowToast('Đã sao chép mã nhúng Iframe vào Clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Không thể tự động sao chép, vui lòng chọn và copy thủ công!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="lms-embed-title" className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 id="lms-embed-title" className="text-base font-bold text-white">Mã Nhúng Iframe Cho Hệ Thống LMS</h3>
              <p className="text-xs text-slate-400">Tích hợp video tương tác vào Moodle, vnEdu, K12Online, Azota, Shub</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Đóng mã nhúng LMS</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-slate-300 font-semibold mb-1">Chiều rộng:</label>
              <input
                type="text"
                value={embedWidth}
                onChange={(e) => setEmbedWidth(e.target.value)}
                onBlur={() => setEmbedWidth(safeWidth)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-slate-300 font-semibold mb-1">Chiều cao:</label>
              <input
                type="text"
                value={embedHeight}
                onChange={(e) => setEmbedHeight(e.target.value)}
                onBlur={() => setEmbedHeight(safeHeight)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
              <span>Đoạn mã HTML Iframe:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép mã'}</span>
              </button>
            </label>
            <textarea
              readOnly
              rows={6}
              value={embedCode}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none resize-none"
            />
          </div>

          {/* Guide for LMS */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Hướng dẫn chèn vào LMS:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed pl-1">
              <li>Xuất file HTML độc lập bằng nút <strong>"Xuất File HTML Tương Tác"</strong>.</li>
              <li>Tải file HTML lên thư mục bài giảng của LMS hoặc Google Drive / Hosting trường.</li>
              <li>Dán mã Iframe ở trên vào công cụ soạn thảo của LMS (chọn chế độ <em>Nguồn HTML / Source Code</em>).</li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-1.5"
          >
            <Copy className="w-4 h-4" />
            <span>Sao Chép Mã Nhúng</span>
          </button>
        </div>

      </div>
    </div>
  );
};
