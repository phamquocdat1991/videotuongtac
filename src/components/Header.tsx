import React from 'react';
import {
  Sparkles,
  Phone,
  ShieldCheck,
  Key,
  FolderOpen,
  Code,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import { VisitCounter } from './VisitCounter';

interface HeaderProps {
  authorName?: string;
  authorZalo?: string;
  hasApiKey: boolean;
  onOpenApiSettings: () => void;
  onOpenProjectManager: () => void;
  onOpenLmsEmbed: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  authorName = 'PHẠM QUỐC ĐẠT',
  authorZalo = '0705350000',
  hasApiKey,
  onOpenApiSettings,
  onOpenProjectManager,
  onOpenLmsEmbed,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-xl px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & Title */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/20 flex-shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  AI Interactive Video Studio
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  Edu Edition v2.5
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Nền tảng tạo Video Tương tác Sư phạm bằng AI &bull; Xuất HTML &amp; Nhúng LMS
              </p>
            </div>
          </div>

          {/* Mobile Visit Counter */}
          <div className="block sm:hidden">
            <VisitCounter compact />
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end w-full md:w-auto">
          
          {/* Server-Side Visit Counter */}
          <div className="hidden sm:block">
            <VisitCounter />
          </div>

          {/* Project Manager Button */}
          <button
            type="button"
            onClick={onOpenProjectManager}
            className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Quản lý dự án & Nạp mẫu bài giảng"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Mẫu &amp; Dự Án</span>
          </button>

          {/* LMS Embed Button */}
          <button
            type="button"
            onClick={onOpenLmsEmbed}
            className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Lấy mã nhúng Iframe cho LMS"
          >
            <Code className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nhúng LMS</span>
          </button>

          {/* Mandatory Settings (API Key) Button with Red Text as strictly requested in AI_INSTRUCTIONS.md */}
          <button
            type="button"
            onClick={onOpenApiSettings}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/95 hover:bg-slate-800 text-white border border-rose-500/50 hover:border-rose-400 shadow-md transition-all group"
            title="Nhấp để cấu hình Model &amp; API Key"
          >
            <div className="flex items-center gap-1 text-indigo-400 font-bold text-xs">
              <Key className="w-3.5 h-3.5" />
              <span>Settings (API Key)</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400 font-bold text-xs tracking-tight group-hover:text-rose-300 animate-pulse">
              Lấy API key để sử dụng app
            </span>
          </button>

          {/* Mandatory Author Credit Badge */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 hidden lg:inline font-medium">Bản quyền:</span>
              <span className="text-indigo-300 font-bold uppercase tracking-wide">
                ANH GIÁO: {authorName}
              </span>
              <span className="text-slate-600">|</span>
              <a
                href={`https://zalo.me/${authorZalo}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>Zalo: {authorZalo}</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
