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
  { id: 1, reference: "John 3:16", title: "God's Love", moves: 30 },
  { id: 2, reference: "Psalm 23:1", title: "The Good Shepherd", moves: 25 },
  { id: 3, reference: "Genesis 1:1", title: "The Beginning", moves: 15 },
  { id: 4, reference: "Philippians 4:13", title: "Strength", moves: 20 },
  { id: 5, reference: "Romans 8:28", title: "God's Purpose", moves: 30 },
  { id: 6, reference: "Proverbs 3:5", title: "Trust", moves: 25 },
  { id: 7, reference: "Matthew 6:33", title: "The Kingdom First", moves: 30 },
  { id: 8, reference: "John 14:6", title: "The Way", moves: 20 },
  { id: 9, reference: "Joshua 1:9", title: "Courage", moves: 25 },
  { id: 10, reference: "Jeremiah 29:11", title: "A Future and a Hope", moves: 30 },
  { id: 11, reference: "Ephesians 2:8", title: "By Grace", moves: 25 },
  { id: 12, reference: "1 John 4:8", title: "God is Love", moves: 15 },
  { id: 13, reference: "Psalm 119:105", title: "The Lamp", moves: 20 },
  { id: 14, reference: "Romans 3:23", title: "All Have Sinned", moves: 20 },
  { id: 15, reference: "Romans 6:23", title: "The Gift of God", moves: 25 },
  { id: 16, reference: "Acts 1:8", title: "Witnesses", moves: 25 },
  { id: 17, reference: "Matthew 28:19", title: "The Great Commission", moves: 35 },
  { id: 18, reference: "Galatians 5:22", title: "Fruit of the Spirit", moves: 35 },
  { id: 19, reference: "1 Corinthians 13:4", title: "Love is Patient", moves: 30 },
  { id: 20, reference: "Hebrews 11:1", title: "Faith", moves: 20 }
];

const GRID_SIZE = 5;

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
  const [gameState, setGameState] = useState<'LEVEL_SELECT' | 'PLAYING' | 'VICTORY' | 'GAMEOVER'>('LEVEL_SELECT');
  const [verse, setVerse] = useState<{ reference: string, text: string } | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [grid, setGrid] = useState<CrushWord[][]>([]);
  const [collectedWordIndices, setCollectedWordIndices] = useState<Set<number>>(new Set());
  const [movesLeft, setMovesLeft] = useState(0);
  const [movesTaken, setMovesTaken] = useState(0);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{ row: number, col: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState<number>(1);
  const [highScores, setHighScores] = useState<Record<number, number>>({});
  const [bestMoves, setBestMoves] = useState<Record<number, number>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load progress
  useEffect(() => {
    const savedScores = localStorage.getItem('verse_crush_scores');
    if (savedScores) setHighScores(JSON.parse(savedScores));
    
    const savedBestMoves = localStorage.getItem('verse_crush_best_moves');
    if (savedBestMoves) setBestMoves(JSON.parse(savedBestMoves));
    
    const savedProgress = localStorage.getItem('verse_crush_progress');
    if (savedProgress) setUnlockedLevels(parseInt(savedProgress));

    const skipTutorial = localStorage.getItem('verse_crush_skip_tutorial');
    if (!skipTutorial) setShowTutorial(true);
  }, []);

  const saveLevelProgress = (levelId: number, newScore: number, moves: number) => {
    const updatedScores = { ...highScores, [levelId]: Math.max(highScores[levelId] || 0, newScore) };
    setHighScores(updatedScores);
    localStorage.setItem('verse_crush_scores', JSON.stringify(updatedScores));

    const updatedBestMoves = { ...bestMoves, [levelId]: bestMoves[levelId] ? Math.min(bestMoves[levelId], moves) : moves };
    setBestMoves(updatedBestMoves);
    localStorage.setItem('verse_crush_best_moves', JSON.stringify(updatedBestMoves));

    if (levelId === unlockedLevels && levelId < CRUSH_LEVELS.length) {
      const nextLevel = levelId + 1;
      setUnlockedLevels(nextLevel);
      localStorage.setItem('verse_crush_progress', nextLevel.toString());
    }
  };

  const resetLevelProgress = (levelId: number) => {
    const updatedScores = { ...highScores };
    delete updatedScores[levelId];
    setHighScores(updatedScores);
    localStorage.setItem('verse_crush_scores', JSON.stringify(updatedScores));

    const updatedBestMoves = { ...bestMoves };
    delete updatedBestMoves[levelId];
    setBestMoves(updatedBestMoves);
    localStorage.setItem('verse_crush_best_moves', JSON.stringify(updatedBestMoves));
  };

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
      setMovesTaken(0);
      setCollectedWordIndices(new Set());
      setScore(0);
      
      // Create initial grid
      const newGrid: CrushWord[][] = [];
      let idCounter = 0;
      
      // Ensure every word is included at least once if possible
      const initialIndices: number[] = [];
      for (let i = 0; i < verseWords.length; i++) {
        initialIndices.push(i);
      }
      // Fill the rest with random indices
      while (initialIndices.length < GRID_SIZE * GRID_SIZE) {
        initialIndices.push(Math.floor(Math.random() * verseWords.length));
      }
      // Shuffle initial indices
      for (let i = initialIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [initialIndices[i], initialIndices[j]] = [initialIndices[j], initialIndices[i]];
      }

      for (let r = 0; r < GRID_SIZE; r++) {
        newGrid[r] = [];
        for (let c = 0; c < GRID_SIZE; c++) {
          const wordIdx = initialIndices.pop()!;
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

      // Track words currently in grid to prioritize missing ones
      const currentWordsInGrid = new Set<number>();
      tempGrid.forEach(row => row.forEach(w => {
        if (!w.isMatched) currentWordsInGrid.add(w.wordIndex);
      }));

      const getRefillIndex = () => {
        // 1. Try words not in grid
        const missing = words.map((_, i) => i).filter(i => !currentWordsInGrid.has(i));
        if (missing.length > 0) {
          // Prioritize uncollected among missing
          const uncollectedMissing = missing.filter(i => !collectedWordIndices.has(i));
          const targetIdx = uncollectedMissing.length > 0 
            ? uncollectedMissing[Math.floor(Math.random() * uncollectedMissing.length)]
            : missing[Math.floor(Math.random() * missing.length)];
          
          currentWordsInGrid.add(targetIdx);
          return targetIdx;
        }
        
        // 2. Try uncollected words (even if already in grid)
        const uncollected = words.map((_, i) => i).filter(i => !collectedWordIndices.has(i));
        if (uncollected.length > 0) {
          return uncollected[Math.floor(Math.random() * uncollected.length)];
        }
        
        // 3. Random
        return Math.floor(Math.random() * words.length);
      };

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
            const wordIdx = getRefillIndex();
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
    setMovesTaken(prev => prev + 1);
    
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
        const level = CRUSH_LEVELS[currentLevelIdx];
        saveLevelProgress(level.id, score, movesTaken);
        setGameState('VICTORY');
      } else if (movesLeft <= 0) {
        setGameState('GAMEOVER');
      }
    }
  }, [collectedWordIndices, words.length, movesLeft, gameState, isProcessing, currentLevelIdx, score, movesTaken]);

  const startGame = () => {
    setGameState('PLAYING');
    setShowTutorial(false);
    loadLevel(currentLevelIdx);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white font-sans relative overflow-hidden select-none touch-none">
      {/* Level Selector */}
      {gameState === 'LEVEL_SELECT' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-6 flex items-center justify-between bg-slate-950/50 backdrop-blur-md border-b border-white/5 z-20">
            <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <Trophy size={16} className="text-amber-500" />
                <span className="font-black text-amber-500">{(Object.values(highScores) as number[]).reduce((a, b) => a + b, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-black tracking-tighter uppercase italic text-amber-400">Verse Crush</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Swap words to assemble the verse. Watch your moves!</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CRUSH_LEVELS.map((level, idx) => {
                  const isLocked = level.id > unlockedLevels;
                  const highScore = highScores[level.id] || 0;
                  const bestMove = bestMoves[level.id] || 0;
                  const isPassed = bestMove > 0;
                  
                  return (
                    <div key={level.id} className="relative group">
                      <motion.div
                        whileHover={!isLocked ? { scale: 1.02, rotate: isPassed ? [0, -1, 1, 0] : 0 } : {}}
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
                        {isPassed && (
                          <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-500/10 blur-3xl rounded-full" />
                            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full" />
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Reset all progress for ${level.title}?`)) {
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
                              <Trophy size={8} />
                              <span>Best Score</span>
                            </div>
                            <div className="text-sm font-black text-white">{highScore.toLocaleString()}</div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 text-slate-500 font-black text-[8px] uppercase tracking-widest">
                              <Zap size={8} />
                              <span>Best Moves</span>
                            </div>
                            <div className="text-sm font-black text-amber-400">{bestMove || '-'}</div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-slate-950/80 backdrop-blur-md text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Swap adjacent words • Match sequences • Assemble the full verse
            </p>
          </div>
        </div>
      )}

      {gameState !== 'LEVEL_SELECT' && (
        <>
          {/* HUD */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-slate-950/80 to-transparent">
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
                  "px-3 py-1.5 rounded-xl text-base font-black transition-all duration-500 border-2 uppercase tracking-tighter",
                  collectedWordIndices.has(i) 
                    ? cn(
                        WORD_BG_COLORS[i % WORD_BG_COLORS.length],
                        WORD_TEXT_COLORS[i % WORD_TEXT_COLORS.length],
                        "border-current shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-110 z-10"
                      )
                    : "bg-slate-800/50 text-slate-600 border-transparent opacity-50"
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
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
        <div className="aspect-square w-full max-w-2xl bg-slate-900 rounded-[2rem] sm:rounded-[3rem] p-2 sm:p-4 border-4 border-slate-800 shadow-2xl relative">
          <div className="grid grid-cols-5 grid-rows-5 gap-1.5 sm:gap-3 h-full w-full">
            {grid.map((row, r) => (
              row.map((word, c) => (
                <motion.button
                  key={word.id}
                  layoutId={`word-${word.id}`}
                  onClick={() => handleWordClick(r, c)}
                  className={cn(
                    "relative rounded-xl sm:rounded-2xl flex items-center justify-center p-1 sm:p-2 text-xs sm:text-lg md:text-2xl font-black uppercase tracking-tighter transition-all border-2",
                    selectedWord?.row === r && selectedWord?.col === c 
                      ? "bg-white text-slate-950 scale-110 z-10 shadow-[0_0_30px_rgba(255,255,255,0.8)] border-white" 
                      : cn(
                          WORD_BG_COLORS[word.wordIndex % WORD_BG_COLORS.length],
                          WORD_TEXT_COLORS[word.wordIndex % WORD_TEXT_COLORS.length],
                          "hover:brightness-125"
                        ),
                    word.isMatched && "opacity-0 scale-0"
                  )}
                  initial={false}
                  animate={{
                    scale: word.isMatched ? 0 : 1,
                    opacity: word.isMatched ? 0 : 1,
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
                  <Zap size={32} className="text-amber-400" />
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-center mb-6 tracking-tight uppercase">Mission Briefing</h3>
              
              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-amber-400 font-bold">1</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    <span className="text-white font-bold">Swap Words.</span> Click two adjacent words to swap them.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-rose-400 font-bold">2</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    <span className="text-white font-bold">Match Sequences.</span> Form sequences of 2-5 words that appear in the verse (Left-to-Right or Top-to-Bottom).
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-blue-400 font-bold">3</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    <span className="text-white font-bold">Assemble the Verse.</span> Collect every word in the verse before you run out of moves!
                  </p>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowTutorial(false);
                  localStorage.setItem('verse_crush_skip_tutorial', 'true');
                }}
                className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
              >
                I'M READY
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )}

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
                      const nextIdx = currentLevelIdx + 1;
                      setCurrentLevelIdx(nextIdx);
                      loadLevel(nextIdx);
                    } else {
                      setGameState('LEVEL_SELECT');
                    }
                  }}
                  className="w-full py-5 bg-amber-500 text-slate-950 rounded-2xl font-black text-2xl shadow-lg hover:brightness-110 transition-all active:scale-95 uppercase italic"
                >
                  Next Verse
                </button>
                <button 
                  onClick={() => {
                    onUpdateXP(score);
                    setGameState('LEVEL_SELECT');
                  }}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-lg hover:bg-slate-700 transition-all uppercase italic"
                >
                  Back to Levels
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
                  onClick={() => setGameState('LEVEL_SELECT')}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-lg hover:bg-slate-700 transition-all uppercase italic"
                >
                  Back to Levels
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
