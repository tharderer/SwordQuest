import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Heart, Shuffle, Edit2, Sparkles, ArrowLeft, Play, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { TowerBlock, MathHUD } from './TriviaTowerComponents';
import { Difficulty } from '../types';
import { 
  MathOp, 
  MathEquation, 
  generateMathProblem, 
  generateChronologyQuestion, 
  generateSpellingQuestion, 
  generateParableQuestion, 
  DANGER_LINE_PX 
} from '../lib/towerUtils';

export { type Difficulty };

// --- Math Tower Logic ---
// (Removed local definitions as they are imported)

// --- Chronology Tower Logic ---
// (Removed local definitions as they are imported)

// --- Spelling Tower Logic ---
// (Removed local definitions as they are imported)

// --- Parable Tower Logic ---
// (Removed local definitions as they are imported)

export const ChronologyTowerGame = ({ 
  onComplete, 
  onMistake, 
  onExit, 
  isOutOfHearts,
  volume,
  setVolume,
  isMusicEnabled,
  setIsMusicEnabled,
  musicStatus,
  setMusicStatus
}: { 
  onComplete: (xp: number) => void, 
  onMistake: () => void, 
  onExit: () => void, 
  isOutOfHearts: boolean,
  volume: number,
  setVolume: (v: number) => void,
  isMusicEnabled: boolean,
  setIsMusicEnabled: (v: boolean) => void,
  musicStatus: string,
  setMusicStatus: (v: string) => void
}) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showStart, setShowStart] = useState(true);
  const [question, setQuestion] = useState(() => generateChronologyQuestion());
  const [towerData, setTowerData] = useState<{
    stack: {id: number, word: string, height: number, color: string, isPlatform?: boolean}[]
  }>({ 
    stack: [{ id: -1, word: "", height: 100, color: '#1e293b', isPlatform: true }] 
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const towerContainerRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef(performance.now());
  const lastTapTimeRef = useRef(Date.now());
  const nextIdRef = useRef(0);
  const platformYRef = useRef(DANGER_LINE_PX);
  const towerHeightRef = useRef(100);
  const cameraYRef = useRef(0);
  const sinkRateRef = useRef(8);
  const [containerHeight, setContainerHeight] = useState(800);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (containerHeight > 0 && showStart) {
      const h = containerHeight * 0.20;
      towerHeightRef.current = h;
      setTowerData({ stack: [{ id: -1, word: "", height: h, color: '#1e293b', isPlatform: true }] });
    }
  }, [containerHeight, showStart]);

  useEffect(() => {
    if (showStart || isGameOver || isOutOfHearts) return;
    let active = true;
    const tick = () => {
      if (!active) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastUpdateRef.current) / 1000);
      lastUpdateRef.current = now;
      platformYRef.current -= sinkRateRef.current * dt;
      const topOfTower = platformYRef.current + towerHeightRef.current;
      const targetCameraY = Math.max(0, topOfTower - containerHeight * 0.6);
      cameraYRef.current += (targetCameraY - cameraYRef.current) * (1 - Math.exp(-4 * dt));
      if (topOfTower - cameraYRef.current <= DANGER_LINE_PX) {
        setIsGameOver(true);
        return;
      }
      if (towerContainerRef.current) {
        towerContainerRef.current.style.transform = `translate3d(0, ${-(platformYRef.current - cameraYRef.current)}px, 0)`;
      }
      sinkRateRef.current += 0.3 * dt;
      requestAnimationFrame(tick);
    };
    lastUpdateRef.current = performance.now();
    const animId = requestAnimationFrame(tick);
    return () => { active = false; cancelAnimationFrame(animId); };
  }, [showStart, isGameOver, isOutOfHearts, containerHeight]);

  const handleChoice = (event: any) => {
    if (isGameOver || showStart) return;
    if (event.id === question.correctEvent.id) {
      setScore(s => s + 10);
      setStreak(s => s + 1);
      const h = containerHeight * 0.20;
      towerHeightRef.current += h;
      setTowerData(prev => ({
        stack: [...prev.stack, { id: nextIdRef.current++, word: event.text, height: h, color: '#f43f5e' }]
      }));
      setQuestion(generateChronologyQuestion());
      lastTapTimeRef.current = Date.now();
    } else {
      setStreak(0);
      onMistake();
    }
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden flex flex-col">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500/50 z-20" style={{ bottom: DANGER_LINE_PX }} />
      </div>

      <div ref={towerContainerRef} className="absolute left-0 right-0 bottom-0 flex flex-col-reverse items-center transition-transform duration-75 ease-out will-change-transform">
        {towerData.stack.map((block) => (
          <TowerBlock key={block.id} {...block} />
        ))}
      </div>

      <div className="relative z-30 p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onExit} className="p-2 bg-white/10 rounded-xl text-white"><ArrowLeft /></button>
          <div className="text-white font-black text-2xl">SCORE: {score}</div>
          <div className="w-10" />
        </div>

        <AnimatePresence mode="wait">
          {showStart ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-rose-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl"><Shuffle size={48} /></div>
              <h2 className="text-4xl font-black text-white mb-4 italic tracking-tighter">CHRONOLOGY TOWER</h2>
              <p className="text-rose-200 mb-8 font-bold uppercase tracking-widest">Stack events in order!</p>
              <button onClick={() => setShowStart(false)} className="px-12 py-4 bg-rose-500 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform">START MISSION</button>
            </motion.div>
          ) : isGameOver ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <h2 className="text-6xl font-black text-white mb-4 italic tracking-tighter">TOWER FELL!</h2>
              <p className="text-rose-200 mb-8 text-xl font-bold">Final Score: {score}</p>
              <button onClick={() => onComplete(score)} className="px-12 py-4 bg-rose-500 text-white rounded-2xl font-black text-xl shadow-xl">COLLECT XP</button>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border-2 border-white/20 mb-8">
                <p className="text-rose-200 text-xs font-black uppercase tracking-widest mb-2">What happened after...</p>
                <h3 className="text-2xl font-black text-white italic tracking-tight">{question.baseEvent.text}</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 mt-auto mb-8">
                {question.options.map((opt) => (
                  <button key={opt.id} onClick={() => handleChoice(opt)} className="w-full py-5 bg-white rounded-2xl font-black text-slate-900 shadow-xl active:scale-95 transition-transform hover:bg-rose-50">
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const SpellingTowerGame = ({ 
  onComplete, 
  onMistake, 
  onExit, 
  isOutOfHearts,
  volume,
  setVolume,
  isMusicEnabled,
  setIsMusicEnabled,
  musicStatus,
  setMusicStatus
}: { 
  onComplete: (xp: number) => void, 
  onMistake: () => void, 
  onExit: () => void, 
  isOutOfHearts: boolean,
  volume: number,
  setVolume: (v: number) => void,
  isMusicEnabled: boolean,
  setIsMusicEnabled: (v: boolean) => void,
  musicStatus: string,
  setMusicStatus: (v: string) => void
}) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showStart, setShowStart] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [question, setQuestion] = useState(() => generateSpellingQuestion("", 0));
  const [towerData, setTowerData] = useState<{
    stack: {id: number, word: string, height: number, color: string, isPlatform?: boolean}[]
  }>({ 
    stack: [{ id: -1, word: "", height: 100, color: '#1e293b', isPlatform: true }] 
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const towerContainerRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef(performance.now());
  const lastTapTimeRef = useRef(Date.now());
  const nextIdRef = useRef(0);
  const platformYRef = useRef(DANGER_LINE_PX);
  const towerHeightRef = useRef(100);
  const cameraYRef = useRef(0);
  const sinkRateRef = useRef(8);
  const [containerHeight, setContainerHeight] = useState(800);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (containerHeight > 0 && showStart) {
      const h = containerHeight * 0.20;
      towerHeightRef.current = h;
      setTowerData({ stack: [{ id: -1, word: "", height: h, color: '#1e293b', isPlatform: true }] });
    }
  }, [containerHeight, showStart]);

  useEffect(() => {
    if (showStart || isGameOver || isOutOfHearts) return;
    let active = true;
    const tick = () => {
      if (!active) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastUpdateRef.current) / 1000);
      lastUpdateRef.current = now;
      platformYRef.current -= sinkRateRef.current * dt;
      const topOfTower = platformYRef.current + towerHeightRef.current;
      const targetCameraY = Math.max(0, topOfTower - containerHeight * 0.6);
      cameraYRef.current += (targetCameraY - cameraYRef.current) * (1 - Math.exp(-4 * dt));
      if (topOfTower - cameraYRef.current <= DANGER_LINE_PX) {
        setIsGameOver(true);
        return;
      }
      if (towerContainerRef.current) {
        towerContainerRef.current.style.transform = `translate3d(0, ${-(platformYRef.current - cameraYRef.current)}px, 0)`;
      }
      sinkRateRef.current += 0.3 * dt;
      requestAnimationFrame(tick);
    };
    lastUpdateRef.current = performance.now();
    const animId = requestAnimationFrame(tick);
    return () => { active = false; cancelAnimationFrame(animId); };
  }, [showStart, isGameOver, isOutOfHearts, containerHeight]);

  const handleChoice = (char: string) => {
    if (isGameOver || showStart) return;
    if (char === question.nextChar) {
      const nextIdx = currentIndex + 1;
      const h = containerHeight * 0.20;
      
      if (nextIdx >= question.name.length) {
        setScore(s => s + 50);
        towerHeightRef.current += h;
        setTowerData(prev => ({
          stack: [...prev.stack, { id: nextIdRef.current++, word: question.name, height: h, color: '#06b6d4' }]
        }));
        const newQ = generateSpellingQuestion("", 0);
        setQuestion(newQ);
        setCurrentIndex(0);
      } else {
        setScore(s => s + 5);
        setCurrentIndex(nextIdx);
        setQuestion(generateSpellingQuestion(question.name, nextIdx));
      }
      lastTapTimeRef.current = Date.now();
    } else {
      setStreak(0);
      onMistake();
    }
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden flex flex-col">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500/50 z-20" style={{ bottom: DANGER_LINE_PX }} />
      </div>

      <div ref={towerContainerRef} className="absolute left-0 right-0 bottom-0 flex flex-col-reverse items-center transition-transform duration-75 ease-out will-change-transform">
        {towerData.stack.map((block) => (
          <TowerBlock key={block.id} {...block} />
        ))}
      </div>

      <div className="relative z-30 p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onExit} className="p-2 bg-white/10 rounded-xl text-white"><ArrowLeft /></button>
          <div className="text-white font-black text-2xl">SCORE: {score}</div>
          <div className="w-10" />
        </div>

        <AnimatePresence mode="wait">
          {showStart ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-cyan-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl"><Edit2 size={48} /></div>
              <h2 className="text-4xl font-black text-white mb-4 italic tracking-tighter">SPELLING TOWER</h2>
              <p className="text-cyan-200 mb-8 font-bold uppercase tracking-widest">Spell Bible names to build!</p>
              <button onClick={() => setShowStart(false)} className="px-12 py-4 bg-cyan-500 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform">START MISSION</button>
            </motion.div>
          ) : isGameOver ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <h2 className="text-6xl font-black text-white mb-4 italic tracking-tighter">TOWER FELL!</h2>
              <p className="text-cyan-200 mb-8 text-xl font-bold">Final Score: {score}</p>
              <button onClick={() => onComplete(score)} className="px-12 py-4 bg-cyan-500 text-white rounded-2xl font-black text-xl shadow-xl">COLLECT XP</button>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border-2 border-white/20 mb-8 text-center">
                <p className="text-cyan-200 text-xs font-black uppercase tracking-widest mb-4">Spell the name...</p>
                <div className="flex justify-center gap-2">
                  {question.name.split('').map((char, i) => (
                    <div key={i} className={cn(
                      "w-10 h-12 rounded-lg flex items-center justify-center font-black text-2xl border-2",
                      i < currentIndex ? "bg-cyan-500 border-cyan-400 text-white" : "bg-white/5 border-white/20 text-white/20"
                    )}>
                      {i < currentIndex ? char : '?'}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-auto mb-8">
                {question.options.map((opt, i) => (
                  <button key={i} onClick={() => handleChoice(opt)} className="w-full py-8 bg-white rounded-2xl font-black text-4xl text-slate-900 shadow-xl active:scale-95 transition-transform hover:bg-cyan-50">
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const ParableTowerGame = ({ 
  onComplete, 
  onMistake, 
  onExit, 
  isOutOfHearts,
  volume,
  setVolume,
  isMusicEnabled,
  setIsMusicEnabled,
  musicStatus,
  setMusicStatus
}: { 
  onComplete: (xp: number) => void, 
  onMistake: () => void, 
  onExit: () => void, 
  isOutOfHearts: boolean,
  volume: number,
  setVolume: (v: number) => void,
  isMusicEnabled: boolean,
  setIsMusicEnabled: (v: boolean) => void,
  musicStatus: string,
  setMusicStatus: (v: string) => void
}) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showStart, setShowStart] = useState(true);
  const [question, setQuestion] = useState(() => generateParableQuestion());
  const [towerData, setTowerData] = useState<{
    stack: {id: number, word: string, height: number, color: string, isPlatform?: boolean}[]
  }>({ 
    stack: [{ id: -1, word: "", height: 100, color: '#1e293b', isPlatform: true }] 
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const towerContainerRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef(performance.now());
  const lastTapTimeRef = useRef(Date.now());
  const nextIdRef = useRef(0);
  const platformYRef = useRef(DANGER_LINE_PX);
  const towerHeightRef = useRef(100);
  const cameraYRef = useRef(0);
  const sinkRateRef = useRef(8);
  const [containerHeight, setContainerHeight] = useState(800);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (containerHeight > 0 && showStart) {
      const h = containerHeight * 0.20;
      towerHeightRef.current = h;
      setTowerData({ stack: [{ id: -1, word: "", height: h, color: '#1e293b', isPlatform: true }] });
    }
  }, [containerHeight, showStart]);

  useEffect(() => {
    if (showStart || isGameOver || isOutOfHearts) return;
    let active = true;
    const tick = () => {
      if (!active) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastUpdateRef.current) / 1000);
      lastUpdateRef.current = now;
      platformYRef.current -= sinkRateRef.current * dt;
      const topOfTower = platformYRef.current + towerHeightRef.current;
      const targetCameraY = Math.max(0, topOfTower - containerHeight * 0.6);
      cameraYRef.current += (targetCameraY - cameraYRef.current) * (1 - Math.exp(-4 * dt));
      if (topOfTower - cameraYRef.current <= DANGER_LINE_PX) {
        setIsGameOver(true);
        return;
      }
      if (towerContainerRef.current) {
        towerContainerRef.current.style.transform = `translate3d(0, ${-(platformYRef.current - cameraYRef.current)}px, 0)`;
      }
      sinkRateRef.current += 0.3 * dt;
      requestAnimationFrame(tick);
    };
    lastUpdateRef.current = performance.now();
    const animId = requestAnimationFrame(tick);
    return () => { active = false; cancelAnimationFrame(animId); };
  }, [showStart, isGameOver, isOutOfHearts, containerHeight]);

  const handleChoice = (opt: any) => {
    if (isGameOver || showStart) return;
    if (opt.name === question.parable.name) {
      setScore(s => s + 20);
      setStreak(s => s + 1);
      const h = containerHeight * 0.20;
      towerHeightRef.current += h;
      setTowerData(prev => ({
        stack: [...prev.stack, { id: nextIdRef.current++, word: opt.name, height: h, color: '#8b5cf6' }]
      }));
      setQuestion(generateParableQuestion());
      lastTapTimeRef.current = Date.now();
    } else {
      setStreak(0);
      onMistake();
    }
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden flex flex-col">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500/50 z-20" style={{ bottom: DANGER_LINE_PX }} />
      </div>

      <div ref={towerContainerRef} className="absolute left-0 right-0 bottom-0 flex flex-col-reverse items-center transition-transform duration-75 ease-out will-change-transform">
        {towerData.stack.map((block) => (
          <TowerBlock key={block.id} {...block} />
        ))}
      </div>

      <div className="relative z-30 p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onExit} className="p-2 bg-white/10 rounded-xl text-white"><ArrowLeft /></button>
          <div className="text-white font-black text-2xl">SCORE: {score}</div>
          <div className="w-10" />
        </div>

        <AnimatePresence mode="wait">
          {showStart ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-violet-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl"><Sparkles size={48} /></div>
              <h2 className="text-4xl font-black text-white mb-4 italic tracking-tighter">PARABLE TOWER</h2>
              <p className="text-violet-200 mb-8 font-bold uppercase tracking-widest">Match parables to meanings!</p>
              <button onClick={() => setShowStart(false)} className="px-12 py-4 bg-violet-500 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform">START MISSION</button>
            </motion.div>
          ) : isGameOver ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <h2 className="text-6xl font-black text-white mb-4 italic tracking-tighter">TOWER FELL!</h2>
              <p className="text-violet-200 mb-8 text-xl font-bold">Final Score: {score}</p>
              <button onClick={() => onComplete(score)} className="px-12 py-4 bg-violet-500 text-white rounded-2xl font-black text-xl shadow-xl">COLLECT XP</button>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border-2 border-white/20 mb-8">
                <p className="text-violet-200 text-xs font-black uppercase tracking-widest mb-2">What is the meaning of...</p>
                <h3 className="text-2xl font-black text-white italic tracking-tight">{question.parable.name}</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 mt-auto mb-8">
                {question.options.map((opt, i) => (
                  <button key={i} onClick={() => handleChoice(opt)} className="w-full py-5 bg-white rounded-2xl font-black text-slate-900 shadow-xl active:scale-95 transition-transform hover:bg-violet-50">
                    {opt.meaning}
                  </button>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const MathTowerGame = ({ 
  onComplete, 
  onMistake, 
  onExit, 
  isOutOfHearts,
  volume,
  setVolume,
  isMusicEnabled,
  setIsMusicEnabled,
  selectedMusicStyle,
  setSelectedMusicStyle,
  musicStatus,
  setMusicStatus,
  setIsQuestionBankOpen,
  setBankStore
}: { 
  onComplete: (xp: number) => void, 
  onMistake: () => void, 
  onExit: () => void, 
  isOutOfHearts: boolean,
  volume: number,
  setVolume: (v: number) => void,
  isMusicEnabled: boolean,
  setIsMusicEnabled: (v: boolean) => void,
  selectedMusicStyle: string,
  setSelectedMusicStyle: (v: string) => void,
  musicStatus: string,
  setMusicStatus: (v: string) => void,
  setIsQuestionBankOpen: (v: boolean) => void,
  setBankStore: (store: string) => void
}) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showStart, setShowStart] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isRedAlert, setIsRedAlert] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isComboActive, setIsComboActive] = useState(false);
  const lastCorrectTimesRef = useRef<number[]>([]);

  const [problem, setProblem] = useState(() => generateMathProblem(0, 'medium'));
  const [towerData, setTowerData] = useState<{
    stack: {id: number, word: string, height: number, color: string, isPlatform?: boolean}[]
  }>({ 
    stack: [{ id: -1, word: "", height: 100, color: '#1e293b', isPlatform: true }] 
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const towerContainerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastUpdateRef = useRef(performance.now());
  const lastTapTimeRef = useRef(Date.now());
  const nextIdRef = useRef(0);
  
  const platformYRef = useRef(DANGER_LINE_PX);
  const towerHeightRef = useRef(100);
  const cameraYRef = useRef(0);
  const sinkRateRef = useRef(15);
  const isRedAlertRef = useRef(false);
  
  const [containerHeight, setContainerHeight] = useState(() => typeof window !== 'undefined' ? window.innerHeight : 800);
  const containerHeightRef = useRef(containerHeight);

  useEffect(() => {
    containerHeightRef.current = containerHeight;
  }, [containerHeight]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const heightPx = entry.contentRect.height;
        setContainerHeight(heightPx);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (containerHeight > 0) {
      const newHeight = containerHeight * 0.20;
      if (showStart) {
        towerHeightRef.current = newHeight;
        platformYRef.current = DANGER_LINE_PX;
        setTowerData({
          stack: [{ id: -1, word: "", height: newHeight, color: '#1e293b', isPlatform: true }]
        });
      }
    }
  }, [containerHeight, showStart]);

  useEffect(() => {
    if (showStart || isGameOver || isPaused || isOutOfHearts) return;
    
    let active = true;
    const tick = () => {
      if (!active) return;
      
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastUpdateRef.current) / 1000); 
      lastUpdateRef.current = now;

      platformYRef.current -= sinkRateRef.current * dt;
      
      const topOfTower = platformYRef.current + towerHeightRef.current;
      const targetCameraY = Math.max(0, topOfTower - containerHeightRef.current * 0.6); 
      
      if (targetCameraY > cameraYRef.current) {
        const followSpeed = 4.0; 
        cameraYRef.current += (targetCameraY - cameraYRef.current) * (1 - Math.exp(-followSpeed * dt));
      } else {
        const followSpeed = 0.05; 
        cameraYRef.current += (targetCameraY - cameraYRef.current) * (1 - Math.exp(-followSpeed * dt));
      }

      const visualTop = topOfTower - cameraYRef.current;
      if (visualTop > containerHeightRef.current * 0.85) {
        cameraYRef.current = topOfTower - containerHeightRef.current * 0.85;
      }

      const redAlertActive = visualTop < containerHeightRef.current * 0.25;

      if (visualTop <= DANGER_LINE_PX) {
        setIsGameOver(true);
        platformYRef.current = cameraYRef.current + DANGER_LINE_PX - towerHeightRef.current;
        return; 
      }

      if (Number.isFinite(platformYRef.current) && towerContainerRef.current) {
        const visualY = platformYRef.current - cameraYRef.current;
        towerContainerRef.current.style.transform = `translate3d(0, ${-visualY}px, 0)`;
      }

      if (redAlertActive !== isRedAlertRef.current) {
        isRedAlertRef.current = redAlertActive;
        setIsRedAlert(redAlertActive);
        
        if (towerContainerRef.current) {
          if (redAlertActive) {
            towerContainerRef.current.classList.add('red-alert-pulse');
          } else {
            towerContainerRef.current.classList.remove('red-alert-pulse');
          }
        }
      }

      sinkRateRef.current += 0.5 * dt; 

      requestAnimationFrame(tick);
    };

    lastUpdateRef.current = performance.now();
    const animId = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(animId);
    };
  }, [showStart, isGameOver, isPaused, isOutOfHearts]);

  const playSound = useCallback((freq: number, type: OscillatorType, dur: number, vol: number = 0.2, noSweep: boolean = false) => {
    if (!audioCtxRef.current || isPaused || isOutOfHearts) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    if (!noSweep) {
      if (freq > 500) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, ctx.currentTime + dur);
      } else if (freq < 300 && freq > 0) {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, ctx.currentTime + dur);
      }
    }

    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(vol * volume, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    
    osc.connect(g);
    g.connect(ctx.destination); 
    
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }, [volume, isPaused, isOutOfHearts]);

  const playCorrectSound = useCallback(() => {
    playSound(880, 'sine', 0.15, 0.2, false);
    setTimeout(() => playSound(1320, 'sine', 0.2, 0.15, false), 50);
  }, [playSound]);

  const playIncorrectSound = useCallback(() => {
    playSound(180, 'triangle', 0.3, 0.4, false);
  }, [playSound]);

  const OP_COLORS = {
    addition: '#3b82f6', // blue
    subtraction: '#f59e0b', // orange
    multiplication: '#f43f5e', // red
    division: '#10b981', // emerald
  };

  const handleChoice = (eq: MathEquation) => {
    if (isGameOver || showStart || isPaused || isOutOfHearts) return;
    const now = Date.now();
    const timeDelta = now - lastTapTimeRef.current;

    if (eq.isCorrect) {
      lastTapTimeRef.current = now;
      playCorrectSound();
      
      const currentTime = Date.now();
      lastCorrectTimesRef.current = [...lastCorrectTimesRef.current, currentTime].filter(t => currentTime - t < 10000);
      
      const isCombo = lastCorrectTimesRef.current.length >= 5;
      setIsComboActive(isCombo);
      
      const basePoints = 10;
      const speedBonus = Math.max(0, 20 - Math.floor(timeDelta / 200)); 
      const points = basePoints + speedBonus;
      
      setScore(s => s + points);
      setStreak(s => s + 1);
      
      const h = containerHeight * 0.20;
      towerHeightRef.current += h;
      setTowerData(prev => ({
        stack: [...prev.stack, { id: nextIdRef.current++, word: eq.text, height: h, color: OP_COLORS[eq.type] }]
      }));
      
      setProblem(generateMathProblem(score + points, difficulty));
    } else {
      playIncorrectSound();
      setStreak(0);
      setLives(l => Math.max(0, l - 1));
      onMistake();
      if (lives <= 1) {
        setIsGameOver(true);
      } else {
        setProblem(generateMathProblem(score, difficulty));
      }
    }
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden flex flex-col bg-slate-950">
      <MathHUD 
        score={score} 
        streak={streak} 
        lives={lives} 
        isPaused={isPaused} 
        setIsPaused={setIsPaused}
        lastUpdateRef={lastUpdateRef}
        setIsSettingsOpen={setIsSettingsOpen}
      />

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500/50 z-20" style={{ bottom: DANGER_LINE_PX }} />
        </div>

        <div ref={towerContainerRef} className="absolute left-0 right-0 bottom-0 flex flex-col-reverse items-center transition-transform duration-75 ease-out will-change-transform">
          {towerData.stack.map((block) => (
            <TowerBlock key={block.id} {...block} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {showStart ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6 text-center">
              <div className="w-24 h-24 bg-blue-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl"><Trophy size={48} /></div>
              <h2 className="text-4xl font-black text-white mb-4 italic tracking-tighter">MATH TOWER</h2>
              <p className="text-blue-200 mb-8 font-bold uppercase tracking-widest">Solve equations to build!</p>
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {(['easy', 'medium', 'hard', 'advanced', 'master', 'extreme'] as Difficulty[]).map(d => (
                  <button key={d} onClick={() => setDifficulty(d)} className={cn("px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all", difficulty === d ? "bg-blue-500 text-white shadow-lg scale-110" : "bg-white/5 text-white/40 hover:bg-white/10")}>{d}</button>
                ))}
              </div>
              <button onClick={() => setShowStart(false)} className="px-12 py-4 bg-blue-500 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform">START MISSION</button>
            </motion.div>
          ) : isGameOver ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center">
              <h2 className="text-6xl font-black text-white mb-4 italic tracking-tighter">TOWER FELL!</h2>
              <p className="text-blue-200 mb-8 text-xl font-bold">Final Score: {score}</p>
              <div className="flex gap-4">
                <button onClick={() => {
                  setScore(0);
                  setLives(3);
                  setIsGameOver(false);
                  setShowStart(true);
                  setProblem(generateMathProblem(0, difficulty));
                }} className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black text-lg">RETRY</button>
                <button onClick={() => onComplete(score)} className="px-12 py-4 bg-blue-500 text-white rounded-2xl font-black text-xl shadow-xl">COLLECT XP</button>
              </div>
            </motion.div>
          ) : (
            <div className="absolute inset-0 z-30 flex flex-col p-6">
              <div className="mt-auto grid grid-cols-2 gap-3 mb-8">
                {problem.options.map((opt, i) => (
                  <button key={i} onClick={() => handleChoice(opt)} className="w-full py-8 bg-white rounded-2xl font-black text-4xl text-slate-900 shadow-xl active:scale-95 transition-transform hover:bg-blue-50">
                    {opt.text.split('=')[1].trim()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
