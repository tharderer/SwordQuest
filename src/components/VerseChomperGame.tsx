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
}

interface Enemy {
  id: number;
  type: 'STATIC' | 'CHASER' | 'BAR';
  x: number;
  y: number;
  vx: number;
  vy: number;
  symbol: string;
  width?: number;
}

interface ChomperLevel {
  id: number;
  reference: string;
  title: string;
}

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
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [avatarPos, setAvatarPos] = useState({ x: 50, y: 80 }); // Percentage
  const [highScores, setHighScores] = useState<Record<number, number>>({});
  const [maxLoops, setMaxLoops] = useState<Record<number, number>>({});
  const [unlockedLevels, setUnlockedLevels] = useState<number>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isJumbled, setIsJumbled] = useState(false);
  const [showSpeedUp, setShowSpeedUp] = useState(false);
  const prevLoopCount = useRef(loopCount);
  
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
    if (savedMaxLoops) setMaxLoops(JSON.parse(savedMaxLoops));
    
    const savedProgress = localStorage.getItem('verse_chomper_progress');
    if (savedProgress) setUnlockedLevels(parseInt(savedProgress));

    const skip = localStorage.getItem('verse_chomper_skip_tutorial');
    if (skip === 'true') setDontShowAgain(true);
  }, []);

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

    if (levelId === unlockedLevels && levelId < CHOMPER_LEVELS.length) {
      const nextLevel = levelId + 1;
      setUnlockedLevels(nextLevel);
      localStorage.setItem('verse_chomper_progress', nextLevel.toString());
    }
  };

  const startLevel = async (idx: number) => {
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
        setNextWordIndex(0);
        setFallingWords([]);
        setEnemies([]);
        setLives(5);
        setScore(0);
        setStreak(0);
        setLoopCount(startLoop);
        prevLoopCount.current = startLoop;
        setCurrentLevelIdx(idx);
        setIsPaused(false);
        nextWordToSpawnRef.current = 0;
        distractorsRemainingRef.current = 0;
        lastTimeRef.current = 0;
        setAudioUrl(hymnUrls[Math.floor(Math.random() * hymnUrls.length)]);
        
        setGameState('PLAYING');
        if (!dontShowAgain) {
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
      // Base speed increases with loop count
      speed: (0.6 + (loopCountRef.current * 0.2)) * (Math.random() * 0.4 + 0.8),
      isCorrect: isCorrect,
      wordIndex: wordIdx
    };

    setFallingWords(prev => [...prev, newFallingWord]);
  }, []);

  const spawnEnemy = useCallback(() => {
    const loop = loopCountRef.current;
    if (loop < 2) return;

    setEnemies(prev => {
      // Limit number of enemies
      if (prev.length >= Math.min(3, loop - 1)) return prev;

      const id = Date.now() + Math.random();
      let newEnemy: Enemy;

      if (loop === 2) {
        newEnemy = {
          id,
          type: 'STATIC',
          x: Math.random() * 80 + 10,
          y: Math.random() * 40 + 20,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          symbol: '#'
        };
      } else if (loop === 3) {
        newEnemy = {
          id,
          type: 'CHASER',
          x: Math.random() > 0.5 ? 0 : 100,
          y: Math.random() * 100,
          vx: 0,
          vy: 0,
          symbol: 'O'
        };
      } else {
        newEnemy = {
          id,
          type: 'BAR',
          x: 50,
          y: Math.random() * 40 + 30,
          vx: 0.15,
          vy: 0,
          symbol: '---',
          width: 30
        };
      }

      return [...prev, newEnemy];
    });
  }, []);

  const updateGame = useCallback((time: number) => {
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

    // Spawn logic - faster as loops progress
    const spawnRate = Math.max(300, 1000 - (loopCountRef.current * 100));
    if (time - lastSpawnTime.current > spawnRate) {
      spawnWord();
      if (Math.random() < 0.1) spawnEnemy();
      lastSpawnTime.current = time;
    }

    // Enemy movement and collision
    setEnemies(prev => {
      if (prev.length === 0) return prev;
      let hitEnemyType: 'STATIC' | 'CHASER' | 'BAR' | null = null;

      const next = prev.map(e => {
        let nx = e.x + (e.vx * dt);
        let ny = e.y + (e.vy * dt);
        let nvx = e.vx;
        let nvy = e.vy;

        if (e.type === 'STATIC') {
          if (nx < 5) { nx = 5; nvx = Math.abs(nvx); }
          else if (nx > 95) { nx = 95; nvx = -Math.abs(nvx); }
          
          if (ny < 10) { ny = 10; nvy = Math.abs(nvy); }
          else if (ny > 90) { ny = 90; nvy = -Math.abs(nvy); }
        } else if (e.type === 'CHASER') {
          const dx = avatarPosRef.current.x - e.x;
          const dy = avatarPosRef.current.y - e.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            nvx = (dx / dist) * 0.03; // Reduced from 0.05
            nvy = (dy / dist) * 0.03; // Reduced from 0.05
          }
        } else if (e.type === 'BAR') {
          if (nx < 20 || nx > 80) nvx *= -1;
        }

        // Collision with player
        const distToPlayer = Math.sqrt(Math.pow(nx - avatarPosRef.current.x, 2) + Math.pow(ny - avatarPosRef.current.y, 2));
        const collisionDist = e.type === 'BAR' ? 12 : 6;
        if (distToPlayer < collisionDist) {
          hitEnemyType = e.type;
        }

        return { ...e, x: nx, y: ny, vx: nvx, vy: nvy };
      });

      if (hitEnemyType) {
        setLives(l => {
          const nl = l - 1;
          if (nl <= 0) setGameState('GAME_OVER');
          return Math.max(0, nl);
        });
        playChompSound(false);
        
        return []; // Clear enemies on hit
      }

      return next;
    });

    setFallingWords(prev => {
      if (prev.length === 0) return prev;
      
      let livesLost = 0;
      let scoreGained = 0;
      let nextWordAdvanced = false;
      let streakReset = false;
      let streakIncrement = 0;

      const next = prev.map(w => ({ ...w, y: w.y + (w.speed * (dt / 16)) })).filter(w => {
        // Check if correct word fell through
        if (w.y > 105) {
          if (w.isCorrect && w.wordIndex === nextWordIndexRef.current) {
            livesLost++;
            streakReset = true;
            // Reset spawn ref so the missed word is the next "correct" one to drop
            nextWordToSpawnRef.current = nextWordIndexRef.current;
          }
          return false;
        }
        
        // Collision detection
        const dist = Math.sqrt(Math.pow(w.x - avatarPosRef.current.x, 2) + Math.pow(w.y - avatarPosRef.current.y, 2));
        if (dist < 9) { // Slightly larger chomp radius for better feel
          if (w.isCorrect && w.wordIndex === nextWordIndexRef.current) {
            // Correct chomp!
            playChompSound(true);
            scoreGained += (10 * loopCountRef.current);
            nextWordAdvanced = true;
            streakIncrement++;
          } else {
            // Wrong chomp!
            playChompSound(false);
            livesLost++;
            streakReset = true;
          }
          return false;
        }
        return true;
      });

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
        setStreak(prevStreak => {
          const newStreak = prevStreak + streakIncrement;
          if (newStreak % 10 === 0) setLives(l => Math.min(5, l + 1));
          return newStreak;
        });
      }

      if (nextWordAdvanced) {
        setNextWordIndex(ni => {
          const nextIdx = (ni + 1) % wordsRef.current.length;
          if (nextIdx === 0) {
            setLoopCount(lc => lc + 1);
            setEnemies([]); // Clear enemies on new loop
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
    <div className="flex flex-col h-full bg-slate-950 text-white font-sans overflow-hidden relative select-none">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CHOMPER_LEVELS.map((level, idx) => {
                const isLocked = level.id > unlockedLevels;
                const highScore = highScores[level.id] || 0;
                const maxLoop = maxLoops[level.id] || 1;
                
                return (
                  <div key={level.id} className="relative group">
                    <motion.button
                      whileHover={!isLocked ? { scale: 1.02 } : {}}
                      whileTap={!isLocked ? { scale: 0.98 } : {}}
                      onClick={() => !isLocked && startLevel(idx)}
                      className={cn(
                        "w-full p-6 rounded-3xl border-2 transition-all text-left relative overflow-hidden",
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
                        <div className="flex flex-col items-end gap-1">
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
                      </div>
                      <h3 className="font-black text-lg leading-tight mb-1">{level.title}</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{level.reference}</p>
                    </motion.button>

                    {!isLocked && maxLoop > 1 && (
                      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-950/80 backdrop-blur-sm p-1.5 rounded-xl border border-white/10 z-10">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setStartLoop(prev => Math.max(1, prev - 1));
                          }}
                          className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded-md hover:bg-slate-700 text-white font-black"
                        >
                          -
                        </button>
                        <div className="flex flex-col items-center min-w-[60px]">
                          <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">Start Loop</span>
                          <span className="text-xs font-black text-amber-400">{startLoop}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setStartLoop(prev => Math.min(maxLoop, prev + 1));
                          }}
                          className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded-md hover:bg-slate-700 text-white font-black"
                        >
                          +
                        </button>
                      </div>
                    )}
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
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Heart 
                      key={i} 
                      size={20} 
                      className={cn(i < lives ? "text-rose-500 fill-rose-500" : "text-slate-800")} 
                    />
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-amber-400 leading-none">{score}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</div>
              </div>
            </div>
          </div>

          {/* Verse Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-slate-950/90 to-transparent">
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="flex flex-wrap justify-center gap-1.5 max-h-[120px] overflow-y-auto pb-2 custom-scrollbar">
                {words.map((word, i) => {
                  const isCaught = i < nextWordIndex;
                  const isCurrent = i === nextWordIndex;
                  
                  // Loop 1: Show all words
                  // Loop 2: Show caught words + current word as blank
                  // Loop 3: Show initials
                  // Loop 4+: Show only caught words, others hidden
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
                    // Loop 4+: No bar (handled by opacity 0 for all non-caught)
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

          {/* Falling Words */}
          {fallingWords.map(w => {
            return (
              <div
                key={w.id}
                style={{ 
                  position: 'absolute',
                  left: `${w.x}%`, 
                  top: `${w.y}%`,
                  transform: 'translate3d(-50%, -50%, 0)',
                  pointerEvents: 'none'
                }}
              >
                <div className={cn(
                  "px-4 py-2 rounded-2xl font-black text-lg shadow-xl whitespace-nowrap border-2 transition-transform",
                  "bg-slate-800 text-white border-white/30 opacity-100 shadow-white/5"
                )}>
                  {w.text}
                </div>
              </div>
            );
          })}

          {/* Enemies */}
          {enemies.map(e => (
            <div
              key={e.id}
              style={{
                position: 'absolute',
                left: `${e.x}%`,
                top: `${e.y}%`,
                transform: 'translate3d(-50%, -50%, 0)',
                pointerEvents: 'none',
                zIndex: 25
              }}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-black text-xl shadow-2xl border-2 animate-pulse",
                e.type === 'BAR' ? "w-32 h-4 rounded-full bg-rose-600 border-rose-400" : "bg-rose-600 border-rose-400 text-white"
              )}>
                {e.symbol}
              </div>
            </div>
          ))}

          {/* Avatar (Chomper) */}
          <div
            style={{ 
              position: 'absolute',
              left: `${avatarPos.x}%`, 
              top: `${avatarPos.y}%`,
              transform: 'translate3d(-50%, -50%, 0)',
              pointerEvents: 'none',
              zIndex: 30
            }}
          >
            <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/40 relative overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-slate-950 rounded-full" />
              <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-slate-950 rounded-full" />
              <div className="absolute bottom-2 w-8 h-4 bg-slate-950 rounded-full" />
            </div>
            
            {/* Streak Indicator */}
            {streak >= 5 && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
                {streak} STREAK!
              </div>
            )}
          </div>

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
                  Speed Up!
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
                    <span className="text-white font-bold">Loop for XP.</span> Completing the verse starts a new, faster loop. Keep going to maximize your score!
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
                  <button
                    onClick={() => setIsPaused(false)}
                    className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-2xl hover:bg-amber-400 transition-colors"
                  >
                    RESUME
                  </button>
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
              onClick={() => startLevel(currentLevelIdx)}
              className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-2xl hover:bg-amber-400 transition-colors flex items-center justify-center gap-3"
            >
              <RotateCcw size={24} />
              TRY AGAIN
            </button>
            <button
              onClick={() => {
                saveProgress(CHOMPER_LEVELS[currentLevelIdx].id, score, loopCount);
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
