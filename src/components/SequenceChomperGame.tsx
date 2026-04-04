import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Trophy, Play, RotateCcw, X, Zap, Star, ChevronRight, AlertCircle, Pause, Music, Volume2, VolumeX, CheckCircle2, Sparkles, Plus, Ghost } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateBibleSequences, BibleSequence } from '../services/geminiService';

const hymnUrls = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3"
];

interface SequenceChomperProps {
  onComplete: (xp: number) => void;
  onExit: () => void;
  isMusicEnabled: boolean;
  setIsMusicEnabled: (enabled: boolean) => void;
  selectedMusicStyle: string;
  setSelectedMusicStyle: (style: string) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

interface FallingWord {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
  isCorrect: boolean;
  wordIndex: number; // Index in the sequence
}

interface FallingHeart {
  id: number;
  x: number;
  y: number;
  speed: number;
}

interface Monster {
  id: number;
  x: number;
  y: number;
  speed: number;
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

const INITIAL_SEQUENCES: BibleSequence[] = [
  { id: 1, title: "Days of Creation", description: "The 7 days of creation in order", items: ["Light", "Firmament", "Dry Land", "Sun & Moon", "Fish & Birds", "Animals & Man", "Rest"], book: "Genesis" },
  { id: 2, title: "Rivers of Eden", description: "The four rivers flowing out of Eden", items: ["Pishon", "Gihon", "Tigris", "Euphrates"], book: "Genesis" },
  { id: 3, title: "Noah's Sons", description: "The three sons of Noah", items: ["Shem", "Ham", "Japheth"], book: "Genesis" },
  { id: 4, title: "Patriarchs", description: "The fathers of the faith in order", items: ["Abraham", "Isaac", "Jacob", "Joseph"], book: "Genesis" },
  { id: 5, title: "Plagues of Egypt", description: "The ten plagues sent upon Egypt in order", items: ["Blood", "Frogs", "Lice", "Flies", "Livestock", "Boils", "Hail", "Locusts", "Darkness", "Firstborn"], book: "Exodus" },
  { id: 6, title: "Ten Commandments", description: "The laws given to Moses in order", items: ["One God", "No Idols", "No Vain Name", "Sabbath", "Honor Parents", "No Murder", "No Adultery", "No Stealing", "No False Witness", "No Coveting"], book: "Exodus" },
  { id: 7, title: "Tribes of Israel", description: "The twelve tribes in birth order", items: ["Reuben", "Simeon", "Levi", "Judah", "Dan", "Naphtali", "Gad", "Asher", "Issachar", "Zebulun", "Joseph", "Benjamin"], book: "Genesis" },
  { id: 8, title: "Judges of Israel", description: "Leaders in chronological order", items: ["Othniel", "Ehud", "Shamgar", "Deborah", "Gideon", "Tola", "Jair", "Jephthah", "Ibzan", "Elon", "Abdon", "Samson"], book: "Judges" },
  { id: 9, title: "United Kingdom Kings", description: "First three kings of Israel in order", items: ["Saul", "David", "Solomon"], book: "1 Samuel" },
  { id: 10, title: "The Twelve Apostles", description: "The apostles as listed in Matthew 10", items: ["Peter", "Andrew", "James", "John", "Philip", "Bartholomew", "Thomas", "Matthew", "James (son of Alphaeus)", "Thaddaeus", "Simon", "Judas"], book: "Matthew" },
  { id: 11, title: "The Beatitudes", description: "The blessings from the Sermon on the Mount", items: ["Poor in Spirit", "Mourn", "Meek", "Hunger for Righteousness", "Merciful", "Pure in Heart", "Peacemakers", "Persecuted"], book: "Matthew" },
  { id: 12, title: "Seven Churches", description: "Churches in Asia Minor in order", items: ["Ephesus", "Smyrna", "Pergamum", "Thyatira", "Sardis", "Philadelphia", "Laodicea"], book: "Revelation" },
  { id: 13, title: "Seven Seals", description: "Judgments from the scroll in order", items: ["White Horse", "Red Horse", "Black Horse", "Pale Horse", "Souls", "Earthquake", "Silence"], book: "Revelation" },
  { id: 14, title: "Seven Trumpets", description: "Angelic warnings in order", items: ["Hail & Fire", "Mountain", "Star", "Darkness", "Locusts", "Euphrates", "Kingdom"], book: "Revelation" },
  { id: 15, title: "Seven Bowls", description: "Final plagues of wrath in order", items: ["Sores", "Sea", "Rivers", "Sun", "Darkness", "Euphrates", "Voices"], book: "Revelation" }
];

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
  return prev.word.id === next.word.id && 
         Math.abs(prev.word.y - next.word.y) < 0.5 && 
         prev.word.x === next.word.x;
});

const FallingHeartItem = React.memo(({ heart }: { heart: FallingHeart }) => {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      style={{ 
        position: 'absolute',
        left: `${heart.x}%`, 
        top: `${heart.y}%`,
        transform: 'translate3d(-50%, -50%, 0)',
        pointerEvents: 'none',
        willChange: 'transform'
      }}
    >
      <div className="p-3 bg-rose-500 rounded-full shadow-lg shadow-rose-500/50 border-2 border-white/50 animate-pulse">
        <Heart className="w-6 h-6 text-white fill-current" />
      </div>
    </motion.div>
  );
}, (prev, next) => {
  return prev.heart.id === next.heart.id && 
         Math.abs(prev.heart.y - next.heart.y) < 0.5 && 
         prev.heart.x === next.heart.x;
});

const MonsterItem = React.memo(({ monster }: { monster: Monster }) => {
  return (
    <motion.div
      initial={{ scale: 0, rotate: 20 }}
      animate={{ scale: 1, rotate: 0 }}
      style={{ 
        position: 'absolute',
        left: `${monster.x}%`, 
        top: `${monster.y}%`,
        transform: 'translate3d(-50%, -50%, 0)',
        pointerEvents: 'none',
        willChange: 'transform'
      }}
    >
      <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-900/50 border-2 border-purple-400 animate-bounce">
        <Ghost className="w-8 h-8 text-white fill-current" />
      </div>
    </motion.div>
  );
}, (prev, next) => {
  return prev.monster.id === next.monster.id && 
         Math.abs(prev.monster.y - next.monster.y) < 0.5 && 
         prev.monster.x === next.monster.x;
});

const Avatar = React.memo(({ pos, streak, loopCount }: { pos: { x: number, y: number }, streak: number, loopCount: number }) => {
  const isFever = streak >= 10;
  
  let skinColor = "bg-amber-500";
  let shadowColor = "shadow-amber-500/40";
  let extraEffects = null;

  if (loopCount >= 7) {
    skinColor = "bg-yellow-400";
    shadowColor = "shadow-yellow-400/60";
    extraEffects = (
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 40],
              y: [0, (Math.random() - 0.5) * 40]
            }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            className="absolute left-1/2 top-1/2 w-1 h-1 bg-white rounded-full"
          />
        ))}
      </div>
    );
  } else if (loopCount >= 5) {
    skinColor = "bg-slate-300";
    shadowColor = "shadow-slate-400/50";
  } else if (loopCount >= 3) {
    skinColor = "bg-cyan-400";
    shadowColor = "shadow-cyan-400/70";
  }

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
      <motion.div 
        animate={isFever ? { scale: [1, 1.1, 1], rotate: [0, 2, -2, 0] } : {}}
        transition={{ duration: 0.2, repeat: Infinity }}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden transition-colors duration-500",
          skinColor,
          shadowColor,
          isFever && "ring-4 ring-orange-500 ring-offset-2 ring-offset-transparent"
        )}
      >
        <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-slate-950 rounded-full" />
        <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 bg-slate-950 rounded-full" />
        <div className="absolute bottom-1 w-4.5 h-2 bg-slate-950 rounded-full" />
        {extraEffects}
      </motion.div>
      
      {streak >= 5 && (
        <div className={cn(
          "absolute -top-8 left-1/2 -translate-x-1/2 text-white text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg transition-colors",
          isFever ? "bg-orange-600 animate-pulse scale-110" : "bg-blue-500"
        )}>
          {streak} {isFever ? "FEVER!" : "STREAK!"}
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

const SequenceProgressBar = React.memo(({ items, nextWordIndex, loopCount }: { items: string[], nextWordIndex: number, loopCount: number }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-slate-950/90 to-transparent">
      <div className="max-w-2xl mx-auto space-y-2">
        <div className="flex flex-wrap justify-center gap-1.5 max-h-[80px] overflow-y-auto pb-2 custom-scrollbar">
          {items.map((item, i) => {
            const isCaught = i < nextWordIndex;
            const isCurrent = i === nextWordIndex;
            
            let displayItem = item;
            let opacityClass = "opacity-100";
            let bgClass = "bg-slate-600";
            
            if (loopCount === 1) {
              bgClass = isCaught ? "bg-amber-500 text-slate-950" : isCurrent ? "bg-white text-slate-950 animate-pulse" : "text-slate-600";
            } else if (loopCount === 2) {
              if (isCaught) {
                bgClass = "bg-amber-500 text-slate-950";
              } else if (isCurrent) {
                displayItem = "_".repeat(item.length);
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
                {displayItem}
              </span>
            );
          })}
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            animate={{ width: `${items.length > 0 ? (nextWordIndex / items.length) * 100 : 0}%` }}
            className="h-full bg-amber-500"
          />
        </div>
      </div>
    </div>
  );
});

export const SequenceChomperGame: React.FC<SequenceChomperProps> = ({ 
  onComplete, 
  onExit,
  isMusicEnabled,
  setIsMusicEnabled,
  selectedMusicStyle,
  setSelectedMusicStyle,
  volume,
  setVolume
}) => {
  const [gameState, setGameState] = useState<'LEVEL_SELECT' | 'PLAYING' | 'GAME_OVER' | 'VICTORY'>('LEVEL_SELECT');
  const [isLoading, setIsLoading] = useState(false);
  const [sequences, setSequences] = useState<BibleSequence[]>(INITIAL_SEQUENCES);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [items, setItems] = useState<string[]>([]);
  const [nextWordIndex, setNextWordIndex] = useState(0);
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [fallingHearts, setFallingHearts] = useState<FallingHeart[]>([]);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [lives, setLives] = useState(5);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loopCount, setLoopCount] = useState(1);
  const [startLoop, setStartLoop] = useState(1);
  const [avatarPos, setAvatarPos] = useState({ x: 50, y: 80 });
  const [highScores, setHighScores] = useState<Record<number, number>>({});
  const [maxLoops, setMaxLoops] = useState<Record<number, number>>({});
  const [unlockedLevels, setUnlockedLevels] = useState<number>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [startLoops, setStartLoops] = useState<Record<number, number>>({});
  const [showTutorial, setShowTutorial] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showSpeedUp, setShowSpeedUp] = useState(false);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [heartBreaks, setHeartBreaks] = useState<HeartBreak[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const fallingWordsRef = useRef<FallingWord[]>([]);
  const fallingHeartsRef = useRef<FallingHeart[]>([]);
  const monstersRef = useRef<Monster[]>([]);
  const nextHeartSpawnRef = useRef<number>(0);
  const nextMonsterSpawnRef = useRef<number>(0);

  useEffect(() => {
    if (explosions.length > 0) {
      const timer = setTimeout(() => setExplosions(prev => prev.slice(1)), 1000);
      return () => clearTimeout(timer);
    }
  }, [explosions]);

  useEffect(() => {
    if (heartBreaks.length > 0) {
      const timer = setTimeout(() => setHeartBreaks(prev => prev.slice(1)), 1000);
      return () => clearTimeout(timer);
    }
  }, [heartBreaks]);

  const prevLoopCount = useRef(loopCount);
  const sessionRef = useRef<SavedSession | null>(null);
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
  const itemsRef = useRef(items);
  const nextWordIndexRef = useRef(nextWordIndex);
  const loopCountRef = useRef(loopCount);
  const avatarPosRef = useRef(avatarPos);
  const streakRef = useRef(streak);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { showTutorialRef.current = showTutorial; }, [showTutorial]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { nextWordIndexRef.current = nextWordIndex; }, [nextWordIndex]);
  useEffect(() => { loopCountRef.current = loopCount; }, [loopCount]);
  useEffect(() => { avatarPosRef.current = avatarPos; }, [avatarPos]);
  useEffect(() => { streakRef.current = streak; }, [streak]);

  useEffect(() => {
    if (loopCount > prevLoopCount.current && gameState === 'PLAYING' && !showTutorial) {
      setShowSpeedUp(true);
      const timer = setTimeout(() => setShowSpeedUp(false), 1500);
      return () => clearTimeout(timer);
    }
    prevLoopCount.current = loopCount;
  }, [loopCount, gameState, showTutorial]);

  useEffect(() => {
    const savedScores = localStorage.getItem('sequence_chomper_scores');
    if (savedScores) setHighScores(JSON.parse(savedScores));
    
    const savedMaxLoops = localStorage.getItem('sequence_chomper_max_loops');
    if (savedMaxLoops) {
      const parsed = JSON.parse(savedMaxLoops);
      setMaxLoops(parsed);
      setStartLoops(parsed);
    }
    
    const savedProgress = localStorage.getItem('sequence_chomper_progress');
    if (savedProgress) setUnlockedLevels(parseInt(savedProgress));

    const savedSeqs = localStorage.getItem('sequence_chomper_sequences');
    if (savedSeqs) setSequences(JSON.parse(savedSeqs));

    const skip = localStorage.getItem('sequence_chomper_skip_tutorial');
    if (skip === 'true') setDontShowAgain(true);

    const saved = localStorage.getItem('sequence_chomper_saved_session');
    if (saved) {
      try {
        setSavedSession(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved session", e);
      }
    }
  }, []);

  useEffect(() => {
    if (gameState === 'PLAYING' && !isPaused) {
      const saveInterval = setInterval(() => {
        if (sessionRef.current) {
          localStorage.setItem('sequence_chomper_saved_session', JSON.stringify(sessionRef.current));
        }
      }, 5000);
      return () => clearInterval(saveInterval);
    }
  }, [gameState, isPaused]);

  const playSound = useCallback((freq: number, type: OscillatorType, dur: number, vol: number = 0.2) => {
    // Sound effects are still local but respect a prop or global state if needed
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
  }, []);

  const playChompSound = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      playSound(440, 'sine', 0.1, 0.4);
      setTimeout(() => playSound(660, 'sine', 0.1, 0.3), 50);
    } else {
      playSound(220, 'triangle', 0.2, 0.5);
    }
  }, [playSound]);

  // Audio playback effect - removed as it's now universal

  const saveProgress = (levelId: number, newScore: number, currentLoop: number) => {
    const updatedScores = { ...highScores, [levelId]: Math.max(highScores[levelId] || 0, newScore) };
    setHighScores(updatedScores);
    localStorage.setItem('sequence_chomper_scores', JSON.stringify(updatedScores));
    const updatedMaxLoops = { ...maxLoops, [levelId]: Math.max(maxLoops[levelId] || 1, currentLoop) };
    setMaxLoops(updatedMaxLoops);
    localStorage.setItem('sequence_chomper_max_loops', JSON.stringify(updatedMaxLoops));
    setStartLoops(prev => ({ ...prev, [levelId]: Math.max(prev[levelId] || 1, currentLoop) }));
    if (levelId === unlockedLevels && currentLoop >= 8 && levelId < sequences.length) {
      const nextLevel = levelId + 1;
      setUnlockedLevels(nextLevel);
      localStorage.setItem('sequence_chomper_progress', nextLevel.toString());
    }
  };

  const startLevel = async (idx: number, resumeSession?: SavedSession) => {
    const sequence = sequences[idx];
    setItems(sequence.items);
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
      const levelStartLoop = startLoops[sequence.id] || 1;
      setNextWordIndex(0);
      setLives(5);
      setScore(0);
      setStreak(0);
      setLoopCount(levelStartLoop);
      prevLoopCount.current = levelStartLoop;
      setStartLoop(levelStartLoop);
      nextWordToSpawnRef.current = 0;
      localStorage.removeItem('sequence_chomper_saved_session');
      setSavedSession(null);
    }
    fallingWordsRef.current = [];
    setFallingWords([]);
    setCurrentLevelIdx(idx);
    setIsPaused(false);
    distractorsRemainingRef.current = 0;
    lastTimeRef.current = 0;
    setGameState('PLAYING');
    if (!dontShowAgain && !resumeSession) setShowTutorial(true);
  };

  const handleGenerateNewLevel = async () => {
    setIsGenerating(true);
    try {
      const lastBook = sequences[sequences.length - 1]?.book || "Genesis";
      const newSeqs = await generateBibleSequences(lastBook, 5);
      const updatedSeqs = [...sequences, ...newSeqs];
      setSequences(updatedSeqs);
      localStorage.setItem('sequence_chomper_sequences', JSON.stringify(updatedSeqs));
    } catch (error) {
      console.error("Failed to generate new levels", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const spawnWord = useCallback(() => {
    const currentItems = itemsRef.current;
    if (currentItems.length === 0) return;
    let isCorrect = false;
    let wordIdx = -1;
    if (distractorsRemainingRef.current <= 0) {
      isCorrect = true;
      wordIdx = nextWordToSpawnRef.current;
      nextWordToSpawnRef.current = (nextWordToSpawnRef.current + 1) % currentItems.length;
      distractorsRemainingRef.current = Math.floor(Math.random() * 2) + 2;
    } else {
      isCorrect = false;
      const nextNeededWord = currentItems[nextWordIndexRef.current].toLowerCase();
      const wrongIndices = currentItems.map((_, i) => i).filter(i => currentItems[i].toLowerCase() !== nextNeededWord);
      if (wrongIndices.length > 0) {
        wordIdx = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
      } else {
        wordIdx = (nextWordIndexRef.current + 1) % currentItems.length;
      }
      distractorsRemainingRef.current--;
    }
    const wordToSpawn = currentItems[wordIdx];
    const totalWords = currentItems.length;
    const currentProgressQuarters = totalWords > 0 ? Math.floor((nextWordIndexRef.current / totalWords) * 4) : 0;
    const totalQuarters = (loopCountRef.current - 1) * 4 + currentProgressQuarters;
    const baseSpeed = 0.675 * Math.pow(1.0355, totalQuarters);

    const newFallingWord: FallingWord = {
      id: Date.now() + Math.random(),
      text: wordToSpawn,
      x: Math.random() * 80 + 10,
      y: -10,
      speed: baseSpeed,
      isCorrect: isCorrect,
      wordIndex: wordIdx
    };
    fallingWordsRef.current.push(newFallingWord);
    setFallingWords([...fallingWordsRef.current]);
  }, []);

  const spawnHeart = useCallback(() => {
    const totalWords = itemsRef.current.length;
    const currentProgressQuarters = totalWords > 0 ? Math.floor((nextWordIndexRef.current / totalWords) * 4) : 0;
    const totalQuarters = (loopCountRef.current - 1) * 4 + currentProgressQuarters;
    const baseSpeed = 0.675 * Math.pow(1.0355, totalQuarters);

    const newHeart: FallingHeart = {
      id: Date.now() + Math.random(),
      x: Math.random() * 80 + 10,
      y: -10,
      speed: baseSpeed * 0.8
    };

    fallingHeartsRef.current.push(newHeart);
    setFallingHearts([...fallingHeartsRef.current]);
    nextHeartSpawnRef.current = Date.now() + 20000 + Math.random() * 20000;
  }, []);

  const spawnMonster = useCallback(() => {
    const totalWords = itemsRef.current.length;
    const currentProgressQuarters = totalWords > 0 ? Math.floor((nextWordIndexRef.current / totalWords) * 4) : 0;
    const totalQuarters = (loopCountRef.current - 1) * 4 + currentProgressQuarters;
    const baseSpeed = 0.675 * Math.pow(1.0355, totalQuarters);

    const newMonster: Monster = {
      id: Date.now() + Math.random(),
      x: Math.random() * 80 + 10,
      y: -10,
      speed: baseSpeed * 1.2
    };

    monstersRef.current.push(newMonster);
    setMonsters([...monstersRef.current]);
    nextMonsterSpawnRef.current = Date.now() + 8000 + Math.random() * 12000;
  }, []);

  const updateGame = useCallback((time: number) => {
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current || showTutorialRef.current) {
      if (isPausedRef.current || showTutorialRef.current) {
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(updateGame);
      }
      return;
    }
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = Math.min(time - lastTimeRef.current, 32);
    lastTimeRef.current = time;

    if (time - lastSpawnTime.current > 600) {
      spawnWord();
      lastSpawnTime.current = time;
    }

    // Spawn hearts and monsters
    const now = Date.now();
    if (now > nextHeartSpawnRef.current) {
      spawnHeart();
    }
    if (now > nextMonsterSpawnRef.current) {
      spawnMonster();
    }

    const currentAvatarPos = avatarPosRef.current;

    // Update hearts
    setFallingHearts(prev => {
      const next: FallingHeart[] = [];
      let heartsCaught = 0;
      for (const h of prev) {
        const newY = h.y + (h.speed * (dt / 16));
        if (newY > 105) continue;

        const dx = h.x - currentAvatarPos.x;
        const dy = newY - currentAvatarPos.y;
        if (dx * dx + dy * dy < 81) {
          heartsCaught++;
          continue;
        }
        next.push({ ...h, y: newY });
      }
      if (heartsCaught > 0) {
        setLives(l => Math.min(l + heartsCaught, 10));
      }
      fallingHeartsRef.current = next;
      return next;
    });

    // Update monsters
    setMonsters(prev => {
      const next: Monster[] = [];
      let monstersHit = 0;
      for (const m of prev) {
        const newY = m.y + (m.speed * (dt / 16));
        if (newY > 105) continue;

        const dx = m.x - currentAvatarPos.x;
        const dy = newY - currentAvatarPos.y;
        if (dx * dx + dy * dy < 100) {
          monstersHit++;
          setHeartBreaks(prevHb => [...prevHb, { id: Date.now() + Math.random(), x: currentAvatarPos.x, y: currentAvatarPos.y }]);
          setHeartBreaks(prevHb => [...prevHb, { id: Date.now() + Math.random(), x: currentAvatarPos.x + 5, y: currentAvatarPos.y - 5 }]);
          continue;
        }
        next.push({ ...m, y: newY });
      }
      if (monstersHit > 0) {
        setLives(l => {
          const nl = l - (monstersHit * 2);
          if (nl <= 0) setGameState('GAME_OVER');
          return Math.max(0, nl);
        });
        setStreak(0);
      }
      monstersRef.current = next;
      return next;
    });

    const prev = fallingWordsRef.current;
    const next: FallingWord[] = [];
    let activeNextWordIdx = nextWordIndexRef.current;
    const currentLoop = loopCountRef.current;
    const currentStreak = streakRef.current;

    let livesLost = 0;
    let scoreGained = 0;
    let nextWordAdvanced = false;
    let streakIncrement = 0;
    let streakReset = false;
    let caughtWord: FallingWord | null = null;
    let missedWordPos: {x: number, y: number} | null = null;

    for (const w of prev) {
      const newY = w.y + (w.speed * (dt / 16));
      if (newY > 105) {
        if (w.isCorrect && w.wordIndex === activeNextWordIdx) {
          livesLost++;
          streakReset = true;
          nextWordToSpawnRef.current = activeNextWordIdx;
        }
        continue;
      }
      const dx = w.x - currentAvatarPos.x;
      const dy = newY - currentAvatarPos.y;
      if (dx * dx + dy * dy < 81) {
        if (w.isCorrect && w.wordIndex === activeNextWordIdx) {
          caughtWord = w;
          scoreGained += (10 * currentLoop * (currentStreak >= 10 ? 2 : 1));
          nextWordAdvanced = true;
          streakIncrement++;
          activeNextWordIdx = (activeNextWordIdx + 1) % itemsRef.current.length;
        } else {
          missedWordPos = { x: currentAvatarPos.x, y: currentAvatarPos.y };
          livesLost++;
          streakReset = true;
        }
        continue;
      }
      next.push({ ...w, y: newY });
    }

    // Apply state updates
    fallingWordsRef.current = next;
    setFallingWords([...next]);

    if (caughtWord) {
      playChompSound(true);
      setExplosions(prevExp => [...prevExp, { id: Date.now() + Math.random(), x: caughtWord!.x, y: caughtWord!.y + (caughtWord!.speed * (dt / 16)) }]);
    }
    if (missedWordPos) {
      playChompSound(false);
      setHeartBreaks(prevHb => [...prevHb, { id: Date.now() + Math.random(), x: missedWordPos!.x, y: missedWordPos!.y }]);
    }

    if (livesLost > 0) {
      setLives(l => {
        const nl = l - livesLost;
        if (nl <= 0) setGameState('GAME_OVER');
        return Math.max(0, nl);
      });
    }
    if (scoreGained > 0) setScore(s => s + scoreGained);
    if (streakReset) setStreak(0);
    if (streakIncrement > 0) {
      setStreak(s => {
        const ns = s + streakIncrement;
        if (ns % 10 === 0) setLives(l => Math.min(5, l + 1));
        return ns;
      });
    }
    if (nextWordAdvanced) {
      setNextWordIndex(ni => {
        const nextIdx = (ni + 1) % itemsRef.current.length;
        if (nextIdx === 0) setLoopCount(lc => lc + 1);
        return nextIdx;
      });
    }

    requestRef.current = requestAnimationFrame(updateGame);
  }, [spawnWord, playChompSound]);

  useEffect(() => {
    if (gameState === 'PLAYING') requestRef.current = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, isPaused, updateGame]);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!gameAreaRef.current || gameState !== 'PLAYING' || isPaused) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setAvatarPos({ 
      x: Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100)), 
      y: Math.max(10, Math.min(95, ((clientY - rect.top) / rect.height) * 100)) 
    });
  };

  return (
    <div className="flex flex-col h-dvh bg-slate-950 text-white font-sans overflow-hidden relative select-none">
      {gameState === 'LEVEL_SELECT' && (
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">Sequence Chomper</h1>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Master the Order</p>
            </div>
          </div>
          <button onClick={onExit} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"><X size={20} /></button>
        </div>
      )}

      {gameState === 'LEVEL_SELECT' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic text-amber-400">Sequence Chomper</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Catch the sequence items in order.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sequences.map((seq, idx) => {
                const isLocked = seq.id > unlockedLevels && idx >= 20; // Only lock generated ones if needed, or follow unlockedLevels
                const isPassed = (maxLoops[seq.id] || 0) >= 8;
                return (
                  <motion.div
                    key={seq.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => startLevel(idx)}
                    className={cn(
                      "p-6 rounded-3xl border-2 bg-slate-900 border-white/10 hover:border-amber-500/50 cursor-pointer flex flex-col h-full",
                      isPassed && "border-yellow-500/50 shadow-xl shadow-yellow-500/10"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-black text-white">{idx + 1}</div>
                      {isPassed && <Trophy size={20} className="text-yellow-500" />}
                    </div>
                    <h3 className="font-black text-lg text-white mb-1">{seq.title}</h3>
                    <p className="text-xs text-slate-500 mb-4">{seq.description}</p>
                    <div className="mt-auto flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>{seq.book}</span>
                      {highScores[seq.id] > 0 && <span className="text-amber-400">PB: {highScores[seq.id]}</span>}
                    </div>
                  </motion.div>
                );
              })}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={handleGenerateNewLevel}
                disabled={isGenerating}
                className="p-6 rounded-3xl border-2 border-dashed border-white/20 hover:border-amber-500/50 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-amber-400 transition-all"
              >
                {isGenerating ? (
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={32} />
                    <span className="font-black uppercase tracking-widest text-sm">Generate New Levels</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div ref={gameAreaRef} onMouseMove={handleMouseMove} onTouchMove={handleMouseMove} className="flex-1 relative overflow-hidden cursor-none touch-none">
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-amber-500 rounded-full text-slate-950 font-black text-xs uppercase">Level {currentLevelIdx + 1}</div>
                <div className="px-3 py-1 bg-white/10 rounded-full text-white font-black text-xs uppercase">Loop {loopCount}</div>
              </div>
              <h2 className="font-black text-xl tracking-tighter uppercase italic">{sequences[currentLevelIdx].title}</h2>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md mr-2">
                  <Music className={cn("w-3.5 h-3.5", isMusicEnabled ? "text-amber-400" : "text-white/20")} />
                  <select 
                    value={selectedMusicStyle}
                    onChange={(e) => setSelectedMusicStyle(e.target.value)}
                    className="bg-transparent text-white text-[10px] font-bold uppercase tracking-widest outline-none border-none cursor-pointer"
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
                  <div className="w-px h-3 bg-white/10 mx-1" />
                  <button 
                    onClick={() => setIsMusicEnabled(!isMusicEnabled)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {isMusicEnabled ? <Volume2 size={14} className="text-white" /> : <VolumeX size={14} className="text-white/40" />}
                  </button>
                </div>
                <button onClick={() => setIsPaused(!isPaused)} className="p-2 bg-white/10 rounded-xl">{isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}</button>
                <div className="flex gap-1">{[...Array(Math.max(5, lives))].map((_, i) => <Heart key={i} size={20} className={cn(i < lives ? "text-rose-500 fill-rose-500" : "text-slate-800")} />)}</div>
              </div>
              <div className="text-3xl font-black text-amber-400">{score}</div>
            </div>
          </div>
          <SequenceProgressBar items={items} nextWordIndex={nextWordIndex} loopCount={loopCount} />
          {fallingWords.map(w => <FallingWordItem key={w.id} word={w} />)}
          {fallingHearts.map(h => <FallingHeartItem key={h.id} heart={h} />)}
          {monsters.map(m => <MonsterItem key={m.id} monster={m} />)}
          {explosions.map(e => <ExplosionEffect key={e.id} x={e.x} y={e.y} />)}
          {heartBreaks.map(h => <HeartBreakEffect key={h.id} x={h.x} y={h.y} />)}
          <Avatar pos={avatarPos} streak={streak} loopCount={loopCount} />
          <AnimatePresence>
            {showTutorial && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-6"
              >
                <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500/30 rounded-[2.5rem] p-8 shadow-2xl shadow-amber-500/10 text-center space-y-8">
                  <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 rotate-3">
                    <Zap size={40} className="text-slate-950" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Mission Briefing</h2>
                    <p className="text-amber-400 font-bold uppercase tracking-widest text-xs">Sequence: {sequences[currentLevelIdx].title}</p>
                  </div>

                  <div className="space-y-4 text-left">
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0 mt-1">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <h4 className="font-black text-sm uppercase">The Objective</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">Catch the sequence items in the correct biblical order. Use your mouse or touch to move.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center shrink-0 mt-1">
                        <AlertCircle size={18} />
                      </div>
                      <div>
                        <h4 className="font-black text-sm uppercase">The Danger</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">Catching the wrong item or missing the correct one costs a life. You have 5 lives.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button 
                      onClick={() => setShowTutorial(false)}
                      className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform"
                    >
                      START MISSION
                    </button>
                    
                    <button 
                      onClick={() => {
                        setDontShowAgain(true);
                        localStorage.setItem('sequence_chomper_skip_tutorial', 'true');
                        setShowTutorial(false);
                      }}
                      className="text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                    >
                      Don't show this again
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showSpeedUp && (
              <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="absolute top-24 left-0 right-0 flex justify-center z-50 pointer-events-none">
                <div className="bg-amber-500 text-slate-950 px-6 py-2 rounded-full font-black text-xl italic uppercase tracking-tighter shadow-2xl border-2 border-white/20">
                  {loopCount === 8 ? "LEVEL PASSED!" : `LOOP ${loopCount} START!`}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {isPaused && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-center space-y-6">
                <Pause size={48} className="text-amber-500 mx-auto" />
                <h2 className="text-4xl font-black uppercase italic">Paused</h2>
                <button onClick={() => setIsPaused(false)} className="px-12 py-4 bg-white text-slate-950 rounded-2xl font-black text-xl">RESUME</button>
                <button onClick={() => setGameState('LEVEL_SELECT')} className="block w-full text-slate-400 font-bold uppercase text-xs">Quit Game</button>
              </div>
            </div>
          )}
        </div>
      )}

      {gameState === 'GAME_OVER' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
          <AlertCircle size={64} className="text-rose-500" />
          <h2 className="text-5xl font-black uppercase italic tracking-tighter">Out of Lives</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest">Score: {score} • Loop: {loopCount}</p>
          <button onClick={() => startLevel(currentLevelIdx)} className="px-12 py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-2xl flex items-center gap-3"><RotateCcw size={24} /> TRY AGAIN</button>
          <button onClick={() => { saveProgress(sequences[currentLevelIdx].id, score, loopCount); setGameState('LEVEL_SELECT'); }} className="text-slate-400 font-bold uppercase tracking-widest text-xs">Back to Levels</button>
        </div>
      )}
    </div>
  );
};
