import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  MoveHorizontal,
  Edit2,
  Lock,
  Sparkles,
  CheckSquare,
  Award,
  Zap,
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

interface InteractivePlayerPreviewProps {
  videoUrl: string;
  videoFileName: string;
  interactions: InteractionPoint[];
  seekTimestampTarget: number | null;
  onDurationDetected: (duration: number) => void;
}

export const InteractivePlayerPreview: React.FC<InteractivePlayerPreviewProps> = ({
  videoUrl,
  videoFileName,
  interactions,
  seekTimestampTarget,
  onDurationDetected,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [completedPointIds, setCompletedPointIds] = useState<Set<string>>(new Set());
  const [activeModalPoint, setActiveModalPoint] = useState<InteractionPoint | null>(null);

  // Interaction States
  // 1. Single Quiz
  const [selectedQuizChoice, setSelectedQuizChoice] = useState<number | null>(null);
  // 2. Multi Choice
  const [selectedMultiChoices, setSelectedMultiChoices] = useState<number[]>([]);
  // 3. True / False
  const [selectedTrueFalse, setSelectedTrueFalse] = useState<boolean | null>(null);
  // 4. Drag & Drop
  const [droppedCategories, setDroppedCategories] = useState<{ [itemId: string]: string }>({});
  // 5. Fill Blank
  const [fillBlankInput, setFillBlankInput] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);

  // General Feedback
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [totalXp, setTotalXp] = useState<number>(0);

  // Seek lock alert
  const [showSeekLockToast, setShowSeekLockToast] = useState(false);

  // Sound effects generator using Web Audio API
  const playSoundEffect = (type: 'correct' | 'wrong' | 'complete') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'correct') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'wrong') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio not supported or blocked
    }
  };

  // Synchronize external seek command from table
  useEffect(() => {
    if (seekTimestampTarget !== null && videoRef.current) {
      videoRef.current.currentTime = Math.max(0, seekTimestampTarget - 0.5);
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [seekTimestampTarget]);

  // Format seconds
  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    // Check interaction points
    for (const point of interactions) {
      if (!completedPointIds.has(point.id)) {
        if (
          Math.abs(cur - point.timestamp) < 0.45 ||
          (cur >= point.timestamp && cur < point.timestamp + 0.9)
        ) {
          videoRef.current.pause();
          setIsPlaying(false);
          triggerModal(point);
          break;
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 180;
      setDuration(dur);
      onDurationDetected(dur);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const triggerModal = (point: InteractionPoint) => {
    setActiveModalPoint(point);
    setSelectedQuizChoice(null);
    setSelectedMultiChoices([]);
    setSelectedTrueFalse(null);
    setDroppedCategories({});
    setFillBlankInput('');
    setShowHint(false);
    setFeedback(null);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = ratio * duration;

    // Enforced progression check: prevent jumping past uncompleted point
    const earliestUncompleted = interactions
      .filter((p) => !completedPointIds.has(p.id))
      .sort((a, b) => a.timestamp - b.timestamp)[0];

    if (earliestUncompleted && target > earliestUncompleted.timestamp + 0.5) {
      videoRef.current.currentTime = earliestUncompleted.timestamp;
      setShowSeekLockToast(true);
      setTimeout(() => setShowSeekLockToast(false), 2500);
      triggerModal(earliestUncompleted);
    } else {
      videoRef.current.currentTime = target;
    }
  };

  // 1. Submit Single Quiz
  const submitQuiz = () => {
    if (!activeModalPoint || activeModalPoint.data.type !== 'quiz') return;
    if (selectedQuizChoice === null) return;

    const quiz = activeModalPoint.data as QuizInteraction;
    const isCorrect = selectedQuizChoice === quiz.correctAnswer;

    if (isCorrect) {
      playSoundEffect('correct');
      setTotalXp((xp) => xp + 20);
      setCompletedPointIds(new Set([...completedPointIds, activeModalPoint.id]));
      setFeedback({
        isCorrect: true,
        text: quiz.explanation || 'Chính xác! Bạn đã hiểu rất đúng nội dung bài học.',
      });
    } else {
      playSoundEffect('wrong');
      setFeedback({
        isCorrect: false,
        text: quiz.explanation ? `Chưa đúng! ${quiz.explanation}` : 'Chưa đúng, hãy suy nghĩ và chọn lại nhé!',
      });
    }
  };

  // 2. Submit Multi Choice
  const submitMultiChoice = () => {
    if (!activeModalPoint || activeModalPoint.data.type !== 'multi_choice') return;
    const mc = activeModalPoint.data as MultiChoiceInteraction;
    const correct = mc.correctAnswers || [];

    const isMatch =
      selectedMultiChoices.length === correct.length &&
      selectedMultiChoices.every((c) => correct.includes(c));

    if (isMatch) {
      playSoundEffect('correct');
      setTotalXp((xp) => xp + 25);
      setCompletedPointIds(new Set([...completedPointIds, activeModalPoint.id]));
      setFeedback({
        isCorrect: true,
        text: mc.explanation || 'Xuất sắc! Bạn đã chọn đủ tất cả đáp án đúng.',
      });
    } else {
      playSoundEffect('wrong');
      setFeedback({
        isCorrect: false,
        text: mc.explanation ? `Chưa đủ hoặc chưa đúng! ${mc.explanation}` : 'Chưa chính xác, vui lòng kiểm tra lại!',
      });
    }
  };

  // 3. Submit True / False
  const submitTrueFalse = (userChoice: boolean) => {
    if (!activeModalPoint || activeModalPoint.data.type !== 'true_false') return;
    const tf = activeModalPoint.data as TrueFalseInteraction;
    setSelectedTrueFalse(userChoice);

    const isCorrect = userChoice === tf.isCorrect;
    if (isCorrect) {
      playSoundEffect('correct');
      setTotalXp((xp) => xp + 15);
      setCompletedPointIds(new Set([...completedPointIds, activeModalPoint.id]));
      setFeedback({
        isCorrect: true,
        text: tf.explanation || 'Đúng rồi! Bạn đã phán đoán rất chính xác.',
      });
    } else {
      playSoundEffect('wrong');
      setFeedback({
        isCorrect: false,
        text: tf.explanation ? `Chưa chính xác! ${tf.explanation}` : 'Nhận định này chưa đúng!',
      });
    }
  };

  // 4. Submit Drag & Drop
  const submitDragDrop = () => {
    if (!activeModalPoint || activeModalPoint.data.type !== 'drag_drop') return;
    const dd = activeModalPoint.data as DragDropInteraction;
    let correctCount = 0;

    dd.items.forEach((it) => {
      if (droppedCategories[it.id] === it.targetCategory) {
        correctCount++;
      }
    });

    const isAllCorrect = correctCount === dd.items.length;
    if (isAllCorrect) {
      playSoundEffect('correct');
      setTotalXp((xp) => xp + 30);
      setCompletedPointIds(new Set([...completedPointIds, activeModalPoint.id]));
      setFeedback({
        isCorrect: true,
        text: dd.explanation || 'Xuất sắc! Tất cả các thẻ đã được xếp đúng danh mục.',
      });
    } else {
      playSoundEffect('wrong');
      setFeedback({
        isCorrect: false,
        text: `Bạn đã xếp đúng ${correctCount}/${dd.items.length} thẻ. Thử lại nhé!`,
      });
    }
  };

  // 5. Submit Fill Blank
  const submitFillBlank = () => {
    if (!activeModalPoint || activeModalPoint.data.type !== 'fill_blank') return;
    const fb = activeModalPoint.data as FillBlankInteraction;
    const cleanUser = fillBlankInput.trim().toLowerCase().replace(/\s+/g, '');
    const cleanAns = fb.blankAnswer.trim().toLowerCase().replace(/\s+/g, '');

    const isCorrect = cleanUser === cleanAns;
    if (isCorrect) {
      playSoundEffect('correct');
      setTotalXp((xp) => xp + 20);
      setCompletedPointIds(new Set([...completedPointIds, activeModalPoint.id]));
      setFeedback({
        isCorrect: true,
        text: fb.explanation || `Chính xác! Đáp án là: "${fb.blankAnswer}".`,
      });
    } else {
      playSoundEffect('wrong');
      setFeedback({
        isCorrect: false,
        text: fb.explanation ? `Chưa đúng! ${fb.explanation}` : 'Chưa đúng, hãy thử kiểm tra lại từ khóa nhé!',
      });
    }
  };

  // 6. Complete Checkpoint Note
  const completeCheckpointNote = () => {
    if (!activeModalPoint) return;
    playSoundEffect('correct');
    setTotalXp((xp) => xp + 10);
    setCompletedPointIds(new Set([...completedPointIds, activeModalPoint.id]));
    resumeVideo();
  };

  const resumeVideo = () => {
    setActiveModalPoint(null);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <section aria-labelledby="preview-panel-title" className="flex flex-col gap-4 rounded-3xl border border-white/[0.075] bg-[#0b1627]/95 p-5 shadow-[0_24px_70px_rgba(2,8,23,0.32)] lg:p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></div>
          <h2 id="preview-panel-title" className="text-sm font-bold text-white tracking-wide">
            Xem trước trải nghiệm người học
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          {/* XP Badge */}
          <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2.5 py-0.5 rounded-full">
            <Zap className="w-3 h-3 fill-amber-300" />
            <span className="font-bold">{totalXp} XP</span>
          </div>

          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            {completedPointIds.size}/{interactions.length} mốc hoàn thành
          </span>
        </div>
      </div>

      {/* Video Container Frame */}
      <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 aspect-video flex items-center justify-center group">
        
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-300">Chưa có video được tải lên</p>
            <p className="text-xs text-slate-500 mt-1">
              Hãy chọn một file video hoặc bấm vào video mẫu ở cột bên trái để trải nghiệm ngay.
            </p>
          </div>
        )}

        {/* Big Play Button Overlay */}
        {videoUrl && !isPlaying && !activeModalPoint && (
          <button
            onClick={togglePlay}
            className="absolute z-10 w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-all cursor-pointer"
          >
            <Play className="w-8 h-8 translate-x-0.5 fill-white" />
          </button>
        )}

        {/* Seek Lock Toast */}
        {showSeekLockToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs animate-in fade-in slide-in-from-top-4">
            <Lock className="w-4 h-4" />
            <span>Khóa tua tiến: Bạn cần hoàn thành câu hỏi tương tác trước!</span>
          </div>
        )}

        {/* INTERACTIVE MODAL OVERLAY (Pop-up on exact timestamp) */}
        {activeModalPoint && (
          <div className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/90 rounded-2xl p-5 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[94%] custom-scrollbar animate-in zoom-in-95 duration-150">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold uppercase">
                    {activeModalPoint.data.type === 'quiz'
                      ? 'Trắc Nghiệm Đơn'
                      : activeModalPoint.data.type === 'multi_choice'
                      ? 'Chọn Nhiều Đáp Án'
                      : activeModalPoint.data.type === 'true_false'
                      ? 'Đúng / Sai'
                      : activeModalPoint.data.type === 'drag_drop'
                      ? 'Kéo Thả Ghép Thẻ'
                      : activeModalPoint.data.type === 'fill_blank'
                      ? 'Điền Khuyết'
                      : 'Thẻ Tóm Tắt'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {formatTime(activeModalPoint.timestamp)}
                  </span>
                </div>
                <span className="text-[11px] text-amber-400 font-medium">Video đã tạm dừng</span>
              </div>

              {/* BODY: 1. SINGLE QUIZ */}
              {activeModalPoint.data.type === 'quiz' && (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-white leading-relaxed">
                    <MathRenderer content={(activeModalPoint.data as QuizInteraction).question} />
                  </div>
                  <div className="space-y-2">
                    {(activeModalPoint.data as QuizInteraction).options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      return (
                        <label
                          key={idx}
                          onClick={() => setSelectedQuizChoice(idx)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedQuizChoice === idx
                              ? 'bg-indigo-950/70 border-indigo-500 text-white'
                              : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 text-slate-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="prev_quiz"
                            checked={selectedQuizChoice === idx}
                            onChange={() => setSelectedQuizChoice(idx)}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="w-5 h-5 rounded bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {letter}
                          </span>
                          <span className="text-xs font-medium flex-1">
                            <MathRenderer content={opt} inline />
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BODY: 2. MULTI CHOICE */}
              {activeModalPoint.data.type === 'multi_choice' && (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-white leading-relaxed">
                    <MathRenderer content={(activeModalPoint.data as MultiChoiceInteraction).question} />
                  </div>
                  <div className="space-y-2">
                    {(activeModalPoint.data as MultiChoiceInteraction).options.map((opt, idx) => {
                      const isSelected = selectedMultiChoices.includes(idx);
                      const letter = String.fromCharCode(65 + idx);
                      return (
                        <label
                          key={idx}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedMultiChoices(selectedMultiChoices.filter((c) => c !== idx));
                            } else {
                              setSelectedMultiChoices([...selectedMultiChoices, idx]);
                            }
                          }}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-950/70 border-indigo-500 text-white'
                              : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 text-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <span className="w-5 h-5 rounded bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {letter}
                          </span>
                          <span className="text-xs font-medium flex-1">
                            <MathRenderer content={opt} inline />
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BODY: 3. TRUE / FALSE */}
              {activeModalPoint.data.type === 'true_false' && (
                <div className="space-y-4">
                  <div className="text-sm font-bold text-white leading-relaxed">
                    <MathRenderer content={(activeModalPoint.data as TrueFalseInteraction).statement} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => submitTrueFalse(true)}
                      className={`p-4 rounded-xl border font-bold text-sm transition-all ${
                        selectedTrueFalse === true
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-slate-800/80 border-slate-700 hover:bg-emerald-950/40 text-emerald-300'
                      }`}
                    >
                      ✓ ĐÚNG
                    </button>
                    <button
                      type="button"
                      onClick={() => submitTrueFalse(false)}
                      className={`p-4 rounded-xl border font-bold text-sm transition-all ${
                        selectedTrueFalse === false
                          ? 'bg-rose-600 border-rose-400 text-white'
                          : 'bg-slate-800/80 border-slate-700 hover:bg-rose-950/40 text-rose-300'
                      }`}
                    >
                      ✗ SAI
                    </button>
                  </div>
                </div>
              )}

              {/* BODY: 4. DRAG & DROP */}
              {activeModalPoint.data.type === 'drag_drop' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-white">
                    <MathRenderer content={(activeModalPoint.data as DragDropInteraction).instruction} />
                  </div>
                  
                  {/* Category slots */}
                  <div className="grid grid-cols-2 gap-2">
                    {(activeModalPoint.data as DragDropInteraction).categories.map((cat, idx) => (
                      <div key={idx} className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 min-h-[90px] flex flex-col">
                        <div className="text-[11px] font-bold text-violet-300 uppercase mb-1.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                          <span><MathRenderer content={cat} inline /></span>
                        </div>
                        <div className="flex-1 space-y-1">
                          {(activeModalPoint.data as DragDropInteraction).items
                            .filter((it) => droppedCategories[it.id] === cat)
                            .map((it) => (
                              <div
                                key={it.id}
                                className="bg-violet-600 text-white text-[11px] px-2 py-1 rounded shadow flex items-center justify-between"
                              >
                                <span><MathRenderer content={it.text} inline /></span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = { ...droppedCategories };
                                    delete next[it.id];
                                    setDroppedCategories(next);
                                  }}
                                  className="text-violet-200 hover:text-white ml-1 font-bold"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Available Items Pool */}
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-semibold mb-1.5">
                      Nhấp vào thẻ để chọn xếp vào danh mục:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeModalPoint.data as DragDropInteraction).items
                        .filter((it) => !droppedCategories[it.id])
                        .map((it) => (
                          <div key={it.id} className="relative group/drop">
                            <span className="inline-block bg-slate-800 border border-slate-700 text-slate-200 hover:border-violet-500 text-[11px] font-medium px-2.5 py-1 rounded-lg cursor-pointer">
                              <MathRenderer content={it.text} inline />
                            </span>
                            {/* Fast Drop Menu */}
                            <div className="absolute left-0 bottom-full mb-1 hidden group-hover/drop:flex flex-col bg-slate-900 border border-slate-700 rounded-lg p-1 shadow-xl z-30 whitespace-nowrap min-w-[120px]">
                              {(activeModalPoint.data as DragDropInteraction).categories.map((cat, cIdx) => (
                                <button
                                  key={cIdx}
                                  type="button"
                                  onClick={() =>
                                    setDroppedCategories({
                                      ...droppedCategories,
                                      [it.id]: cat,
                                    })
                                  }
                                  className="text-left text-[10px] text-violet-300 hover:bg-slate-800 p-1 rounded font-medium"
                                >
                                  → {cat}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* BODY: 5. FILL BLANK */}
              {activeModalPoint.data.type === 'fill_blank' && (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-white leading-relaxed p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <MathRenderer content={(activeModalPoint.data as FillBlankInteraction).sentence} />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={fillBlankInput}
                      onChange={(e) => setFillBlankInput(e.target.value)}
                      placeholder="Nhập từ hoặc công thức cần điền..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                    {(activeModalPoint.data as FillBlankInteraction).hint && (
                      <button
                        type="button"
                        onClick={() => setShowHint(!showHint)}
                        className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold"
                      >
                        💡 Gợi ý
                      </button>
                    )}
                  </div>

                  {showHint && (activeModalPoint.data as FillBlankInteraction).hint && (
                    <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                      Gợi ý: {(activeModalPoint.data as FillBlankInteraction).hint}
                    </div>
                  )}
                </div>
              )}

              {/* BODY: 6. CHECKPOINT NOTE */}
              {activeModalPoint.data.type === 'checkpoint_note' && (
                <div className="space-y-3 bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/30">
                  <div className="text-sm font-bold text-indigo-300">
                    <MathRenderer content={(activeModalPoint.data as CheckpointNoteInteraction).title} />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <MathRenderer content={(activeModalPoint.data as CheckpointNoteInteraction).summary} />
                  </p>
                  <ul className="space-y-1.5 pl-2">
                    {(activeModalPoint.data as CheckpointNoteInteraction).keyTakeaways?.map((item, idx) => (
                      <li key={idx} className="text-xs text-emerald-300 flex items-start gap-1.5">
                        <span>&bull;</span>
                        <span><MathRenderer content={item} inline /></span>
                      </li>
                    ))}
                  </ul>
                  {(activeModalPoint.data as CheckpointNoteInteraction).reflectionQuestion && (
                    <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-amber-200 font-medium">
                      🧠 <MathRenderer content={(activeModalPoint.data as CheckpointNoteInteraction).reflectionQuestion!} inline />
                    </div>
                  )}
                </div>
              )}

              {/* Feedback Notification */}
              {feedback && (
                <div
                  className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2 ${
                    feedback.isCorrect
                      ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
                  }`}
                >
                  {feedback.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">
                      {feedback.isCorrect ? 'Chính xác! (+XP)' : 'Chưa đúng!'}
                    </div>
                    <div className="text-[11px] mt-0.5">
                      <MathRenderer content={feedback.text} inline />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                {activeModalPoint.data.type === 'quiz' && !feedback?.isCorrect && (
                  <button
                    type="button"
                    onClick={submitQuiz}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs shadow transition-all cursor-pointer"
                  >
                    Kiểm Tra Đáp Án
                  </button>
                )}

                {activeModalPoint.data.type === 'multi_choice' && !feedback?.isCorrect && (
                  <button
                    type="button"
                    onClick={submitMultiChoice}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs shadow transition-all cursor-pointer"
                  >
                    Kiểm Tra Lựa Chọn
                  </button>
                )}

                {activeModalPoint.data.type === 'drag_drop' && !feedback?.isCorrect && (
                  <button
                    type="button"
                    onClick={submitDragDrop}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-4 rounded-xl text-xs shadow transition-all cursor-pointer"
                  >
                    Kiểm Tra Kéo Thả
                  </button>
                )}

                {activeModalPoint.data.type === 'fill_blank' && !feedback?.isCorrect && (
                  <button
                    type="button"
                    onClick={submitFillBlank}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-xl text-xs shadow transition-all cursor-pointer"
                  >
                    Kiểm Tra Điền Từ
                  </button>
                )}

                {activeModalPoint.data.type === 'checkpoint_note' && (
                  <button
                    type="button"
                    onClick={completeCheckpointNote}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Đã Hiểu &amp; Tiếp Tục Xem</span>
                    <Play className="w-3.5 h-3.5 fill-white" />
                  </button>
                )}

                {feedback?.isCorrect && (
                  <button
                    type="button"
                    onClick={resumeVideo}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Tiếp Tục Xem Video</span>
                    <Play className="w-3.5 h-3.5 fill-white" />
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Video Control Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
        
        {/* Timeline with Markers */}
        <div
          onClick={handleTimelineClick}
          className="relative w-full h-3 bg-slate-800 rounded-full cursor-pointer overflow-visible"
        >
          {/* Progress bar */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />

          {/* Interaction Markers */}
          {interactions.map((point) => {
            const pct = duration > 0 ? Math.min(100, Math.max(0, (point.timestamp / duration) * 100)) : 0;
            const isDone = completedPointIds.has(point.id);
            return (
              <div
                key={point.id}
                style={{ left: `${pct}%` }}
                className={`absolute top-0 bottom-0 w-2.5 -ml-1 rounded-full z-10 transform transition-transform hover:scale-150 ${
                  isDone ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400 shadow-sm shadow-amber-400'
                }`}
                title={`${point.title} (${formatTime(point.timestamp)})`}
              />
            );
          })}
        </div>

        {/* Buttons & Time */}
        <div className="flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <span className="font-mono text-slate-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Mốc dừng tương tác: {interactions.length}
            </span>
          </div>
        </div>

      </div>

    </section>
  );
};
