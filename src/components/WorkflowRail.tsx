import React from 'react';
import { Check, FileVideo2, ListChecks, Rocket } from 'lucide-react';
interface Props { hasSource: boolean; interactionCount: number; isReviewed: boolean; saveLabel: string; }
export const WorkflowRail: React.FC<Props> = ({ hasSource, interactionCount, isReviewed, saveLabel }) => {
  const steps = [
    { icon: FileVideo2, number: '01', title: 'Nguồn bài học', description: hasSource ? 'Đã sẵn sàng' : 'Cần video', done: hasSource },
    { icon: ListChecks, number: '02', title: 'Điểm tương tác', description: `${interactionCount} mốc`, done: interactionCount > 0 },
    { icon: Rocket, number: '03', title: 'Kiểm tra & xuất', description: isReviewed ? 'Đã rà soát' : 'Chờ rà soát', done: isReviewed },
  ];
  return <section aria-label="Tiến trình tạo bài giảng" className="rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
    <div className="mb-2 px-2 pb-2"><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">Tiến độ bài giảng</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">Hoàn thành lần lượt để sẵn sàng xuất bản.</p></div>
    <div className="grid gap-1.5 sm:grid-cols-3 xl:grid-cols-1">{steps.map(({ icon: Icon, number, title, description, done }, index) => <div key={number} className={`relative flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${index === 0 ? 'border-blue-200 bg-blue-50/80' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}>
      {index < steps.length - 1 && <span aria-hidden="true" className="absolute left-[30px] top-[52px] hidden h-4 w-px bg-slate-200 xl:block" />}
      <div className={`grid h-9 w-9 flex-none place-items-center rounded-xl border ${done ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-white text-slate-400'}`}>{done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</div>
      <div className="min-w-0"><div className="flex items-center gap-2"><span className="text-[10px] font-bold tracking-[0.16em] text-slate-400">{number}</span><h2 className="truncate text-xs font-extrabold text-slate-800">{title}</h2></div><p className={`text-[11px] ${done ? 'text-emerald-600' : 'text-slate-500'}`}>{description}</p></div>
    </div>)}</div><p className="sr-only" aria-live="polite">{saveLabel}</p>
  </section>;
};
