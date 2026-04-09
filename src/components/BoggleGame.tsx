import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, VolumeX, Music } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';
import { Verse, Difficulty } from '../types';

// --- Boggle Logic ---

const generateBoggleGrid = (words: string[], verseText: string) => {
  const targetWords = words.map(w => w.toUpperCase()).sort((a, b) => b.length - a.length);
  
  // Fixed size of 5x5 as requested
  let size = 5;

  const cleanVerse = verseText.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const letterPool = Array.from(new Set(cleanVerse.split(""))).filter(l => l.length > 0);
  
  if (letterPool.length === 0) {
    return { 
      grid: Array(size).fill(null).map(() => Array(size).fill('A')), 
      placedWords: [] 
    };
  }

  const directions = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  // --- Phase 1: Greedy Skeleton Seeding ---
  let currentGrid: (string | null)[][] = Array(size).fill(null).map(() => Array(size).fill(null));

  const placeWordGreedy = (word: string, grid: (string | null)[][]): boolean => {
    const visited = Array(size).fill(null).map(() => Array(size).fill(false));
    const backtrack = (r: number, c: number, idx: number): boolean => {
      if (idx === word.length) return true;
      if (r < 0 || r >= size || c < 0 || c >= size || visited[r][c]) return false;
      
      const char = word[idx];
      const existing = grid[r][c];
      if (existing !== null && existing !== char) return false;
      
      const oldChar = grid[r][c];
      grid[r][c] = char;
      visited[r][c] = true;
      
      const shuffledDirs = [...directions].sort(() => Math.random() - 0.5);
      for (const [dr, dc] of shuffledDirs) {
        if (backtrack(r + dr, c + dc, idx + 1)) return true;
      }
      
      grid[r][c] = oldChar;
      visited[r][c] = false;
      return false;
    };

    const starts = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        starts.push([r, c]);
      }
    }
    starts.sort(() => Math.random() - 0.5);
    for (const [r, c] of starts) {
      if (backtrack(r, c, 0)) return true;
    }
    return false;
  };

  // Seed the grid with as many words as possible (starting with longest)
  for (const word of targetWords) {
    placeWordGreedy(word, currentGrid);
  }

  const fillRemainingWithSmartLetters = (grid: (string | null)[][]) => {
    return grid.map(row => 
      row.map(char => char || letterPool[Math.floor(Math.random() * letterPool.length)])
    );
  };

  let workingGrid: string[][] = fillRemainingWithSmartLetters(currentGrid);

  const solve = (grid: string[][]): string[] => {
    const found = new Set<string>();
    const dfs = (r: number, c: number, word: string, idx: number, visited: boolean[][]): boolean => {
      if (idx === word.length) return true;
      if (r < 0 || r >= size || c < 0 || c >= size || visited[r][c] || grid[r][c] !== word[idx]) return false;
      visited[r][c] = true;
      for (const [dr, dc] of directions) {
        if (dfs(r + dr, c + dc, word, idx + 1, visited)) {
          visited[r][c] = false;
          return true;
        }
      }
      visited[r][c] = false;
      return false;
    };

    for (const word of targetWords) {
      let wordFound = false;
      const visited = Array(size).fill(null).map(() => Array(size).fill(false));
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (dfs(r, c, word, 0, visited)) {
            found.add(word);
            wordFound = true;
            break;
          }
        }
        if (wordFound) break;
      }
    }
    return Array.from(found);
  };

  let bestWords = solve(workingGrid);
  let bestGrid = workingGrid.map(row => [...row]);
  let bestScore = bestWords.reduce((acc, w) => acc + (w.length * w.length), 0);
  let previousScore = bestScore;

  let temp = 10.0;
  const coolingRate = 0.99995;

  for (let i = 0; i < 100000; i++) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    const oldChar = workingGrid[r][c];
    
    workingGrid[r][c] = letterPool[Math.floor(Math.random() * letterPool.length)];
    
    const currentWords = solve(workingGrid);
    const currentScore = currentWords.reduce((acc, w) => acc + (w.length * w.length), 0);
    
    const delta = currentScore - previousScore;
    if (delta >= 0 || Math.random() < Math.exp(delta / temp)) {
      previousScore = currentScore;
      if (currentScore > bestScore) {
        bestScore = currentScore;
        bestWords = currentWords;
        bestGrid = workingGrid.map(row => [...row]);
      }
    } else {
      workingGrid[r][c] = oldChar;
    }
    
    temp *= coolingRate;
    if (bestWords.length === targetWords.length) break;
  }

  return { grid: bestGrid, placedWords: bestWords };
};

export const BoggleGame = ({ 
  verse, 
  onComplete, 
  onExit, 
  difficulty, 
  setDifficulty,
  isMusicEnabled,
  setIsMusicEnabled,
  selectedMusicStyle,
  setSelectedMusicStyle,
  volume,
  setVolume
}: { 
  verse: Verse, 
  onComplete: (xp: number) => void, 
  onExit: () => void, 
  difficulty: Difficulty, 
  setDifficulty: (d: Difficulty) => void,
  isMusicEnabled: boolean,
  setIsMusicEnabled: (v: boolean) => void,
  selectedMusicStyle: string,
  setSelectedMusicStyle: (v: string) => void,
  volume: number,
  setVolume: (v: number) => void
}) => {
  const allPossibleWords = useMemo(() => {
    const cleanText = verse.text.replace(/[.,!?;:"'()\[\]]/g, "");
    return Array.from(new Set(cleanText.split(/\s+/).filter(w => w.length >= 3).map(w => w.toUpperCase())));
  }, [verse]);

  const verseParts = useMemo(() => {
    return verse.text.split(/(\s+)/);
  }, [verse.text]);

  const [grid, setGrid] = useState<string[][]>([]);
  const [wordsToFind, setWordsToFind] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [currentSelection, setCurrentSelection] = useState<{r: number, c: number}[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generatingMessage, setGeneratingMessage] = useState("Weaving the verse into the grid...");
  const gridRef = useRef<HTMLDivElement>(null);

  const generatingMessages = [
    "Weaving the verse into the grid...",
    "Searching 100,000 combinations...",
    "Finding the perfect overlaps...",
    "Packing the Word into the grid...",
    "Optimizing for maximum density...",
    "Aligning the letters...",
    "Simulating annealing process...",
    "Polishing the board..."
  ];

  useEffect(() => {
    setIsGenerating(true);
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % generatingMessages.length;
      setGeneratingMessage(generatingMessages[msgIndex]);
    }, 800);

    const timer = setTimeout(() => {
      const { grid: newGrid, placedWords } = generateBoggleGrid(allPossibleWords, verse.text);
      setGrid(newGrid);
      setWordsToFind(placedWords);
      setFoundWords(new Set());
      setTimeLeft(60);
      setIsGameOver(false);
      setIsGenerating(false);
      clearInterval(msgInterval);
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(msgInterval);
    };
  }, [verse, allPossibleWords]);

  useEffect(() => {
    if (timeLeft > 0 && !isGameOver) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setIsGameOver(true);
    }
  }, [timeLeft, isGameOver]);

  const currentWord = useMemo(() => {
    return currentSelection.map(pos => grid[pos.r][pos.c]).join('');
  }, [currentSelection, grid]);

  const handleTouchStart = (r: number, c: number) => {
    if (isGameOver) return;
    setIsDragging(true);
    setCurrentSelection([{r, c}]);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || isGameOver || !gridRef.current) return;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = gridRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const gridSize = grid.length;
    const cellSize = rect.width / gridSize;
    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);

    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      const centerX = (c + 0.5) * cellSize;
      const centerY = (r + 0.5) * cellSize;
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      if (dist > cellSize * 0.4) return;

      const last = currentSelection[currentSelection.length - 1];
      if (last.r === r && last.c === c) return;

      const alreadySelected = currentSelection.some(pos => pos.r === r && pos.c === c);
      if (alreadySelected) {
        if (currentSelection.length > 1) {
          const secondLast = currentSelection[currentSelection.length - 2];
          if (secondLast.r === r && secondLast.c === c) {
            setCurrentSelection(prev => prev.slice(0, -1));
          }
        }
        return;
      }

      const dr = Math.abs(r - last.r);
      const dc = Math.abs(c - last.c);
      if (dr <= 1 && dc <= 1) {
        setCurrentSelection(prev => [...prev, {r, c}]);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      if (wordsToFind.includes(currentWord) && !foundWords.has(currentWord)) {
        setFoundWords(prev => new Set([...prev, currentWord]));
        setTimeLeft(prev => prev + 5);
        
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#3b82f6', '#8b5cf6', '#ec4899']
        });
      }
      setIsDragging(false);
      setCurrentSelection([]);
    }
  };

  const allFound = wordsToFind.length > 0 && foundWords.size === wordsToFind.length;
  useEffect(() => {
    if (allFound) {
      setIsGameOver(true);
    }
  }, [allFound]);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 p-8 bg-slate-950 rounded-3xl shadow-2xl border-2 border-slate-800 h-full text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)] animate-pulse" />
        
        <div className="relative">
          <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin [animation-direction:reverse]" />
          </div>
        </div>

        <div className="text-center space-y-4 relative z-10">
          <h3 className="text-2xl font-black italic tracking-tighter text-blue-400 animate-bounce">
            GENERATING GRID
          </h3>
          <div className="h-8 flex items-center justify-center">
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 duration-500">
              {generatingMessage}
            </p>
          </div>
        </div>

        <div className="w-full max-w-xs bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '100%', backgroundSize: '200% 100%' }} />
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}} />
      </div>
    );
  }

  if (isGameOver) {
    const xpMultiplier = difficulty === 'hard' ? 2.5 : difficulty === 'medium' ? 1.5 : 1;
    const timeBonus = Math.floor(timeLeft / 2);
    const finalXP = Math.round((foundWords.size * xpMultiplier + timeBonus) * (allFound ? 2 : 1));

    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-6 bg-slate-950 rounded-3xl shadow-xl border-2 border-slate-800 h-full text-white overflow-y-auto">
        <div className="text-center w-full">
          <h3 className={cn("text-4xl font-black mb-4 italic tracking-tighter", allFound ? "text-green-500" : "text-rose-500")}>
            {allFound ? "MISSION COMPLETE" : "TIME EXPIRED"}
          </h3>
          
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 mb-6 text-left">
            <p className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-2">The Verse</p>
            <p className="text-lg font-bold leading-tight mb-2 italic">"{verse.text}"</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              — {verse.book} {verse.chapter}:{verse.verse}
            </p>
          </div>

          <div className="flex justify-around items-center mb-6">
            <div className="text-center">
              <div className="text-5xl font-black text-white tracking-tighter">{foundWords.size}</div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.1em] text-[10px]">Words Found</p>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-5xl font-black text-blue-400 tracking-tighter">+{finalXP}</div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.1em] text-[10px]">XP Earned</p>
            </div>
          </div>

          <div className="bg-blue-600/20 border border-blue-500/30 px-4 py-2 rounded-xl inline-block mb-6">
            <span className="text-blue-400/60 text-[10px] block uppercase tracking-widest font-bold">
              {difficulty === 'hard' ? 'Memory Master' : difficulty === 'medium' ? 'Verse Scholar' : 'Easy Mode'}
            </span>
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
    <div className="flex flex-col h-full bg-slate-950 text-white p-4 select-none overflow-hidden touch-none"
         onMouseUp={handleTouchEnd}
         onMouseLeave={handleTouchEnd}
         onTouchEnd={handleTouchEnd}>
      
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time</span>
          <span className={cn("text-xl font-black tabular-nums", timeLeft < 10 ? "text-rose-500 animate-pulse" : "text-white")}>
            {timeLeft}s
          </span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-1">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  "px-2 py-1 rounded-lg font-black text-[8px] uppercase tracking-tighter transition-all border",
                  difficulty === d 
                    ? "bg-indigo-500 border-indigo-400 text-white shadow-lg" 
                    : "bg-slate-900 border-slate-800 text-slate-500 hover:border-indigo-500/50"
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
            <Music className={cn("w-3 h-3", isMusicEnabled ? "text-blue-400" : "text-white/20")} />
            <select 
              value={selectedMusicStyle}
              onChange={(e) => setSelectedMusicStyle(e.target.value)}
              className="bg-transparent text-white text-[8px] font-bold uppercase tracking-widest outline-none border-none cursor-pointer"
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
            <button 
              onClick={() => setIsMusicEnabled(!isMusicEnabled)}
              className="p-0.5 hover:bg-white/10 rounded transition-colors"
            >
              {isMusicEnabled ? <Volume2 size={10} className="text-white" /> : <VolumeX size={10} className="text-white/40" />}
            </button>
          </div>
        </div>

        <button 
          onClick={onExit}
          className="p-1 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verse Words in Grid</span>
          <span className="text-xl font-black text-blue-400">{foundWords.size}/{wordsToFind.length}</span>
        </div>
      </div>

      <div className="bg-slate-900/50 p-3 rounded-xl mb-3 border border-white/5 flex flex-wrap justify-center gap-x-1 gap-y-0.5 max-h-[25vh] overflow-y-auto">
        {verseParts.map((part, i) => {
          const clean = part.toUpperCase().replace(/[^A-Z]/g, "");
          const isInGrid = wordsToFind.includes(clean);
          const isFound = foundWords.has(clean);
          
          if (part.trim() === "") return <span key={i} className="w-1"></span>;

          let displayContent = part;
          let isHidden = false;

          if (!isFound) {
            if (difficulty === 'hard') {
              isHidden = true;
            } else if (difficulty === 'medium' && isInGrid) {
              isHidden = true;
            }
          }

          if (isHidden) {
            displayContent = part.replace(/[A-Za-z]/g, "_");
          }

          return (
            <span 
              key={i} 
              className={cn(
                "text-sm font-bold transition-all duration-300 px-0.5 rounded",
                isFound 
                  ? "bg-green-500/30 text-green-400 scale-105" 
                  : isInGrid 
                    ? difficulty === 'easy' 
                      ? "text-blue-400 border-b border-blue-500/50" 
                      : "text-slate-500"
                    : difficulty === 'hard'
                      ? "text-slate-700"
                      : "text-slate-300"
              )}
            >
              {displayContent}
            </span>
          );
        })}
        <div className="w-full text-[9px] text-slate-600 font-bold text-center mt-1 uppercase tracking-widest">
          {verse.book} {verse.chapter}:{verse.verse}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <div 
          ref={gridRef}
          className={cn(
            "grid gap-1.5 w-full max-w-[360px] aspect-square mb-4 grid-cols-5",
          )}
          onMouseMove={handleTouchMove}
          onTouchMove={handleTouchMove}
        >
          {grid.map((row, r) => row.map((char, c) => {
            const isSelected = currentSelection.some(pos => pos.r === r && pos.c === c);
            const isLast = currentSelection.length > 0 && currentSelection[currentSelection.length - 1].r === r && currentSelection[currentSelection.length - 1].c === c;
            
            return (
              <div
                key={`${r}-${c}`}
                data-boggle-cell
                data-r={r}
                data-c={c}
                onMouseDown={() => handleTouchStart(r, c)}
                onTouchStart={() => handleTouchStart(r, c)}
                className={cn(
                  "relative flex items-center justify-center text-2xl font-black rounded-xl border-b-4 transition-all cursor-pointer",
                  isSelected 
                    ? "bg-white border-blue-400 text-blue-600 scale-95 shadow-[0_0_20px_rgba(59,130,246,0.5)]" 
                    : "bg-slate-800 border-slate-950 text-slate-200 hover:brightness-110"
                )}
                style={{ 
                  borderColor: isSelected ? '#3b82f6' : undefined,
                  backgroundColor: isSelected ? '#ffffff' : undefined,
                  color: isSelected ? '#3b82f6' : undefined
                }}
              >
                {char}
                {isLast && (
                  <motion.div 
                    layoutId="selection-glow"
                    className="absolute inset-0 bg-blue-400/20 rounded-xl blur-md"
                  />
                )}
              </div>
            );
          }))}
        </div>

        <div className="h-14 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {currentWord && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white font-black text-2xl tracking-widest shadow-[0_10px_20px_rgba(37,99,235,0.3)] border border-white/20"
              >
                {currentWord}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
