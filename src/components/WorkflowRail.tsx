import React from 'react';
import { Check, FileVideo2, ListChecks, Rocket } from 'lucide-react';
interface Props { hasSource: boolean; interactionCount: number; isReviewed: boolean; saveLabel: string; }
export const WorkflowRail: React.FC<Props> = ({ hasSource, interactionCount, isReviewed, saveLabel }) => {
  const steps = [
    { icon: FileVideo2, number: '01', title: 'Nguồn bài học', description: hasSource ? 'Đã sẵn sàng' : 'Cần video', done: hasSource },
    { icon: ListChecks, number: '02', title: 'Điểm tương tác', description: `${interactionCount} mốc`, done: interactionCount > 0 },
    { icon: Rocket, number: '03', title: 'Kiểm tra & xuất', description: isReviewed ? 'Đã rà soát' : 'Chờ rà soát', done: isReviewed },
  ];
  return <section aria-label="Tiến trình tạo bài giảng" className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-2 shadow-[0_20px_60px_rgba(2,8,23,0.18)]">
    <div className="grid gap-2 sm:grid-cols-3">{steps.map(({ icon: Icon, number, title, description, done }, index) => <div key={number} className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 ${index === 0 ? 'bg-white/[0.045]' : ''}`}>
      <div className={`grid h-9 w-9 flex-none place-items-center rounded-xl border ${done ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/[0.04] text-slate-400'}`}>{done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</div>
      <div className="min-w-0"><div className="flex items-center gap-2"><span className="text-[10px] font-bold tracking-[0.18em] text-slate-500">{number}</span><h2 className="truncate text-xs font-bold text-slate-100">{title}</h2></div><p className={`text-[11px] ${done ? 'text-emerald-300/80' : 'text-slate-500'}`}>{description}</p></div>
    </div>)}</div><p className="sr-only" aria-live="polite">{saveLabel}</p>
  </section>;
};
