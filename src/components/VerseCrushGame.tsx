import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Trophy, Play, RotateCcw, X, Zap, Star, ChevronRight, AlertCircle, Pause, Music, Volume2, VolumeX, CheckCircle2, LayoutGrid, ArrowLeft } from 'lucide-react';
import { getVerseByRef, parseReference } from '../lib/bibleDb';
import { cn } from '../lib/utils';

const hymnUrls = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3"
];

interface VerseCrushProps {
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

interface CrushWord {
  id: number;
  text: string;
  row: number;
  col: number;
  wordIndex: number; // Index in the verse
  isMatched: boolean;
}

interface CrushLevel {
  id: number;
  reference: string;
  title: string;
  moves: number;
}

const CRUSH_LEVELS: CrushLevel[] = [
  { id: 1, reference: "John 3:16", title: "God's Love", moves: 25 },
  { id: 2, reference: "Psalm 23:1", title: "The Good Shepherd", moves: 20 },
  { id: 3, reference: "Genesis 1:1", title: "The Beginning", moves: 15 },
  { id: 4, reference: "Philippians 4:13", title: "Strength", moves: 20 },
  { id: 5, reference: "Romans 8:28", title: "God's Purpose", moves: 25 },
  { id: 6, reference: "Proverbs 3:5", title: "Trust", moves: 20 },
  { id: 7, reference: "Matthew 6:33", title: "The Kingdom First", moves: 25 },
  { id: 8, reference: "John 14:6", title: "The Way", moves: 20 },
];

const GRID_SIZE = 5;

export const VerseCrushGame: React.FC<VerseCrushProps> = ({ 
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
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'VICTORY' | 'GAMEOVER'>('IDLE');
  const [verse, setVerse] = useState<{ reference: string, text: string } | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [grid, setGrid] = useState<CrushWord[][]>([]);
  const [collectedWordIndices, setCollectedWordIndices] = useState<Set<number>>(new Set());
  const [movesLeft, setMovesLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [selectedWord, setSelectedWord] = useState<{ row: number, col: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

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
  const loadLevel = useCallback(async (idx: number) => {
    const level = CRUSH_LEVELS[idx];
    const parsed = parseReference(level.reference);
    if (!parsed) return;
    
    const v = await getVerseByRef(parsed.book, parsed.chapter, parsed.startVerse);
    if (v) {
      setVerse(v);
      const verseWords = v.text.split(/\s+/).filter(w => w.length > 0);
      setWords(verseWords);
      setMovesLeft(level.moves);
      setCollectedWordIndices(new Set());
      setScore(0);
      
      // Create initial grid
      const newGrid: CrushWord[][] = [];
      let idCounter = 0;
      for (let r = 0; r < GRID_SIZE; r++) {
        newGrid[r] = [];
        for (let c = 0; c < GRID_SIZE; c++) {
          const wordIdx = Math.floor(Math.random() * verseWords.length);
          newGrid[r][c] = {
            id: idCounter++,
            text: verseWords[wordIdx],
            row: r,
            col: c,
            wordIndex: wordIdx,
            isMatched: false
          };
        }
      }
      setGrid(newGrid);
      setGameState('PLAYING');
    }
  }, []);

  // Check for matches in the grid
  const findMatches = useCallback((currentGrid: CrushWord[][]) => {
    const matchedIndices = new Set<string>(); // "row,col"
    const matchedWordIndicesInVerse = new Set<number>();

    // Horizontal matches
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 1; c++) {
        // Try to find sequences of length 2 to 5
        for (let len = 5; len >= 2; len--) {
          if (c + len > GRID_SIZE) continue;
          
          const sequence = currentGrid[r].slice(c, c + len);
          const verseIndices = sequence.map(w => w.wordIndex);
          
          // Check if verseIndices are sequential in the verse
          let isSequential = true;
          for (let i = 0; i < verseIndices.length - 1; i++) {
            if (verseIndices[i + 1] !== verseIndices[i] + 1) {
              isSequential = false;
              break;
            }
          }

          if (isSequential) {
            for (let i = 0; i < len; i++) {
              matchedIndices.add(`${r},${c + i}`);
              matchedWordIndicesInVerse.add(sequence[i].wordIndex);
            }
            c += len - 1; // Skip the matched words
            break;
          }
        }
      }
    }

    // Vertical matches
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 1; r++) {
        for (let len = 5; len >= 2; len--) {
          if (r + len > GRID_SIZE) continue;
          
          const sequence: CrushWord[] = [];
          for (let i = 0; i < len; i++) {
            sequence.push(currentGrid[r + i][c]);
          }
          
          const verseIndices = sequence.map(w => w.wordIndex);
          
          let isSequential = true;
          for (let i = 0; i < verseIndices.length - 1; i++) {
            if (verseIndices[i + 1] !== verseIndices[i] + 1) {
              isSequential = false;
              break;
            }
          }

          if (isSequential) {
            for (let i = 0; i < len; i++) {
              matchedIndices.add(`${r + i},${c}`);
              matchedWordIndicesInVerse.add(sequence[i].wordIndex);
            }
            r += len - 1;
            break;
          }
        }
      }
    }

    return { matchedIndices, matchedWordIndicesInVerse };
  }, []);

  // Process matches: evaporate, slide down, refill
  const processMatches = useCallback(async (currentGrid: CrushWord[][]) => {
    setIsProcessing(true);
    let tempGrid = JSON.parse(JSON.stringify(currentGrid)) as CrushWord[][];
    let hasMatches = true;
    let totalMatchesFound = 0;

    while (hasMatches) {
      const { matchedIndices, matchedWordIndicesInVerse } = findMatches(tempGrid);
      
      if (matchedIndices.size === 0) {
        hasMatches = false;
        break;
      }

      totalMatchesFound++;
      
      // Update collected words
      setCollectedWordIndices(prev => {
        const next = new Set(prev);
        matchedWordIndicesInVerse.forEach(idx => next.add(idx));
        return next;
      });

      // Mark as matched for animation
      matchedIndices.forEach(pos => {
        const [r, c] = pos.split(',').map(Number);
        tempGrid[r][c].isMatched = true;
      });
      setGrid([...tempGrid]);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Evaporate and slide down
      const newGrid: CrushWord[][] = Array.from({ length: GRID_SIZE }, () => []);
      let idCounter = Math.max(...tempGrid.flat().map(w => w.id)) + 1;

      for (let c = 0; c < GRID_SIZE; c++) {
        const columnWords = [];
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          if (!tempGrid[r][c].isMatched) {
            columnWords.push(tempGrid[r][c]);
          }
        }
        
        // Fill from bottom
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          if (columnWords.length > 0) {
            const word = columnWords.shift()!;
            word.row = r;
            word.col = c;
            newGrid[r][c] = word;
          } else {
            // New word falling in
            const wordIdx = Math.floor(Math.random() * words.length);
            newGrid[r][c] = {
              id: idCounter++,
              text: words[wordIdx],
              row: r,
              col: c,
              wordIndex: wordIdx,
              isMatched: false
            };
          }
        }
      }
      tempGrid = newGrid;
      setGrid([...tempGrid]);
      setScore(prev => prev + (matchedIndices.size * 10));
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsProcessing(false);
    return totalMatchesFound > 0;
  }, [findMatches, words]);

  // Handle word swap
  const handleSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    if (isProcessing || isPaused || gameState !== 'PLAYING') return;

    setMovesLeft(prev => prev - 1);
    
    // Perform swap
    const newGrid = JSON.parse(JSON.stringify(grid)) as CrushWord[][];
    const temp = newGrid[r1][c1];
    newGrid[r1][c1] = newGrid[r2][c2];
    newGrid[r2][c2] = temp;
    
    // Update positions
    newGrid[r1][c1].row = r1;
    newGrid[r1][c1].col = c1;
    newGrid[r2][c2].row = r2;
    newGrid[r2][c2].col = c2;

    setGrid(newGrid);
    await new Promise(resolve => setTimeout(resolve, 300));

    const matched = await processMatches(newGrid);

    if (!matched) {
      // Swap back if no match
      const revertGrid = JSON.parse(JSON.stringify(grid)) as CrushWord[][];
      const temp2 = revertGrid[r1][c1];
      revertGrid[r1][c1] = revertGrid[r2][c2];
      revertGrid[r2][c2] = temp2;
      
      revertGrid[r1][c1].row = r1;
      revertGrid[r1][c1].col = c1;
      revertGrid[r2][c2].row = r2;
      revertGrid[r2][c2].col = c2;
      
      setGrid(revertGrid);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  const handleWordClick = (r: number, c: number) => {
    if (isProcessing || isPaused || gameState !== 'PLAYING') return;

    if (!selectedWord) {
      setSelectedWord({ row: r, col: c });
    } else {
      const { row: sr, col: sc } = selectedWord;
      const isAdjacent = (Math.abs(r - sr) === 1 && c === sc) || (Math.abs(c - sc) === 1 && r === sr);
      
      if (isAdjacent) {
        handleSwap(sr, sc, r, c);
        setSelectedWord(null);
      } else {
        setSelectedWord({ row: r, col: c });
      }
    }
  };

  // Check victory/gameover
  useEffect(() => {
    if (gameState === 'PLAYING' && !isProcessing) {
      if (collectedWordIndices.size === words.length && words.length > 0) {
        setGameState('VICTORY');
      } else if (movesLeft <= 0) {
        setGameState('GAMEOVER');
      }
    }
  }, [collectedWordIndices, words.length, movesLeft, gameState, isProcessing, currentLevelIdx, score]);

  const startGame = () => {
    setGameState('PLAYING');
    setShowTutorial(false);
    loadLevel(currentLevelIdx);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden select-none touch-none">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-slate-950/80 to-transparent">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button onClick={onExit} className="p-2 bg-white/10 rounded-full text-white">
              <ArrowLeft size={20} />
            </button>
            <div className="px-3 py-1 bg-amber-500 rounded-full text-slate-950 font-black text-xs uppercase italic">Level {currentLevelIdx + 1}</div>
          </div>
          <h2 className="font-black text-xl tracking-tighter uppercase italic text-white leading-tight">{verse?.reference}</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2 items-center">
            <button onClick={() => setIsPaused(!isPaused)} className="p-2 bg-white/10 rounded-full text-white">
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>
            <div className="text-3xl font-black text-amber-500 leading-none">{score}</div>
          </div>
          <div className="px-4 py-1 bg-white/10 rounded-full text-white font-bold text-sm">
            Moves: <span className={cn(movesLeft <= 5 ? "text-red-500" : "text-amber-400")}>{movesLeft}</span>
          </div>
        </div>
      </div>

      {/* Verse Progress Display */}
      <div className="mt-24 px-4 mb-4">
        <div className="bg-slate-900/80 p-4 rounded-2xl border-2 border-slate-800 shadow-xl">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {words.map((word, i) => (
              <span 
                key={i}
                className={cn(
                  "px-2 py-1 rounded text-sm font-bold transition-all duration-500",
                  collectedWordIndices.has(i) 
                    ? "bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.5)] scale-105" 
                    : "bg-slate-800 text-slate-500"
                )}
              >
                {word}
              </span>
            ))}
          </div>
          <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${(collectedWordIndices.size / words.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="aspect-square w-full max-w-md bg-slate-900 rounded-3xl p-2 border-4 border-slate-800 shadow-2xl relative">
          <div className="grid grid-cols-5 grid-rows-5 gap-2 h-full w-full">
            {grid.map((row, r) => (
              row.map((word, c) => (
                <motion.button
                  key={word.id}
                  layoutId={`word-${word.id}`}
                  onClick={() => handleWordClick(r, c)}
                  className={cn(
                    "relative rounded-xl flex items-center justify-center p-1 text-[10px] sm:text-xs font-black uppercase tracking-tighter transition-all",
                    selectedWord?.row === r && selectedWord?.col === c 
                      ? "bg-amber-500 text-slate-950 scale-110 z-10 shadow-[0_0_20px_rgba(245,158,11,0.8)]" 
                      : "bg-slate-800 text-white hover:bg-slate-700",
                    word.isMatched && "opacity-0 scale-0"
                  )}
                  initial={false}
                  animate={{
                    scale: word.isMatched ? 0 : 1,
                    opacity: word.isMatched ? 0 : 1,
                  }}
                >
                  <span className="text-center break-words line-clamp-2">{word.text}</span>
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

      {/* Tutorial / Start Screen */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-24 h-24 bg-amber-500 rounded-3xl flex items-center justify-center mb-8 shadow-2xl rotate-3">
              <Zap size={48} className="text-slate-950" fill="currentColor" />
            </div>
            <h1 className="text-6xl font-black text-white mb-4 italic uppercase tracking-tighter leading-none">Verse Crush</h1>
            <p className="text-slate-400 text-lg mb-12 max-w-xs font-medium">
              Swap words to create sequences from the verse. Light up the whole verse to win!
            </p>
            
            <div className="space-y-4 w-full max-w-xs">
              {CRUSH_LEVELS.map((level, idx) => (
                <button
                  key={level.id}
                  onClick={() => {
                    setCurrentLevelIdx(idx);
                    startGame();
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xl border-2 border-slate-800 hover:border-amber-500 hover:text-amber-500 transition-all uppercase italic flex justify-between px-6 items-center"
                >
                  <span>{level.title}</span>
                  <ChevronRight size={24} />
                </button>
              ))}
            </div>
          </motion.div>
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
            <div className="bg-slate-900 rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl border-4 border-amber-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-amber-500" />
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="inline-block mb-6"
              >
                <Trophy className="w-24 h-24 text-amber-500" />
              </motion.div>
              <h2 className="text-5xl font-black mb-2 text-white italic uppercase tracking-tighter italic">Divine Victory!</h2>
              <p className="text-slate-400 mb-8 font-bold">You assembled the entire verse!</p>
              <div className="bg-slate-950 rounded-3xl p-6 mb-8 border-2 border-slate-800">
                <div className="text-sm text-slate-500 uppercase font-black mb-1">Final Score</div>
                <div className="text-5xl font-black text-amber-500">{score}</div>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    onUpdateXP(score);
                    if (currentLevelIdx < CRUSH_LEVELS.length - 1) {
                      setCurrentLevelIdx(prev => prev + 1);
                      loadLevel(currentLevelIdx + 1);
                    } else {
                      onComplete(0); // Exit to dashboard
                    }
                  }}
                  className="w-full py-5 bg-amber-500 text-slate-950 rounded-2xl font-black text-2xl shadow-lg hover:brightness-110 transition-all active:scale-95 uppercase italic"
                >
                  Next Verse
                </button>
                <button 
                  onClick={() => {
                    onUpdateXP(score);
                    onExit();
                  }}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-lg hover:bg-slate-700 transition-all uppercase italic"
                >
                  Back to Menu
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
            <div className="bg-slate-900 rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl border-4 border-red-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
              <div className="inline-block mb-6 text-red-500">
                <AlertCircle size={80} />
              </div>
              <h2 className="text-5xl font-black mb-2 text-white italic uppercase tracking-tighter">Out of Moves</h2>
              <p className="text-slate-400 mb-8 font-bold">Don't give up! Try again.</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => loadLevel(currentLevelIdx)}
                  className="w-full py-5 bg-red-500 text-white rounded-2xl font-black text-2xl shadow-lg hover:brightness-110 transition-all active:scale-95 uppercase italic"
                >
                  Try Again
                </button>
                <button 
                  onClick={onExit}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-lg hover:bg-slate-700 transition-all uppercase italic"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
