import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Trophy, Play, RotateCcw, X, Zap, Star, ChevronRight, AlertCircle, Pause, Music, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';
import { getVerseByRef, parseReference } from '../lib/bibleDb';
import { cn } from '../lib/utils';

const hymnUrls = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3"
];

interface VerseChomperProps {
  onComplete: (xp: number) => void;
  onExit: () => void;
}

interface FallingWord {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
  isCorrect: boolean;
  wordIndex: number; // Index in the verse
  isJumbled?: boolean;
  spawnedAtTargetIndex: number; // The target index when this word was spawned
}

interface Explosion {
  id: number;
  x: number;
  y: number;
}

interface HeartBreak {
  id: number;
  x: number;
  y: number;
}

interface ChomperLevel {
  id: number;
  reference: string;
  title: string;
}

interface SavedSession {
  levelIdx: number;
  score: number;
  lives: number;
  streak: number;
  loopCount: number;
  nextWordIndex: number;
  startLoop: number;
  timestamp: number;
}

const FallingWordItem = React.memo(({ word }: { word: FallingWord }) => {
  return (
    <div
      style={{ 
        position: 'absolute',
        left: `${word.x}%`, 
        top: `${word.y}%`,
        transform: 'translate3d(-50%, -50%, 0)',
        pointerEvents: 'none',
        willChange: 'transform'
      }}
    >
      <div className={cn(
        "px-4 py-2 rounded-xl font-black text-lg shadow-xl whitespace-nowrap border-2 transition-transform",
        "bg-slate-800 text-white border-white/30 opacity-100 shadow-white/5"
      )}>
        {word.text}
      </div>
    </div>
  );
}, (prev, next) => {
  // Only re-render if position or text changed significantly (approx every other frame at 60fps)
  return prev.word.id === next.word.id && 
         Math.abs(prev.word.y - next.word.y) < 0.5 && 
         prev.word.x === next.word.x;
});

const Avatar = React.memo(({ pos, streak }: { pos: { x: number, y: number }, streak: number }) => {
  return (
    <div
      style={{ 
        position: 'absolute',
        left: `${pos.x}%`, 
        top: `${pos.y}%`,
        transform: 'translate3d(-50%, -50%, 0)',
        pointerEvents: 'none',
        zIndex: 30,
        willChange: 'transform'
      }}
    >
      <div className="w-9 h-9 bg-amber-500 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/40 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-slate-950 rounded-full" />
        <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 bg-slate-950 rounded-full" />
        <div className="absolute bottom-1 w-4.5 h-2 bg-slate-950 rounded-full" />
      </div>
      
      {streak >= 5 && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
          {streak} STREAK!
        </div>
      )}
    </div>
  );
});

const ExplosionEffect = ({ x, y }: { x: number, y: number, key?: any }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 2.5, opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="absolute pointer-events-none z-50"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <div className="w-16 h-16 bg-rose-500 rounded-full blur-2xl opacity-60" />
      <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 1 }}
            animate={{ 
              x: (Math.random() - 0.5) * 150, 
              y: (Math.random() - 0.5) * 150,
              scale: 0,
              rotate: Math.random() * 360
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-3 h-3 bg-amber-400 rounded-sm absolute shadow-lg shadow-amber-500/50"
          />
        ))}
      </div>
    </motion.div>
  );
};

const HeartBreakEffect = ({ x, y }: { x: number, y: number, key?: any }) => {
  return (
    <div 
      className="absolute pointer-events-none z-50"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 1.5 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex"
      >
        <motion.div
          initial={{ x: 0, y: 0, rotate: 0 }}
          animate={{ x: -30, y: 40, rotate: -60 }}
          transition={{ duration: 0.7, ease: "easeIn" }}
        >
          <Heart size={40} className="text-rose-600 fill-rose-600 [clip-path:inset(0_50%_0_0)]" />
        </motion.div>
        <motion.div
          initial={{ x: 0, y: 0, rotate: 0 }}
          animate={{ x: 30, y: 40, rotate: 60 }}
          transition={{ duration: 0.7, ease: "easeIn" }}
          className="-ml-10"
        >
          <Heart size={40} className="text-rose-600 fill-rose-600 [clip-path:inset(0_0_0_50%)]" />
        </motion.div>
      </motion.div>
    </div>
  );
};

const CHOMPER_LEVELS: ChomperLevel[] = [
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

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const GameStage = React.memo(({ fallingWords, avatarPos, streak, explosions, heartBreaks }: { 
  fallingWords: FallingWord[], 
  avatarPos: { x: number, y: number }, 
  streak: number,
  explosions: Explosion[],
  heartBreaks: HeartBreak[]
}) => {
  return (
    <>
      {/* Falling Words */}
      {fallingWords.map(w => (
        <FallingWordItem key={w.id} word={w} />
      ))}

      {/* Avatar (Chomper) */}
      <Avatar pos={avatarPos} streak={streak} />

      {/* Effects */}
      <AnimatePresence>
        {explosions.map(e => (
          <ExplosionEffect key={e.id} x={e.x} y={e.y} />
        ))}
        {heartBreaks.map(h => (
          <HeartBreakEffect key={h.id} x={h.x} y={h.y} />
        ))}
      </AnimatePresence>
    </>
  );
});

const VerseProgressBar = React.memo(({ words, nextWordIndex, loopCount }: { words: string[], nextWordIndex: number, loopCount: number }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-slate-950/90 to-transparent">
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="flex flex-wrap justify-center gap-1.5 max-h-[120px] overflow-y-auto pb-2 custom-scrollbar">
          {words.map((word, i) => {
            const isCaught = i < nextWordIndex;
            const isCurrent = i === nextWordIndex;
            
            let displayWord = word;
            let opacityClass = "opacity-100";
            let bgClass = "bg-slate-600";
            
            if (loopCount === 1) {
              bgClass = isCaught ? "bg-amber-500 text-slate-950" : isCurrent ? "bg-white text-slate-950 animate-pulse" : "text-slate-600";
            } else if (loopCount === 2) {
              if (isCaught) {
                bgClass = "bg-amber-500 text-slate-950";
              } else if (isCurrent) {
                displayWord = "_".repeat(word.length);
                bgClass = "bg-white text-slate-950 animate-pulse";
              } else {
                opacityClass = "opacity-0";
              }
            } else if (loopCount === 3) {
              if (isCaught) {
                bgClass = "bg-amber-500 text-slate-950";
              } else if (isCurrent) {
                displayWord = word[0] + "_".repeat(word.length - 1);
                bgClass = "bg-white text-slate-950 animate-pulse";
              } else {
                opacityClass = "opacity-0";
              }
            } else {
              if (isCaught) {
                bgClass = "bg-amber-500 text-slate-950";
              } else {
                opacityClass = "opacity-0";
              }
            }

            return (
              <span 
                key={i}
                className={cn(
                  "text-xs font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded transition-all duration-500",
                  bgClass,
                  opacityClass
                )}
              >
                {displayWord}
              </span>
            );
          })}
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            animate={{ width: `${words.length > 0 ? (nextWordIndex / words.length) * 100 : 0}%` }}
            className="h-full bg-amber-500"
          />
        </div>
      </div>
    </div>
  );
});

export const VerseChomperGame: React.FC<VerseChomperProps> = ({ onComplete, onExit }) => {
  const [gameState, setGameState] = useState<'LEVEL_SELECT' | 'PLAYING' | 'GAME_OVER' | 'VICTORY'>('LEVEL_SELECT');
  const [isVerseLoading, setIsVerseLoading] = useState(false);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [verseText, setVerseText] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [nextWordIndex, setNextWordIndex] = useState(0);
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [lives, setLives] = useState(5);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loopCount, setLoopCount] = useState(1);
  const [startLoop, setStartLoop] = useState(1);
  const [avatarPos, setAvatarPos] = useState({ x: 50, y: 80 }); // Percentage
  const [highScores, setHighScores] = useState<Record<number, number>>({});
  const [maxLoops, setMaxLoops] = useState<Record<number, number>>({});
  const [unlockedLevels, setUnlockedLevels] = useState<number>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [startLoops, setStartLoops] = useState<Record<number, number>>({});
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isJumbled, setIsJumbled] = useState(false);
  const [showSpeedUp, setShowSpeedUp] = useState(false);
  const [showCircleBack, setShowCircleBack] = useState(false);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [heartBreaks, setHeartBreaks] = useState<HeartBreak[]>([]);
  const prevLoopCount = useRef(loopCount);
  
  const sessionRef = useRef<SavedSession | null>(null);

  // Update session ref whenever state changes
  useEffect(() => {
    if (gameState === 'PLAYING') {
      sessionRef.current = {
        levelIdx: currentLevelIdx,
        score: score,
        lives: lives,
        streak: streak,
        loopCount: loopCount,
        nextWordIndex: nextWordIndex,
        startLoop: startLoop,
        timestamp: Date.now()
      };
    }
  }, [gameState, currentLevelIdx, score, lives, streak, loopCount, nextWordIndex, startLoop]);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const requestRef = useRef<number>(0);
  const lastSpawnTime = useRef<number>(0);
  const nextWordToSpawnRef = useRef<number>(0);
  const distractorsRemainingRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const gameStateRef = useRef(gameState);
  const isPausedRef = useRef(isPaused);
  const showTutorialRef = useRef(showTutorial);
  const wordsRef = useRef(words);
  const nextWordIndexRef = useRef(nextWordIndex);
  const loopCountRef = useRef(loopCount);
  const avatarPosRef = useRef(avatarPos);

  // Sync refs with state for the game loop
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { showTutorialRef.current = showTutorial; }, [showTutorial]);
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { nextWordIndexRef.current = nextWordIndex; }, [nextWordIndex]);
  useEffect(() => { loopCountRef.current = loopCount; }, [loopCount]);
  useEffect(() => { avatarPosRef.current = avatarPos; }, [avatarPos]);

  useEffect(() => {
    if (loopCount > prevLoopCount.current && gameState === 'PLAYING' && !showTutorial) {
      setShowSpeedUp(true);
      const timer = setTimeout(() => setShowSpeedUp(false), 1500);
      return () => clearTimeout(timer);
    }
    prevLoopCount.current = loopCount;
  }, [loopCount, gameState, showTutorial]);

  // Load progress
  useEffect(() => {
    const savedScores = localStorage.getItem('verse_chomper_scores');
    if (savedScores) setHighScores(JSON.parse(savedScores));
    
    const savedMaxLoops = localStorage.getItem('verse_chomper_max_loops');
    if (savedMaxLoops) {
      const parsed = JSON.parse(savedMaxLoops);
      setMaxLoops(parsed);
      // Default startLoops to the highest reached for each level
      setStartLoops(parsed);
    }
    
    const savedProgress = localStorage.getItem('verse_chomper_progress');
    if (savedProgress) setUnlockedLevels(parseInt(savedProgress));

    const skip = localStorage.getItem('verse_chomper_skip_tutorial');
    if (skip === 'true') setDontShowAgain(true);

    const saved = localStorage.getItem('verse_chomper_saved_session');
    if (saved) {
      try {
        setSavedSession(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved session", e);
      }
    }
  }, []);

  // Periodically save session during gameplay
  useEffect(() => {
    if (gameState === 'PLAYING' && !isPaused) {
      const saveInterval = setInterval(() => {
        if (sessionRef.current) {
          localStorage.setItem('verse_chomper_saved_session', JSON.stringify(sessionRef.current));
        }
      }, 5000); // Save every 5 seconds
      return () => clearInterval(saveInterval);
    }
  }, [gameState, isPaused]);

  const playSound = useCallback((freq: number, type: OscillatorType, dur: number, vol: number = 0.2) => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      // Frequency sweep for effects
      if (freq > 400) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + dur);
      } else {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, ctx.currentTime + dur);
      }
      
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      
      osc.connect(g);
      g.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {
      console.error("Sound playback failed:", e);
    }
  }, [isMuted]);

  const playChompSound = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      playSound(440, 'sine', 0.1, 0.4);
      setTimeout(() => playSound(660, 'sine', 0.1, 0.3), 50);
    } else {
      playSound(220, 'triangle', 0.2, 0.5);
    }
  }, [playSound]);

  // Audio playback effect
  useEffect(() => {
    if (gameState === 'PLAYING') {
      if (!audioUrl) {
        setAudioUrl(hymnUrls[Math.floor(Math.random() * hymnUrls.length)]);
        return;
      }

      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.loop = true;
      } else if (audioRef.current.src !== audioUrl) {
        audioRef.current.src = audioUrl;
      }
      
      audioRef.current.muted = isMuted;
      audioRef.current.volume = 0.3;
      
      const playAudio = async () => {
        try {
          await audioRef.current?.play();
        } catch (e) {
          console.error("Audio playback failed:", e);
        }
      };
      playAudio();
    } else {
      audioRef.current?.pause();
    }

    return () => {
      audioRef.current?.pause();
    };
  }, [audioUrl, gameState, isMuted]);

  const saveProgress = (levelId: number, newScore: number, currentLoop: number) => {
    const updatedScores = { ...highScores, [levelId]: Math.max(highScores[levelId] || 0, newScore) };
    setHighScores(updatedScores);
    localStorage.setItem('verse_chomper_scores', JSON.stringify(updatedScores));

    const updatedMaxLoops = { ...maxLoops, [levelId]: Math.max(maxLoops[levelId] || 1, currentLoop) };
    setMaxLoops(updatedMaxLoops);
    localStorage.setItem('verse_chomper_max_loops', JSON.stringify(updatedMaxLoops));

    // Update startLoops to the highest reached
    setStartLoops(prev => ({ ...prev, [levelId]: Math.max(prev[levelId] || 1, currentLoop) }));

    if (levelId === unlockedLevels && currentLoop >= 8 && levelId < CHOMPER_LEVELS.length) {
      const nextLevel = levelId + 1;
      setUnlockedLevels(nextLevel);
      localStorage.setItem('verse_chomper_progress', nextLevel.toString());
    }
  };

  const resetLevelProgress = (levelId: number) => {
    const updatedScores = { ...highScores };
    delete updatedScores[levelId];
    setHighScores(updatedScores);
    localStorage.setItem('verse_chomper_scores', JSON.stringify(updatedScores));

    const updatedMaxLoops = { ...maxLoops };
    delete updatedMaxLoops[levelId];
    setMaxLoops(updatedMaxLoops);
    localStorage.setItem('verse_chomper_max_loops', JSON.stringify(updatedMaxLoops));

    const updatedStartLoops = { ...startLoops };
    updatedStartLoops[levelId] = 1;
    setStartLoops(updatedStartLoops);
  };

  const startLevel = async (idx: number, resumeSession?: SavedSession) => {
    const level = CHOMPER_LEVELS[idx];
    const parsed = parseReference(level.reference);
    
    if (!parsed) {
      console.error("Failed to parse reference:", level.reference);
      return;
    }

    setIsVerseLoading(true);
    try {
      const verse = await getVerseByRef(parsed.book, parsed.chapter, parsed.startVerse);
      
      if (verse && verse.text) {
        const cleanWords = verse.text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0);
        if (cleanWords.length === 0) {
          console.error("Verse has no words:", level.reference);
          alert("This verse seems to be empty. Please try another level.");
          return;
        }
        setVerseText(verse.text);
        setWords(cleanWords);
        
        const levelStartLoop = startLoops[level.id] || 1;

        if (resumeSession) {
          setNextWordIndex(resumeSession.nextWordIndex);
          setLives(resumeSession.lives);
          setScore(resumeSession.score);
          setStreak(resumeSession.streak);
          setLoopCount(resumeSession.loopCount);
          prevLoopCount.current = resumeSession.loopCount;
          setStartLoop(resumeSession.startLoop);
          nextWordToSpawnRef.current = resumeSession.nextWordIndex;
        } else {
          setNextWordIndex(0);
          setLives(5);
          setScore(0);
          setStreak(0);
          setLoopCount(levelStartLoop);
          prevLoopCount.current = levelStartLoop;
          setStartLoop(levelStartLoop);
          nextWordToSpawnRef.current = 0;
          // Clear any old saved session when starting fresh
          localStorage.removeItem('verse_chomper_saved_session');
          setSavedSession(null);
        }

        setFallingWords([]);
        setCurrentLevelIdx(idx);
        setIsPaused(false);
        distractorsRemainingRef.current = 0;
        lastTimeRef.current = 0;
        setAudioUrl(hymnUrls[Math.floor(Math.random() * hymnUrls.length)]);
        
        setGameState('PLAYING');
        if (!dontShowAgain && !resumeSession) {
          setShowTutorial(true);
        }
      } else {
        console.error("Verse not found or empty:", level.reference);
        alert(`Could not find verse: ${level.reference}. Please make sure the Bible is downloaded in settings.`);
      }
    } catch (err) {
      console.error("Error loading verse:", err);
      alert("Failed to load verse. Please try again.");
    } finally {
      setIsVerseLoading(false);
    }
  };

  const addExplosion = useCallback((x: number, y: number) => {
    const id = Date.now() + Math.random();
    setExplosions(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setExplosions(prev => prev.filter(e => e.id !== id));
    }, 800);
  }, []);

  const addHeartBreak = useCallback((x: number, y: number) => {
    const id = Date.now() + Math.random();
    setHeartBreaks(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setHeartBreaks(prev => prev.filter(h => h.id !== id));
    }, 1000);
  }, []);

  const spawnWord = useCallback(() => {
    const currentWords = wordsRef.current;
    if (currentWords.length === 0) return;

    let isCorrect = false;
    let wordIdx = -1;

    // Logic: 2-3 distractors between every correct word
    if (distractorsRemainingRef.current <= 0) {
      isCorrect = true;
      wordIdx = nextWordToSpawnRef.current;
      // We don't advance nextWordToSpawnRef here, we advance it when the word is caught or missed
      // Actually, we should advance it here to ensure the next correct word spawned is the next one in sequence
      nextWordToSpawnRef.current = (nextWordToSpawnRef.current + 1) % currentWords.length;
      distractorsRemainingRef.current = Math.floor(Math.random() * 2) + 2; // 2 or 3 distractors
    } else {
      isCorrect = false;
      // Pick a random word from the verse that isn't the same string as the next correct word
      // AND isn't the word we are about to spawn as correct
      const nextNeededWord = currentWords[nextWordIndexRef.current].toLowerCase();
      const nextToSpawnWord = currentWords[nextWordToSpawnRef.current].toLowerCase();
      
      const wrongIndices = currentWords.map((_, i) => i).filter(i => {
        const word = currentWords[i].toLowerCase();
        return word !== nextNeededWord && word !== nextToSpawnWord;
      });
      
      if (wrongIndices.length > 0) {
        wordIdx = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
      } else {
        // If we can't find a unique word in the verse, use a generic distractor
        const genericDistractors = ["AND", "THE", "BUT", "FOR", "WITH"];
        const randomGeneric = genericDistractors[Math.floor(Math.random() * genericDistractors.length)];
        // Check if generic is also the needed word
        if (randomGeneric.toLowerCase() === nextNeededWord) {
          wordIdx = (nextWordIndexRef.current + 2) % currentWords.length;
        } else {
          // We need a way to handle generic words not in the verse array
          // For now, just pick any index that isn't the needed one
          wordIdx = currentWords.findIndex((w, idx) => w.toLowerCase() !== nextNeededWord && idx !== nextWordIndexRef.current);
          if (wordIdx === -1) wordIdx = (nextWordIndexRef.current + 1) % currentWords.length;
        }
      }
      distractorsRemainingRef.current--;
    }

    const wordToSpawn = currentWords[wordIdx];

    const newFallingWord: FallingWord = {
      id: Date.now() + Math.random(),
      text: wordToSpawn,
      x: Math.random() * 80 + 10, // 10% to 90%
      y: -10,
      // Constant fall speed
      speed: 0.45,
      isCorrect: isCorrect,
      wordIndex: wordIdx,
      spawnedAtTargetIndex: nextWordIndexRef.current
    };

    setFallingWords(prev => [...prev, newFallingWord]);
  }, []);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const updateGame = useCallback((time: number) => {
    if (!isMountedRef.current) return;
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current || showTutorialRef.current) {
      if (isPausedRef.current || showTutorialRef.current) {
        lastTimeRef.current = time; // Keep time updated but don't advance
        requestRef.current = requestAnimationFrame(updateGame);
      }
      return;
    }

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    // Limit delta time to prevent huge jumps after tab switch
    const dt = Math.min(deltaTime, 32); 
    lastTimeRef.current = time;

    // Spawn logic - faster as loops progress, but more gradual
    const spawnRate = Math.max(1, 650 - (loopCountRef.current * 50));
    if (time - lastSpawnTime.current > spawnRate) {
      spawnWord();
      lastSpawnTime.current = time;
    }

    setFallingWords(prev => {
      if (prev.length === 0 && distractorsRemainingRef.current > 0) return prev;
      
      let livesLost = 0;
      let scoreGained = 0;
      let wordsAdvancedCount = 0;
      let streakReset = false;
      let streakIncrement = 0;
      let circleBackBonus = false;

      const next: FallingWord[] = [];
      let currentNextWordIdx = nextWordIndexRef.current;
      const currentAvatarPos = avatarPosRef.current;
      const currentLoop = loopCountRef.current;

      for (let i = 0; i < prev.length; i++) {
        const w = prev[i];
        const newY = w.y + (w.speed * (dt / 16));
        
        // Check if correct word fell through
        if (newY > 105) {
          if (w.isCorrect && w.wordIndex === currentNextWordIdx) {
            livesLost++;
            addExplosion(w.x, 95);
            addHeartBreak(w.x, 95);
            streakReset = true;
            nextWordToSpawnRef.current = currentNextWordIdx;
          }
          continue;
        }
        
        // Collision detection
        const dx = w.x - currentAvatarPos.x;
        const dy = newY - currentAvatarPos.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < 81) { // 9^2 = 81
          if (w.isCorrect && w.wordIndex === currentNextWordIdx) {
            playChompSound(true);
            scoreGained += (10 * currentLoop);
            
            // Circle back bonus check
            if (w.spawnedAtTargetIndex < w.wordIndex) {
              circleBackBonus = true;
            }

            wordsAdvancedCount++;
            currentNextWordIdx = (currentNextWordIdx + 1) % wordsRef.current.length;
            nextWordIndexRef.current = currentNextWordIdx; // Update ref immediately for same-frame sequence
            streakIncrement++;
          } else {
            playChompSound(false);
            livesLost++;
            addHeartBreak(currentAvatarPos.x, currentAvatarPos.y);
            streakReset = true;
          }
          continue;
        }

        // Only create a new object if the position changed
        if (newY !== w.y) {
          next.push({ ...w, y: newY });
        } else {
          next.push(w);
        }
      }

      if (livesLost > 0) {
        setLives(l => {
          const nl = l - livesLost;
          if (nl <= 0) setGameState('GAME_OVER');
          return Math.max(0, nl);
        });
      }

      if (scoreGained > 0) setScore(s => s + scoreGained);
      
      if (circleBackBonus) {
        setLives(l => l + 1);
        setShowCircleBack(true);
        setTimeout(() => setShowCircleBack(false), 1500);
      }

      if (streakReset) setStreak(0);
      if (streakIncrement > 0) {
        setStreak(prevStreak => {
          const newStreak = prevStreak + streakIncrement;
          if (newStreak % 10 === 0) setLives(l => l + 1);
          return newStreak;
        });
      }

      if (wordsAdvancedCount > 0) {
        setNextWordIndex(ni => {
          let nextIdx = ni;
          for (let k = 0; k < wordsAdvancedCount; k++) {
            nextIdx = (nextIdx + 1) % wordsRef.current.length;
            if (nextIdx === 0) {
              setLoopCount(lc => lc + 1);
            }
          }
          return nextIdx;
        });
      }

      return next;
    });

    requestRef.current = requestAnimationFrame(updateGame);
  }, [spawnWord]);

  useEffect(() => {
    if (gameState === 'PLAYING' && !isPaused) {
      requestRef.current = requestAnimationFrame(updateGame);
    } else if (gameState === 'PLAYING' && isPaused) {
      // Keep loop alive but updateGame handles the pause logic internally via refs
      requestRef.current = requestAnimationFrame(updateGame);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, isPaused, updateGame]);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!gameAreaRef.current || gameState !== 'PLAYING' || isPaused) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    setAvatarPos({ 
      x: Math.max(5, Math.min(95, x)), 
      y: Math.max(10, Math.min(95, y)) 
    });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden relative select-none">
      {/* Header (Lobby/Level Select Only) */}
      {gameState === 'LEVEL_SELECT' && (
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">Verse Chomper</h1>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Master the Word</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onExit}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Level Select Screen */}
      {gameState === 'LEVEL_SELECT' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic text-amber-400">Verse Chomper</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Catch the words in order. Don't miss a beat.</p>
            </div>

            {savedSession && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <RotateCcw className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-amber-400 leading-tight">Resume Last Game?</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {CHOMPER_LEVELS[savedSession.levelIdx].reference} • Loop {savedSession.loopCount} • Score {savedSession.score}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      localStorage.removeItem('verse_chomper_saved_session');
                      setSavedSession(null);
                    }}
                    className="flex-1 sm:flex-none px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={() => startLevel(savedSession.levelIdx, savedSession)}
                    className="flex-1 sm:flex-none px-6 py-3 bg-amber-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-colors"
                  >
                    Resume
                  </button>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CHOMPER_LEVELS.map((level, idx) => {
                const isLocked = level.id > unlockedLevels;
                const highScore = highScores[level.id] || 0;
                const maxLoop = maxLoops[level.id] || 1;
                
                return (
                  <div key={level.id} className="relative group">
                    <motion.div
                      whileHover={!isLocked ? { scale: 1.02 } : {}}
                      whileTap={!isLocked ? { scale: 0.98 } : {}}
                      onClick={() => !isLocked && startLevel(idx)}
                      className={cn(
                        "w-full p-6 rounded-3xl border-2 transition-all text-left relative overflow-hidden cursor-pointer",
                        isLocked 
                          ? "bg-slate-900/50 border-white/5 opacity-50 grayscale cursor-not-allowed" 
                          : "bg-slate-900 border-white/10 hover:border-amber-500/50"
                      )}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-black",
                          isLocked ? "bg-slate-800 text-slate-600" : "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                        )}>
                          {level.id}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!isLocked && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Reset all progress for ${level.title} to Loop 1?`)) {
                                  resetLevelProgress(level.id);
                                }
                              }}
                              className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/10 hover:bg-rose-500/30 rounded-lg text-rose-500 transition-all border border-rose-500/20 z-20"
                              title="Reset Level Progress"
                            >
                              <RotateCcw size={12} />
                              <span className="text-[8px] font-black uppercase tracking-widest">Reset</span>
                            </button>
                          )}

                          {!isLocked && maxLoop > 1 && (
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
                              <div className="flex flex-col items-center min-w-[40px]">
                                <span className="text-[6px] text-slate-500 font-black uppercase tracking-tighter">Start</span>
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
                      </div>
                      
                      <div className="mb-8">
                        <h3 className="font-black text-lg leading-tight mb-1">{level.title}</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{level.reference}</p>
                      </div>

                      <div className="flex justify-between items-end mt-auto">
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
                          {!isLocked && maxLoop < 8 && (
                            <div className="text-[8px] font-black text-rose-400 uppercase tracking-widest">
                              Goal: Pass Loop 7
                            </div>
                          )}
                          {!isLocked && maxLoop >= 8 && (
                            <div className="flex items-center gap-1 text-emerald-400 font-black text-[8px] uppercase tracking-widest">
                              <CheckCircle2 size={10} />
                              Passed
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer Instructions */}
      {gameState === 'LEVEL_SELECT' && (
        <div className="p-6 border-t border-white/5 bg-slate-950/80 backdrop-blur-md text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Drag to move • Catch words in order • 5 Lives • 10 Streak = +1 Life
          </p>
        </div>
      )}

      {/* Playing Screen */}
      {gameState === 'PLAYING' && (
        <div 
          ref={gameAreaRef}
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
          className="flex-1 relative overflow-hidden cursor-none touch-none"
        >
          {words.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-50">
              <div className="text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                <p className="text-amber-500 font-bold">Something went wrong. No words found.</p>
                <button onClick={() => setGameState('LEVEL_SELECT')} className="px-6 py-2 bg-amber-500 text-slate-950 rounded-full font-black uppercase tracking-widest text-xs">Back to Levels</button>
              </div>
            </div>
          )}
          {/* HUD */}
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 bg-gradient-to-b from-slate-950/80 to-transparent">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-amber-500 rounded-full text-slate-950 font-black text-xs uppercase tracking-tighter">
                  Level {CHOMPER_LEVELS[currentLevelIdx].id}
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full text-white font-black text-xs uppercase tracking-tighter">
                  Loop {loopCount}
                </div>
              </div>
              <h2 className="font-black text-xl tracking-tighter uppercase italic">{CHOMPER_LEVELS[currentLevelIdx].reference}</h2>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-2 items-center">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  title={isMuted ? "Unmute Music" : "Mute Music"}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
                </button>
                <div className="flex items-center gap-1">
                  {lives <= 5 ? (
                    [...Array(5)].map((_, i) => (
                      <Heart 
                        key={i} 
                        size={20} 
                        className={cn(i < lives ? "text-rose-500 fill-rose-500" : "text-slate-800")} 
                      />
                    ))
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Heart size={20} className="text-rose-500 fill-rose-500" />
                      <span className="text-xl font-black text-rose-500">x{lives}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-amber-400 leading-none">{score}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</div>
              </div>
            </div>
          </div>

          {/* Verse Progress Bar */}
          <VerseProgressBar words={words} nextWordIndex={nextWordIndex} loopCount={loopCount} />

          {/* Game Stage (Falling Words & Avatar) */}
          <GameStage 
            fallingWords={fallingWords} 
            avatarPos={avatarPos} 
            streak={streak} 
            explosions={explosions}
            heartBreaks={heartBreaks}
          />

          {/* Speed Up Notification */}
          <AnimatePresence>
            {showSpeedUp && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
              >
                <div className="bg-amber-500 text-slate-950 px-8 py-4 rounded-3xl font-black text-4xl italic uppercase tracking-tighter shadow-2xl">
                  {loopCount === 8 ? "LEVEL PASSED!" : "Speed Up!"}
                </div>
              </motion.div>
            )}
            {showCircleBack && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
              >
                <div className="bg-emerald-500 text-white px-8 py-4 rounded-3xl font-black text-4xl italic uppercase tracking-tighter shadow-2xl flex flex-col items-center">
                  <span>Circle back!</span>
                  <span className="text-xl">+1 LIFE!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instruction Overlay */}
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
                  <Zap size={32} className="text-amber-400" />
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-center mb-6 tracking-tight uppercase">Mission Briefing</h3>
              
              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-amber-400 font-bold">1</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    <span className="text-white font-bold">Catch the Words.</span> Move your avatar to catch the words of the verse in the correct order.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-rose-400 font-bold">2</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    <span className="text-white font-bold">Avoid Distractors.</span> Catching the wrong word or missing the correct one costs you a life.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-blue-400 font-bold">3</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    <span className="text-white font-bold">Loop for XP.</span> Completing the verse starts a new, faster loop. <span className="text-amber-400 font-bold">Pass Loop 7 to pass the level!</span>
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-emerald-400 font-bold">4</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    <span className="text-white font-bold">Circle back!</span> If you catch a word and the next one is already on screen, circle back to catch it for an <span className="text-emerald-400 font-bold">EXTRA LIFE!</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 px-2">
                <button 
                  onClick={() => {
                    const newVal = !dontShowAgain;
                    setDontShowAgain(newVal);
                    localStorage.setItem('verse_chomper_skip_tutorial', newVal.toString());
                  }}
                  className={cn(
                    "w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center",
                    dontShowAgain ? "bg-amber-500 border-amber-500" : "border-slate-700 bg-slate-800"
                  )}
                >
                  {dontShowAgain && <CheckCircle2 size={16} className="text-white" />}
                </button>
                <span className="text-xs text-slate-400 font-medium">Don't show this again</span>
              </div>

              <button 
                onClick={() => {
                  setShowTutorial(false);
                  setGameState('PLAYING');
                }}
                className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
              >
                I'M READY
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pause Overlay */}
          <AnimatePresence>
            {isPaused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/40">
                    <Pause size={40} className="text-slate-950" />
                  </div>
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Game Paused</h2>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setIsPaused(false)}
                      className="px-12 py-4 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-2xl hover:bg-amber-400 transition-colors"
                    >
                      RESUME
                    </button>
                    <button
                      onClick={() => {
                        const session: SavedSession = {
                          levelIdx: currentLevelIdx,
                          score: score,
                          lives: lives,
                          streak: streak,
                          loopCount: loopCount,
                          nextWordIndex: nextWordIndex,
                          startLoop: startLoop,
                          timestamp: Date.now()
                        };
                        localStorage.setItem('verse_chomper_saved_session', JSON.stringify(session));
                        setSavedSession(session);
                        setGameState('LEVEL_SELECT');
                      }}
                      className="px-12 py-4 bg-slate-900 text-white border border-white/10 rounded-2xl font-black text-sm hover:bg-slate-800 transition-colors"
                    >
                      SAVE & QUIT
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'GAME_OVER' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
          <div className="w-24 h-24 bg-rose-500/20 rounded-full flex items-center justify-center border-4 border-rose-500">
            <AlertCircle size={48} className="text-rose-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-5xl font-black uppercase italic tracking-tighter">Out of Lives</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest">You reached loop {loopCount} with {score} points</p>
            {loopCount >= 8 && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-emerald-400 font-black text-xs uppercase tracking-widest animate-bounce">
                <CheckCircle2 size={16} />
                Level Passed! Next Level Unlocked
              </div>
            )}
          </div>
          
          <div className="w-full max-w-xs bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Level Score</span>
              <span className="text-2xl font-black text-white">{score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Personal Best</span>
              <span className="text-2xl font-black text-amber-400">{highScores[CHOMPER_LEVELS[currentLevelIdx].id] || 0}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => {
                saveProgress(CHOMPER_LEVELS[currentLevelIdx].id, score, loopCount);
                startLevel(currentLevelIdx);
              }}
              className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-2xl hover:bg-amber-400 transition-colors flex items-center justify-center gap-3"
            >
              <RotateCcw size={24} />
              TRY AGAIN
            </button>
            <button
              onClick={() => {
                saveProgress(CHOMPER_LEVELS[currentLevelIdx].id, score, loopCount);
                localStorage.removeItem('verse_chomper_saved_session');
                setSavedSession(null);
                setGameState('LEVEL_SELECT');
              }}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm border border-white/10 hover:bg-slate-800 transition-colors"
            >
              BACK TO LEVELS
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isVerseLoading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-amber-500 font-black uppercase tracking-widest text-sm">
              Loading Verse...
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
