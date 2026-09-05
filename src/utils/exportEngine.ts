import { InteractionPoint } from '../types';

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function serializeForInlineScript(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function generateExportHtml(
  videoTitle: string,
  interactions: InteractionPoint[],
  videoSourceUrl: string = '',
  videoFileName: string = 'video_bai_giang.mp4',
  authorInfo: { name: string; zalo: string } = {
    name: 'PHẠM QUỐC ĐẠT',
    zalo: '0705350000',
  }
): string {
  const sanitizedInteractions = serializeForInlineScript(interactions);
  const serializedTitle = serializeForInlineScript(videoTitle);
  const titleSafe = escapeHtml(videoTitle);
  const videoSourceSafe = escapeHtml(videoSourceUrl);
  const videoFileNameSafe = escapeHtml(videoFileName);
  const authorNameSafe = escapeHtml(authorInfo.name);
  const authorZaloSafe = escapeHtml(authorInfo.zalo.replace(/[^0-9+]/g, ''));

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleSafe} - Video Tương Tác Sư Phạm AI</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <!-- KaTeX for Beautiful Math Formula Rendering -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js" crossorigin="anonymous"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6366f1; }
    .glass-modal { background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(12px); }
    @media print {
      body * { visibility: hidden; }
      #printable-certificate, #printable-certificate * { visibility: visible; }
      #printable-certificate { position: absolute; left: 0; top: 0; width: 100%; color: #000; background: #fff; }
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">

  <!-- Header -->
  <header class="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-30 px-4 py-3 sm:px-6">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div>
          <h1 class="text-base sm:text-lg font-bold text-white tracking-tight line-clamp-1">${titleSafe}</h1>
          <p class="text-xs text-indigo-400 font-medium">Bài Giảng Tương Tác Sư Phạm &bull; AI Powered</p>
        </div>
      </div>

      <!-- Author Badge -->
      <div class="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm text-xs">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span class="text-slate-400 font-medium">Bản quyền:</span>
        <span class="text-indigo-300 font-bold uppercase tracking-wide">ANH GIÁO: ${authorNameSafe}</span>
        <span class="text-slate-600">|</span>
        <a href="https://zalo.me/${authorZaloSafe}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors">
          Zalo: ${authorZaloSafe}
        </a>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">

    <!-- Video Player Column (3 cols) -->
    <div class="lg:col-span-3 flex flex-col gap-4">
      
      <!-- Video Frame Container -->
      <div class="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 aspect-video flex items-center justify-center group" id="player-container">
        
        <video 
          id="main-video" 
          class="w-full h-full object-contain cursor-pointer"
          playsinline
          ${videoSourceUrl ? `src="${videoSourceSafe}"` : ''}
        >
          Trình duyệt của bạn không hỗ trợ phát video HTML5.
        </video>

        <!-- No Video Prompt / Local File Selector if source not loaded -->
        <div id="video-fallback" class="${videoSourceUrl ? 'hidden' : 'flex'} absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-10">
          <div class="w-16 h-16 rounded-2xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Chọn file Video bài giảng trên máy của bạn</h3>
          <p class="text-sm text-slate-400 max-w-md mb-5">Vui lòng chọn file video (<span class="text-indigo-300 font-mono">${videoFileNameSafe}</span> hoặc bất kỳ file video .mp4 nào) để bắt đầu học.</p>
          <label class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            <span>Tải Video Lên Trình Chiếu</span>
            <input type="file" id="local-video-input" accept="video/mp4,video/webm,video/quicktime" class="hidden">
          </label>
        </div>

        <!-- Big Play Button Overlay -->
        <button id="big-play-btn" class="absolute z-10 w-20 h-20 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl hover:bg-indigo-500 hover:scale-110 transition-all duration-300">
          <svg class="w-10 h-10 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </button>

        <!-- Lock Alert Overlay (When seeking forward past unanswered point) -->
        <div id="seek-lock-toast" class="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs sm:text-sm transform -translate-y-12 opacity-0 transition-all duration-300 pointer-events-none">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          <span>Khóa tua tiến: Bạn cần hoàn thành câu hỏi tương tác trước khi xem tiếp!</span>
        </div>

        <!-- INTERACTION OVERLAY MODAL -->
        <div id="interaction-overlay" class="absolute inset-0 z-20 glass-modal flex items-center justify-center p-4 sm:p-6 hidden">
          <div class="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-7 max-w-xl w-full shadow-2xl overflow-y-auto max-h-[92%] custom-scrollbar transform transition-all duration-300 scale-95" id="interaction-modal-card">
            
            <!-- Modal Header -->
            <div class="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
              <div class="flex items-center gap-2">
                <span id="modal-type-badge" class="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold px-2.5 py-1 rounded-lg uppercase">
                  Câu hỏi tương tác
                </span>
                <span id="modal-time-badge" class="text-xs text-slate-400 font-mono">
                  00:00
                </span>
              </div>
              <span class="text-xs text-amber-400 font-medium">Video đã tạm dừng</span>
            </div>

            <!-- Interaction Dynamic Body -->
            <div id="modal-body" class="space-y-4"></div>

            <!-- Feedback Area -->
            <div id="modal-feedback" class="mt-4 p-3.5 rounded-xl text-sm hidden"></div>

            <!-- Modal Footer Action -->
            <div class="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-3" id="modal-footer"></div>
          </div>
        </div>

        <!-- COMPLETION CERTIFICATE & SCORE OVERLAY -->
        <div id="completion-overlay" class="absolute inset-0 z-20 glass-modal flex items-center justify-center p-4 hidden">
          <div class="bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl" id="printable-certificate">
            <div class="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-3 animate-bounce">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h2 class="text-xl sm:text-2xl font-bold text-white mb-1">Chúc Mừng Bạn!</h2>
            <p class="text-xs sm:text-sm text-slate-300 mb-4">Bạn đã hoàn thành xuất sắc toàn bộ bài học tương tác!</p>
            
            <!-- Result Card -->
            <div class="bg-slate-800/80 rounded-2xl p-4 mb-4 border border-slate-700 text-left">
              <div class="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2 text-xs">
                <span class="text-slate-400">Bài học:</span>
                <span class="font-bold text-white">${titleSafe}</span>
              </div>
              <div class="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2 text-xs">
                <span class="text-slate-400">Điểm kinh nghiệm:</span>
                <span class="font-extrabold text-amber-400 text-sm" id="final-xp">0 XP</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-400">Mốc tương tác đã vượt qua:</span>
                <span class="font-bold text-emerald-400" id="final-stats">100% Hoàn thành</span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="grid grid-cols-2 gap-2 mb-3">
              <button id="btn-print-result" class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all">
                <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                <span>In Phiếu Kết Quả</span>
              </button>
              <button id="btn-copy-code" class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all">
                <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                <span>Mã Xác Nhận</span>
              </button>
            </div>

            <button id="btn-replay-all" class="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              <span>Xem Lại Bài Học Từ Đầu</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Video Controls Bar -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
        
        <!-- Timeline Bar with Interaction Markers -->
        <div class="relative w-full group">
          <div class="relative w-full h-3 bg-slate-800 rounded-full cursor-pointer overflow-visible" id="timeline-track">
            <!-- Progress bar -->
            <div id="timeline-progress" class="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full w-0 pointer-events-none"></div>
            <!-- Markers Container -->
            <div id="timeline-markers" class="absolute inset-0 pointer-events-none"></div>
          </div>
        </div>

        <!-- Buttons row -->
        <div class="flex items-center justify-between flex-wrap gap-2 text-sm">
          <div class="flex items-center gap-3">
            <button id="ctrl-play" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors" title="Phát/Tạm dừng">
              <svg id="icon-play" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              <svg id="icon-pause" class="w-5 h-5 hidden" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>

            <button id="ctrl-mute" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors" title="Âm lượng">
              <svg id="icon-vol" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
            </button>

            <div class="text-xs text-slate-400 font-mono">
              <span id="current-time">00:00</span> / <span id="total-time">00:00</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-xs text-indigo-300 font-medium">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              <span>Chế độ: Chống tua bài</span>
            </span>

            <button id="ctrl-fullscreen" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors" title="Toàn màn hình">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
            </button>
          </div>
        </div>

      </div>

    </div>

    <!-- Sidebar: Interaction Timeline List & Progress (1 col) -->
    <div class="lg:col-span-1 flex flex-col gap-4">
      
      <!-- Progress Summary Card -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <h3 class="text-sm font-bold text-white mb-2 flex items-center justify-between">
          <span>Tiến Độ Bài Học</span>
          <span id="progress-percent" class="text-indigo-400 font-mono">0%</span>
        </h3>
        <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
          <div id="progress-bar-fill" class="h-full bg-indigo-500 rounded-full w-0 transition-all duration-300"></div>
        </div>
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>Đã giải: <strong id="completed-count" class="text-slate-200">0</strong>/<span id="total-count">0</span></span>
          <span class="text-amber-400 font-bold" id="total-xp-display">0 XP</span>
        </div>
      </div>

      <!-- Interaction Milestones List -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex-1 flex flex-col min-h-[320px]">
        <h3 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          <span>Danh Sách Điểm Dừng</span>
        </h3>

        <div id="interactions-list" class="space-y-2.5 flex-1 overflow-y-auto max-h-[420px] custom-scrollbar pr-1"></div>
      </div>

    </div>

  </main>

  <!-- Audio & KaTeX Logic -->
  <script>
    const RAW_INTERACTIONS = ${sanitizedInteractions};
    const VIDEO_TITLE = ${serializedTitle};

    let interactions = JSON.parse(JSON.stringify(RAW_INTERACTIONS)).sort((a, b) => a.timestamp - b.timestamp);
    let completedPoints = new Set();
    let totalXp = 0;
    let activeInteraction = null;

    // Selection states
    let selectedQuizIndex = null;
    let selectedMultiIndices = [];
    let selectedTrueFalseVal = null;
    let droppedCategories = {};
    let fillBlankText = '';

    // DOM References
    const video = document.getElementById('main-video');
    const playerContainer = document.getElementById('player-container');
    const bigPlayBtn = document.getElementById('big-play-btn');
    const ctrlPlay = document.getElementById('ctrl-play');
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');
    const ctrlMute = document.getElementById('ctrl-mute');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    const timelineTrack = document.getElementById('timeline-track');
    const timelineProgress = document.getElementById('timeline-progress');
    const timelineMarkers = document.getElementById('timeline-markers');
    const seekLockToast = document.getElementById('seek-lock-toast');
    const interactionOverlay = document.getElementById('interaction-overlay');
    const completionOverlay = document.getElementById('completion-overlay');
    const modalBody = document.getElementById('modal-body');
    const modalFeedback = document.getElementById('modal-feedback');
    const modalFooter = document.getElementById('modal-footer');
    const modalTypeBadge = document.getElementById('modal-type-badge');
    const modalTimeBadge = document.getElementById('modal-time-badge');
    const interactionsListEl = document.getElementById('interactions-list');
    const progressPercentEl = document.getElementById('progress-percent');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const completedCountEl = document.getElementById('completed-count');
    const totalCountEl = document.getElementById('total-count');
    const totalXpDisplay = document.getElementById('total-xp-display');
    const localVideoInput = document.getElementById('local-video-input');
    const videoFallback = document.getElementById('video-fallback');
    const ctrlFullscreen = document.getElementById('ctrl-fullscreen');
    const btnReplayAll = document.getElementById('btn-replay-all');
    const finalXp = document.getElementById('final-xp');
    const btnPrintResult = document.getElementById('btn-print-result');
    const btnCopyCode = document.getElementById('btn-copy-code');

    function escapeHtml(text) {
      return String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function renderMath(text) {
      if (!text) return ''; const value = String(text); if (typeof window.katex === 'undefined') return escapeHtml(value);
      let result = ''; let lastIndex = 0; const expression = /\\$([^\\$\\n]+?)\\$/g; let match;
      while ((match = expression.exec(value)) !== null) { result += escapeHtml(value.slice(lastIndex, match.index));
        try { result += window.katex.renderToString(match[1].trim(), { displayMode: false, throwOnError: false }); } catch(e) { result += escapeHtml(match[0]); }
        lastIndex = expression.lastIndex; }
      return result + escapeHtml(value.slice(lastIndex));
    }

    // Audio SFX using Web Audio API
    function playAudio(type) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (type === 'correct') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25);
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
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        }
      } catch(e) {}
    }

    function formatTime(sec) {
      if (isNaN(sec) || sec < 0) return '00:00';
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
    }

    // Update Progress Sidebar
    function updateProgress() {
      const total = interactions.length;
      const count = completedPoints.size;
      const pct = total > 0 ? Math.round((count / total) * 100) : 100;
      if (progressPercentEl) progressPercentEl.innerText = pct + '%';
      if (progressBarFill) progressBarFill.style.width = pct + '%';
      if (completedCountEl) completedCountEl.innerText = count;
      if (totalCountEl) totalCountEl.innerText = total;
      if (totalXpDisplay) totalXpDisplay.innerText = totalXp + ' XP';
      renderSidebarList();
    }

    // Render Markers on timeline
    function renderMarkers() {
      timelineMarkers.innerHTML = '';
      const dur = video.duration || 180;
      interactions.forEach(pt => {
        const pct = (pt.timestamp / dur) * 100;
        const marker = document.createElement('div');
        marker.className = 'absolute top-0 bottom-0 w-2.5 -ml-1 rounded-full pointer-events-none ' +
          (completedPoints.has(pt.id) ? 'bg-emerald-400' : 'bg-amber-400');
        marker.style.left = Math.min(100, Math.max(0, pct)) + '%';
        timelineMarkers.appendChild(marker);
      });
    }

    // Render Sidebar List
    function renderSidebarList() {
      interactionsListEl.innerHTML = '';
      interactions.forEach((pt, idx) => {
        const isDone = completedPoints.has(pt.id);
        const item = document.createElement('div');
        item.className = 'p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ' +
          (isDone ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700');
        item.innerHTML = '<div>' +
          '<div class="font-semibold">' + (idx + 1) + '. ' + escapeHtml(pt.title) + '</div>' +
          '<div class="text-[11px] text-slate-400 font-mono mt-0.5">' + formatTime(pt.timestamp) + '</div>' +
          '</div>' +
          (isDone ? '<span class="text-emerald-400 font-bold">✓ Đã giải</span>' : '<span class="text-amber-400">Đang chờ</span>');
        interactionsListEl.appendChild(item);
      });
    }

    // Open Interaction Modal
    function triggerModal(point) {
      activeInteraction = point;
      selectedQuizIndex = null;
      selectedMultiIndices = [];
      selectedTrueFalseVal = null;
      droppedCategories = {};
      fillBlankText = '';

      modalTimeBadge.innerText = formatTime(point.timestamp);
      modalFeedback.className = 'mt-4 p-3.5 rounded-xl text-sm hidden';
      modalFeedback.innerHTML = '';

      let bodyHtml = '';
      let footerHtml = '';

      if (point.data.type === 'quiz') {
        modalTypeBadge.innerText = 'Trắc nghiệm đơn';
        bodyHtml += '<div class="text-sm font-bold text-white mb-3">' + renderMath(point.data.question) + '</div><div class="space-y-2">';
        point.data.options.forEach((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          bodyHtml += '<label class="quiz-opt-label flex items-center gap-2.5 p-3 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 cursor-pointer transition-all">' +
            '<input type="radio" name="modal_quiz" value="' + idx + '" class="w-4 h-4 text-indigo-600">' +
            '<span class="w-5 h-5 rounded bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0">' + letter + '</span>' +
            '<span class="text-xs font-medium flex-1">' + renderMath(opt) + '</span>' +
            '</label>';
        });
        bodyHtml += '</div>';
        footerHtml = '<button id="btn-submit-action" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-5 rounded-xl text-xs shadow transition-all cursor-pointer">Kiểm Tra Đáp Án</button>';
      } else if (point.data.type === 'multi_choice') {
        modalTypeBadge.innerText = 'Chọn nhiều đáp án';
        bodyHtml += '<div class="text-sm font-bold text-white mb-3">' + renderMath(point.data.question) + '</div><div class="space-y-2">';
        point.data.options.forEach((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          bodyHtml += '<label class="mc-opt-label flex items-center gap-2.5 p-3 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 cursor-pointer transition-all">' +
            '<input type="checkbox" value="' + idx + '" class="w-4 h-4 text-indigo-600 rounded">' +
            '<span class="w-5 h-5 rounded bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0">' + letter + '</span>' +
            '<span class="text-xs font-medium flex-1">' + renderMath(opt) + '</span>' +
            '</label>';
        });
        bodyHtml += '</div>';
        footerHtml = '<button id="btn-submit-action" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-5 rounded-xl text-xs shadow transition-all cursor-pointer">Kiểm Tra Lựa Chọn</button>';
      } else if (point.data.type === 'true_false') {
        modalTypeBadge.innerText = 'Đúng / Sai';
        bodyHtml += '<div class="text-sm font-bold text-white mb-4">' + renderMath(point.data.statement) + '</div>' +
          '<div class="grid grid-cols-2 gap-3">' +
          '<button id="btn-tf-true" class="p-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-emerald-950/40 text-emerald-300 font-bold text-sm">✓ ĐÚNG</button>' +
          '<button id="btn-tf-false" class="p-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-rose-950/40 text-rose-300 font-bold text-sm">✗ SAI</button>' +
          '</div>';
      } else if (point.data.type === 'fill_blank') {
        modalTypeBadge.innerText = 'Điền từ khuyết';
        bodyHtml += '<div class="text-sm font-bold text-white mb-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700">' + renderMath(point.data.sentence) + '</div>' +
          '<div class="flex items-center gap-2">' +
          '<input type="text" id="input-fb-answer" placeholder="Nhập đáp án điền vào..." class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none">' +
          (point.data.hint ? '<button id="btn-fb-hint" class="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl">💡 Gợi ý</button>' : '') +
          '</div>' +
          (point.data.hint ? '<div id="fb-hint-text" class="hidden mt-2 p-2 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-200">Gợi ý: ' + escapeHtml(point.data.hint) + '</div>' : '');
        footerHtml = '<button id="btn-submit-action" class="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-5 rounded-xl text-xs shadow transition-all cursor-pointer">Kiểm Tra Điền Từ</button>';
      } else if (point.data.type === 'drag_drop') {
        modalTypeBadge.innerText = 'Kéo thả phân loại';
        bodyHtml += '<div class="text-xs font-bold text-white mb-2">' + renderMath(point.data.instruction) + '</div>' +
          '<div class="grid grid-cols-2 gap-2 mb-3" id="dd-slots">';
        point.data.categories.forEach(cat => {
          bodyHtml += '<div class="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 min-h-[90px] flex flex-col" data-cat="' + escapeHtml(cat) + '">' +
            '<div class="text-[11px] font-bold text-violet-300 uppercase mb-1.5 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-violet-400"></span><span>' + renderMath(cat) + '</span></div>' +
            '<div class="slot-items space-y-1 flex-1"></div>' +
            '</div>';
        });
        bodyHtml += '</div><div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">' +
          '<div class="text-[11px] text-slate-400 font-semibold mb-1.5">Bấm vào thẻ để xếp vào nhóm:</div>' +
          '<div class="flex flex-wrap gap-1.5" id="dd-pool">';
        point.data.items.forEach(it => {
          bodyHtml += '<div class="relative group/drop" data-item-id="' + escapeHtml(it.id) + '">' +
            '<span class="inline-block bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-medium px-2.5 py-1 rounded-lg cursor-pointer">' + renderMath(it.text) + '</span>' +
            '<div class="absolute left-0 bottom-full mb-1 hidden group-hover/drop:flex flex-col bg-slate-900 border border-slate-700 rounded-lg p-1 shadow-xl z-30 whitespace-nowrap min-w-[120px]">';
          point.data.categories.forEach(cat => {
            bodyHtml += '<button type="button" class="btn-drop-cat text-left text-[10px] text-violet-300 hover:bg-slate-800 p-1 rounded font-medium" data-cat="' + escapeHtml(cat) + '" data-item-id="' + escapeHtml(it.id) + '">→ ' + escapeHtml(cat) + '</button>';
          });
          bodyHtml += '</div></div>';
        });
        bodyHtml += '</div></div>';
        footerHtml = '<button id="btn-submit-action" class="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-5 rounded-xl text-xs shadow transition-all cursor-pointer">Kiểm Tra Kéo Thả</button>';
      } else if (point.data.type === 'checkpoint_note') {
        modalTypeBadge.innerText = 'Thẻ tóm tắt';
        bodyHtml += '<div class="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-2.5">' +
          '<div class="text-sm font-bold text-indigo-300">' + renderMath(point.data.title) + '</div>' +
          '<p class="text-xs text-slate-300 leading-relaxed">' + renderMath(point.data.summary) + '</p>' +
          '<ul class="space-y-1 pl-2">';
        (point.data.keyTakeaways || []).forEach(it => {
          bodyHtml += '<li class="text-xs text-emerald-300 flex items-start gap-1.5"><span>&bull;</span><span>' + renderMath(it) + '</span></li>';
        });
        bodyHtml += '</ul>' +
          (point.data.reflectionQuestion ? '<div class="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-amber-200 font-medium">🧠 ' + renderMath(point.data.reflectionQuestion) + '</div>' : '') +
          '</div>';
        footerHtml = '<button id="btn-resume-action" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-lg transition-all cursor-pointer">Đã Hiểu &amp; Tiếp Tục Xem</button>';
      }

      modalBody.innerHTML = bodyHtml;
      modalFooter.innerHTML = footerHtml;
      interactionOverlay.classList.remove('hidden');

      // Bind events inside modal
      bindModalEvents(point);
    }

    function bindModalEvents(point) {
      if (point.data.type === 'quiz') {
        document.querySelectorAll('input[name="modal_quiz"]').forEach(r => {
          r.addEventListener('change', (e) => {
            selectedQuizIndex = parseInt(e.target.value);
          });
        });
        const btnSub = document.getElementById('btn-submit-action');
        if (btnSub) {
          btnSub.onclick = () => {
            if (selectedQuizIndex === null) return;
            const isCorrect = selectedQuizIndex === point.data.correctAnswer;
            showFeedback(isCorrect, point.data.explanation, 20);
          };
        }
      } else if (point.data.type === 'multi_choice') {
        document.querySelectorAll('.mc-opt-label input[type="checkbox"]').forEach(cb => {
          cb.addEventListener('change', () => {
            const checked = [];
            document.querySelectorAll('.mc-opt-label input[type="checkbox"]:checked').forEach(c => {
              checked.push(parseInt(c.value));
            });
            selectedMultiIndices = checked;
          });
        });
        const btnSub = document.getElementById('btn-submit-action');
        if (btnSub) {
          btnSub.onclick = () => {
            const correct = point.data.correctAnswers || [];
            const isMatch = selectedMultiIndices.length === correct.length && selectedMultiIndices.every(c => correct.includes(c));
            showFeedback(isMatch, point.data.explanation, 25);
          };
        }
      } else if (point.data.type === 'true_false') {
        const btnT = document.getElementById('btn-tf-true');
        const btnF = document.getElementById('btn-tf-false');
        if (btnT) btnT.onclick = () => showFeedback(point.data.isCorrect === true, point.data.explanation, 15);
        if (btnF) btnF.onclick = () => showFeedback(point.data.isCorrect === false, point.data.explanation, 15);
      } else if (point.data.type === 'fill_blank') {
        const hintBtn = document.getElementById('btn-fb-hint');
        if (hintBtn) {
          hintBtn.onclick = () => {
            const ht = document.getElementById('fb-hint-text');
            if (ht) ht.classList.toggle('hidden');
          };
        }
        const btnSub = document.getElementById('btn-submit-action');
        if (btnSub) {
          btnSub.onclick = () => {
            const inp = document.getElementById('input-fb-answer');
            const userAns = inp ? inp.value.trim().toLowerCase().replace(/\\s+/g, '') : '';
            const correctAns = point.data.blankAnswer.trim().toLowerCase().replace(/\\s+/g, '');
            const isCorrect = userAns === correctAns;
            showFeedback(isCorrect, point.data.explanation || ('Đáp án: ' + point.data.blankAnswer), 20);
          };
        }
      } else if (point.data.type === 'drag_drop') {
        document.querySelectorAll('.btn-drop-cat').forEach(b => {
          b.onclick = (e) => {
            const itId = b.getAttribute('data-item-id');
            const cat = b.getAttribute('data-cat');
            droppedCategories[itId] = cat;
            renderDragDropState(point);
          };
        });
        const btnSub = document.getElementById('btn-submit-action');
        if (btnSub) {
          btnSub.onclick = () => {
            let correct = 0;
            point.data.items.forEach(it => {
              if (droppedCategories[it.id] === it.targetCategory) correct++;
            });
            const isAll = correct === point.data.items.length;
            showFeedback(isAll, point.data.explanation || ('Xếp đúng: ' + correct + '/' + point.data.items.length), 30);
          };
        }
      } else if (point.data.type === 'checkpoint_note') {
        const btnRes = document.getElementById('btn-resume-action');
        if (btnRes) {
          btnRes.onclick = () => {
            completedPoints.add(point.id);
            totalXp += 10;
            playAudio('correct');
            updateProgress();
            closeModalAndResume();
          };
        }
      }
    }

    function renderDragDropState(point) {
      document.querySelectorAll('#dd-slots [data-cat]').forEach(slot => {
        const cat = slot.getAttribute('data-cat');
        const container = slot.querySelector('.slot-items');
        container.innerHTML = '';
        point.data.items.filter(it => droppedCategories[it.id] === cat).forEach(it => {
          const chip = document.createElement('div');
          chip.className = 'bg-violet-600 text-white text-[11px] px-2 py-1 rounded shadow flex items-center justify-between';
          chip.innerHTML = '<span>' + renderMath(it.text) + '</span><button class="text-violet-200 hover:text-white font-bold ml-1">&times;</button>';
          chip.querySelector('button').onclick = () => {
            delete droppedCategories[it.id];
            renderDragDropState(point);
          };
          container.appendChild(chip);
        });
      });
      document.querySelectorAll('#dd-pool [data-item-id]').forEach(chip => {
        const id = chip.getAttribute('data-item-id');
        chip.style.display = droppedCategories[id] ? 'none' : 'block';
      });
    }

    function showFeedback(isCorrect, explanation, xpGain) {
      if (isCorrect) {
        playAudio('correct');
        completedPoints.add(activeInteraction.id);
        totalXp += xpGain;
        updateProgress();
        renderMarkers();

        modalFeedback.className = 'mt-4 p-3.5 rounded-xl text-xs bg-emerald-950/80 border border-emerald-500/50 text-emerald-200';
        modalFeedback.innerHTML = '<div class="font-bold flex items-center gap-1.5"><span>✓ Chính xác! (+ ' + xpGain + ' XP)</span></div>' +
          '<div class="mt-1">' + renderMath(explanation || 'Bạn đã nắm rất vững kiến thức!') + '</div>';

        modalFooter.innerHTML = '<button id="btn-continue-video" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"><span>Tiếp Tục Xem Video</span><svg class="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>';
        document.getElementById('btn-continue-video').onclick = () => closeModalAndResume();
      } else {
        playAudio('wrong');
        modalFeedback.className = 'mt-4 p-3.5 rounded-xl text-xs bg-rose-950/80 border border-rose-500/50 text-rose-200';
        modalFeedback.innerHTML = '<div class="font-bold">✗ Chưa chính xác!</div>' +
          '<div class="mt-1">' + renderMath(explanation || 'Hãy suy nghĩ và thử lại nhé!') + '</div>';
      }
    }

    function closeModalAndResume() {
      interactionOverlay.classList.add('hidden');
      activeInteraction = null;
      video.play().catch(()=>{});
      updatePlayIcon(true);
    }

    function updatePlayIcon(isPlaying) {
      if (isPlaying) {
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
        bigPlayBtn.classList.add('hidden');
      } else {
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
        if (!activeInteraction) bigPlayBtn.classList.remove('hidden');
      }
    }

    // Video Events
    video.addEventListener('timeupdate', () => {
      const cur = video.currentTime;
      const dur = video.duration || 180;
      currentTimeEl.innerText = formatTime(cur);
      totalTimeEl.innerText = formatTime(dur);
      timelineProgress.style.width = ((cur / dur) * 100) + '%';

      // Trigger checkpoints
      for (const pt of interactions) {
        if (!completedPoints.has(pt.id)) {
          if (Math.abs(cur - pt.timestamp) < 0.45 || (cur >= pt.timestamp && cur < pt.timestamp + 0.9)) {
            video.pause();
            updatePlayIcon(false);
            triggerModal(pt);
            break;
          }
        }
      }
    });

    video.addEventListener('loadedmetadata', () => {
      totalTimeEl.innerText = formatTime(video.duration);
      renderMarkers();
      updateProgress();
    });

    video.addEventListener('play', () => updatePlayIcon(true));
    video.addEventListener('pause', () => updatePlayIcon(false));

    video.addEventListener('ended', () => {
      if (completedPoints.size === interactions.length) {
        if (typeof confetti === 'function') {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        if (finalXp) finalXp.innerText = totalXp + ' XP';
        completionOverlay.classList.remove('hidden');
      }
    });

    // Big play button & controls
    bigPlayBtn.addEventListener('click', () => video.play());
    ctrlPlay.addEventListener('click', () => {
      if (video.paused) video.play();
      else video.pause();
    });

    ctrlMute.addEventListener('click', () => {
      video.muted = !video.muted;
      ctrlMute.classList.toggle('text-rose-400', video.muted);
    });

    ctrlFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        playerContainer.requestFullscreen().catch(()=>{});
      } else {
        document.exitFullscreen().catch(()=>{});
      }
    });

    // Enforced Seeking check on timeline click
    timelineTrack.addEventListener('click', (e) => {
      const rect = timelineTrack.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const targetTime = ratio * (video.duration || 180);

      const earliestUncompleted = interactions
        .filter(p => !completedPoints.has(p.id))
        .sort((a, b) => a.timestamp - b.timestamp)[0];

      if (earliestUncompleted && targetTime > earliestUncompleted.timestamp + 0.5) {
        video.currentTime = earliestUncompleted.timestamp;
        seekLockToast.classList.remove('opacity-0', '-translate-y-12');
        setTimeout(() => seekLockToast.classList.add('opacity-0', '-translate-y-12'), 2500);
        triggerModal(earliestUncompleted);
      } else {
        video.currentTime = targetTime;
      }
    });

    // Local Video Input fallback
    if (localVideoInput) {
      localVideoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          video.src = URL.createObjectURL(file);
          videoFallback.classList.add('hidden');
          video.play().catch(()=>{});
        }
      });
    }

    if (btnReplayAll) {
      btnReplayAll.addEventListener('click', () => {
        completionOverlay.classList.add('hidden');
        completedPoints.clear();
        totalXp = 0;
        updateProgress();
        renderMarkers();
        video.currentTime = 0;
        video.play().catch(()=>{});
      });
    }

    if (btnPrintResult) {
      btnPrintResult.addEventListener('click', () => window.print());
    }

    if (btnCopyCode) {
      btnCopyCode.addEventListener('click', () => {
        const code = 'CERT-' + Math.random().toString(36).substring(2, 9).toUpperCase() + '-' + totalXp + 'XP';
        navigator.clipboard.writeText(code).then(() => {
          alert('Đã sao chép mã chứng nhận hoàn thành: ' + code);
        });
      });
    }

    // Keyboard Space to Play/Pause
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (video.paused) video.play();
        else video.pause();
      }
    });

    // Initialize
    updateProgress();
  </script>
</body>
</html>`;
}

export function generateOfflineExportHtml(videoTitle: string, interactions: InteractionPoint[], videoFileName: string, localVideoPath: string): string {
  return generateExportHtml(videoTitle, interactions, localVideoPath, videoFileName)
    .replace('<script src="https://cdn.tailwindcss.com"></script>', '<link rel="stylesheet" href="./assets/app.css">')
    .replace('<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>', '<script src="./assets/confetti.browser.min.js"></script>')
    .replace('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css" crossorigin="anonymous">', '<link rel="stylesheet" href="./assets/katex.min.css">')
    .replace('<script src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js" crossorigin="anonymous"></script>', '<script src="./assets/katex.min.js"></script>')
    .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">/g, '').replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>/g, '')
    .replace(/\s*<link href="https:\/\/fonts\.googleapis\.com\/css2[^>]+>/g, '');
}
