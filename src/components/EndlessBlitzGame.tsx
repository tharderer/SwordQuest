import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  ArrowLeft, 
  Plus, 
  HelpCircle, 
  Sparkles, 
  Music, 
  Volume2, 
  VolumeX, 
  ChevronRight,
  X,
  CheckCircle2,
  Zap,
  Rocket,
  Star,
  Shuffle,
  LayoutGrid,
  Timer
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Verse, Difficulty, UserProgress } from '../types';
import { 
  recordVerseSeen, 
  getLearningVerses, 
  getVerseLevel, 
  promoteVerse,
  getProgress,
  getNextEndlessVerse
} from '../lib/storage';
import { dictionaryService } from '../lib/dictionary';
import { Background } from './Background';
import { SettingsOverlay } from './SettingsOverlay';
import { HUD, TowerStack } from './TriviaTowerComponents';

const DANGER_LINE_PX = 8;
const ENGLISH_FREQUENCIES = "EEEEEEEEEEEEETTTTTTTTTTAAAAAAAAAOOOOOOOIIIIIIINNNNNNNSSSSSSRRRRRRHHHHHHLLLLDDDDCCCCUUUUMMMMWWWYYYFFGGPPBBVKXJQZ";

const getLevelConfig = (level: number): { mode: 'classic' | 'reference', difficulty: Difficulty } => {
  switch (level) {
    case 1: return { mode: 'classic', difficulty: 'easy' };
    case 2: return { mode: 'classic', difficulty: 'medium' };
    case 3: return { mode: 'classic', difficulty: 'advanced' };
    case 4: return { mode: 'classic', difficulty: 'master' };
    case 5: return { mode: 'reference', difficulty: 'easy' };
    default: return { mode: 'classic', difficulty: 'easy' };
  }
};

const getNextVerseKey = (allVerses: Verse[], playedMastered: string[]): string => {
  const progress = getProgress();
  const learning = getLearningVerses(allVerses);
  
  // 1. Try to find a learning verse that hasn't been played this session
  const unplayedLearning = learning.filter(key => !playedMastered.includes(key));
  if (unplayedLearning.length > 0) return unplayedLearning[0];
  
  // 2. If all learning played, try to find a mastered verse that hasn't been played this session
  const mastered = Object.keys(progress.verseMastery).filter(key => progress.verseMastery[key].status === 'supernova');
  const unplayedMastered = mastered.filter(key => !playedMastered.includes(key));
  if (unplayedMastered.length > 0) return unplayedMastered[Math.floor(Math.random() * unplayedMastered.length)];
  
  // 3. Fallback to any verse
  return learning[0] || `${allVerses[0].book} ${allVerses[0].chapter}:${allVerses[0].verse}`;
};

export const ReferenceGameUI = memo(({
  availableChunks,
  placedChunks,
  handleChunkTap,
  handlePlacedChunkTap,
  handleClearAll,
  handleShuffle,
  handleSubmit,
  handleReorder,
  isCorrect,
  wordAreaRectRef,
  bonusWordsFoundCount,
  currentVerse
}: any) => {
  return (
    <div className="flex flex-col h-full p-2 sm:p-4 gap-2 sm:gap-4 relative overflow-hidden">
      {/* Target Word Display / Drop Zone */}
      <div 
        id="placed-chunks-container"
        className={cn(
          "flex-1 flex flex-wrap items-center justify-center gap-1 sm:gap-2 p-2 sm:p-4 rounded-2xl border-2 transition-all duration-300 min-h-[60px]",
          isCorrect ? "bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-white/5 border-white/10"
        )}
      >
        <Reorder.Group 
          axis="x" 
          values={placedChunks} 
          onReorder={handleReorder}
          className="flex flex-wrap items-center justify-center gap-1 sm:gap-2"
        >
          {placedChunks.map((chunk: any) => (
            <Reorder.Item
              key={chunk.id}
              value={chunk}
              onClick={() => handlePlacedChunkTap(chunk)}
              className="touch-none"
            >
              <motion.div
                layoutId={`chunk-${chunk.id}`}
                className="w-8 h-10 sm:w-12 sm:h-14 bg-white text-slate-900 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-lg sm:text-2xl shadow-lg cursor-pointer active:scale-95"
              >
                {chunk.text}
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
        
        {placedChunks.length === 0 && (
          <div className="text-white/20 font-black text-xs sm:text-sm uppercase tracking-widest animate-pulse">
            Spell the missing word
          </div>
        )}
      </div>

      {/* Available Chunks / Tray */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 px-2 sm:px-4">
        {availableChunks.map((chunk: any) => (
          <motion.button
            key={chunk.id}
            layoutId={`chunk-${chunk.id}`}
            onClick={() => !chunk.isUsed && handleChunkTap(chunk)}
            disabled={chunk.isUsed}
            className={cn(
              "w-8 h-10 sm:w-12 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-lg sm:text-2xl shadow-md transition-all active:scale-90",
              chunk.isUsed 
                ? "bg-white/5 text-transparent border border-white/5 shadow-none" 
                : "bg-slate-800 text-white border border-white/10 hover:bg-slate-700"
            )}
          >
            {!chunk.isUsed && chunk.text}
          </motion.button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-2 sm:px-4">
        <div className="flex gap-2">
          <button 
            onClick={handleShuffle}
            className="p-2 sm:p-3 bg-white/5 text-white/60 rounded-xl hover:bg-white/10 hover:text-white transition-all active:scale-90"
          >
            <Shuffle size={18} />
          </button>
          <button 
            onClick={handleClearAll}
            className="p-2 sm:p-3 bg-white/5 text-white/60 rounded-xl hover:bg-white/10 hover:text-white transition-all active:scale-90"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {bonusWordsFoundCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-amber-500/30">
              <Sparkles size={12} className="text-amber-400" />
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-tighter">Bonus: {bonusWordsFoundCount}/10</span>
            </div>
          )}
          
          <button 
            onClick={handleSubmit}
            className={cn(
              "px-6 sm:px-10 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg tracking-widest transition-all active:scale-95 shadow-xl",
              isCorrect 
                ? "bg-emerald-500 text-white" 
                : placedChunks.length >= 4 
                  ? "bg-blue-500 text-white" 
                  : "bg-white/5 text-white/20 cursor-not-allowed"
            )}
          >
            {isCorrect ? 'PERFECT!' : 'SUBMIT'}
          </button>
        </div>
      </div>
    </div>
  );
});

export const ChoiceGameUI = memo(({ options, isAskingReference, currentVerse, words, currentIndex, difficulty, handleChoice }: any) => {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 p-2 sm:p-4 h-full">
      {options.map((option: string, i: number) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => handleChoice(option)}
          className={cn(
            "relative group overflow-hidden rounded-xl sm:rounded-2xl border-2 transition-all active:scale-95 flex items-center justify-center p-2 sm:p-4",
            "bg-slate-900/40 border-white/10 hover:bg-slate-800/60 hover:border-white/20 shadow-lg"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className={cn(
            "font-black tracking-tight leading-tight uppercase text-center",
            isAskingReference ? "text-xs sm:text-lg text-blue-300" : "text-sm sm:text-2xl text-white"
          )}>
            {option}
          </span>
          {difficulty === 'master' && !isAskingReference && (
            <div className="absolute top-1 left-2 text-[8px] font-black text-white/20 uppercase tracking-widest">
              {option[0]}
            </div>
          )}
        </motion.button>
      ))}
    </div>
  );
});

export const EndlessBlitzGame = ({ 
  allVerses, 
  onComplete, 
  onMistake, 
  onExit,
  volume,
  setVolume,
  isMusicEnabled,
  setIsMusicEnabled,
  musicStatus,
  setMusicStatus,
  setIsQuestionBankOpen,
  setBankStore
}: { 
  allVerses: Verse[], 
  onComplete: (xp: number) => void, 
  onMistake: () => void, 
  onExit: () => void,
  volume: number,
  setVolume: (v: number) => void,
  isMusicEnabled: boolean,
  setIsMusicEnabled: (v: boolean) => void,
  musicStatus: string,
  setMusicStatus: (v: string) => void,
  setIsQuestionBankOpen: (v: boolean) => void,
  setBankStore: (store: string) => void
}) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [gameMode, setGameMode] = useState<'classic' | 'reference'>('classic');
  const [userInput, setUserInput] = useState('');
  const [sessionMasteredKeys, setSessionMasteredKeys] = useState<string[]>([]);
  const [currentVerse, setCurrentVerse] = useState<Verse>(() => getNextEndlessVerse(allVerses, []));
  const words = useMemo(() => {
    const cleanText = currentVerse.text
      .replace(/\{[^{}]*:[^{}]*\}/g, '')
      .replace(/[\{\}\[\]\(\)]/g, '')
      .replace(/[^\w\s]|_/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return cleanText.split(/\s+/).filter(Boolean);
  }, [currentVerse]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isAskingReference = currentIndex >= words.length;
  
  const options = useMemo(() => {
    if (!isAskingReference) {
      const correct = words[currentIndex];
      
      if (difficulty === 'master') {
        const correctFirstLetter = correct[0].toLowerCase();
        const usedLetters = new Set([correctFirstLetter]);
        const finalDistractors: string[] = [];
        
        const verseDistractors = words
          .filter(w => w.toLowerCase() !== correct.toLowerCase())
          .sort(() => Math.random() - 0.5);
          
        for (const w of verseDistractors) {
          const firstLetter = w[0].toLowerCase();
          if (!usedLetters.has(firstLetter)) {
            finalDistractors.push(w);
            usedLetters.add(firstLetter);
            if (finalDistractors.length === 3) break;
          }
        }
        
        const fallbacks = ["Faith", "Grace", "Love", "Peace", "Hope", "Joy", "Kindness", "Mercy", "Truth", "Wisdom", "Strength", "Patience", "Christ", "Spirit", "Holy", "Lord", "God", "Bible"];
        const shuffledFallbacks = [...fallbacks].sort(() => Math.random() - 0.5);
        
        for (const w of shuffledFallbacks) {
          if (finalDistractors.length === 3) break;
          const firstLetter = w[0].toLowerCase();
          if (!usedLetters.has(firstLetter)) {
            finalDistractors.push(w);
            usedLetters.add(firstLetter);
          }
        }
        
        return [correct, ...finalDistractors].sort(() => Math.random() - 0.5);
      }

      const distractors = words
        .filter(w => w.toLowerCase() !== correct.toLowerCase())
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      const finalDistractors = [...distractors];
      const fallbackPool = ["Faith", "Grace", "Love", "Peace", "Hope"];
      while (finalDistractors.length < 3) {
        const randomFallback = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
        if (!finalDistractors.includes(randomFallback)) {
          finalDistractors.push(randomFallback);
        } else {
          finalDistractors.push(randomFallback + " "); 
        }
      }

      return [correct, ...finalDistractors].sort(() => Math.random() - 0.5);
    } else {
      const correct = `${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`;
      const distractors = allVerses
        .filter(v => `${v.book} ${v.chapter}:${v.verse}` !== correct)
        .map(v => `${v.book} ${v.chapter}:${v.verse}`)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      const finalDistractors = [...distractors];
      const fallbackPool = ["Genesis 1:1", "John 3:16", "Psalm 23:1", "Psalm 119:105", "Proverbs 3:5"];
      while (finalDistractors.length < 3) {
        const randomFallback = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
        if (!finalDistractors.includes(randomFallback)) {
          finalDistractors.push(randomFallback);
        } else {
          finalDistractors.push(randomFallback + " ");
        }
      }

      return [correct, ...finalDistractors].sort(() => Math.random() - 0.5);
    }
  }, [currentIndex, words, allVerses, currentVerse, isAskingReference, difficulty]);

  const [mistakesInVerse, setMistakesInVerse] = useState(0);
  const [availableChunks, setAvailableChunks] = useState<{id: number, text: string, trayIndex?: number}[]>([]);
  const [placedChunks, setPlacedChunks] = useState<{id: number, text: string, trayIndex?: number}[]>([]);
  const wordAreaRectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const updateRect = () => {
      const container = document.getElementById('placed-chunks-container');
      if (container) {
        wordAreaRectRef.current = container.getBoundingClientRect();
      }
    };
    const timer = setTimeout(updateRect, 500);
    window.addEventListener('resize', updateRect);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
    };
  }, [gameMode, isAskingReference, availableChunks.length, placedChunks.length]);

  const [showSupernova, setShowSupernova] = useState(false);
  
  const [towerData, setTowerData] = useState<{
    stack: {id: number, word: string, height: number, color: string, isPlatform?: boolean}[]
  }>({ 
    stack: [{ id: -1, word: "", height: 100, color: '#1e293b', isPlatform: true }] 
  });

  const towerContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showStart, setShowStart] = useState(true);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRedAlert, setIsRedAlert] = useState(false);
  const isRedAlertRef = useRef(false);
  const sinkRateRef = useRef(8);
  const containerHeightRef = useRef(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [containerHeight, setContainerHeight] = useState(() => typeof window !== 'undefined' ? window.innerHeight : 800); 
  useEffect(() => {
    containerHeightRef.current = containerHeight;
  }, [containerHeight]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [timesSeen, setTimesSeen] = useState(0);
  const [totalNotesPlayed, setTotalNotesPlayed] = useState(0);
  const [bonusWordsFoundCount, setBonusWordsFoundCount] = useState(0);
  const [dictStatus, setDictStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setDictStatus('loading');
    dictionaryService.init()
      .then(() => setDictStatus('ready'))
      .catch(err => {
        console.error('Dictionary init failed:', err);
        setDictStatus('error');
      });
  }, []);
  
  const lastUpdateRef = useRef(Date.now());
  const lastTapTimeRef = useRef(Date.now());
  const nextIdRef = useRef(0);
  const towerHeightRef = useRef(100); 
  const platformYRef = useRef(DANGER_LINE_PX); 
  const cameraYRef = useRef(0);
  const stackRef = useRef(towerData.stack);
  useEffect(() => {
    stackRef.current = towerData.stack;
  }, [towerData.stack]);

  const [platformHeight, setPlatformHeight] = useState(100); 

  useEffect(() => {
    if (containerHeight > 0) {
      const newHeight = containerHeight * 0.20;
      setPlatformHeight(newHeight);
      if (showStart) {
        towerHeightRef.current = newHeight;
        platformYRef.current = DANGER_LINE_PX;
        setTowerData(prev => ({
          stack: [{ id: -1, word: "", height: newHeight, color: '#1e293b', isPlatform: true }]
        }));
      }
    }
  }, [containerHeight, showStart]);

  useEffect(() => {
    if (gameMode === 'reference' && !isAskingReference && !isPaused && !isGameOver && !showTutorial && !showStart) {
      inputRef.current?.focus();
    }
  }, [gameMode, currentIndex, isAskingReference, isPaused, isGameOver, showTutorial, showStart]);

  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

  useEffect(() => {
    const verseKey = `${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`;
    const updatedProgress = recordVerseSeen(verseKey);
    const count = updatedProgress.verseMastery[verseKey]?.timesSeen || 0;
    setTimesSeen(count);
  }, [currentVerse]);

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
    if (showStart || isGameOver || showTutorial || isPaused) return;
    
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

      sinkRateRef.current += 0.05 * dt; 

      requestAnimationFrame(tick);
    };

    lastUpdateRef.current = performance.now();
    const animId = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(animId);
    };
  }, [showStart, isGameOver, showTutorial, isPaused]);

  const playSound = useCallback((freq: number, type: OscillatorType, dur: number, vol: number = 0.2, noSweep: boolean = false) => {
    if (!audioCtxRef.current || isPaused) return;
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
  }, [volume, isPaused]);

  const playCorrectSound = useCallback(() => {
    playSound(880, 'sine', 0.15, 0.2, false);
    setTimeout(() => playSound(1320, 'sine', 0.2, 0.15, false), 50);
  }, [playSound]);

  const playIncorrectSound = useCallback(() => {
    playSound(180, 'triangle', 0.3, 0.4, false);
  }, [playSound]);

  const playMelodyNote = useCallback((word: string, globalIndex: number) => {
    playCorrectSound();
  }, [playCorrectSound]);

  const completeVerse = useCallback((choice: string, timeDelta: number) => {
    const correctRef = `${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`;
    
    playSound(880, 'sine', 0.2, 0.2);
    setTimeout(() => playSound(1100, 'sine', 0.2, 0.2), 100);
    
    const verseKey = `${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`;
    
    promoteVerse(verseKey);
    
    const currentProgress = getProgress();
    const updatedPlayedMastered = [...sessionMasteredKeys];
    if (currentProgress.masteredVerses.includes(verseKey)) {
      if (!updatedPlayedMastered.includes(verseKey)) {
        updatedPlayedMastered.push(verseKey);
      }
      setSessionMasteredKeys(updatedPlayedMastered);
    }
    
    const nextVerseKey = getNextVerseKey(allVerses, updatedPlayedMastered);
    const nextVerse = allVerses.find(v => `${v.book} ${v.chapter}:${v.verse}` === nextVerseKey) || allVerses[0];
    
    const nextLevel = getVerseLevel(nextVerseKey);
    const config = getLevelConfig(nextLevel);
    setGameMode(config.mode);
    setDifficulty(config.difficulty);

    setCurrentVerse(nextVerse);
    setCurrentIndex(0);
    setMistakesInVerse(0);
    setUserInput('');
    
    const newStreak = streak + 1;
    setStreak(newStreak);
    setScore(prev => prev + 1); 
    
    setConsecutiveCorrect(prev => prev + 1);
    
    const height = containerHeight * 0.20; 
    towerHeightRef.current += height;
    
    setTowerData(prev => {
      const newStack = [
        ...prev.stack,
        {
          id: nextIdRef.current++,
          word: "✓ " + correctRef,
          height,
          color: '#fbbf24'
        }
      ];
      return { stack: newStack };
    });
  }, [currentVerse, allVerses, streak, containerHeight, volume, isPaused, sessionMasteredKeys, playSound]);

  const handleChoice = useCallback((choice: string) => {
    if (isGameOver || showTutorial || isPaused) return;
    const now = Date.now();
    const timeDelta = now - lastTapTimeRef.current;

    if (isAskingReference) {
      const correctRef = `${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`;
      if (choice === correctRef) {
        lastTapTimeRef.current = now;
        completeVerse(choice, timeDelta);
      } else {
        playIncorrectSound();
        setStreak(0);
        setConsecutiveCorrect(0);
        setMistakesInVerse(prev => prev + 1);
        
        if (towerContainerRef.current) {
          towerContainerRef.current.classList.add('animate-shake');
          setTimeout(() => {
            towerContainerRef.current?.classList.remove('animate-shake');
          }, 500);
        }
      }
      return;
    }

    if (choice === words[currentIndex]) {
      lastTapTimeRef.current = now;
      playMelodyNote(words[currentIndex], totalNotesPlayed);
      setTotalNotesPlayed(prev => prev + 1);
      const word = words[currentIndex];
      
      const height = containerHeight * 0.20; 
      towerHeightRef.current += height;
      
      setTowerData(prev => {
        const newStack = [
          ...prev.stack, 
          { 
            id: nextIdRef.current++, 
            word, 
            height,
            color: colors[score % colors.length]
          }
        ];
        return { stack: newStack };
      });
      
      const nextIdx = currentIndex + 1;
      if (gameMode === 'reference' && nextIdx >= words.length) {
        completeVerse(words[currentIndex], timeDelta);
      } else {
        setCurrentIndex(nextIdx);
        
        const newStreak = streak + 1;
        setStreak(newStreak);
        setScore(prev => prev + 1); 

        setConsecutiveCorrect(prev => prev + 1);
      }
    } else {
      playIncorrectSound();
      setStreak(0);
      setConsecutiveCorrect(0);
      setMistakesInVerse(prev => prev + 1);
      
      if (towerContainerRef.current) {
        towerContainerRef.current.classList.add('animate-shake');
        setTimeout(() => {
          towerContainerRef.current?.classList.remove('animate-shake');
        }, 500);
      }
    }
  }, [isGameOver, showTutorial, isPaused, isAskingReference, currentVerse, completeVerse, words, currentIndex, totalNotesPlayed, score, streak, consecutiveCorrect, gameMode, playIncorrectSound, playMelodyNote, containerHeight, colors]);

  const generateTray = useCallback((targetWord: string) => {
    const word = targetWord.toUpperCase();
    let chunks: { id: number, text: string }[] = [];
    
    if (word.length > 7) {
      for (let i = 0; i < word.length; i += 3) {
        chunks.push({
          id: i,
          text: word.substring(i, i + 3)
        });
      }
    } else {
      chunks = word.split('').map((char, i) => ({ id: i, text: char }));
      
      let nextId = Date.now();
      while (chunks.length < 7) {
        const randomChar = ENGLISH_FREQUENCIES[Math.floor(Math.random() * ENGLISH_FREQUENCIES.length)];
        chunks.push({ id: nextId++, text: randomChar });
      }
    }
    
    return chunks.sort(() => Math.random() - 0.5).map((c, i) => ({ ...c, trayIndex: i, isUsed: false }));
  }, []);

  useEffect(() => {
    if (gameMode === 'reference' && !isAskingReference) {
      solvedWordRef.current = null;
      const tray = generateTray(words[currentIndex]);
      setAvailableChunks(tray);
      setPlacedChunks([]);
      setBonusWordsFoundCount(0);
    }
  }, [currentIndex, currentVerse, gameMode, isAskingReference, words, generateTray]);

  const solvedWordRef = useRef<string | null>(null);

  const handleChunkTap = useCallback((chunkObj: {id: number, text: string, trayIndex?: number}, index?: number) => {
    if (isGameOver || isPaused || showStart) return;
    
    setAvailableChunks(prev => prev.map(c => c.id === chunkObj.id ? { ...c, isUsed: true } : c));
    setPlacedChunks(prev => {
      const next = [...prev];
      if (typeof index === 'number') {
        next.splice(index, 0, chunkObj);
      } else {
        next.push(chunkObj);
      }
      playSound(440 + next.length * 40, 'sine', 0.1, 0.1);
      return next;
    });
  }, [isGameOver, isPaused, showStart, playSound]);

  const isCorrect = useMemo(() => {
    if (gameMode !== 'reference' || isAskingReference) return false;
    const targetWord = words[currentIndex].toUpperCase();
    const currentText = placedChunks.map(c => c.text).join('');
    return currentText === targetWord;
  }, [placedChunks, currentIndex, words, gameMode, isAskingReference]);

  const handleSubmit = useCallback(async () => {
    const currentText = placedChunks.map(c => c.text).join('');
    const targetWord = words[currentIndex].toUpperCase();

    if (isCorrect && solvedWordRef.current !== targetWord) {
      solvedWordRef.current = targetWord;
      handleChoice(words[currentIndex]);
    } else if (currentText.length >= 4) {
      const isValid = await dictionaryService.isValidWord(currentText);
      if (isValid) {
        const now = Date.now();
        const timeDelta = now - lastTapTimeRef.current;
        lastTapTimeRef.current = now;

        playSound(660, 'sine', 0.2, 0.2);
        setTimeout(() => playSound(880, 'sine', 0.2, 0.2), 100);
        
        const height = containerHeight * 0.20; 
        towerHeightRef.current += height;
        
        setTowerData(prev => ({
          ...prev,
          stack: [...prev.stack, {
            id: Date.now(),
            word: currentText,
            height,
            color: '#f59e0b',
          }]
        }));
        
        setScore(prev => prev + 1);

        const newBonusCount = bonusWordsFoundCount + 1;
        if (newBonusCount >= 10) {
          solvedWordRef.current = targetWord;
          handleChoice(words[currentIndex]);
          setBonusWordsFoundCount(0);
        } else {
          setBonusWordsFoundCount(newBonusCount);
          const newTray = generateTray(targetWord);
          setAvailableChunks(newTray);
          setPlacedChunks([]);
        }
      } else {
        if (towerContainerRef.current) {
          towerContainerRef.current.classList.add('animate-shake');
          setTimeout(() => {
            towerContainerRef.current?.classList.remove('animate-shake');
          }, 500);
        }
        playSound(150, 'sawtooth', 0.2, 0.1);
      }
    } else if (placedChunks.length > 0) {
      if (towerContainerRef.current) {
        towerContainerRef.current.classList.add('animate-shake');
        setTimeout(() => {
          towerContainerRef.current?.classList.remove('animate-shake');
        }, 500);
      }
      playSound(150, 'sawtooth', 0.2, 0.1);
    }
  }, [isCorrect, words, currentIndex, handleChoice, placedChunks, bonusWordsFoundCount, generateTray, playSound, containerHeight]);

  const handlePlacedChunkTap = useCallback((chunkObj: {id: number, text: string, trayIndex?: number}) => {
    if (isGameOver || isPaused || showStart) return;
    
    setPlacedChunks(prev => prev.filter(c => c.id !== chunkObj.id));
    setAvailableChunks(prev => prev.map(c => c.id === chunkObj.id ? { ...c, isUsed: false } : c));
    playSound(330, 'sine', 0.1, 0.1);
  }, [isGameOver, isPaused, showStart, playSound]);

  const handleClearAll = useCallback(() => {
    if (placedChunks.length === 0) return;
    setAvailableChunks(prev => prev.map(c => ({ ...c, isUsed: false })));
    setPlacedChunks([]);
    playSound(220, 'sine', 0.1, 0.1);
  }, [placedChunks, playSound]);

  const handleShuffle = useCallback(() => {
    if (placedChunks.length > 0) return;
    setAvailableChunks(prev => [...prev].sort(() => Math.random() - 0.5));
    playSound(220, 'sine', 0.1, 0.1);
  }, [placedChunks.length, playSound]);

  const handleReorder = useCallback((newOrder: {id: number, text: string, trayIndex?: number}[]) => {
    setPlacedChunks(newOrder);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameMode !== 'reference' || isAskingReference || isGameOver || isPaused || showTutorial || showStart) return;
      
      const char = e.key.toUpperCase();
      if (/^[A-Z]$/.test(char)) {
        const availableChunk = availableChunks.find(c => c.text === char && !c.isUsed);
        if (availableChunk) {
          handleChunkTap(availableChunk);
        } else {
          playIncorrectSound();
        }
      } else if (e.key === 'Backspace') {
        if (placedChunks.length > 0) {
          handlePlacedChunkTap(placedChunks[placedChunks.length - 1]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode, isAskingReference, isGameOver, isPaused, showTutorial, showStart, availableChunks, placedChunks, handleChunkTap, handlePlacedChunkTap, playIncorrectSound]);

  const startLaunch = () => {
    if (dontShowAgain) {
      localStorage.setItem('endless_tutorial_dismissed', 'true');
    }
    setShowTutorial(false);
    lastTapTimeRef.current = Date.now();
    lastUpdateRef.current = performance.now();
  };

  const handleIgnite = () => {
    if (containerHeight <= 0) return; 
    
    setScore(0);
    setStreak(0);
    setConsecutiveCorrect(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsRedAlert(false);
    isRedAlertRef.current = false;
    setCurrentIndex(0);
    setMistakesInVerse(0);
    setShowStart(false);
    
    const learning = getLearningVerses(allVerses);
    const firstVerseKey = learning[0];
    const firstVerse = allVerses.find(v => `${v.book} ${v.chapter}:${v.verse}` === firstVerseKey) || allVerses[0];
    setCurrentVerse(firstVerse);
    
    const level = getVerseLevel(firstVerseKey);
    const config = getLevelConfig(level);
    setGameMode(config.mode);
    setDifficulty(config.difficulty);

    const startHeight = containerHeight * 0.20;
    
    platformYRef.current = DANGER_LINE_PX;
    cameraYRef.current = 0;
    towerHeightRef.current = startHeight;
    
    if (difficulty === 'extreme') sinkRateRef.current = 25;
    else if (difficulty === 'master') sinkRateRef.current = 20;
    else if (difficulty === 'advanced') sinkRateRef.current = 15;
    else if (difficulty === 'hard') sinkRateRef.current = 12;
    else if (difficulty === 'medium') sinkRateRef.current = 8;
    else sinkRateRef.current = 5;

    nextIdRef.current = 0;
    lastUpdateRef.current = performance.now();
    lastTapTimeRef.current = Date.now();
    
    setTowerData({
      stack: [{ id: -1, word: "", height: startHeight, color: '#1e293b', isPlatform: true }]
    });

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    
    setShowStart(false);
  };

  const masteredKeys = useMemo(() => {
    const progress = getProgress();
    return Object.keys(progress.verseMastery || {})
      .filter(key => progress.verseMastery[key].status === 'supernova');
  }, []);

  const currentProgress = useMemo(() => {
    const p = getProgress();
    return { verseMastery: p.verseMastery };
  }, []);

  if (showStart) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 bg-slate-950 text-white overflow-y-auto custom-scrollbar">
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: Math.random() * 3 + 2, delay: Math.random() * 2 }}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
            />
          ))}
        </div>

        <button 
          onClick={onExit}
          className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors z-50"
        >
          <X size={28} />
        </button>

        <div className="text-center z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-24 h-24 mx-auto mb-4"
          >
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
            <Rocket size={60} className="text-blue-400 absolute inset-0 m-auto animate-bounce" />
            <Star size={30} className="text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
          </motion.div>
          
          <h3 className="text-3xl font-black mb-2 tracking-tighter italic">STAR TOWER</h3>
          
          <div className="space-y-2 max-w-[280px] mx-auto mb-6">
            <p className="text-blue-200/60 text-xs font-medium leading-relaxed">
              Build your <span className="text-white font-bold">Constellation of Verses</span> by stacking the Word.
            </p>
          </div>
        </div>

        <button 
          onClick={handleIgnite}
          className="relative group z-10"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative px-12 py-4 bg-slate-900 border border-white/10 rounded-2xl font-black text-lg tracking-widest text-white shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
            IGNITE MISSION <ChevronRight size={20} className="text-blue-400" />
          </div>
        </button>
      </div>
    );
  }

  if (showTutorial) {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-8 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl text-white custom-scrollbar"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center">
              <Zap size={32} className="text-blue-400" />
            </div>
          </div>
          
          <h3 className="text-2xl font-black text-center mb-6 tracking-tight uppercase">Mission Briefing</h3>
          
          <div className="space-y-6 mb-8">
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-blue-400 font-bold">1</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-bold">Speed = Height.</span> Tapping words instantly creates massive blocks. Hesitating creates thin ones.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-rose-400 font-bold">2</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-bold">Stay Above the Line.</span> The tower is sinking. If the <span className="text-rose-400 font-bold underline">TOP</span> of your stack falls below the red laser, you collapse.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-yellow-400 font-bold">3</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-bold">No Hints.</span> Use your memory to build the tower. Every word counts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6 px-2">
            <button 
              onClick={() => setDontShowAgain(!dontShowAgain)}
              className={cn(
                "w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center",
                dontShowAgain ? "bg-blue-500 border-blue-500" : "border-slate-700 bg-slate-800"
              )}
            >
              {dontShowAgain && <CheckCircle2 size={16} className="text-white" />}
            </button>
            <span className="text-xs text-slate-400 font-medium">Don't show this again</span>
          </div>

          <button 
            onClick={startLaunch}
            className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
          >
            I'M READY
          </button>
        </motion.div>
      </div>
    );
  }

  if (isGameOver) {
    const xpMultiplier = difficulty === 'extreme' ? 4 : difficulty === 'master' ? 3 : difficulty === 'advanced' ? 2 : difficulty === 'hard' ? 1.75 : difficulty === 'medium' ? 1.5 : 1;
    const finalXP = Math.round(score * xpMultiplier);

    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-6 bg-slate-950 rounded-3xl shadow-xl border-2 border-slate-800 h-full text-white overflow-y-auto">
        <div className="text-center w-full">
          <h3 className="text-4xl font-black text-rose-500 mb-4 italic tracking-tighter">COLLAPSED</h3>
          
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 mb-6 text-left">
            <p className="text-rose-500 font-black text-[10px] uppercase tracking-widest mb-2">Final Verse</p>
            <p className="text-lg font-bold leading-tight mb-2 italic">"{currentVerse.text.replace(/\{[^{}]*:[^{}]*\}/g, "").replace(/[^\w\s]|_/g, "").replace(/[\{\}\[\]\(\)]/g, "").replace(/\s+/g, " ").trim()}"</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              — {`${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`}
            </p>
          </div>

          <div className="flex justify-around items-center mb-6">
            <div className="text-center">
              <div className="text-5xl font-black text-white tracking-tighter">{score}</div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.1em] text-[10px]">Words Stacked</p>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-5xl font-black text-blue-400 tracking-tighter">+{finalXP}</div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.1em] text-[10px]">XP Earned</p>
            </div>
          </div>

          <div className="bg-blue-600/20 border border-blue-500/30 px-4 py-2 rounded-xl inline-block mb-6">
            <span className="text-blue-400/60 text-[10px] block uppercase tracking-widest font-bold">{difficulty} Multiplier</span>
          </div>
        </div>
        <button 
          onClick={() => onComplete(finalXP)}
          className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
        >
          COLLECT XP
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col transition-transform duration-75 h-full overflow-hidden">
      <Background masteredKeys={masteredKeys} progress={currentProgress} />

      <HUD 
        score={score}
        streak={streak}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        lastUpdateRef={lastUpdateRef}
        gameMode={gameMode}
        dictStatus={dictStatus}
        currentVerse={currentVerse}
        setIsSettingsOpen={setIsSettingsOpen}
      />

      <SettingsOverlay 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        volume={volume}
        setVolume={setVolume}
        isMusicEnabled={isMusicEnabled}
        setIsMusicEnabled={setIsMusicEnabled}
        musicStatus={musicStatus}
        onOpenBank={() => {
          setBankStore('jeopardy');
          setIsQuestionBankOpen(true);
          setIsSettingsOpen(false);
        }}
        onOpenWitsBank={() => {
          setBankStore('wits');
          setIsQuestionBankOpen(true);
          setIsSettingsOpen(false);
        }}
      />

      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <AnimatePresence>
          {isPaused && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="text-center">
                <h2 className="text-5xl font-black text-white mb-8 tracking-tighter italic">PAUSED</h2>
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => {
                      lastUpdateRef.current = performance.now();
                      setIsPaused(false);
                    }}
                    className="px-12 py-4 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-2xl active:scale-95 transition-transform"
                  >
                    RESUME
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          ref={towerContainerRef}
          className="absolute inset-0 pointer-events-none will-change-transform"
        >
          <TowerStack stack={towerData.stack} />
        </div>

        <div 
          className={cn(
            "absolute left-0 right-0 h-1 bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1),0_0_40px_rgba(244,63,94,0.6)] z-50 flex items-center justify-center transition-all",
            isRedAlert && "danger-line-pulse bg-rose-400"
          )}
          style={{ bottom: `${DANGER_LINE_PX}px` }}
        />
      </div>

      <div className="h-[180px] bg-slate-950/80 backdrop-blur-md z-40 border-t border-white/10">
        {gameMode === 'reference' && !isAskingReference ? (
          <ReferenceGameUI 
            availableChunks={availableChunks}
            placedChunks={placedChunks}
            handleChunkTap={handleChunkTap}
            handlePlacedChunkTap={handlePlacedChunkTap}
            handleClearAll={handleClearAll}
            handleShuffle={handleShuffle}
            handleSubmit={handleSubmit}
            handleReorder={handleReorder}
            isCorrect={isCorrect}
            wordAreaRectRef={wordAreaRectRef}
            bonusWordsFoundCount={bonusWordsFoundCount}
            currentVerse={currentVerse}
          />
        ) : (
          <ChoiceGameUI 
            options={options}
            isAskingReference={isAskingReference}
            currentVerse={currentVerse}
            words={words}
            currentIndex={currentIndex}
            difficulty={difficulty}
            handleChoice={handleChoice}
          />
        )}
      </div>
    </div>
  );
};
