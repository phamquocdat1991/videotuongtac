import React from 'react';
import {
  Clock,
  Edit2,
  Trash2,
  Play,
  Plus,
  Download,
  CheckCircle,
  Layers,
  HelpCircle,
  MoveHorizontal,
  FileCode,
  Sparkles,
  Copy,
  BookOpen,
  Code,
  CheckSquare,
  FileSpreadsheet,
  ClipboardCheck,
  PackageCheck,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import {
  InteractionPoint,
  QuizInteraction,
  MultiChoiceInteraction,
  TrueFalseInteraction,
  DragDropInteraction,
  FillBlankInteraction,
  CheckpointNoteInteraction,
} from '../types';
import { MathRenderer } from './MathRenderer';

const getTypeLabelForMatrix = (type: string): string => ({
  quiz: 'Trắc nghiệm',
  multi_choice: 'Đa đáp án',
  true_false: 'Đúng/Sai',
  drag_drop: 'Kéo thả',
  fill_blank: 'Điền khuyết',
  checkpoint_note: 'Tóm tắt',
}[type] || type);

interface ScriptTableProps {
  interactions: InteractionPoint[];
  onEditInteraction: (point: InteractionPoint) => void;
  onDeleteInteraction: (id: string) => void;
  onDuplicateInteraction: (point: InteractionPoint) => void;
  onAddNewInteraction: () => void;
  onSeekToTimestamp: (seconds: number) => void;
  onExportHtml: () => void;
  onPreviewStandalone: () => void;
  onCopyHtml: () => void;
  onOpenLmsEmbed: () => void;
  onReview: () => void;
  onExportOffline: () => void;
  isReviewed: boolean;
  isExportingOffline: boolean;
}

export const ScriptTable: React.FC<ScriptTableProps> = ({
  interactions,
  onEditInteraction,
  onDeleteInteraction,
  onDuplicateInteraction,
  onAddNewInteraction,
  onSeekToTimestamp,
  onExportHtml,
  onPreviewStandalone,
  onCopyHtml,
  onOpenLmsEmbed,
  onReview,
  onExportOffline,
  isReviewed,
  isExportingOffline,
}) => {
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  /** Xuất danh sách mốc tương tác ra file CSV */
  const exportCsv = () => {
    if (interactions.length === 0) return;

    const escape = (val: string) => `"${String(val).replace(/"/g, '""')}"`;

    const getQuestion = (point: InteractionPoint): string => {
      const d = point.data;
      if (d.type === 'quiz') return d.question;
      if (d.type === 'multi_choice') return d.question;
      if (d.type === 'true_false') return d.statement;
      if (d.type === 'drag_drop') return d.instruction;
      if (d.type === 'fill_blank') return d.sentence;
      if (d.type === 'checkpoint_note') return d.title;
      return '';
    };

    const getCorrectAnswer = (point: InteractionPoint): string => {
      const d = point.data;
      if (d.type === 'quiz') return d.options[d.correctAnswer] || '';
      if (d.type === 'multi_choice') return d.correctAnswers.map((i) => d.options[i]).join(' | ');
      if (d.type === 'true_false') return d.isCorrect ? 'Đúng' : 'Sai';
      if (d.type === 'drag_drop') return d.items.map((it) => `${it.text} → ${it.targetCategory}`).join(' | ');
      if (d.type === 'fill_blank') return d.blankAnswer;
      if (d.type === 'checkpoint_note') return d.keyTakeaways.join(' | ');
      return '';
    };

    const getTypeLabel = (type: string): string => {
      const map: Record<string, string> = {
        quiz: 'Trắc nghiệm đơn',
        multi_choice: 'Đa đáp án',
        true_false: 'Đúng / Sai',
        drag_drop: 'Kéo thả thẻ',
        fill_blank: 'Điền từ',
        checkpoint_note: 'Thẻ tóm tắt',
      };
      return map[type] || type;
    };

    const header = ['STT', 'Mốc dừng (mm:ss)', 'Tiêu đề', 'Loại tương tác', 'Nội dung câu hỏi', 'Đáp án đúng'];
    const rows = interactions.map((p, idx) => [
      String(idx + 1),
      formatSeconds(p.timestamp),
      p.title,
      getTypeLabel(p.data.type),
      getQuestion(p),
      getCorrectAnswer(p),
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map(escape).join(','))
      .join('\n');

    const bom = '\uFEFF'; // UTF-8 BOM cho Excel tiếng Việt
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kich_ban_tuong_tac_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getAnswerSummary = (point: InteractionPoint) => {
    const data = point.data;

    if (data.type === 'quiz') {
      const q = data as QuizInteraction;
      const correctText = q.options[q.correctAnswer] || `Lựa chọn #${q.correctAnswer + 1}`;
      const letter = String.fromCharCode(65 + q.correctAnswer);
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 inline flex-shrink-0" />
            <span>Đáp án {letter}: <MathRenderer content={correctText} inline /></span>
          </span>
          {q.explanation && (
            <span className="text-[11px] text-slate-400 italic line-clamp-1">
              <MathRenderer content={q.explanation} inline />
            </span>
          )}
        </div>
      );
    } else if (data.type === 'multi_choice') {
      const mc = data as MultiChoiceInteraction;
      const letters = (mc.correctAnswers || []).map((i) => String.fromCharCode(65 + i)).join(', ');
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-indigo-700 font-semibold text-xs flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5 inline flex-shrink-0" />
            <span>Các đáp án đúng: [{letters}]</span>
          </span>
          {mc.explanation && (
            <span className="text-[11px] text-slate-400 italic line-clamp-1">
              <MathRenderer content={mc.explanation} inline />
            </span>
          )}
        </div>
      );
    } else if (data.type === 'true_false') {
      const tf = data as TrueFalseInteraction;
      return (
        <div className="flex flex-col gap-0.5 text-xs">
          <span className={tf.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
            Khẳng định này: {tf.isCorrect ? '✓ ĐÚNG' : '✗ SAI'}
          </span>
          {tf.explanation && (
            <span className="text-[11px] text-slate-400 italic line-clamp-1">
              <MathRenderer content={tf.explanation} inline />
            </span>
          )}
        </div>
      );
    } else if (data.type === 'drag_drop') {
      const dd = data as DragDropInteraction;
      return (
        <div className="flex flex-col gap-0.5 text-xs text-slate-300">
          <span className="text-violet-700 font-medium">
            {dd.categories.length} nhóm &bull; {dd.items.length} thẻ phân loại
          </span>
          <span className="text-[11px] text-slate-400 line-clamp-1">
            {dd.items.map((it) => `${it.text} → ${it.targetCategory}`).join('; ')}
          </span>
        </div>
      );
    } else if (data.type === 'fill_blank') {
      const fb = data as FillBlankInteraction;
      return (
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="text-amber-700 font-semibold">
            Điền: "<MathRenderer content={fb.blankAnswer} inline />"
          </span>
          {fb.hint && (
            <span className="text-[11px] text-slate-400 italic">
              Gợi ý: {fb.hint}
            </span>
          )}
        </div>
      );
    } else if (data.type === 'checkpoint_note') {
      const cn = data as CheckpointNoteInteraction;
      return (
        <div className="flex flex-col gap-0.5 text-xs text-indigo-700">
          <span className="font-semibold">Thẻ tóm tắt trọng tâm</span>
          <span className="text-[11px] text-slate-400 line-clamp-1">
            {cn.keyTakeaways?.join('; ')}
          </span>
        </div>
      );
    }

    return <span className="text-slate-500">Chưa cấu hình</span>;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'quiz':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-700 border border-indigo-500/30">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Trắc nghiệm đơn</span>
          </span>
        );
      case 'multi_choice':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-700 border border-blue-500/30">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Đa đáp án</span>
          </span>
        );
      case 'true_false':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-500/15 text-teal-700 border border-teal-500/30">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Đúng / Sai</span>
          </span>
        );
      case 'drag_drop':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-500/15 text-violet-700 border border-violet-500/30">
            <MoveHorizontal className="w-3.5 h-3.5" />
            <span>Kéo thả thẻ</span>
          </span>
        );
      case 'fill_blank':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-700 border border-amber-500/30">
            <Edit2 className="w-3.5 h-3.5" />
            <span>Điền từ</span>
          </span>
        );
      case 'checkpoint_note':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Thẻ tóm tắt</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getContentDisplay = (point: InteractionPoint) => {
    const data = point.data;
    if (data.type === 'quiz') return data.question;
    if (data.type === 'multi_choice') return data.question;
    if (data.type === 'true_false') return data.statement;
    if (data.type === 'drag_drop') return data.instruction;
    if (data.type === 'fill_blank') return data.sentence;
    if (data.type === 'checkpoint_note') return data.summary;
    return '';
  };

  const typeCoverage: Record<string, number> = interactions.reduce((summary: Record<string, number>, point: InteractionPoint) => {
    summary[point.data.type] = (summary[point.data.type] || 0) + 1;
    return summary;
  }, {});
  const objectiveCoverage = interactions.filter((point) => point.learningObjective?.trim()).length;

  return (
    <section aria-labelledby="script-panel-title" className="academic-panel academic-script flex flex-col gap-5 rounded-3xl border border-white/[0.075] bg-[#0b1627]/95 p-5 shadow-[0_24px_70px_rgba(2,8,23,0.32)] lg:p-6">
      
      {/* Header Bar */}
      <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="script-panel-title" className="text-base font-bold text-white">Kịch bản tương tác</h2>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-full border border-slate-700">
                {interactions.length} điểm dừng
              </span>
            </div>
            <p className="text-xs text-slate-400">Biên tập nội dung, đáp án và mốc dừng trên video</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onReview}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${isReviewed ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
          >
            {isReviewed ? <ShieldCheck className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
            <span>{isReviewed ? 'Đã rà soát' : 'Rà soát'}</span>
          </button>

          <button
            type="button"
            onClick={exportCsv}
            disabled={interactions.length === 0}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-700 hover:text-emerald-800 px-3 py-2 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all"
            title="Xuất danh sách mốc tương tác ra file CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất CSV</span>
          </button>

          <button
            type="button"
            onClick={onAddNewInteraction}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-2 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Thêm Điểm Dừng</span>
          </button>

          <button
            type="button"
            onClick={onExportHtml}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất File HTML Tương Tác</span>
          </button>
        </div>
      </div>

      <div className="grid gap-2 rounded-xl border border-slate-800/80 bg-slate-950/45 p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200"><BarChart3 className="h-4 w-4 text-cyan-400" /><span>Ma trận bao phủ</span></div>
        <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">
          {Object.entries(typeCoverage).map(([type, count]) => <span key={type} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1">{getTypeLabelForMatrix(type)}: <strong className="text-slate-200">{count}</strong></span>)}
          {interactions.length === 0 && <span>Chưa có dữ liệu</span>}
        </div>
        <span className={`text-[10px] font-semibold ${objectiveCoverage === interactions.length && interactions.length ? 'text-emerald-700' : 'text-slate-500'}`}>Mục tiêu học tập: {objectiveCoverage}/{interactions.length}</span>
      </div>

      {/* Inspector list: phù hợp với cột biên tập của Academic Workspace. */}
      <div className="space-y-3">
        {interactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <Sparkles className="h-8 w-8 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Chưa có kịch bản tương tác</p>
            <p className="max-w-sm text-xs text-slate-500">Dùng “Phân tích bằng AI” hoặc chọn “Thêm Điểm Dừng” để bắt đầu.</p>
          </div>
        ) : interactions.map((point, index) => (
          <article key={point.id} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:border-blue-200 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-[11px] font-extrabold text-slate-500">{index + 1}</span>
                <button type="button" onClick={() => onSeekToTimestamp(point.timestamp)} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-mono text-xs font-bold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100" title="Nhấp để nhảy video tới mốc này"><Clock className="h-3.5 w-3.5" /><span>{formatSeconds(point.timestamp)}</span></button>
                {getTypeBadge(point.data.type)}
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button type="button" onClick={() => onSeekToTimestamp(point.timestamp)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-indigo-600" title="Xem trước tại mốc này" aria-label={`Xem trước mốc ${index + 1}`}><Play className="h-4 w-4" /></button>
                <button type="button" onClick={() => onEditInteraction(point)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-amber-600" title="Chỉnh sửa câu hỏi" aria-label={`Chỉnh sửa mốc ${index + 1}`}><Edit2 className="h-4 w-4" /></button>
                <button type="button" onClick={() => onDuplicateInteraction(point)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-cyan-700" title="Nhân bản điểm dừng này" aria-label={`Nhân bản mốc ${index + 1}`}><Copy className="h-4 w-4" /></button>
                <button type="button" onClick={() => onDeleteInteraction(point.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-rose-600" title="Xóa mốc tương tác" aria-label={`Xóa mốc ${index + 1}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <div className="text-sm font-bold leading-relaxed text-slate-900"><MathRenderer content={getContentDisplay(point)} inline /></div>
              {point.title && <p className="mt-1 text-[11px] italic text-slate-500">Tiêu đề: {point.title}</p>}
              {point.learningObjective && <p className="mt-2 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] text-blue-700"><strong>Mục tiêu:</strong> {point.learningObjective}</p>}
              <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">{getAnswerSummary(point)}</div>
            </div>
          </article>
        ))}
      </div>

      {/* Export & Sharing Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <FileCode className="w-4 h-4 text-indigo-400" />
          <span>Hệ thống xuất bản: Tạo file HTML5 độc lập chạy offline, tích hợp KaTeX và chống tua bài.</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onExportOffline}
            disabled={isExportingOffline}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-violet-700 border border-slate-700 rounded-lg transition-colors font-medium flex items-center gap-1.5"
            title="Đóng gói HTML, video và thư viện để dùng không mạng"
          >
            <PackageCheck className={`w-3.5 h-3.5 ${isExportingOffline ? 'animate-pulse' : ''}`} />
            <span>{isExportingOffline ? 'Đang đóng gói…' : 'Gói offline'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenLmsEmbed}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-700 hover:text-cyan-800 border border-slate-700 rounded-lg transition-colors font-medium flex items-center gap-1.5"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Mã Nhúng LMS</span>
          </button>
          <button
            type="button"
            onClick={onPreviewStandalone}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors font-medium"
          >
            Xem Tab Mới
          </button>
          <button
            type="button"
            onClick={onCopyHtml}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors font-medium"
          >
            Sao Chép HTML
          </button>
        </div>
      </div>

    </section>
  );
};
