import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Trophy, Play, RotateCcw, X, Zap, Star, ChevronRight, AlertCircle, Pause, Music, Volume2, VolumeX, CheckCircle2, Target } from 'lucide-react';
import { getVerseByRef, parseReference } from '../lib/bibleDb';
import { cn } from '../lib/utils';

const hymnUrls = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3"
];

interface VerseDartsProps {
  onComplete: (xp: number) => void;
  onExit: () => void;
  isMusicEnabled: boolean;
  setIsMusicEnabled: (enabled: boolean) => void;
  selectedMusicStyle: string;
  setSelectedMusicStyle: (style: string) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

interface DartTarget {
  id: number;
  text: string;
  x: number; // %
  y: number; // %
  scale: number; // 1.0 to 0.0
  isCorrect: boolean;
  wordIndex: number;
  createdAt: number;
  duration: number;
  sector: number;
}

interface ShatterEffect {
  id: number;
  x: number;
  y: number;
  text: string;
  createdAt: number;
}

interface HeartBreak {
  id: number;
  x: number;
  y: number;
  createdAt: number;
}

interface DartsLevel {
  id: number;
  reference: string;
  title: string;
}

const DARTS_LEVELS: DartsLevel[] = [
  { id: 1, reference: "John 3:16", title: "The Gospel" },
  { id: 2, reference: "Genesis 1:1", title: "The Beginning" },
  { id: 3, reference: "Psalm 23:1", title: "The Shepherd" },
  { id: 4, reference: "Philippians 4:13", title: "The Strength" },
  { id: 5, reference: "Romans 8:28", title: "The Promise" },
  { id: 6, reference: "Matthew 6:33", title: "The Kingdom" },
  { id: 7, reference: "Proverbs 3:5", title: "The Trust" },
  { id: 8, reference: "Isaiah 41:10", title: "The Fearless" },
  { id: 9, reference: "Joshua 1:9", title: "The Courage" },
  { id: 10, reference: "Hebrews 11:1", title: "The Faith" }
];

const SECTORS_X = 5;
const SECTORS_Y = 5;

const HUD = React.memo(({ 
  currentLevelIdx, 
  loopCount, 
  isMusicEnabled, 
  setIsMusicEnabled, 
  selectedMusicStyle, 
  setSelectedMusicStyle, 
  isPaused, 
  setIsPaused, 
  lives, 
  score,
  levelTitle
}: { 
  currentLevelIdx: number, 
  loopCount: number, 
  isMusicEnabled: boolean, 
  setIsMusicEnabled: (v: boolean) => void, 
  selectedMusicStyle: string, 
  setSelectedMusicStyle: (v: string) => void, 
  isPaused: boolean, 
  setIsPaused: (v: boolean) => void, 
  lives: number, 
  score: number,
  levelTitle: string
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-3 sm:p-6 flex justify-between items-start z-20 bg-gradient-to-b from-slate-950/80 to-transparent gap-2">
      <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-rose-500 rounded-full text-white font-black text-[10px] sm:text-xs uppercase tracking-tighter whitespace-nowrap">Level {currentLevelIdx + 1}</div>
          <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/10 rounded-full text-white font-black text-[10px] sm:text-xs uppercase tracking-tighter whitespace-nowrap">Loop {loopCount}</div>
        </div>
        <h2 className="font-black text-sm sm:text-xl tracking-tighter uppercase italic truncate text-white">{levelTitle}</h2>
      </div>
      <div className="flex flex-col items-end gap-2 sm:gap-3 shrink-0">
        <div className="flex gap-1.5 sm:gap-2 items-center">
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md mr-1 sm:mr-2">
            <Music className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", isMusicEnabled ? "text-rose-400" : "text-white/20")} />
            <select 
              value={selectedMusicStyle}
              onChange={(e) => setSelectedMusicStyle(e.target.value)}
              className="bg-transparent text-white text-[7px] sm:text-[10px] font-bold uppercase tracking-widest outline-none border-none cursor-pointer max-w-[50px] sm:max-w-none"
            >
              <option value="hymns" className="bg-slate-900">Hymns</option>
              <option value="gospel" className="bg-slate-900">Gospel</option>
              <option value="acoustic" className="bg-slate-900">Acoustic</option>
              <option value="ambient" className="bg-slate-900">Ambient</option>
              <option value="lofi" className="bg-slate-900">Lo-Fi</option>
              <option value="classical" className="bg-slate-900">Classical</option>
              <option value="retro" className="bg-slate-900">Retro</option>
              <option value="epic" className="bg-slate-900">Epic</option>
            </select>
            <div className="w-px h-2 sm:h-3 bg-white/10 mx-0.5 sm:mx-1" />
            <button 
              onClick={() => setIsMusicEnabled(!isMusicEnabled)}
              className="p-0.5 sm:p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMusicEnabled ? <Volume2 size={12} className="text-white" /> : <VolumeX size={12} className="text-white/40" />}
            </button>
          </div>
          <button onClick={() => setIsPaused(!isPaused)} className="p-1.5 sm:p-2 bg-white/10 rounded-xl text-white">
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <div className="flex gap-0.5 sm:gap-1">
            {[...Array(5)].map((_, i) => (
              <Heart key={i} size={14} className={cn(i < lives ? "text-rose-500 fill-rose-500" : "text-slate-800")} />
            ))}
          </div>
        </div>
        <div className="text-xl sm:text-3xl font-black text-rose-400 leading-none">{score}</div>
      </div>
    </div>
  );
});

const TargetItem = React.memo(({ 
  target, 
  onTap 
}: { 
  target: DartTarget, 
  onTap: (t: DartTarget) => void 
}) => {
  return (
    <div
      onClick={() => onTap(target)}
      style={{ 
        position: 'absolute',
        left: `${target.x}%`, 
        top: `${target.y}%`,
        transform: `translate3d(-50%, -50%, 0) scale(${target.scale})`,
        cursor: 'pointer',
        willChange: 'transform, opacity',
        opacity: target.scale > 0.2 ? 1 : target.scale * 5
      }}
      className="group"
    >
      <div className={cn(
        "relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center border-4 shadow-2xl transition-colors",
        target.isCorrect ? "border-rose-500 bg-rose-500/10" : "border-slate-500 bg-slate-800/50"
      )}>
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
        
        {/* Inner Circle */}
        <div className={cn(
          "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-center p-2 font-black text-xs sm:text-sm uppercase tracking-tighter leading-tight",
          target.isCorrect ? "text-white" : "text-slate-400"
        )}>
          {target.text}
        </div>

        {/* Shrink Indicator */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="100 100"
            strokeDashoffset={100 - (target.scale * 100)}
            className={target.isCorrect ? "text-rose-500/30" : "text-slate-500/30"}
          />
        </svg>
      </div>
    </div>
  );
});

const ShatterEffect = React.memo(({ x, y, text }: { x: number, y: number, text: string }) => {
  return (
    <div
      className="absolute pointer-events-none z-50 animate-explosion"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <div className="w-20 h-20 bg-rose-500 rounded-full blur-2xl opacity-40" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white font-black text-lg uppercase tracking-tighter animate-ping opacity-0">
          {text}
        </div>
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-rose-400 rounded-sm absolute shadow-lg shadow-rose-500/50 animate-particle"
            style={{ 
              '--tx': `${(Math.random() - 0.5) * 150}px`, 
              '--ty': `${(Math.random() - 0.5) * 150}px`,
              '--tr': `${Math.random() * 360}deg`,
              animationDelay: `${Math.random() * 0.1}s`
            } as any}
          />
        ))}
      </div>
    </div>
  );
});

const HeartBreakEffect = React.memo(({ x, y }: { x: number, y: number }) => {
  return (
    <div 
      className="absolute pointer-events-none z-50 animate-heartbreak-container"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <div className="relative w-12 h-12 animate-heartbreak-fade">
        <Heart size={48} className="text-rose-600 fill-rose-600 absolute left-0 top-0 animate-heartbreak-left" style={{ clipPath: 'inset(0 50% 0 0)' }} />
        <Heart size={48} className="text-rose-600 fill-rose-600 absolute left-0 top-0 animate-heartbreak-right" style={{ clipPath: 'inset(0 0 0 50%)' }} />
      </div>
    </div>
  );
});

export const VerseDartsGame: React.FC<VerseDartsProps> = ({ 
  onComplete, 
  onExit, 
  isMusicEnabled, 
  setIsMusicEnabled, 
  selectedMusicStyle, 
  setSelectedMusicStyle,
  volume,
  setVolume
}) => {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'>('START');
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [streak, setStreak] = useState(0);
  const [loopCount, setLoopCount] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showSpeedUp, setShowSpeedUp] = useState(false);
  
  const [verse, setVerse] = useState<{ text: string, reference: string } | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [nextWordIndex, setNextWordIndex] = useState(0);
  const [targets, setTargets] = useState<DartTarget[]>([]);
  const [shatters, setShatters] = useState<ShatterEffect[]>([]);
  const [heartBreaks, setHeartBreaks] = useState<HeartBreak[]>([]);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const usedSectorsRef = useRef<Set<number>>(new Set());

  const isFever = streak >= 10;

  // Load level
  const loadLevel = useCallback(async (idx: number) => {
    const level = DARTS_LEVELS[idx];
    const parsed = parseReference(level.reference);
    if (!parsed) return;
    const v = await getVerseByRef(parsed.book, parsed.chapter, parsed.startVerse);
    if (v) {
      setVerse(v);
      const cleanWords = v.text.split(/\s+/).map(w => w.replace(/[^\w\s]/gi, ''));
      setWords(cleanWords);
      setNextWordIndex(0);
      setTargets([]);
      setShatters([]);
      setHeartBreaks([]);
      usedSectorsRef.current.clear();
    }
  }, []);

  useEffect(() => {
    loadLevel(currentLevelIdx);
  }, [currentLevelIdx, loadLevel]);

  // Audio handling
  useEffect(() => {
    if (isMusicEnabled && gameState === 'PLAYING' && !isPaused) {
      if (!audioRef.current) {
        audioRef.current = new Audio(hymnUrls[Math.floor(Math.random() * hymnUrls.length)]);
        audioRef.current.loop = true;
      }
      audioRef.current.volume = volume / 100;
      audioRef.current.play().catch(e => console.log("Audio play failed", e));
    } else {
      audioRef.current?.pause();
    }
    return () => audioRef.current?.pause();
  }, [isMusicEnabled, gameState, isPaused, volume]);

  const triggerHaptic = useCallback((type: 'success' | 'error') => {
    if (window.navigator.vibrate) {
      window.navigator.vibrate(type === 'success' ? 10 : [20, 50, 20]);
    }
  }, []);

  const spawnWave = useCallback(() => {
    if (!words.length || nextWordIndex >= words.length) return;

    const waveSize = 3;
    const distractorsCount = 2;
    const newTargets: DartTarget[] = [];
    
    // Correct words
    for (let i = 0; i < waveSize && (nextWordIndex + i) < words.length; i++) {
      const wordIdx = nextWordIndex + i;
      const sector = getRandomAvailableSector();
      if (sector === -1) break;

      const pos = getSectorCenter(sector);
      newTargets.push({
        id: Math.random(),
        text: words[wordIdx],
        x: pos.x,
        y: pos.y,
        scale: 1.0,
        isCorrect: true,
        wordIndex: wordIdx,
        createdAt: Date.now(),
        duration: Math.max(1500, 4000 - (loopCount * 300)),
        sector
      });
    }

    // Distractors
    const allBibleWords = ["faith", "hope", "love", "grace", "truth", "peace", "joy", "spirit", "light", "life"];
    for (let i = 0; i < distractorsCount; i++) {
      const sector = getRandomAvailableSector();
      if (sector === -1) break;

      const pos = getSectorCenter(sector);
      newTargets.push({
        id: Math.random(),
        text: allBibleWords[Math.floor(Math.random() * allBibleWords.length)],
        x: pos.x,
        y: pos.y,
        scale: 1.0,
        isCorrect: false,
        wordIndex: -1,
        createdAt: Date.now(),
        duration: Math.max(1500, 4000 - (loopCount * 300)),
        sector
      });
    }

    setTargets(prev => [...prev, ...newTargets]);
  }, [words, nextWordIndex, loopCount]);

  const getRandomAvailableSector = () => {
    const totalSectors = SECTORS_X * SECTORS_Y;
    const available = [];
    for (let i = 0; i < totalSectors; i++) {
      if (!usedSectorsRef.current.has(i)) available.push(i);
    }
    if (available.length === 0) return -1;
    const sector = available[Math.floor(Math.random() * available.length)];
    usedSectorsRef.current.add(sector);
    return sector;
  };

  const getSectorCenter = (sector: number) => {
    const row = Math.floor(sector / SECTORS_X);
    const col = sector % SECTORS_X;
    const width = 100 / SECTORS_X;
    const height = 100 / SECTORS_Y;
    return {
      x: (col * width) + (width / 2),
      y: (row * height) + (height / 2)
    };
  };

  const handleTargetTap = useCallback((target: DartTarget) => {
    if (isPaused || gameState !== 'PLAYING') return;

    if (target.isCorrect && target.wordIndex === nextWordIndex) {
      // Correct!
      const bullseyeBonus = Math.floor(target.scale * 100);
      const points = (100 + bullseyeBonus) * (isFever ? 2 : 1);
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      setNextWordIndex(prev => prev + 1);
      setShatters(prev => [...prev, { id: Math.random(), x: target.x, y: target.y, text: target.text, createdAt: Date.now() }]);
      setTargets(prev => prev.filter(t => t.id !== target.id));
      usedSectorsRef.current.delete(target.sector);
      triggerHaptic('success');
    } else {
      // Wrong!
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) setGameState('GAMEOVER');
        return newLives;
      });
      setStreak(0);
      setHeartBreaks(prev => [...prev, { id: Math.random(), x: target.x, y: target.y, createdAt: Date.now() }]);
      triggerHaptic('error');
    }
  }, [isPaused, gameState, nextWordIndex, isFever, triggerHaptic]);

  const updateGame = useCallback((time: number) => {
    if (isPaused || gameState !== 'PLAYING') {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(updateGame);
      return;
    }

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    const now = Date.now();

    setTargets(prev => {
      const updated = prev.map(t => {
        const elapsed = now - t.createdAt;
        const newScale = Math.max(0, 1 - (elapsed / t.duration));
        return { ...t, scale: newScale };
      });

      // Check for expired targets
      const expired = updated.filter(t => t.scale <= 0);
      if (expired.length > 0) {
        expired.forEach(t => {
          if (t.isCorrect) {
            setLives(l => {
              const nl = l - 1;
              if (nl <= 0) setGameState('GAMEOVER');
              return nl;
            });
            setStreak(0);
            setHeartBreaks(hb => [...hb, { id: Math.random(), x: t.x, y: t.y, createdAt: now }]);
            triggerHaptic('error');
          }
          usedSectorsRef.current.delete(t.sector);
        });
        return updated.filter(t => t.scale > 0);
      }
      return updated;
    });

    // Cleanup effects
    setShatters(prev => prev.filter(s => now - s.createdAt < 1000));
    setHeartBreaks(prev => prev.filter(h => now - h.createdAt < 1000));

    requestRef.current = requestAnimationFrame(updateGame);
  }, [isPaused, gameState, triggerHaptic]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [updateGame]);

  // Wave spawning logic
  useEffect(() => {
    if (gameState === 'PLAYING' && !isPaused && targets.length === 0 && words.length > 0) {
      if (nextWordIndex >= words.length) {
        // Level Complete / Loop
        setLoopCount(prev => {
          const next = prev + 1;
          if (next > 8) {
            setGameState('VICTORY');
          } else {
            setShowSpeedUp(true);
            setTimeout(() => setShowSpeedUp(false), 2000);
            setNextWordIndex(0);
          }
          return next;
        });
      } else {
        spawnWave();
      }
    }
  }, [gameState, isPaused, targets.length, words.length, nextWordIndex, spawnWave]);

  const startGame = () => {
    setGameState('PLAYING');
    setShowTutorial(false);
    setScore(0);
    setLives(5);
    setStreak(0);
    setLoopCount(1);
    setNextWordIndex(0);
  };

  const restartLevel = () => {
    startGame();
    loadLevel(currentLevelIdx);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden select-none touch-none">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-rose-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[120px]" />
      </div>

      {gameState === 'START' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 z-10">
          <div className="w-24 h-24 bg-rose-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-500/20 rotate-12">
            <Target size={48} className="text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">Verse Darts</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tap the words before they shrink away!</p>
          </div>
          <button 
            onClick={startGame}
            className="px-12 py-5 bg-rose-500 text-white rounded-2xl font-black text-2xl shadow-xl shadow-rose-500/20 active:scale-95 transition-transform"
          >
            PLAY NOW
          </button>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div ref={gameAreaRef} className="flex-1 relative overflow-hidden">
          <HUD 
            currentLevelIdx={currentLevelIdx}
            loopCount={loopCount}
            isMusicEnabled={isMusicEnabled}
            setIsMusicEnabled={setIsMusicEnabled}
            selectedMusicStyle={selectedMusicStyle}
            setSelectedMusicStyle={setSelectedMusicStyle}
            isPaused={isPaused}
            setIsPaused={setIsPaused}
            lives={lives}
            score={score}
            levelTitle={DARTS_LEVELS[currentLevelIdx].title}
          />

          {/* Game Stage */}
          <div className="absolute inset-0 pt-24 pb-12 px-6">
            {targets.map(t => (
              <TargetItem key={t.id} target={t} onTap={handleTargetTap} />
            ))}
            {shatters.map(s => (
              <ShatterEffect key={s.id} x={s.x} y={s.y} text={s.text} />
            ))}
            {heartBreaks.map(h => (
              <HeartBreakEffect key={h.id} x={h.x} y={h.y} />
            ))}
          </div>

          {/* Fever Overlay */}
          {isFever && (
            <div className="absolute inset-0 pointer-events-none border-[12px] border-rose-500/20 animate-pulse z-0" />
          )}

          {/* Tutorial Overlay */}
          <AnimatePresence>
            {showTutorial && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-6"
              >
                <div className="max-w-md w-full bg-slate-900 border-2 border-rose-500/30 rounded-[2.5rem] p-8 shadow-2xl shadow-rose-500/10 text-center space-y-8">
                  <div className="w-20 h-20 bg-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20 rotate-3">
                    <Target size={40} className="text-white" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Mission Briefing</h2>
                    <p className="text-rose-400 font-bold uppercase tracking-widest text-xs">Verse: {DARTS_LEVELS[currentLevelIdx].reference}</p>
                  </div>
                  <div className="space-y-4 text-left">
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0 mt-1">
                        <CheckCircle2 size={18} className="text-white" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm uppercase text-white">The Objective</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">Tap words in order before they shrink to nothing. Larger targets give more points!</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center shrink-0 mt-1">
                        <AlertCircle size={18} className="text-white" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm uppercase text-white">The Danger</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">Missing a word or tapping the wrong one costs a life. Speed increases each loop!</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowTutorial(false)}
                    className="w-full py-5 bg-rose-500 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform"
                  >
                    START MISSION
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Speed Up / Loop Start Overlay */}
          <AnimatePresence>
            {showSpeedUp && (
              <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="absolute top-24 left-0 right-0 flex justify-center z-50 pointer-events-none">
                <div className="bg-rose-500 text-white px-6 py-2 rounded-full font-black text-xl italic uppercase tracking-tighter shadow-2xl border-2 border-white/20">
                  LOOP {loopCount} START!
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isPaused && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-center space-y-6">
                <Pause size={48} className="text-rose-500 mx-auto" />
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Mission Paused</h2>
                <button 
                  onClick={() => setIsPaused(false)}
                  className="px-12 py-4 bg-rose-500 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform"
                >
                  RESUME
                </button>
                <button 
                  onClick={onExit}
                  className="block mx-auto text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-white"
                >
                  ABORT MISSION
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(gameState === 'GAMEOVER' || gameState === 'VICTORY') && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 z-10">
          <div className={cn(
            "w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl rotate-12",
            gameState === 'VICTORY' ? "bg-amber-500 shadow-amber-500/20" : "bg-slate-800 shadow-slate-950/20"
          )}>
            {gameState === 'VICTORY' ? <Trophy size={48} className="text-white" /> : <RotateCcw size={48} className="text-white" />}
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">
              {gameState === 'VICTORY' ? 'Victory!' : 'Mission Failed'}
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              {gameState === 'VICTORY' ? 'You mastered the verse!' : 'The sequence was lost.'}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 w-full max-w-xs space-y-4">
            <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Final Score</div>
            <div className="text-5xl font-black text-rose-400 tracking-tighter">{score}</div>
          </div>
          <div className="flex flex-col w-full max-w-xs gap-4">
            <button 
              onClick={restartLevel}
              className="w-full py-5 bg-rose-500 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform"
            >
              TRY AGAIN
            </button>
            <button 
              onClick={onExit}
              className="w-full py-5 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-xl active:scale-95 transition-transform"
            >
              EXIT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
