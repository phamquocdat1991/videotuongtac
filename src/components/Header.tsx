import React from 'react';
import { Code2, FolderOpen, KeyRound, LifeBuoy, ShieldCheck, Sparkles } from 'lucide-react';

interface HeaderProps { authorName?: string; authorZalo?: string; hasApiKey: boolean; onOpenApiSettings: () => void; onOpenProjectManager: () => void; onOpenLmsEmbed: () => void; }
const actionClass = 'inline-flex h-9 items-center gap-2 rounded-xl border border-white/8 bg-white/[0.045] px-3 text-xs font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400';

export const Header: React.FC<HeaderProps> = ({ authorName = 'PHẠM QUỐC ĐẠT', authorZalo = '0705350000', hasApiKey, onOpenApiSettings, onOpenProjectManager, onOpenLmsEmbed }) => (
  <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#07111f]/90 backdrop-blur-xl">
    <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 flex-none place-items-center rounded-[14px] bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 shadow-lg shadow-blue-950/50"><Sparkles className="h-5 w-5 text-white" aria-hidden="true" /></div>
        <div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-sm font-extrabold tracking-tight text-white sm:text-base">Studio bài giảng tương tác</h1><span className="hidden rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-200 sm:inline">v2.8</span></div><p className="truncate text-[11px] text-slate-400">Thiết kế · kiểm duyệt · xuất bản trong một không gian</p></div>
      </div>
      <nav aria-label="Công cụ dự án" className="flex w-full items-center gap-2 overflow-x-auto pb-0.5 md:w-auto md:overflow-visible">
        <button type="button" onClick={onOpenProjectManager} className={actionClass}><FolderOpen className="h-4 w-4 text-amber-300" /><span>Dự án</span></button>
        <button type="button" onClick={onOpenLmsEmbed} className={actionClass}><Code2 className="h-4 w-4 text-cyan-300" /><span>Nhúng LMS</span></button>
        <button type="button" onClick={onOpenApiSettings} className={`${actionClass} ${hasApiKey ? 'border-emerald-400/20' : 'border-amber-400/25'}`} aria-label="Mở cài đặt AI và API key">
          {hasApiKey ? <ShieldCheck className="h-4 w-4 text-emerald-300" /> : <KeyRound className="h-4 w-4 text-amber-300" />}<span>{hasApiKey ? 'AI đã kết nối' : 'Kết nối AI'}</span>
        </button>
        <a href={`https://zalo.me/${authorZalo}`} target="_blank" rel="noopener noreferrer" className={`${actionClass} hidden xl:inline-flex`} title={`Hỗ trợ bởi ${authorName}`}><LifeBuoy className="h-4 w-4 text-violet-300" /><span>Hỗ trợ</span></a>
      </nav>
    </div>
  </header>
);
