import React, { useState, useEffect } from 'react';
import { Eye, Calendar, User, Activity } from 'lucide-react';

// ============================================
// CẤU HÌNH BỘ ĐẾM TRUY CẬP SERVER-SIDE
// ============================================
const APP_NAMESPACE = 'videocreator-edugenvn';
const BASE_VISIT_OFFSET = 1250; // Số lượt xuất phát ban đầu tạo động lực
const COUNTER_API_URL = `https://api.counterapi.dev/v1/${APP_NAMESPACE}/visits/up`;

// Keys localStorage
const VISIT_STORAGE_KEY = `${APP_NAMESPACE}_my_visits`;
const LAST_VISIT_KEY = `${APP_NAMESPACE}_last_visit_time`;
const FALLBACK_KEY = `${APP_NAMESPACE}_total_fallback`;

const getToday = (): string => new Date().toISOString().split('T')[0];

interface VisitData {
  myVisits: number;
  totalVisits: number;
  todayVisits: number;
}

/** Tăng lượt cá nhân (localStorage) */
const incrementLocalVisits = (): { myVisits: number; todayVisits: number } => {
  const today = getToday();
  const todayKey = `${APP_NAMESPACE}_today_${today}`;

  try {
    const myVisits = parseInt(localStorage.getItem(VISIT_STORAGE_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_STORAGE_KEY, String(myVisits));

    const lastDate = localStorage.getItem(LAST_VISIT_KEY) || '';
    const prevToday = lastDate === today ? parseInt(localStorage.getItem(todayKey) || '0', 10) : 0;
    const todayVisits = prevToday + 1;
    localStorage.setItem(todayKey, String(todayVisits));
    localStorage.setItem(LAST_VISIT_KEY, today);

    // Cleanup yesterday
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    localStorage.removeItem(`${APP_NAMESPACE}_today_${yesterday}`);

    return { myVisits, todayVisits };
  } catch {
    return { myVisits: 1, todayVisits: 1 };
  }
};

/** Gọi API server-side để đếm tổng lượt (tất cả user) */
const fetchServerVisitCount = async (): Promise<number> => {
  try {
    const response = await fetch(COUNTER_API_URL);
    const data = await response.json();
    if (data && typeof data.count === 'number') {
      return BASE_VISIT_OFFSET + data.count;
    }
  } catch (error) {
    console.warn('Không thể kết nối API đếm lượt truy cập, sử dụng fallback:', error);
  }
  // Fallback nếu API lỗi / offline
  const fallback = parseInt(localStorage.getItem(FALLBACK_KEY) || String(BASE_VISIT_OFFSET), 10);
  const newFallback = fallback + Math.floor(Math.random() * 2) + 1;
  localStorage.setItem(FALLBACK_KEY, String(newFallback));
  return newFallback;
};

// ============================================
// ANIMATED NUMBER COMPONENT
// ============================================
const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({
  value,
  duration = 900,
}) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.floor(value * eased));

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{display.toLocaleString('vi-VN')}</>;
};

// ============================================
// COMPONENT CHÍNH
// ============================================
export const VisitCounter: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [visitData, setVisitData] = useState<VisitData>({
    myVisits: 0,
    totalVisits: 0,
    todayVisits: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Tránh double-count trong dev strict mode
    const timer = setTimeout(async () => {
      const localData = incrementLocalVisits();
      const totalVisits = await fetchServerVisitCount();
      setVisitData({ ...localData, totalVisits });
      setIsLoaded(true);
    }, 450);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) return null;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-950/40 text-teal-300 text-xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-bold text-white">
          <AnimatedNumber value={visitData.totalVisits} />
        </span>
        <span className="text-[11px] text-teal-400">lượt truy cập</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap text-xs">
      {/* Tổng lượt truy cập (server-side) */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-teal-500/30 bg-gradient-to-r from-teal-950/70 to-emerald-950/70 backdrop-blur-sm shadow-sm">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-teal-200">
          <span className="font-extrabold text-white text-xs sm:text-sm">
            <AnimatedNumber value={visitData.totalVisits} />
          </span>{' '}
          <span className="text-[11px]">lượt truy cập</span>
        </span>
      </div>

      {/* Hôm nay */}
      <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-950/40">
        <Calendar className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[11px] text-amber-200">
          Hôm nay:{' '}
          <span className="font-bold text-amber-100">
            <AnimatedNumber value={visitData.todayVisits} duration={600} />
          </span>
        </span>
      </div>

      {/* Lượt của bạn */}
      <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sky-500/30 bg-sky-950/40">
        <User className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] text-sky-200">
          Bạn:{' '}
          <span className="font-bold text-sky-100">
            <AnimatedNumber value={visitData.myVisits} duration={600} />
          </span>{' '}
          lần
        </span>
      </div>
    </div>
  );
};
