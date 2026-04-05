import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Trophy, Play, RotateCcw, X, Zap, Star, ChevronRight, AlertCircle, Pause, Music, Volume2, VolumeX, CheckCircle2, LayoutGrid } from 'lucide-react';
import { getVerseByRef, parseReference } from '../lib/bibleDb';
import { cn } from '../lib/utils';

const hymnUrls = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3"
];

interface VerseTetrisProps {
  onComplete: (xp: number) => void;
  onExit: () => void;
  isMusicEnabled: boolean;
  setIsMusicEnabled: (enabled: boolean) => void;
  selectedMusicStyle: string;
  setSelectedMusicStyle: (style: string) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

interface TetrisWord {
  id: number;
  text: string;
  column: number;
  y: number; // Pixels from top
  isPlaced: boolean;
  isDragging: boolean;
  wordIndex: number; // Index in the verse
}

interface TetrisLevel {
  id: number;
  reference: string;
  title: string;
}

const TETRIS_LEVELS: TetrisLevel[] = [
  { id: 1, reference: "John 3:16", title: "God's Love" },
  { id: 2, reference: "Psalm 23:1", title: "The Good Shepherd" },
  { id: 3, reference: "Genesis 1:1", title: "The Beginning" },
  { id: 4, reference: "Philippians 4:13", title: "Strength" },
  { id: 5, reference: "Romans 8:28", title: "God's Purpose" },
  { id: 6, reference: "Proverbs 3:5", title: "Trust" },
  { id: 7, reference: "Matthew 6:33", title: "The Kingdom First" },
  { id: 8, reference: "John 14:6", title: "The Way" },
  { id: 9, reference: "Joshua 1:9", title: "Courage" },
  { id: 10, reference: "Jeremiah 29:11", title: "A Future and a Hope" },
  { id: 11, reference: "Ephesians 2:8", title: "By Grace" },
  { id: 12, reference: "1 John 4:8", title: "God is Love" },
  { id: 13, reference: "Psalm 119:105", title: "The Lamp" },
  { id: 14, reference: "Romans 3:23", title: "All Have Sinned" },
  { id: 15, reference: "Romans 6:23", title: "The Gift of God" },
  { id: 16, reference: "Acts 1:8", title: "Witnesses" },
  { id: 17, reference: "Matthew 28:19", title: "The Great Commission" },
  { id: 18, reference: "Galatians 5:22", title: "Fruit of the Spirit" },
  { id: 19, reference: "1 Corinthians 13:4", title: "Love is Patient" },
  { id: 20, reference: "Hebrews 11:1", title: "Faith" }
];

const COLUMNS = 6;
const BLOCK_HEIGHT = 50;
const SPAWN_INTERVAL = 3500;

export const VerseTetrisGame: React.FC<VerseTetrisProps> = ({ 
  onComplete, 
  onExit, 
  isMusicEnabled, 
  setIsMusicEnabled, 
  selectedMusicStyle, 
  setSelectedMusicStyle,
  volume,
  setVolume
}) => {
  const [gameState, setGameState] = useState<'LEVEL_SELECT' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'>('LEVEL_SELECT');
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [loopCount, setLoopCount] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSpeedUp, setShowSpeedUp] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState<number>(1);
  const [highScores, setHighScores] = useState<Record<number, number>>({});
  const [maxLoops, setMaxLoops] = useState<Record<number, number>>({});
  const [startLoops, setStartLoops] = useState<Record<number, number>>({});
  const [isVerseLoading, setIsVerseLoading] = useState(false);
  
  const [verse, setVerse] = useState<{ text: string, reference: string } | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [placedWords, setPlacedWords] = useState<(string | null)[]>([]);
  const [wellWords, setWellWords] = useState<TetrisWord[]>([]);
  const [draggingWord, setDraggingWord] = useState<TetrisWord | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wellRef = useRef<HTMLDivElement>(null);
  const progressAreaRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const lastSpawnRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load progress
  useEffect(() => {
    const savedScores = localStorage.getItem('verse_tetris_scores');
    if (savedScores) setHighScores(JSON.parse(savedScores));
    
    const savedMaxLoops = localStorage.getItem('verse_tetris_max_loops');
    if (savedMaxLoops) {
      const parsed = JSON.parse(savedMaxLoops);
      setMaxLoops(parsed);
      setStartLoops(parsed);
    }
    
    const savedProgress = localStorage.getItem('verse_tetris_progress');
    if (savedProgress) setUnlockedLevels(parseInt(savedProgress));
  }, []);

  const saveProgress = (levelId: number, newScore: number, currentLoop: number) => {
    const updatedScores = { ...highScores, [levelId]: Math.max(highScores[levelId] || 0, newScore) };
    setHighScores(updatedScores);
    localStorage.setItem('verse_tetris_scores', JSON.stringify(updatedScores));

    const updatedMaxLoops = { ...maxLoops, [levelId]: Math.max(maxLoops[levelId] || 1, currentLoop) };
    setMaxLoops(updatedMaxLoops);
    localStorage.setItem('verse_tetris_max_loops', JSON.stringify(updatedMaxLoops));

    setStartLoops(prev => ({ ...prev, [levelId]: Math.max(prev[levelId] || 1, currentLoop) }));

    if (levelId === unlockedLevels && currentLoop >= 8 && levelId < TETRIS_LEVELS.length) {
      const nextLevel = levelId + 1;
      setUnlockedLevels(nextLevel);
      localStorage.setItem('verse_tetris_progress', nextLevel.toString());
    }
  };

  const resetLevelProgress = (levelId: number) => {
    const updatedScores = { ...highScores };
    delete updatedScores[levelId];
    setHighScores(updatedScores);
    localStorage.setItem('verse_tetris_scores', JSON.stringify(updatedScores));

    const updatedMaxLoops = { ...maxLoops };
    delete updatedMaxLoops[levelId];
    setMaxLoops(updatedMaxLoops);
    localStorage.setItem('verse_tetris_max_loops', JSON.stringify(updatedMaxLoops));

    const updatedStartLoops = { ...startLoops };
    updatedStartLoops[levelId] = 1;
    setStartLoops(updatedStartLoops);
  };

  // Load level
  const loadLevel = useCallback(async (idx: number) => {
    setIsVerseLoading(true);
    const level = TETRIS_LEVELS[idx];
    const parsed = parseReference(level.reference);
    if (!parsed) {
      setIsVerseLoading(false);
      return;
    }
    try {
      const v = await getVerseByRef(parsed.book, parsed.chapter, parsed.startVerse);
      if (v) {
        setVerse(v);
        const cleanWords = v.text.split(/\s+/).map(w => w.replace(/[^\w\s]/gi, ''));
        setWords(cleanWords);
        setPlacedWords(new Array(cleanWords.length).fill(null));
        setWellWords([]);
        setDraggingWord(null);
        setScore(0);
        const levelStartLoop = startLoops[level.id] || 1;
        setLoopCount(levelStartLoop);
        setGameState('PLAYING');
      }
    } catch (e) {
      console.error("Failed to load verse", e);
    } finally {
      setIsVerseLoading(false);
    }
  }, [startLoops]);

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

  const spawnWord = useCallback(() => {
    if (!words.length) return;
    
    // Only spawn words that haven't been placed yet
    const availableIndices = placedWords
      .map((w, i) => w === null ? i : -1)
      .filter(i => i !== -1);
    
    if (availableIndices.length === 0) return;

    // Filter out columns that are full (highest word is at or above top)
    const availableColumns = [];
    for (let col = 0; col < COLUMNS; col++) {
      const wordsInCol = wellWords.filter(w => w.column === col);
      const isFull = wordsInCol.some(w => w.y <= 0);
      if (!isFull) {
        availableColumns.push(col);
      }
    }

    if (availableColumns.length === 0) return;

    const wordIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const column = availableColumns[Math.floor(Math.random() * availableColumns.length)];
    const newWord: TetrisWord = {
      id: Math.random(),
      text: words[wordIndex],
      column,
      y: -BLOCK_HEIGHT,
      isPlaced: false,
      isDragging: false,
      wordIndex
    };
    setWellWords(prev => [...prev, newWord]);
  }, [words, placedWords, wellWords]);

  const updateGame = useCallback((time: number) => {
    if (isPaused || gameState !== 'PLAYING') {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(updateGame);
      return;
    }

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Spawning
    const spawnRate = Math.max(1200, SPAWN_INTERVAL - (loopCount * 150));
    if (time - lastSpawnRef.current > spawnRate) {
      spawnWord();
      lastSpawnRef.current = time;
    }

    // Movement & Collision
    setWellWords(prev => {
      const wellHeight = wellRef.current?.clientHeight || 500;
      const speed = (0.3 + (loopCount * 0.05)) * (deltaTime / 16);
      
      // 1. Identify which words are "settled" (at the bottom or on a settled word)
      // Sort bottom-to-top to propagate settlement upwards
      const sortedByY = [...prev].sort((a, b) => b.y - a.y);
      const settledIds = new Set<number>();
      
      sortedByY.forEach(w => {
        if (w.isDragging) return;
        
        const atBottom = w.y >= wellHeight - BLOCK_HEIGHT - 2;
        const onSettled = prev.some(other => 
          other.column === w.column && 
          settledIds.has(other.id) && 
          Math.abs(other.y - (w.y + BLOCK_HEIGHT)) < 4
        );
        
        if (atBottom || onSettled) {
          settledIds.add(w.id);
        }
      });

      // 2. Move non-settled words
      const next = prev.map(w => {
        if (w.isDragging || settledIds.has(w.id)) return w;

        // Target Y is the top of the highest settled word in this column
        const settledInCol = prev.filter(other => other.column === w.column && settledIds.has(other.id));
        const highestSettledY = settledInCol.reduce((min, curr) => curr.y < min ? curr.y : min, wellHeight);
        
        const targetY = highestSettledY - BLOCK_HEIGHT;
        const newY = Math.min(targetY, w.y + speed);

        return { ...w, y: newY };
      });

      // 3. Game Over Check: Only if ALL columns are full
      const allColumnsFull = [...Array(COLUMNS).keys()].every(col => {
        const settledInCol = next.filter(w => w.column === col && settledIds.has(w.id));
        const highestSettledY = settledInCol.reduce((min, curr) => curr.y < min ? curr.y : min, wellHeight);
        return highestSettledY <= 0;
      });

      if (allColumnsFull) {
        setGameState('GAMEOVER');
        saveProgress(TETRIS_LEVELS[currentLevelIdx].id, score, loopCount);
      }

      return next;
    });

    requestRef.current = requestAnimationFrame(updateGame);
  }, [isPaused, gameState, loopCount, spawnWord]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [updateGame]);

  const settledIds = useMemo(() => {
    const wellHeight = wellRef.current?.clientHeight || 500;
    const sortedByY = [...wellWords].sort((a, b) => b.y - a.y);
    const settled = new Set<number>();
    
    sortedByY.forEach(w => {
      if (w.isDragging) return;
      
      const atBottom = w.y >= wellHeight - BLOCK_HEIGHT - 2;
      const onSettled = wellWords.some(other => 
        other.column === w.column && 
        settled.has(other.id) && 
        Math.abs(other.y - (w.y + BLOCK_HEIGHT)) < 4
      );
      
      if (atBottom || onSettled) {
        settled.add(w.id);
      }
    });
    return settled;
  }, [wellWords]);

  // Drag and Drop Logic
  const handlePointerDown = (e: React.PointerEvent, word: TetrisWord) => {
    if (isPaused || gameState !== 'PLAYING') return;

    // Check if buried: A word is buried if there is a SETTLED word above it
    const isBuried = wellWords.some(other => 
      other.column === word.column && 
      other.y < word.y && 
      settledIds.has(other.id)
    );
    
    if (isBuried) return;

    setDraggingWord(word);
    setWellWords(prev => prev.map(w => w.id === word.id ? { ...w, isDragging: true } : w));
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    
    // Capture pointer to ensure move/up events fire even outside the element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingWord || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDragPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingWord || !progressAreaRef.current) return;

    const progressRect = progressAreaRef.current.getBoundingClientRect();
    const isInProgressArea = 
      e.clientX >= progressRect.left && 
      e.clientX <= progressRect.right && 
      e.clientY >= progressRect.top && 
      e.clientY <= progressRect.bottom;

    if (isInProgressArea) {
      // Find which slot
      const slots = progressAreaRef.current.children;
      let targetSlotIdx = -1;
      for (let i = 0; i < slots.length; i++) {
        const slotRect = slots[i].getBoundingClientRect();
        if (e.clientX >= slotRect.left && e.clientX <= slotRect.right && 
            e.clientY >= slotRect.top && e.clientY <= slotRect.bottom) {
          targetSlotIdx = i;
          break;
        }
      }

      if (targetSlotIdx !== -1 && words[targetSlotIdx] === draggingWord.text) {
        // Correct placement!
        setPlacedWords(prev => {
          const next = [...prev];
          next[targetSlotIdx] = draggingWord.text;
          return next;
        });
        setWellWords(prev => prev.filter(w => w.id !== draggingWord.id));
        setScore(prev => prev + 100);
        
        // Check for victory
        setPlacedWords(currentPlaced => {
          if (currentPlaced.every(w => w !== null)) {
            // Verse completed!
            setTimeout(() => {
              setPlacedWords(new Array(words.length).fill(null));
              setLoopCount(l => {
                const next = l + 1;
                setShowSpeedUp(true);
                setTimeout(() => setShowSpeedUp(false), 2000);
                return next;
              });
            }, 500);
          }
          return currentPlaced;
        });
      } else {
        // Return to well
        setWellWords(prev => prev.map(w => w.id === draggingWord.id ? { ...w, isDragging: false } : w));
      }
    } else {
      // Return to well
      setWellWords(prev => prev.map(w => w.id === draggingWord.id ? { ...w, isDragging: false } : w));
    }

    setDraggingWord(null);
  };

  const startGame = () => {
    setGameState('PLAYING');
    setShowTutorial(false);
    setScore(0);
    setLoopCount(1);
    loadLevel(currentLevelIdx);
  };

  const restartLevel = () => {
    startGame();
  };

  return (
    <div 
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden select-none touch-none"
    >
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start z-20 bg-gradient-to-b from-slate-950/80 to-transparent">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <div className="px-2 py-0.5 bg-amber-500 rounded-full text-slate-950 font-black text-[10px] uppercase italic">Level {currentLevelIdx + 1}</div>
            <div className="px-2 py-0.5 bg-white/10 rounded-full text-white font-black text-[10px] uppercase italic">Loop {loopCount}</div>
          </div>
          <h2 className="font-black text-lg tracking-tighter uppercase italic text-white leading-tight">{verse?.reference}</h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-1.5 items-center">
            <button onClick={() => setIsPaused(!isPaused)} className="p-1.5 bg-white/10 rounded-lg text-white">
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
            </button>
            <div className="text-2xl font-black text-amber-500 leading-none">{score}</div>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 flex flex-col pt-14 pb-1 px-2 gap-1">
        {/* The Well */}
        <div 
          ref={wellRef}
          className="flex-1 bg-slate-900/50 rounded-xl border-4 border-slate-800 relative overflow-hidden"
        >
          {/* Column Dividers (Optional visual aid) */}
          <div className="absolute inset-0 flex">
            {[...Array(COLUMNS)].map((_, i) => (
              <div key={i} className="flex-1 border-r border-white/5 last:border-0" />
            ))}
          </div>

          {/* Stacked Words */}
          {wellWords.map(w => {
            if (w.isDragging) return null;
            
            // Check if buried: A word is buried if there is a SETTLED word above it
            const isBuried = wellWords.some(other => 
              other.column === w.column && 
              other.y < w.y && 
              settledIds.has(other.id)
            );

            return (
              <div
                key={w.id}
                onPointerDown={(e) => handlePointerDown(e, w)}
                style={{
                  position: 'absolute',
                  left: `${(w.column * (100 / COLUMNS)) + (100 / COLUMNS / 2)}%`,
                  top: `${w.y}px`,
                  transform: 'translate(-50%, 0)',
                  width: `${(94 / COLUMNS)}%`,
                  height: `${BLOCK_HEIGHT - 4}px`,
                  zIndex: isBuried ? 10 : 20,
                  cursor: isBuried ? 'default' : 'grab',
                  willChange: 'transform',
                  touchAction: 'none'
                }}
                className={cn(
                  "rounded-lg border-2 flex items-center justify-center p-1 text-center font-black text-[10px] sm:text-xs uppercase tracking-tighter",
                  isBuried 
                    ? "bg-slate-800 border-slate-700 text-slate-600 opacity-80" 
                    : "bg-amber-500 border-white/30 text-slate-950 shadow-lg shadow-amber-500/20"
                )}
              >
                {w.text}
              </div>
            );
          })}
        </div>

        {/* Progress Area */}
        <div 
          ref={progressAreaRef}
          className="min-h-[80px] bg-slate-900/80 rounded-xl border-2 border-white/5 p-2 flex flex-wrap gap-1 items-center justify-center overflow-hidden"
        >
          {words.map((word, i) => (
            <div 
              key={i}
              className={cn(
                "px-3 py-2 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-tighter border-2 transition-all",
                placedWords[i] 
                  ? "bg-green-500 border-white/30 text-white shadow-lg shadow-green-500/20" 
                  : loopCount === 1 
                    ? "bg-white/10 border-white/20 text-white/60 shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                    : loopCount === 2
                      ? "bg-white/10 border-white/20 text-white/40 shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                      : "bg-white/5 border-white/10 text-white/10"
              )}
            >
              {placedWords[i] || (
                loopCount === 1 
                  ? word 
                  : loopCount === 2
                    ? (word.length > 1 ? `${word[0]}${".".repeat(word.length - 2)}${word[word.length - 1]}` : word)
                    : "???"
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dragging Word (Rendered outside well to avoid clipping) */}
      {draggingWord && (
        <div
          style={{
            position: 'absolute',
            left: `${dragPos.x}px`,
            top: `${dragPos.y}px`,
            transform: 'translate(-50%, -50%)',
            width: `${(90 / COLUMNS)}%`,
            height: `${BLOCK_HEIGHT - 4}px`,
            zIndex: 100,
            pointerEvents: 'none'
          }}
          className="bg-white border-4 border-amber-500 text-slate-950 rounded-xl flex items-center justify-center p-1 text-center font-black text-[10px] sm:text-xs uppercase tracking-tighter shadow-2xl scale-110"
        >
          {draggingWord.text}
        </div>
      )}

      {/* Overlays */}
      {gameState === 'LEVEL_SELECT' && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col z-[60]">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <LayoutGrid className="text-slate-950" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white">Verse Tetris</h1>
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Stack the Word</p>
              </div>
            </div>
            <button 
              onClick={onExit}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Level Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-black tracking-tighter uppercase italic text-amber-400">Mission Select</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Stack words, clear the verse. Don't let the pile reach the top!</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
                {TETRIS_LEVELS.map((level, idx) => {
                  const isLocked = level.id > unlockedLevels;
                  const highScore = highScores[level.id] || 0;
                  const maxLoop = maxLoops[level.id] || 1;
                  const isPassed = maxLoop >= 8;
                  
                  return (
                    <div key={level.id} className="relative group">
                      <motion.div
                        whileHover={!isLocked ? { scale: 1.02 } : {}}
                        whileTap={!isLocked ? { scale: 0.98 } : {}}
                        onClick={() => {
                          if (!isLocked) {
                            setCurrentLevelIdx(idx);
                            loadLevel(idx);
                          }
                        }}
                        className={cn(
                          "w-full p-6 rounded-3xl border-2 transition-all text-left relative overflow-hidden cursor-pointer h-full flex flex-col",
                          isLocked 
                            ? "bg-slate-900/50 border-white/5 opacity-50 grayscale cursor-not-allowed" 
                            : isPassed
                              ? "bg-gradient-to-br from-slate-900 to-slate-800 border-yellow-500/50 shadow-xl shadow-yellow-500/10"
                              : "bg-slate-900 border-white/10 hover:border-amber-500/50"
                        )}
                      >
                        {isPassed && (
                          <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-500/10 blur-3xl rounded-full" />
                            <motion.div 
                              animate={{ opacity: [0.1, 0.2, 0.1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.05),transparent)]"
                            />
                          </div>
                        )}

                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-black",
                            isLocked ? "bg-slate-800 text-slate-600" : isPassed ? "bg-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/40" : "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                          )}>
                            {level.id}
                          </div>
                          
                          {!isLocked && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Reset all progress for ${level.title}?`)) {
                                    resetLevelProgress(level.id);
                                  }
                                }}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 rounded-lg text-rose-500 transition-all border border-rose-500/20 z-20"
                              >
                                <RotateCcw size={12} />
                              </button>

                              {maxLoop > 1 && (
                                <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-sm p-1 rounded-lg border border-white/10 z-20">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setStartLoops(prev => ({
                                        ...prev,
                                        [level.id]: Math.max(1, (prev[level.id] || 1) - 1)
                                      }));
                                    }}
                                    className="w-5 h-5 flex items-center justify-center bg-slate-800 rounded-md hover:bg-slate-700 text-white font-black text-xs"
                                  >
                                    -
                                  </button>
                                  <div className="flex flex-col items-center min-w-[30px]">
                                    <span className="text-[6px] text-slate-500 font-black uppercase">Start</span>
                                    <span className="text-[10px] font-black text-amber-400">{startLoops[level.id] || 1}</span>
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setStartLoops(prev => ({
                                        ...prev,
                                        [level.id]: Math.min(maxLoop, (prev[level.id] || 1) + 1)
                                      }));
                                    }}
                                    className="w-5 h-5 flex items-center justify-center bg-slate-800 rounded-md hover:bg-slate-700 text-white font-black text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="mb-8 relative z-10">
                          <h3 className={cn(
                            "font-black text-lg leading-tight mb-1",
                            isPassed ? "text-yellow-400" : "text-white"
                          )}>{level.title}</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{level.reference}</p>
                        </div>

                        <div className="flex justify-between items-end mt-auto relative z-10">
                          <div className="flex flex-col gap-1">
                            {highScore > 0 && (
                              <div className="flex items-center gap-1 text-amber-400 font-black text-xs">
                                <Trophy size={12} />
                                {highScore}
                              </div>
                            )}
                            {maxLoop > 1 && (
                              <div className="flex items-center gap-1 text-blue-400 font-black text-[10px] uppercase tracking-widest">
                                <Zap size={10} />
                                Loop {maxLoop}
                              </div>
                            )}
                          </div>
                          {isPassed && <Star size={20} className="text-yellow-500 fill-yellow-500 opacity-50" />}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-slate-950/80 backdrop-blur-md text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Stack words • Drag to slots • Pass Loop 7 to unlock next level
            </p>
          </div>
        </div>
      )}

      {isVerseLoading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-amber-500 font-black uppercase tracking-widest text-sm">Loading Mission...</p>
          </div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-6 text-center space-y-8">
          <div className="w-24 h-24 bg-rose-500 rounded-[2rem] flex items-center justify-center shadow-2xl rotate-12">
            <AlertCircle size={48} className="text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">Mission Failed</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">The pile reached the top!</p>
            {loopCount >= 8 && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-emerald-400 font-black text-xs uppercase tracking-widest">
                <CheckCircle2 size={16} />
                Level Passed! Next Level Unlocked
              </div>
            )}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 w-full max-w-xs">
            <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Final Score</div>
            <div className="text-5xl font-black text-amber-500 tracking-tighter">{score}</div>
          </div>
          <div className="flex flex-col w-full max-w-xs gap-4">
            <button 
              onClick={restartLevel}
              className="w-full py-5 bg-amber-500 text-slate-950 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform"
            >
              TRY AGAIN
            </button>
            <button 
              onClick={() => setGameState('LEVEL_SELECT')}
              className="w-full py-5 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-xl active:scale-95 transition-transform"
            >
              BACK TO LEVELS
            </button>
          </div>
        </div>
      )}

      {gameState === 'VICTORY' && (
        <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-6 text-center space-y-8">
          <div className="w-24 h-24 bg-amber-500 rounded-[2rem] flex items-center justify-center shadow-2xl rotate-12">
            <Trophy size={48} className="text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">Victory!</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">You mastered the verse stack!</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 w-full max-w-xs">
            <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Final Score</div>
            <div className="text-5xl font-black text-amber-500 tracking-tighter">{score}</div>
          </div>
          <button 
            onClick={() => onComplete(score)}
            className="w-full max-w-xs py-5 bg-amber-500 text-slate-950 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform"
          >
            CONTINUE
          </button>
        </div>
      )}

      <AnimatePresence>
        {showSpeedUp && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="absolute top-24 left-0 right-0 flex justify-center z-50 pointer-events-none">
            <div className="bg-amber-500 text-slate-950 px-6 py-2 rounded-full font-black text-xl italic uppercase tracking-tighter shadow-2xl border-2 border-white/20">
              LOOP {loopCount} START!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
