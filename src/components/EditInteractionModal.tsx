import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Plus,
  Trash2,
  Clock,
  HelpCircle,
  MoveHorizontal,
  Edit2,
  Sparkles,
  CheckSquare,
  BookOpen,
  Eye,
} from 'lucide-react';
import {
  InteractionPoint,
  InteractionType,
  QuizInteraction,
  MultiChoiceInteraction,
  TrueFalseInteraction,
  DragDropInteraction,
  FillBlankInteraction,
  CheckpointNoteInteraction,
} from '../types';
import { MathRenderer } from './MathRenderer';

interface EditInteractionModalProps {
  point: InteractionPoint | null;
  isOpen: boolean;
  videoDuration: number;
  onClose: () => void;
  onSave: (point: InteractionPoint) => void;
}

export const EditInteractionModal: React.FC<EditInteractionModalProps> = ({
  point,
  isOpen,
  videoDuration,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<InteractionType>(point?.data.type || 'quiz');
  const [timestamp, setTimestamp] = useState<number>(point?.timestamp || 10);
  const [title, setTitle] = useState<string>(point?.title || '');
  const [learningObjective, setLearningObjective] = useState<string>(point?.learningObjective || '');
  const [cognitiveLevel, setCognitiveLevel] = useState<InteractionPoint['cognitiveLevel']>(point?.cognitiveLevel || 'unclassified');
  const [validationError, setValidationError] = useState<string | null>(null);

  // 1. Single Quiz states
  const [question, setQuestion] = useState<string>('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [quizExplanation, setQuizExplanation] = useState<string>('');

  // 2. Multi Choice states
  const [mcQuestion, setMcQuestion] = useState<string>('');
  const [mcOptions, setMcOptions] = useState<string[]>(['', '', '', '']);
  const [mcCorrectAnswers, setMcCorrectAnswers] = useState<number[]>([0]);
  const [mcExplanation, setMcExplanation] = useState<string>('');

  // 3. True / False states
  const [tfStatement, setTfStatement] = useState<string>('');
  const [tfIsCorrect, setTfIsCorrect] = useState<boolean>(true);
  const [tfExplanation, setTfExplanation] = useState<string>('');

  // 4. Drag Drop states
  const [instruction, setInstruction] = useState<string>('');
  const [categories, setCategories] = useState<string[]>(['Nhóm 1', 'Nhóm 2']);
  const [items, setItems] = useState<
    Array<{ id: string; text: string; targetCategory: string }>
  >([]);
  const [ddExplanation, setDdExplanation] = useState<string>('');

  // 5. Fill Blank states
  const [sentence, setSentence] = useState<string>('');
  const [blankAnswer, setBlankAnswer] = useState<string>('');
  const [hint, setHint] = useState<string>('');
  const [fbExplanation, setFbExplanation] = useState<string>('');

  // 6. Checkpoint Note states
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteSummary, setNoteSummary] = useState<string>('');
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(['']);
  const [reflectionQuestion, setReflectionQuestion] = useState<string>('');

  // Formula Preview Tab
  const [previewFormula, setPreviewFormula] = useState<boolean>(true);

  useEffect(() => {
    if (point) {
      setType(point.data.type);
      setTimestamp(point.timestamp);
      setTitle(point.title || '');
      setLearningObjective(point.learningObjective || '');
      setCognitiveLevel(point.cognitiveLevel || 'unclassified');
      setValidationError(null);

      if (point.data.type === 'quiz') {
        const q = point.data as QuizInteraction;
        setQuestion(q.question || '');
        setOptions(q.options && q.options.length ? [...q.options] : ['', '', '', '']);
        setCorrectAnswer(q.correctAnswer ?? 0);
        setQuizExplanation(q.explanation || '');
      } else if (point.data.type === 'multi_choice') {
        const mc = point.data as MultiChoiceInteraction;
        setMcQuestion(mc.question || '');
        setMcOptions(mc.options && mc.options.length ? [...mc.options] : ['', '', '', '']);
        setMcCorrectAnswers(mc.correctAnswers || [0]);
        setMcExplanation(mc.explanation || '');
      } else if (point.data.type === 'true_false') {
        const tf = point.data as TrueFalseInteraction;
        setTfStatement(tf.statement || '');
        setTfIsCorrect(tf.isCorrect ?? true);
        setTfExplanation(tf.explanation || '');
      } else if (point.data.type === 'drag_drop') {
        const dd = point.data as DragDropInteraction;
        setInstruction(dd.instruction || '');
        setCategories(dd.categories && dd.categories.length ? [...dd.categories] : ['Nhóm 1', 'Nhóm 2']);
        setItems(dd.items && dd.items.length ? [...dd.items] : []);
        setDdExplanation(dd.explanation || '');
      } else if (point.data.type === 'fill_blank') {
        const fb = point.data as FillBlankInteraction;
        setSentence(fb.sentence || '');
        setBlankAnswer(fb.blankAnswer || '');
        setHint(fb.hint || '');
        setFbExplanation(fb.explanation || '');
      } else if (point.data.type === 'checkpoint_note') {
        const cn = point.data as CheckpointNoteInteraction;
        setNoteTitle(cn.title || '');
        setNoteSummary(cn.summary || '');
        setKeyTakeaways(cn.keyTakeaways && cn.keyTakeaways.length ? [...cn.keyTakeaways] : ['']);
        setReflectionQuestion(cn.reflectionQuestion || '');
      }
    }
  }, [point]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (!point) return;
    if (!title.trim()) { setValidationError('Hãy nhập tiêu đề điểm dừng.'); return; }
    if (timestamp < 0 || (videoDuration > 0 && timestamp >= videoDuration)) { setValidationError('Mốc dừng phải nằm trong thời lượng video.'); return; }
    if (type === 'quiz' && (!question.trim() || options.filter((item) => item.trim()).length < 2 || !quizExplanation.trim())) { setValidationError('Trắc nghiệm cần câu hỏi, ít nhất 2 lựa chọn và phần giải thích.'); return; }
    if (type === 'multi_choice' && (!mcQuestion.trim() || mcOptions.filter((item) => item.trim()).length < 2 || !mcCorrectAnswers.length || !mcExplanation.trim())) { setValidationError('Câu đa đáp án cần nội dung, lựa chọn, đáp án đúng và giải thích.'); return; }
    if (type === 'true_false' && (!tfStatement.trim() || !tfExplanation.trim())) { setValidationError('Câu Đúng/Sai cần nhận định và phần giải thích.'); return; }
    if (type === 'drag_drop' && (categories.filter((item) => item.trim()).length < 2 || items.filter((item) => item.text.trim()).length < 2)) { setValidationError('Kéo thả cần ít nhất 2 nhóm và 2 thẻ có nội dung.'); return; }
    if (type === 'fill_blank' && (!sentence.includes('{...}') || !blankAnswer.trim())) { setValidationError('Câu điền khuyết cần ký hiệu {...} và đáp án.'); return; }
    if (type === 'checkpoint_note' && (!noteSummary.trim() || !keyTakeaways.some((item) => item.trim()))) { setValidationError('Thẻ tóm tắt cần nội dung và ít nhất một ý chính.'); return; }
    setValidationError(null);
    let interactionData;

    if (type === 'quiz') {
      interactionData = {
        type: 'quiz' as const,
        question: question.trim(),
        options: options.map((opt) => opt.trim()),
        correctAnswer: Math.max(0, Math.min(options.length - 1, correctAnswer)),
        explanation: quizExplanation.trim(),
      };
    } else if (type === 'multi_choice') {
      interactionData = {
        type: 'multi_choice' as const,
        question: mcQuestion.trim(),
        options: mcOptions.map((opt) => opt.trim()),
        correctAnswers: mcCorrectAnswers,
        explanation: mcExplanation.trim(),
      };
    } else if (type === 'true_false') {
      interactionData = {
        type: 'true_false' as const,
        statement: tfStatement.trim(),
        isCorrect: tfIsCorrect,
        explanation: tfExplanation.trim(),
      };
    } else if (type === 'drag_drop') {
      interactionData = {
        type: 'drag_drop' as const,
        instruction: instruction.trim(),
        categories: categories.map((c) => c.trim()).filter(Boolean),
        items: items.map((it, idx) => ({
          id: it.id || `item_${idx}`,
          text: it.text.trim(),
          targetCategory: it.targetCategory,
        })),
        explanation: ddExplanation.trim(),
      };
    } else if (type === 'fill_blank') {
      interactionData = {
        type: 'fill_blank' as const,
        sentence: sentence.trim(),
        blankAnswer: blankAnswer.trim(),
        hint: hint.trim(),
        explanation: fbExplanation.trim(),
      };
    } else {
      interactionData = {
        type: 'checkpoint_note' as const,
        title: noteTitle.trim() || title.trim(),
        summary: noteSummary.trim(),
        keyTakeaways: keyTakeaways.map((t) => t.trim()).filter(Boolean),
        reflectionQuestion: reflectionQuestion.trim(),
      };
    }

    onSave({
      id: point.id,
      timestamp: Math.max(0, Math.round(timestamp)),
      title: title.trim(),
      learningObjective: learningObjective.trim() || undefined,
      cognitiveLevel,
      data: interactionData,
    });
    onClose();
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  if (!isOpen || !point) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="interaction-editor-title" className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 id="interaction-editor-title" className="text-base font-bold text-white">Chỉnh Sửa Điểm Dừng Tương Tác</h3>
              <p className="text-xs text-slate-400">Điều chỉnh thời gian, loại bài tập và câu hỏi sư phạm</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Đóng trình chỉnh sửa</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs">
          
          {/* Row 1: Timestamp & Type Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Timestamp */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Mốc dừng video:</span>
                </span>
                <span className="text-indigo-300 font-mono font-bold">
                  {formatSeconds(timestamp)}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={Math.max(600, Math.round(videoDuration))}
                  value={timestamp}
                  onChange={(e) => setTimestamp(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-slate-400 font-medium">giây</span>
              </div>
            </div>

            {/* Point Title */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Tiêu đề điểm dừng / Chủ đề con:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Kiểm tra khái niệm Quang hợp"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3 sm:grid-cols-2">
            <div><label className="mb-1.5 block font-semibold text-slate-300">Mục tiêu học tập <span className="font-normal text-slate-500">(khuyến nghị)</span></label><input type="text" value={learningObjective} onChange={(event) => setLearningObjective(event.target.value)} placeholder="VD: Phân biệt pha sáng và pha tối" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none" /></div>
            <div><label className="mb-1.5 block font-semibold text-slate-300">Mức độ nhận thức</label><select value={cognitiveLevel} onChange={(event) => setCognitiveLevel(event.target.value as InteractionPoint['cognitiveLevel'])} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"><option value="unclassified">Chưa phân loại</option><option value="recognition">Nhận biết</option><option value="understanding">Thông hiểu</option><option value="application">Vận dụng</option></select></div>
          </div>

          {validationError && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{validationError}</div>}

          {/* Type Selector (6 Types) */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Loại hoạt động tương tác sư phạm:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setType('quiz')}
                className={`py-1.5 px-2 rounded-lg font-medium text-[11px] transition-all ${
                  type === 'quiz' ? 'bg-indigo-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Trắc nghiệm
              </button>
              <button
                type="button"
                onClick={() => setType('multi_choice')}
                className={`py-1.5 px-2 rounded-lg font-medium text-[11px] transition-all ${
                  type === 'multi_choice' ? 'bg-blue-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Đa đáp án
              </button>
              <button
                type="button"
                onClick={() => setType('true_false')}
                className={`py-1.5 px-2 rounded-lg font-medium text-[11px] transition-all ${
                  type === 'true_false' ? 'bg-teal-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Đúng / Sai
              </button>
              <button
                type="button"
                onClick={() => setType('drag_drop')}
                className={`py-1.5 px-2 rounded-lg font-medium text-[11px] transition-all ${
                  type === 'drag_drop' ? 'bg-violet-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Kéo thả
              </button>
              <button
                type="button"
                onClick={() => setType('fill_blank')}
                className={`py-1.5 px-2 rounded-lg font-medium text-[11px] transition-all ${
                  type === 'fill_blank' ? 'bg-amber-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Điền từ
              </button>
              <button
                type="button"
                onClick={() => setType('checkpoint_note')}
                className={`py-1.5 px-2 rounded-lg font-medium text-[11px] transition-all ${
                  type === 'checkpoint_note' ? 'bg-emerald-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Thẻ tóm tắt
              </button>
            </div>
          </div>

          {/* DYNAMIC FORM: 1. SINGLE QUIZ */}
          {type === 'quiz' && (
            <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                  <span>Câu hỏi trắc nghiệm (Hỗ trợ công thức $...$):</span>
                </label>
                <textarea
                  rows={2}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="VD: Đẳng thức lượng giác nào sau đây đúng: $\sin^2(x) + \cos^2(x) = 1$?"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs focus:border-indigo-500 focus:outline-none"
                />
                {question.includes('$') && (
                  <div className="mt-1 p-2 bg-indigo-950/40 rounded-lg text-xs text-indigo-300">
                    <span className="text-[10px] text-slate-500 block mb-0.5">Xem trước công thức Toán:</span>
                    <MathRenderer content={question} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Các phương án trả lời (Chọn radio để đặt đáp án đúng):
                </label>
                <div className="space-y-2">
                  {options.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                          correctAnswer === idx
                            ? 'bg-emerald-950/40 border-emerald-500/50'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name="correct_opt"
                          checked={correctAnswer === idx}
                          onChange={() => setCorrectAnswer(idx)}
                          className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 font-bold flex items-center justify-center flex-shrink-0">
                          {letter}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...options];
                            newOpts[idx] = e.target.value;
                            setOptions(newOpts);
                          }}
                          placeholder={`Nội dung lựa chọn ${letter}...`}
                          className="flex-1 bg-transparent text-white text-xs focus:outline-none"
                        />
                        {correctAnswer === idx && (
                          <span className="text-[11px] font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/15 rounded">
                            Đáp án đúng
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Lời giải thích khi học sinh trả lời đúng / sai:
                </label>
                <input
                  type="text"
                  value={quizExplanation}
                  onChange={(e) => setQuizExplanation(e.target.value)}
                  placeholder="Giải thích vì sao đáp án này chính xác..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FORM: 2. MULTI CHOICE */}
          {type === 'multi_choice' && (
            <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Câu hỏi chọn nhiều đáp án:
                </label>
                <textarea
                  rows={2}
                  value={mcQuestion}
                  onChange={(e) => setMcQuestion(e.target.value)}
                  placeholder="VD: Những nhân tố nào sau đây ảnh hưởng đến quang hợp?"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Các phương án (Tích chọn các ô đáp án đúng):
                </label>
                <div className="space-y-2">
                  {mcOptions.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isChecked = mcCorrectAnswers.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                          isChecked
                            ? 'bg-blue-950/40 border-blue-500/50'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setMcCorrectAnswers(mcCorrectAnswers.filter((c) => c !== idx));
                            } else {
                              setMcCorrectAnswers([...mcCorrectAnswers, idx]);
                            }
                          }}
                          className="w-4 h-4 text-blue-500 rounded cursor-pointer"
                        />
                        <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 font-bold flex items-center justify-center flex-shrink-0">
                          {letter}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...mcOptions];
                            newOpts[idx] = e.target.value;
                            setMcOptions(newOpts);
                          }}
                          placeholder={`Lựa chọn ${letter}...`}
                          className="flex-1 bg-transparent text-white text-xs focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Giải thích chi tiết:
                </label>
                <input
                  type="text"
                  value={mcExplanation}
                  onChange={(e) => setMcExplanation(e.target.value)}
                  placeholder="Giải thích các đáp án đúng..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FORM: 3. TRUE / FALSE */}
          {type === 'true_false' && (
            <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Nội dung nhận định (Khẳng định):
                </label>
                <textarea
                  rows={2}
                  value={tfStatement}
                  onChange={(e) => setTfStatement(e.target.value)}
                  placeholder="VD: Pha tối của quang hợp chỉ diễn ra vào ban đêm."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Tính đúng đắn của nhận định trên:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTfIsCorrect(true)}
                    className={`p-3 rounded-xl border font-bold text-xs transition-all ${
                      tfIsCorrect
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    ✓ Nhận định ĐÚNG
                  </button>
                  <button
                    type="button"
                    onClick={() => setTfIsCorrect(false)}
                    className={`p-3 rounded-xl border font-bold text-xs transition-all ${
                      !tfIsCorrect
                        ? 'bg-rose-600 border-rose-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    ✗ Nhận định SAI
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Giải thích vì sao:
                </label>
                <input
                  type="text"
                  value={tfExplanation}
                  onChange={(e) => setTfExplanation(e.target.value)}
                  placeholder="Pha tối không cần ánh sáng trực tiếp nhưng vẫn diễn ra vào ban ngày khi có ATP và NADPH..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FORM: 4. DRAG & DROP */}
          {type === 'drag_drop' && (
            <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Yêu cầu / Hướng dẫn kéo thả:
                </label>
                <input
                  type="text"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="VD: Kéo các sản phẩm vào đúng pha quang hợp:"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Các nhóm danh mục đích (2-3 nhóm):
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1">
                      <input
                        type="text"
                        value={cat}
                        onChange={(e) => {
                          const newCats = [...categories];
                          newCats[idx] = e.target.value;
                          setCategories(newCats);
                        }}
                        className="bg-transparent text-violet-300 font-bold text-xs focus:outline-none w-28"
                      />
                      {categories.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setCategories(categories.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {categories.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setCategories([...categories, `Nhóm ${categories.length + 1}`])}
                      className="px-2.5 py-1 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/30 text-xs font-semibold hover:bg-violet-500/20"
                    >
                      + Thêm Nhóm
                    </button>
                  )}
                </div>
              </div>

              {/* Draggable items */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold">
                    Danh sách các thẻ và nhóm đích tương ứng:
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setItems([
                        ...items,
                        { id: `item_${Date.now()}`, text: '', targetCategory: categories[0] || 'Nhóm 1' },
                      ])
                    }
                    className="text-violet-400 hover:text-violet-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Thẻ</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {items.map((it, idx) => (
                    <div key={it.id || idx} className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[11px] font-mono">#{idx + 1}</span>
                      <input
                        type="text"
                        value={it.text}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].text = e.target.value;
                          setItems(newItems);
                        }}
                        placeholder="Nội dung thẻ (hỗ trợ $...$)..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none"
                      />
                      <select
                        value={it.targetCategory}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].targetCategory = e.target.value;
                          setItems(newItems);
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-violet-300 text-xs focus:outline-none"
                      >
                        {categories.map((c, i) => (
                          <option key={i} value={c}>
                            → {c}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC FORM: 5. FILL BLANK */}
          {type === 'fill_blank' && (
            <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Câu hỏi chứa chỗ trống (Dùng ký hiệu <span className="text-amber-400 font-mono">{'{...}'}</span>):
                </label>
                <textarea
                  rows={2}
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  placeholder="VD: Quá trình quang hợp hấp thụ khí {...} và thải ra khí Oxy."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Từ khóa đáp án chính xác:
                  </label>
                  <input
                    type="text"
                    value={blankAnswer}
                    onChange={(e) => setBlankAnswer(e.target.value)}
                    placeholder="VD: CO2 (hoặc Cacbonic)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Gợi ý cho học sinh:
                  </label>
                  <input
                    type="text"
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    placeholder="VD: Công thức hóa học của khí cacbonic"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Lời giải thích:
                </label>
                <input
                  type="text"
                  value={fbExplanation}
                  onChange={(e) => setFbExplanation(e.target.value)}
                  placeholder="Quang hợp cố định CO2 để tạo đường Glucose..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FORM: 6. CHECKPOINT NOTE */}
          {type === 'checkpoint_note' && (
            <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tiêu đề thẻ tóm tắt:
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="VD: Tóm tắt 3 ý trọng tâm"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nội dung tóm tắt ngắn gọn:
                </label>
                <textarea
                  rows={2}
                  value={noteSummary}
                  onChange={(e) => setNoteSummary(e.target.value)}
                  placeholder="Khái quát nội dung cốt lõi của đoạn video vừa xem..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold">Các ý chính cần ghi nhớ:</label>
                  <button
                    type="button"
                    onClick={() => setKeyTakeaways([...keyTakeaways, ''])}
                    className="text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Ý</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {keyTakeaways.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const next = [...keyTakeaways];
                          next[idx] = e.target.value;
                          setKeyTakeaways(next);
                        }}
                        placeholder={`Ý chính #${idx + 1}...`}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none"
                      />
                      {keyTakeaways.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setKeyTakeaways(keyTakeaways.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Câu hỏi phản tư (Không chấm điểm):
                </label>
                <input
                  type="text"
                  value={reflectionQuestion}
                  onChange={(e) => setReflectionQuestion(e.target.value)}
                  placeholder="VD: Hãy tự liên hệ xem quá trình này diễn ra ở đâu quanh bạn?"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Lưu Thay Đổi</span>
          </button>
        </div>

      </div>
    </div>
  );
};
