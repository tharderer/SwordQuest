import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Trophy, Play, RotateCcw, ChevronRight, Pause, ArrowLeft, Timer, Skull } from 'lucide-react';
import { getVerseByRef, parseReference } from '../lib/bibleDb';
import { cn } from '../lib/utils';

import { auth, db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  User
} from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const hymnUrls = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3"
];

interface SpeedVerseProps {
  onComplete: (xp: number) => void;
  onUpdateXP: (xp: number) => void;
  onExit: () => void;
  isMusicEnabled: boolean;
  setIsMusicEnabled: (enabled: boolean) => void;
  selectedMusicStyle: string;
  setSelectedMusicStyle: (style: string) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

interface SpeedVerseWord {
  id: number;
  text: string;
  row: number;
  col: number;
  wordIndex: number; // Index in the verse
  isMatched: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
}

interface SpeedVerseLevel {
  id: number;
  reference: string;
  title: string;
}

const SPEED_LEVELS: SpeedVerseLevel[] = [
  { id: 1, reference: "John 3:16", title: "God's Love" },
  { id: 2, reference: "Psalm 23:1", title: "The Good Shepherd" },
  { id: 3, reference: "Genesis 1:1", title: "The Beginning" },
  { id: 4, reference: "Philippians 4:13", title: "Strength" },
  { id: 5, reference: "Romans 8:28", title: "God's Purpose" },
  { id: 6, reference: "Proverbs 3:5", title: "Trust" },
  { id: 7, reference: "Matthew 6:33", title: "The Kingdom First" },
  { id: 8, reference: "John 14:6", title: "The Way" },
  { id: 9, reference: "Joshua 1:9", title: "Courage" },
  { id: 10, reference: "Jeremiah 29:11", title: "A Future and a Hope" }
];

const GRID_SIZE = 3;

const WORD_BG_COLORS = [
  'bg-red-500/20 border-red-500/40',
  'bg-orange-500/20 border-orange-500/40',
  'bg-amber-500/20 border-amber-500/40',
  'bg-yellow-500/20 border-yellow-500/40',
  'bg-lime-500/20 border-lime-500/40',
  'bg-green-500/20 border-green-500/40',
  'bg-emerald-500/20 border-emerald-500/40',
  'bg-teal-500/20 border-teal-500/40',
  'bg-cyan-500/20 border-cyan-500/40',
  'bg-sky-500/20 border-sky-500/40',
  'bg-blue-500/20 border-blue-500/40',
  'bg-indigo-500/20 border-indigo-500/40',
  'bg-violet-500/20 border-violet-500/40',
  'bg-purple-500/20 border-purple-500/40',
  'bg-fuchsia-500/20 border-fuchsia-500/40',
  'bg-pink-500/20 border-pink-500/40',
  'bg-rose-500/20 border-rose-500/40',
];

const WORD_TEXT_COLORS = [
  'text-red-400', 'text-orange-400', 'text-amber-400', 'text-yellow-400', 'text-lime-400',
  'text-green-400', 'text-emerald-400', 'text-teal-400', 'text-cyan-400', 'text-sky-400',
  'text-blue-400', 'text-indigo-400', 'text-violet-400', 'text-purple-400', 'text-fuchsia-400',
  'text-pink-400', 'text-rose-400'
];

export const SpeedVerseGame: React.FC<SpeedVerseProps> = ({ 
  onComplete, 
  onUpdateXP,
  onExit, 
  isMusicEnabled, 
  setIsMusicEnabled, 
  selectedMusicStyle, 
  setSelectedMusicStyle, 
  volume, 
  setVolume 
}) => {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [gameState, setGameState] = useState<'LEVEL_SELECT' | 'PLAYING' | 'VICTORY' | 'GAMEOVER' | 'LOADING'>('LEVEL_SELECT');
  const [verse, setVerse] = useState<{ reference: string, text: string } | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [grid, setGrid] = useState<SpeedVerseWord[][]>([]);
  const [nextWordIndex, setNextWordIndex] = useState(0);
  const [poolIndex, setPoolIndex] = useState(9);
  const [lives, setLives] = useState(5);
  const [time, setTime] = useState(0); // Time in milliseconds
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState<number>(1);
  const [bestTimes, setBestTimes] = useState<Record<number, number>>({});
  const [loop, setLoop] = useState(1);
  const [loopResults, setLoopResults] = useState<Record<number, boolean>>({}); // Track which loops are passed

  const [user, setUser] = useState<User | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState<number | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextWordIndexRef = useRef(0);
  const poolIndexRef = useRef(9);

  // Load progress
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();

    const savedBestTimes = localStorage.getItem('speed_verse_best_times');
    if (savedBestTimes) setBestTimes(JSON.parse(savedBestTimes));
    
    const savedProgress = localStorage.getItem('speed_verse_progress');
    if (savedProgress) setUnlockedLevels(parseInt(savedProgress));

    const skipTutorial = localStorage.getItem('speed_verse_skip_tutorial');
    if (!skipTutorial) setShowTutorial(true);
  }, []);

  const saveLevelProgress = async (levelId: number, finalTimeMs: number, currentLoop: number) => {
    // Only save best time if it's a valid completion
    const updatedBestTimes = { ...bestTimes, [levelId]: bestTimes[levelId] ? Math.min(bestTimes[levelId], finalTimeMs) : finalTimeMs };
    setBestTimes(updatedBestTimes);
    localStorage.setItem('speed_verse_best_times', JSON.stringify(updatedBestTimes));

    // Save to Firestore if authenticated
    if (auth.currentUser && currentLoop === 3) {
      const path = `leaderboards/${levelId}/scores/${auth.currentUser.uid}`;
      try {
        const docRef = doc(db, path);
        const existingDoc = await getDoc(docRef);
        
        if (!existingDoc.exists() || existingDoc.data().score > finalTimeMs) {
          await setDoc(docRef, {
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || 'Anonymous',
            score: finalTimeMs,
            timestamp: Timestamp.now()
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }

    // Check if Loop 3 was passed with speed constraint (1s per word = words.length * 1000ms)
    const isLoop3Passed = currentLoop === 3 && finalTimeMs <= words.length * 1000;
    
    if (isLoop3Passed && levelId === unlockedLevels && levelId < SPEED_LEVELS.length) {
      const nextLevel = levelId + 1;
      setUnlockedLevels(nextLevel);
      localStorage.setItem('speed_verse_progress', nextLevel.toString());
    }
  };

  // Leaderboard listener
  useEffect(() => {
    if (showLeaderboard !== null) {
      const path = `leaderboards/${showLeaderboard}/scores`;
      const q = query(
        collection(db, path),
        orderBy('score', 'asc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const scores = snapshot.docs.map(doc => doc.data());
        setLeaderboardData(scores);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });

      return () => unsubscribe();
    }
  }, [showLeaderboard]);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in failed", error);
    }
  };

  const formatTime = (ms: number) => (ms / 1000).toFixed(3);

  // Timer
  useEffect(() => {
    if (gameState === 'PLAYING' && !isPaused) {
      startTimeRef.current = performance.now() - time;
      timerRef.current = setInterval(() => {
        const elapsed = performance.now() - startTimeRef.current;
        setTime(Math.floor(elapsed));
      }, 10);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isPaused]);

  // Initialize Audio
  useEffect(() => {
    if (isMusicEnabled) {
      const url = hymnUrls[Math.floor(Math.random() * hymnUrls.length)];
      audioRef.current = new Audio(url);
      audioRef.current.loop = true;
      audioRef.current.volume = volume / 100;
      audioRef.current.play().catch(e => console.log("Audio play failed", e));
    } else {
      audioRef.current?.pause();
    }
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [isMusicEnabled]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Load Level
  const loadLevel = useCallback(async (idx: number, currentLoop: number = 1) => {
    setGameState('LOADING');
    const level = SPEED_LEVELS[idx];
    const parsed = parseReference(level.reference);
    if (!parsed) return;
    
    const v = await getVerseByRef(parsed.book, parsed.chapter, parsed.startVerse);
    if (v) {
      setVerse(v);
      const verseWords = v.text.split(/\s+/).filter(w => w.length > 0);
      setWords(verseWords);
      setNextWordIndex(0);
      nextWordIndexRef.current = 0;
      setLives(5);
      setTime(0);
      setLoop(currentLoop);
      setPoolIndex(GRID_SIZE * GRID_SIZE);
      poolIndexRef.current = GRID_SIZE * GRID_SIZE;
      setIsProcessing(false);

      // Create initial grid
      const newGrid: SpeedVerseWord[][] = [];
      let idCounter = 0;
      
      const gridItems: { text: string, wordIndex: number }[] = [];
      const totalSlots = GRID_SIZE * GRID_SIZE;
      
      if (verseWords.length >= totalSlots) {
        // Long verse: take first slots
        for (let i = 0; i < totalSlots; i++) {
          gridItems.push({ text: verseWords[i], wordIndex: i });
        }
      } else {
        // Short verse: fill with all words, then repeat
        for (let i = 0; i < verseWords.length; i++) {
          gridItems.push({ text: verseWords[i], wordIndex: i });
        }
        // Repeat words until full
        let repeatIdx = 0;
        while (gridItems.length < totalSlots) {
          gridItems.push({ text: verseWords[repeatIdx % verseWords.length], wordIndex: repeatIdx % verseWords.length });
          repeatIdx++;
        }
      }

      // Shuffle
      gridItems.sort(() => Math.random() - 0.5);

      for (let r = 0; r < GRID_SIZE; r++) {
        newGrid[r] = [];
        for (let c = 0; c < GRID_SIZE; c++) {
          const item = gridItems.pop()!;
          newGrid[r][c] = {
            id: idCounter++,
            text: item.text,
            row: r,
            col: c,
            wordIndex: item.wordIndex,
            isMatched: false
          };
        }
      }
      setGrid(newGrid);
      setGameState('PLAYING');
    }
  }, []);

  const handleWordClick = (r: number, c: number) => {
    if (isPaused || gameState !== 'PLAYING') return;

    const clickedWord = grid[r][c];
    if (clickedWord.isMatched || clickedWord.isCorrect || clickedWord.isWrong) return;
    
    // Check if it's the correct next word by text comparison
    const expectedText = words[nextWordIndexRef.current];
    if (clickedWord.text.toLowerCase().replace(/[^\w]/g, '') === expectedText.toLowerCase().replace(/[^\w]/g, '')) {
      // Correct!
      const newNextIndex = nextWordIndexRef.current + 1;
      nextWordIndexRef.current = newNextIndex;
      setNextWordIndex(newNextIndex);
      
      // Mark as correct and refill grid immediately in one state update
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => row.map(word => ({ ...word })));
        const clicked = newGrid[r][c];
        
        // Determine replacement word
        let replacementIndex = -1;
        const totalSlots = GRID_SIZE * GRID_SIZE;
        if (words.length > totalSlots && poolIndexRef.current < words.length) {
          replacementIndex = poolIndexRef.current;
          poolIndexRef.current++;
          setPoolIndex(poolIndexRef.current);
        } else {
          const counts: Record<number, number> = {};
          for (let i = 0; i < words.length; i++) counts[i] = 0;
          
          newGrid.flat().forEach(w => {
            counts[w.wordIndex] = (counts[w.wordIndex] || 0) + 1;
          });
          
          let minCount = Infinity;
          for (let i = 0; i < words.length; i++) {
            if (counts[i] < minCount) minCount = counts[i];
          }
          
          const candidates = [];
          for (let i = 0; i < words.length; i++) {
            if (counts[i] === minCount) candidates.push(i);
          }
          
          replacementIndex = candidates[Math.floor(Math.random() * candidates.length)];
        }

        // Replace immediately
        newGrid[r][c] = {
          id: Date.now() + Math.random(),
          text: words[replacementIndex],
          row: r,
          col: c,
          wordIndex: replacementIndex,
          isMatched: false,
          isCorrect: false,
          isWrong: false
        };
        
        return newGrid;
      });
      
      // Check victory
      if (newNextIndex === words.length) {
        const level = SPEED_LEVELS[currentLevelIdx];
        saveLevelProgress(level.id, time, loop);
        setGameState('VICTORY');
        return;
      }
    } else {
      // Wrong!
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => row.map(word => ({ ...word })));
        newGrid[r][c].isWrong = true;
        return newGrid;
      });
      
      setLives(prev => {
        const next = prev - 1;
        if (next === 0) setGameState('GAMEOVER');
        return next;
      });

      setTimeout(() => {
        setGrid(prevGrid => {
          const resetGrid = prevGrid.map(row => row.map(word => ({ ...word })));
          if (resetGrid[r] && resetGrid[r][c]) {
            resetGrid[r][c].isWrong = false;
          }
          return resetGrid;
        });
      }, 500);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-950 text-white font-sans relative overflow-hidden select-none touch-none pb-safe">
      {/* Level Selector */}
      {gameState === 'LEVEL_SELECT' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-6 flex items-center justify-between bg-slate-950/50 backdrop-blur-md border-b border-white/5 z-20">
            <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-4">
              {!user ? (
                <button 
                  onClick={signIn}
                  className="px-4 py-2 bg-white text-slate-950 rounded-xl font-black text-xs uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all"
                >
                  Sign In for Leaderboards
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
                  <span className="text-xs font-black uppercase tracking-tighter text-slate-400">{user.displayName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <Timer size={16} className="text-amber-500" />
                <span className="font-black text-amber-500">Speed Verse</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-black tracking-tighter uppercase italic text-amber-400">Speed Verse</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tap the words in order. Don't hit the traps!</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SPEED_LEVELS.map((level, idx) => {
                  const isLocked = level.id > unlockedLevels;
                  const bestTime = bestTimes[level.id];
                  const isPassed = bestTime !== undefined;
                  
                  return (
                    <div key={level.id} className="relative group">
                      <motion.div
                        whileHover={!isLocked ? { scale: 1.02 } : {}}
                        whileTap={!isLocked ? { scale: 0.98 } : {}}
                        onClick={() => !isLocked && loadLevel(idx)}
                        className={cn(
                          "w-full p-6 rounded-3xl border-2 transition-all text-left relative overflow-hidden cursor-pointer h-full flex flex-col",
                          isLocked 
                            ? "bg-slate-900/50 border-white/5 opacity-50 grayscale cursor-not-allowed" 
                            : isPassed
                              ? "bg-gradient-to-br from-slate-900 to-slate-800 border-yellow-500/50 shadow-xl shadow-yellow-500/10"
                              : "bg-slate-900 border-white/10 hover:border-amber-500/50"
                        )}
                      >
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-black",
                            isLocked ? "bg-slate-800 text-slate-600" : isPassed ? "bg-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/40" : "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                          )}>
                            {level.id}
                          </div>
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
                            <div className="flex items-center gap-1 text-slate-500 font-black text-[8px] uppercase tracking-widest">
                              <Timer size={8} />
                              <span>Best Time</span>
                            </div>
                            <div className="text-sm font-black text-white">{bestTime !== undefined ? `${formatTime(bestTime)}s` : '-'}</div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowLeaderboard(level.id);
                            }}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Trophy size={16} className="text-amber-500" />
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'LOADING' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full"
          />
          <p className="text-amber-500 font-black uppercase tracking-widest animate-pulse">Consulting the Scribes...</p>
        </div>
      )}

      {(gameState === 'PLAYING' || gameState === 'VICTORY' || gameState === 'GAMEOVER') && (
        <>
          {/* HUD */}
          <div className="flex-shrink-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-slate-950/80 to-transparent">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button onClick={() => setGameState('LEVEL_SELECT')} className="p-2 bg-white/10 rounded-full text-white transition-colors hover:bg-white/20">
                  <ArrowLeft size={20} />
                </button>
                <div className="px-3 py-1 bg-amber-500 rounded-full text-slate-950 font-black text-xs uppercase italic">Level {currentLevelIdx + 1}</div>
              </div>
              <h2 className="font-black text-xl tracking-tighter uppercase italic text-white leading-tight">{verse?.reference}</h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2 items-center">
                <button onClick={() => setIsPaused(!isPaused)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
                  {isPaused ? <Play size={20} /> : <Pause size={20} />}
                </button>
                <div className="text-3xl font-black text-amber-500 leading-none">{formatTime(time)}s</div>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Heart 
                    key={i} 
                    size={16} 
                    className={cn(i < lives ? "text-rose-500 fill-rose-500" : "text-slate-800")} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Verse Progress Display */}
          <div className="flex-shrink-0 px-2 sm:px-4 mb-1">
            <div className="bg-slate-900/90 p-2 sm:p-3 rounded-2xl border-2 border-slate-800 shadow-2xl max-h-[20vh] overflow-y-auto custom-scrollbar">
              <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center">
                {words.map((word, i) => {
                  const isFound = i < nextWordIndex;
                  const isCurrent = i === nextWordIndex;
                  // In Loop 3, hide the next word and only show found words
                  const isVisible = loop === 1 || isFound || (loop === 2 && isCurrent);
                  const shouldHighlight = isCurrent && loop !== 3;
                  
                  return (
                    <motion.span 
                      key={i}
                      initial={false}
                      animate={shouldHighlight ? { scale: 1.2, zIndex: 20 } : { scale: 1, zIndex: 10 }}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs sm:text-sm md:text-base font-black transition-all duration-300 border-2 uppercase tracking-tighter",
                        shouldHighlight 
                          ? "bg-white text-slate-950 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse" 
                          : cn(
                              WORD_BG_COLORS[i % WORD_BG_COLORS.length],
                              WORD_TEXT_COLORS[i % WORD_TEXT_COLORS.length],
                              isFound 
                                ? "border-current opacity-100 shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                                : "border-transparent opacity-20 grayscale-[0.5]"
                            ),
                        !isVisible && "opacity-0 pointer-events-none"
                      )}
                    >
                      {word}
                    </motion.span>
                  );
                })}
              </div>
              <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(nextWordIndex / words.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden pb-8 sm:pb-4">
            <div className="aspect-square w-full h-full max-h-full max-w-full bg-slate-900 rounded-[2rem] sm:rounded-[3rem] p-2 sm:p-6 border-4 border-slate-800 shadow-2xl relative flex items-center justify-center">
              <div className="grid grid-cols-3 grid-rows-3 gap-2 sm:gap-4 h-full w-full">
                {grid.map((row, r) => (
                  row.map((word, c) => (
                    <motion.button
                      key={word.id}
                      onClick={() => handleWordClick(r, c)}
                      className={cn(
                        "relative rounded-xl sm:rounded-3xl flex items-center justify-center p-2 sm:p-4 text-sm sm:text-2xl md:text-4xl font-black uppercase tracking-tighter transition-all border-2 sm:border-4",
                        word.isWrong ? "bg-rose-500 border-rose-400 text-white scale-95 shadow-[0_0_40px_rgba(244,63,94,0.8)]" :
                        cn(
                          WORD_BG_COLORS[word.wordIndex % WORD_BG_COLORS.length],
                          WORD_TEXT_COLORS[word.wordIndex % WORD_TEXT_COLORS.length],
                          "hover:brightness-125 active:scale-90"
                        )
                      )}
                      initial={false}
                      animate={{
                        scale: 1,
                        opacity: 1,
                      }}
                    >
                      <span className="text-center break-words line-clamp-3 leading-tight drop-shadow-sm">{word.text}</span>
                    </motion.button>
                  ))
                ))}
              </div>
              
              {/* Pause Overlay */}
              <AnimatePresence>
                {isPaused && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center rounded-2xl"
                  >
                    <h2 className="text-4xl font-black text-white mb-8 italic uppercase tracking-tighter">Paused</h2>
                    <button 
                      onClick={() => setIsPaused(false)}
                      className="w-48 py-4 bg-amber-500 text-slate-950 rounded-2xl font-black text-xl shadow-lg hover:scale-105 active:scale-95 transition-all uppercase italic"
                    >
                      Resume
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}

      {/* Leaderboard Overlay */}
      <AnimatePresence>
        {showLeaderboard !== null && (
          <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-8 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl text-white custom-scrollbar flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black tracking-tight uppercase italic text-amber-400">Level {showLeaderboard} Top 10</h3>
                <button onClick={() => setShowLeaderboard(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <ArrowLeft size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-2 mb-8">
                {leaderboardData.length > 0 ? (
                  leaderboardData.map((score, i) => (
                    <div key={i} className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border border-white/5",
                      score.userId === user?.uid ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5"
                    )}>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black",
                          i === 0 ? "bg-yellow-500 text-slate-950" : i === 1 ? "bg-slate-300 text-slate-950" : i === 2 ? "bg-amber-700 text-white" : "bg-slate-800 text-slate-400"
                        )}>{i + 1}</span>
                        <span className="font-bold text-sm truncate max-w-[120px]">{score.userName}</span>
                      </div>
                      <span className="font-black text-amber-500">{formatTime(score.score)}s</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-xs">No records yet. Be the first!</div>
                )}
              </div>

              <button 
                onClick={() => setShowLeaderboard(null)}
                className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95 uppercase italic"
              >
                CLOSE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-8 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl text-white custom-scrollbar"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                  <Timer size={32} className="text-amber-400" />
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-center mb-6 tracking-tight uppercase">Speed Briefing</h3>
              
              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-amber-400 font-bold">1</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    <span className="text-white font-bold">Tap in Order.</span> Tap the words of the verse in the correct sequence.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-rose-400 font-bold">2</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    <span className="text-white font-bold">Avoid Traps.</span> Tapping an out-of-order word or a word you already found costs a life!
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-blue-400 font-bold">3</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    <span className="text-white font-bold">Master the Verse.</span> Complete 3 loops to unlock the next level. Loop 3 requires speed!
                  </p>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowTutorial(false);
                  localStorage.setItem('speed_verse_skip_tutorial', 'true');
                }}
                className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
              >
                I'M READY
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Victory / Game Over Screens */}
      <AnimatePresence>
        {gameState === 'VICTORY' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md"
          >
            <div className="bg-slate-900 rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl border-4 border-emerald-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Trophy size={48} className="text-emerald-500" />
              </motion.div>
              <h2 className="text-4xl font-black text-white mb-2 italic uppercase tracking-tighter">
                {loop === 3 && time > words.length * 1000 ? "TOO SLOW!" : "VICTORY!"}
              </h2>
              <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-2">Loop {loop} Completed in {formatTime(time)}s!</p>
              {loop === 3 && (
                <p className={cn("text-xs font-bold uppercase mb-6", time <= words.length * 1000 ? "text-emerald-500" : "text-rose-500")}>
                  Target: Under {words.length}.000s ({time <= words.length * 1000 ? "PASSED" : "FAILED"})
                </p>
              )}
              
              <div className="space-y-3">
                {loop < 3 ? (
                  <button 
                    onClick={() => loadLevel(currentLevelIdx, loop + 1)}
                    className="w-full py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-xl shadow-lg hover:scale-105 active:scale-95 transition-all uppercase italic flex items-center justify-center gap-2"
                  >
                    Next Loop ({loop + 1}/3) <ChevronRight size={24} />
                  </button>
                ) : (
                  time <= words.length * 1000 ? (
                    <button 
                      onClick={() => {
                        if (currentLevelIdx < SPEED_LEVELS.length - 1) {
                          setCurrentLevelIdx(prev => prev + 1);
                          loadLevel(currentLevelIdx + 1, 1);
                        } else {
                          setGameState('LEVEL_SELECT');
                        }
                      }}
                      className="w-full py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-xl shadow-lg hover:scale-105 active:scale-95 transition-all uppercase italic flex items-center justify-center gap-2"
                    >
                      Next Level <ChevronRight size={24} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => loadLevel(currentLevelIdx, 3)}
                      className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-xl shadow-lg hover:scale-105 active:scale-95 transition-all uppercase italic flex items-center justify-center gap-2"
                    >
                      Retry Loop 3 <RotateCcw size={24} />
                    </button>
                  )
                )}
                <button 
                  onClick={() => setGameState('LEVEL_SELECT')}
                  className="w-full py-4 bg-transparent text-slate-500 rounded-2xl font-black text-lg hover:text-white transition-all uppercase italic"
                >
                  Menu
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'GAMEOVER' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md"
          >
            <div className="bg-slate-900 rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl border-4 border-rose-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />
              <div className="w-24 h-24 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Skull size={48} className="text-rose-500" />
              </div>
              <h2 className="text-4xl font-black text-white mb-2 italic uppercase tracking-tighter">OUT OF LIVES</h2>
              <p className="text-rose-400 font-bold uppercase tracking-widest text-sm mb-8">The traps got you!</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => loadLevel(currentLevelIdx, loop)}
                  className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-xl shadow-lg hover:scale-105 active:scale-95 transition-all uppercase italic flex items-center justify-center gap-2"
                >
                  <RotateCcw size={24} /> Try Again
                </button>
                <button 
                  onClick={() => setGameState('LEVEL_SELECT')}
                  className="w-full py-4 bg-transparent text-slate-500 rounded-2xl font-black text-lg hover:text-white transition-all uppercase italic"
                >
                  Menu
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
