import React from 'react';
import { Code2, FolderOpen, KeyRound, LifeBuoy, ShieldCheck, Sparkles } from 'lucide-react';

interface HeaderProps { authorName?: string; authorZalo?: string; hasApiKey: boolean; onOpenApiSettings: () => void; onOpenProjectManager: () => void; onOpenLmsEmbed: () => void; }
const actionClass = 'inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

export const Header: React.FC<HeaderProps> = ({ authorName = 'PHẠM QUỐC ĐẠT', authorZalo = '0705350000', hasApiKey, onOpenApiSettings, onOpenProjectManager, onOpenLmsEmbed }) => (
  <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl">
    <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 flex-none place-items-center rounded-[14px] bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-lg shadow-blue-200"><Sparkles className="h-5 w-5 text-white" aria-hidden="true" /></div>
        <div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-sm font-extrabold tracking-tight text-slate-950 sm:text-base">AI Interactive Video Studio</h1><span className="hidden rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 sm:inline">v2.8</span></div><p className="truncate text-[11px] text-slate-500">Không gian thiết kế bài học dành cho giáo viên</p></div>
      </div>
      <nav aria-label="Công cụ dự án" className="flex w-full items-center gap-2 overflow-x-auto pb-0.5 md:w-auto md:overflow-visible">
        <button type="button" onClick={onOpenProjectManager} className={actionClass}><FolderOpen className="h-4 w-4 text-amber-600" /><span>Dự án</span></button>
        <button type="button" onClick={onOpenLmsEmbed} className={actionClass}><Code2 className="h-4 w-4 text-blue-600" /><span>Nhúng LMS</span></button>
        <button type="button" onClick={onOpenApiSettings} className={`${actionClass} ${hasApiKey ? 'border-emerald-300 bg-emerald-50/70' : 'border-amber-300 bg-amber-50/70'}`} aria-label="Mở cài đặt AI và API key">
          {hasApiKey ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <KeyRound className="h-4 w-4 text-amber-600" />}<span>{hasApiKey ? 'AI đã kết nối' : 'Kết nối AI'}</span>
        </button>
        <a href={`https://zalo.me/${authorZalo}`} target="_blank" rel="noopener noreferrer" className={`${actionClass} hidden xl:inline-flex`} title={`Hỗ trợ bởi ${authorName}`}><LifeBuoy className="h-4 w-4 text-violet-600" /><span>Hỗ trợ</span></a>
      </nav>
    </div>
  </header>
);
