import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  History as HistoryIcon, 
  Flame, 
  Trophy, 
  CheckCircle2, 
  Circle,
  ArrowLeft,
  LayoutGrid,
  List,
  ArrowUpDown,
  Zap,
  RotateCcw
} from 'lucide-react';
import { DailyProgress, DailyJourneyDay, getAllScheduleDays, recordVerseCompletion } from '../services/dailyJourneyService';
import { getAllDailyProgress, getVerseByRef, parseReference } from '../lib/bibleDb';
import { cn, getLocalDateString, formatLocalDate } from '../lib/utils';
import { getRemainingReviewXP, getProgress } from '../lib/storage';
import { UserProgress } from '../types';

interface DailyJourneyHubProps {
  onStartDay: (day: DailyJourneyDay) => void;
  onStartReview: (queue: { date: string; reference: string }[]) => void;
  onExit: () => void;
  progress: UserProgress | null;
}

const DayXP = ({ day, progress }: { day: DailyJourneyDay, progress: UserProgress | null }) => {
  const [remainingXP, setRemainingXP] = useState<number | null>(null);

  useEffect(() => {
    const calc = async () => {
      let total = 0;
      for (const ref of day.references) {
        const parsed = parseReference(ref);
        if (parsed) {
          const verse = await getVerseByRef(parsed.book, parsed.chapter, parsed.startVerse);
          if (verse) {
            const words = verse.text.split(/\s+/).filter(Boolean).length;
            if (day.isCompleted) {
              total += getRemainingReviewXP(ref, words);
            } else {
              total += words * 3;
            }
          }
        }
      }
      setRemainingXP(total);
    };
    calc();
  }, [day, progress]);

  if (remainingXP === null || remainingXP === 0) return null;

  return (
    <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">
      <Zap size={8} fill="currentColor" />
      {remainingXP} XP {day.isCompleted ? 'Available' : 'Potential'}
    </div>
  );
};

export const DailyJourneyHub: React.FC<DailyJourneyHubProps> = ({ onStartDay, onStartReview, onExit, progress }) => {
  const [days, setDays] = useState<DailyJourneyDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [reviewOrder, setReviewOrder] = useState<'oldest' | 'newest'>('oldest');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const allDays = await getAllScheduleDays();
      const today = getLocalDateString();
      
      // Filter to only show days up to today
      const visibleDays = allDays.filter(d => d.date <= today).sort((a, b) => b.date.localeCompare(a.date));
      setDays(visibleDays);
      
      // Calculate streak
      let currentStreak = 0;
      const sortedByDate = [...visibleDays].sort((a, b) => b.date.localeCompare(a.date));
      
      for (const day of sortedByDate) {
        if (day.isCompleted) {
          currentStreak++;
        } else if (day.date !== today) {
          break;
        }
      }
      setStreak(currentStreak);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleReview = async () => {
    const progress = await getAllDailyProgress();
    let queue = progress.map(p => ({ date: p.date, reference: p.reference }));
    
    if (reviewOrder === 'oldest') {
      queue.sort((a, b) => a.date.localeCompare(b.date));
    } else {
      queue.sort((a, b) => b.date.localeCompare(a.date));
    }
    
    if (queue.length > 0) {
      onStartReview(queue);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-950 text-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mb-4"
        />
        <p className="text-amber-500 font-black uppercase tracking-widest animate-pulse">Consulting the Archives...</p>
      </div>
    );
  }

  const todayStr = getLocalDateString();
  const todayDay = days.find(d => d.date === todayStr);

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 flex items-center justify-between border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={onExit}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">Daily Journey</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Your Eternal Path</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-orange-500/20 text-orange-500 px-3 py-1.5 rounded-full border border-orange-500/30">
            <Flame size={16} fill="currentColor" />
            <span className="font-black text-sm">{streak}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar" ref={scrollRef}>
        {/* Today's Card */}
        {todayDay && (
          <section>
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Zap size={14} className="text-amber-500" /> Today's Focus
            </h2>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStartDay(todayDay)}
              className={cn(
                "relative overflow-hidden rounded-[2.5rem] p-8 border-2 transition-all cursor-pointer group",
                todayDay.isCompleted 
                  ? "bg-emerald-500/10 border-emerald-500/30" 
                  : "bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
              )}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest opacity-80">
                      Day {todayDay.dayOfYear} • {formatLocalDate(todayDay.date, { month: 'long', day: 'numeric' })}
                    </span>
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase mt-1">
                      {todayDay.theme}
                    </h3>
                    <div className="mt-2">
                      <DayXP day={todayDay} progress={progress} />
                    </div>
                  </div>
                  {todayDay.isCompleted ? (
                    <div className="bg-emerald-500 text-white p-2 rounded-full">
                      <CheckCircle2 size={24} />
                    </div>
                  ) : (
                    <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors">
                      <Play size={24} fill="currentColor" />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {todayDay.references.map((ref, i) => (
                    <span key={i} className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            </motion.div>
          </section>
        )}

        {/* Review Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <HistoryIcon size={14} className="text-blue-400" /> Daily Review
            </h2>
            <button 
              onClick={() => setReviewOrder(prev => prev === 'oldest' ? 'newest' : 'oldest')}
              className="text-[10px] font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded flex items-center gap-1 hover:bg-white/10 transition-colors"
            >
              <ArrowUpDown size={10} /> {reviewOrder} first
            </button>
          </div>
          
          <button 
            onClick={handleReview}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg shadow-lg transition-all uppercase italic flex items-center justify-center gap-3 group"
          >
            <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
            Start Review Marathon
          </button>
        </section>

        {/* Timeline */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <List size={14} className="text-purple-400" /> Journey Timeline
          </h2>
          
          <div className="space-y-3">
            {days.filter(d => d.date !== todayStr).map((day, idx) => (
              <motion.div 
                key={day.date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onStartDay(day)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                  day.isCompleted 
                    ? "bg-white/5 border-white/10 hover:bg-white/10" 
                    : "bg-slate-900 border-white/5 hover:border-amber-500/50"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  day.isCompleted ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-gray-500"
                )}>
                  {day.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      Day {day.dayOfYear} • {formatLocalDate(day.date, { month: 'short', day: 'numeric' })}
                    </span>
                    {day.isInitialPass && (
                      <span className="text-[8px] font-black bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                        Mastered
                      </span>
                    )}
                    <DayXP day={day} progress={progress} />
                  </div>
                  <h4 className="font-black italic uppercase tracking-tight truncate group-hover:text-amber-400 transition-colors">
                    {day.theme}
                  </h4>
                </div>
                
                <div className="flex -space-x-2">
                  {day.references.map((ref, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[8px] font-bold">
                      {ref.split(' ')[0][0]}
                    </div>
                  ))}
                </div>
                
                <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
