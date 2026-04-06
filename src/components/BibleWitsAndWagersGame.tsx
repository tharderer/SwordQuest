import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, User, Bot, Trophy, ArrowRight, RotateCcw, HelpCircle, Sparkles, Database, Play, AlertCircle, Trash2, Timer, Music, Volume2, VolumeX, X } from 'lucide-react';
import { bibleQuestionService, BibleQuestion } from '../services/bibleQuestionService';
import { getVerseByRef } from '../lib/bibleDb';
import { cn } from '../lib/utils';

interface Question {
  text: string;
  answer: number;
}

const DEFAULT_QUESTIONS: Question[] = [
  { text: "How many years did the Israelites wander in the wilderness?", answer: 40 },
  { text: "How many chapters are in the Book of Psalms?", answer: 150 },
  { text: "How many disciples did Jesus have?", answer: 12 },
  { text: "How many days and nights did it rain during the Great Flood?", answer: 40 },
  { text: "How many books are in the New Testament?", answer: 27 },
  { text: "How many years did Jacob work for Laban to marry Rachel?", answer: 14 },
  { text: "How many plagues did God send upon Egypt?", answer: 10 }
];

const BOT_NAMES = ["Peter", "Martha", "Silas", "Lydia", "Barnabas", "Tabitha"];

const MAT_LAYOUT = [
  { label: "All Guesses Too High", odds: 6 },
  { odds: 5 },
  { odds: 4 },
  { odds: 3 },
  { odds: 2 },
  { odds: 3 },
  { odds: 4 },
  { odds: 5 }
];

type GamePhase = 'LOBBY' | 'QUESTION' | 'GUESSING' | 'BETTING' | 'REVEAL' | 'GAME_OVER';

interface Guess {
  playerNames: string[];
  value: number;
  hasUser: boolean;
}

interface Bet {
  playerName: string;
  spotIndex: number;
  isUser: boolean;
  amount?: number;
}

interface RoundHistory {
  round: number;
  question: string;
  answer: number;
  winningGuess: number;
  winningSpotIndex: number;
  bets: {
    playerName: string;
    amount: number;
    spotIndex: number;
    isWinning: boolean;
    guessValue: number | string;
  }[];
}

interface PlayerScore {
  name: string;
  score: number;
  isUser: boolean;
  color: string;
}

const PLAYER_COLORS = [
  "#2563eb", // Blue (User)
  "#dc2626", // Red
  "#16a34a", // Green
  "#ea580c", // Orange
  "#9333ea", // Purple
  "#db2777", // Pink
  "#0d9488", // Teal
];

interface BibleWitsAndWagersGameProps {
  onExit: () => void;
  isMusicEnabled: boolean;
  setIsMusicEnabled: (enabled: boolean) => void;
  selectedMusicStyle: string;
  setSelectedMusicStyle: (style: string) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

export const BibleWitsAndWagersGame: React.FC<BibleWitsAndWagersGameProps> = ({ 
  onExit,
  isMusicEnabled,
  setIsMusicEnabled,
  selectedMusicStyle,
  setSelectedMusicStyle,
  volume,
  setVolume
}) => {
  const [questions, setQuestions] = useState<BibleQuestion[]>([]);
  const [scores, setScores] = useState<PlayerScore[]>(() => [
    { name: "You", score: 0, isUser: true, color: PLAYER_COLORS[0] },
    ...BOT_NAMES.map((name, i) => ({ name, score: 0, isUser: false, color: PLAYER_COLORS[i + 1] }))
  ]);
  const [round, setRound] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('LOBBY');
  const [userGuess, setUserGuess] = useState<string>('');
  const [uniqueGuesses, setUniqueGuesses] = useState<Guess[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [userBets, setUserBets] = useState<Record<number, number>>({});
  const [activeBetSpot, setActiveBetSpot] = useState<number | null>(null);
  const [winningSpotIndex, setWinningSpotIndex] = useState<number | null>(null);
  const [roundResult, setRoundResult] = useState<{ winnings: number; bonus: boolean; message: string; winners?: string[] } | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [dbQuestionCount, setDbQuestionCount] = useState(0);
  const [unseenQuestionCount, setUnseenQuestionCount] = useState(0);
  const [verificationVerse, setVerificationVerse] = useState<string | null>(null);
  const [gameHistory, setGameHistory] = useState<RoundHistory[]>([]);

  useEffect(() => {
    const init = async () => {
      const count = await bibleQuestionService.getQuestionCount();
      const unseen = await bibleQuestionService.getUnseenQuestionCount();
      setDbQuestionCount(count);
      setUnseenQuestionCount(unseen);
    };
    init();
  }, []);

  const currentQuestion = questions[currentQuestionIndex] || { text: "Loading...", answer: 0 };

  const userScore = scores.find(s => s.isUser)?.score || 0;
  const totalUserChips = userScore + 2;
  const userChipsPlaced = (Object.values(userBets) as number[]).reduce((a, b) => a + b, 0);

  const startGame = async () => {
    setGenerationError(null);
    let gameQuestions = await bibleQuestionService.getWitsQuestionsForGame(7);
    
    const unseenCount = await bibleQuestionService.getUnseenQuestionCount();
    
    // Only trigger generation if we are below the threshold (21 unseen questions)
    if (unseenCount < 21) {
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      if (apiKey) {
        if (unseenCount < 7) {
          // Blocking generation: we don't even have enough for one full game
          setIsGenerating(true);
          setGenerationProgress({ current: 0, total: 14 });
          try {
            await bibleQuestionService.generateQuestions(apiKey, (current, total) => {
              setGenerationProgress({ current, total });
            });
            // Re-fetch questions after generation is complete
            gameQuestions = await bibleQuestionService.getWitsQuestionsForGame(7);
            const count = await bibleQuestionService.getQuestionCount();
            const unseen = await bibleQuestionService.getUnseenQuestionCount();
            setDbQuestionCount(count);
            setUnseenQuestionCount(unseen);
          } catch (error: any) {
            console.error("Failed to generate questions:", error);
            setGenerationError("Generation failed. Using fallback questions.");
          } finally {
            setIsGenerating(false);
            setGenerationProgress({ current: 0, total: 0 });
          }
        } else {
          // Background generation: we have enough for this game, but want to stay ahead
          bibleQuestionService.generateQuestions(apiKey).then(async () => {
            const newCount = await bibleQuestionService.getQuestionCount();
            const newUnseen = await bibleQuestionService.getUnseenQuestionCount();
            setDbQuestionCount(newCount);
            setUnseenQuestionCount(newUnseen);
          }).catch(err => console.error("Background generation failed:", err));
        }
      }
    }

    if (!gameQuestions || gameQuestions.length === 0) {
      const fallback = DEFAULT_QUESTIONS.map(q => ({ ...q, book: 'Genesis', chapter: 0, used: false })) as BibleQuestion[];
      gameQuestions = fallback;
    }

    setQuestions(gameQuestions.slice(0, 7));
    
    // Mark all selected questions as used immediately to prevent duplicates in next game
    const selectedIds = gameQuestions.slice(0, 7).map(q => q.id).filter((id): id is number => id !== undefined);
    if (selectedIds.length > 0) {
      await bibleQuestionService.markAsUsed(selectedIds);
      const unseen = await bibleQuestionService.getUnseenQuestionCount();
      setUnseenQuestionCount(unseen);
    }

    setPhase('QUESTION');
    setVerificationVerse(null);
    setRound(1);
    setCurrentQuestionIndex(0);
    setScores(scores.map(s => ({ ...s, score: 0 })));
    setGameHistory([]);
    setTimeLeft(30);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((phase === 'QUESTION' || phase === 'BETTING') && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (phase === 'QUESTION') {
        handleGuessSubmit();
      } else if (phase === 'BETTING') {
        handleReveal();
      }
    }
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const startNewRound = useCallback(async () => {
    if (round >= 7) {
      setPhase('GAME_OVER');
      return;
    }
    setPhase('QUESTION');
    setVerificationVerse(null);
    setUserGuess('');
    setUniqueGuesses([]);
    setBets([]);
    setWinningSpotIndex(null);
    setRoundResult(null);
    setTimeLeft(30);
    setRound(prev => prev + 1);
    setCurrentQuestionIndex((prev) => (prev + 1) % questions.length);
  }, [round, questions]);

  const handleDeleteQuestion = async () => {
    if (!currentQuestion.id) return;
    
    try {
      await bibleQuestionService.deleteQuestion(currentQuestion.id);
      // Update counts after deletion
      const count = await bibleQuestionService.getQuestionCount();
      const unseen = await bibleQuestionService.getUnseenQuestionCount();
      setDbQuestionCount(count);
      setUnseenQuestionCount(unseen);
      
      // Fetch a replacement question, excluding all questions currently in the game
      const currentIds = questions.map(q => q.id).filter((id): id is number => id !== undefined);
      const replacement = await bibleQuestionService.getWitsQuestionsForGame(1, currentIds);
      if (replacement.length > 0) {
        // Mark replacement as used
        if (replacement[0].id) {
          await bibleQuestionService.markAsUsed([replacement[0].id]);
        }
        
        const newQuestions = [...questions];
        newQuestions[currentQuestionIndex] = replacement[0];
        setQuestions(newQuestions);
        
        // Reset round state
        setPhase('QUESTION');
        setVerificationVerse(null);
        setUserGuess('');
        setUniqueGuesses([]);
        setBets([]);
        setWinningSpotIndex(null);
        setRoundResult(null);
        setTimeLeft(30);
      } else {
        // If no replacement available, try to generate
        const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
        if (apiKey) {
          setIsGenerating(true);
          await bibleQuestionService.generateQuestions(apiKey);
          const fresh = await bibleQuestionService.getWitsQuestionsForGame(1, currentIds);
          if (fresh.length > 0) {
            // Mark fresh as used
            if (fresh[0].id) {
              await bibleQuestionService.markAsUsed([fresh[0].id]);
            }
            
            const newQuestions = [...questions];
            newQuestions[currentQuestionIndex] = fresh[0];
            setQuestions(newQuestions);
            
            // Reset round state
            setPhase('QUESTION');
            setVerificationVerse(null);
            setUserGuess('');
            setUniqueGuesses([]);
            setBets([]);
            setWinningSpotIndex(null);
            setRoundResult(null);
            setTimeLeft(30);
          }
          setIsGenerating(false);
        }
      }
    } catch (err) {
      console.error("Failed to delete/replace question:", err);
    }
  };

  const handleGuessSubmit = () => {
    let val = parseInt(userGuess);
    if (isNaN(val)) val = 1; // Default to 1 if no guess entered

    // Generate Bot Guesses
    const rawGuesses: { name: string; value: number }[] = [
      { name: "You", value: val },
      ...BOT_NAMES.map(name => {
        const variance = Math.floor(currentQuestion.answer * 0.6);
        const randomGuess = Math.max(1, currentQuestion.answer + Math.floor(Math.random() * (variance * 2 + 1)) - variance);
        return { name, value: randomGuess };
      })
    ];

    // Group and Sort
    const grouped: { [key: number]: Guess } = {};
    rawGuesses.forEach(rg => {
      if (!grouped[rg.value]) {
        grouped[rg.value] = { playerNames: [], value: rg.value, hasUser: false };
      }
      grouped[rg.value].playerNames.push(rg.name);
      if (rg.name === "You") grouped[rg.value].hasUser = true;
    });

    const sortedUnique = Object.values(grouped).sort((a, b) => a.value - b.value);
    setUniqueGuesses(sortedUnique);
    setUserBets({});
    setActiveBetSpot(null);
    setTimeLeft(60);
    setPhase('BETTING');

    // Calculate valid spots for bots to bet on
    const mapping: (Guess | null)[] = new Array(8).fill(null);
    const n = sortedUnique.length;
    if (n % 2 !== 0) {
      const mid = Math.floor(n / 2);
      mapping[4] = sortedUnique[mid];
      for (let i = 0; i < mid; i++) mapping[4 - (mid - i)] = sortedUnique[i];
      for (let i = mid + 1; i < n; i++) mapping[4 + (i - mid)] = sortedUnique[i];
    } else {
      const midLeft = (n / 2) - 1;
      const midRight = n / 2;
      for (let i = midLeft; i >= 0; i--) mapping[3 - (midLeft - i)] = sortedUnique[i];
      for (let i = midRight; i < n; i++) mapping[5 + (i - midRight)] = sortedUnique[i];
    }
    const validSpots = mapping.map((m, i) => (m || i === 0) ? i : -1).filter(i => i !== -1);

    // Bots place their bets
    const botBets: Bet[] = [];
    BOT_NAMES.forEach(name => {
      const playerScore = scores.find(s => s.name === name)?.score || 0;
      const totalChips = playerScore + 2;
      for (let i = 0; i < totalChips; i++) {
        botBets.push({
          playerName: name,
          spotIndex: validSpots[Math.floor(Math.random() * validSpots.length)],
          isUser: false,
          amount: 1
        });
      }
    });
    setBets(botBets);
  };

  const placeUserChip = (spotIndex: number) => {
    setActiveBetSpot(spotIndex);
  };

  const setUserBetAmount = (spotIndex: number, amount: number) => {
    const otherBets = Object.entries(userBets)
      .filter(([idx]) => parseInt(idx) !== spotIndex)
      .reduce((acc: number, [_, val]) => acc + (val as number), 0);
    
    const maxAllowed = totalUserChips - otherBets;
    const finalAmount = Math.max(0, Math.min(amount, maxAllowed));
    
    setUserBets(prev => ({
      ...prev,
      [spotIndex]: finalAmount
    }));
  };

  const clearUserBets = () => {
    setUserBets({});
    setActiveBetSpot(null);
  };

  // Map unique guesses to mat spots (1-7)
  const getMatMapping = useCallback(() => {
    const mapping: (Guess | null)[] = new Array(8).fill(null);
    const n = uniqueGuesses.length;
    
    if (n === 0) return mapping;

    if (n % 2 !== 0) {
      // Odd: Middle guess at index 4 (2:1)
      const mid = Math.floor(n / 2);
      mapping[4] = uniqueGuesses[mid];
      // Fill left
      for (let i = 0; i < mid; i++) {
        mapping[4 - (mid - i)] = uniqueGuesses[i];
      }
      // Fill right
      for (let i = mid + 1; i < n; i++) {
        mapping[4 + (i - mid)] = uniqueGuesses[i];
      }
    } else {
      // Even: Middle space (index 4) empty
      const midLeft = (n / 2) - 1;
      const midRight = n / 2;
      // Fill left from 3 downwards
      for (let i = midLeft; i >= 0; i--) {
        mapping[3 - (midLeft - i)] = uniqueGuesses[i];
      }
      // Fill right from 5 upwards
      for (let i = midRight; i < n; i++) {
        mapping[5 + (i - midRight)] = uniqueGuesses[i];
      }
    }
    return mapping;
  }, [uniqueGuesses]);

  const handleReveal = async () => {
    setPhase('REVEAL');
    
    // Fetch verification verse
    if (currentQuestion?.book && currentQuestion?.chapter && currentQuestion?.verse) {
      try {
        const verse = await getVerseByRef(currentQuestion.book, currentQuestion.chapter, currentQuestion.verse);
        if (verse) {
          setVerificationVerse(verse.text);
        }
      } catch (err) {
        console.error("Failed to fetch verification verse:", err);
      }
    }

    const oldUserScore = userScore;
    const answer = currentQuestion.answer;
    const mapping = getMatMapping();
    
    // Find winning guess index in uniqueGuesses
    let winningGuessIdx = -1;
    let closestValue = -1;
    uniqueGuesses.forEach((g, i) => {
      if (g.value <= answer && g.value > closestValue) {
        closestValue = g.value;
        winningGuessIdx = i;
      }
    });

    // Find which spot on the mat that guess is in
    let finalWinningSpotIndex = -1;
    if (winningGuessIdx === -1) {
      finalWinningSpotIndex = 0; // All too high
    } else {
      const winningGuess = uniqueGuesses[winningGuessIdx];
      finalWinningSpotIndex = mapping.findIndex(m => m?.value === winningGuess.value);
    }

    setWinningSpotIndex(finalWinningSpotIndex);

    // Record history
    const currentRoundHistory: RoundHistory = {
      round,
      question: currentQuestion.text,
      answer: currentQuestion.answer,
      winningGuess: winningGuessIdx !== -1 ? uniqueGuesses[winningGuessIdx].value : -1,
      winningSpotIndex: finalWinningSpotIndex,
      bets: []
    };

    // Add user bets to history
    Object.entries(userBets).forEach(([spotIdx, amount]) => {
      const amt = amount as number;
      if (amt > 0) {
        const spot = parseInt(spotIdx);
        currentRoundHistory.bets.push({
          playerName: "You",
          amount: amt,
          spotIndex: spot,
          isWinning: spot === finalWinningSpotIndex,
          guessValue: spot === 0 ? "Too High" : (mapping[spot]?.value || "---")
        });
      }
    });

    // Add bot bets to history
    const botBetsBySpot: Record<number, Record<string, number>> = {};
    bets.forEach(b => {
      if (!botBetsBySpot[b.spotIndex]) botBetsBySpot[b.spotIndex] = {};
      botBetsBySpot[b.spotIndex][b.playerName] = (botBetsBySpot[b.spotIndex][b.playerName] || 0) + 1;
    });

    Object.entries(botBetsBySpot).forEach(([spotIdx, players]) => {
      const spot = parseInt(spotIdx);
      Object.entries(players).forEach(([playerName, amount]) => {
        currentRoundHistory.bets.push({
          playerName,
          amount,
          spotIndex: spot,
          isWinning: spot === finalWinningSpotIndex,
          guessValue: spot === 0 ? "Too High" : (mapping[spot]?.value || "---")
        });
      });
    });

    setGameHistory(prev => [...prev, currentRoundHistory]);

    // Calculate payouts and bonuses
    const newScores = scores.map(s => ({ ...s }));
    
    // 1. Payouts for bots
    newScores.filter(s => !s.isUser).forEach(player => {
      const playerBets = bets.filter(b => b.playerName === player.name);
      const totalChipsBet = playerBets.length;
      if (totalChipsBet === 0) return;

      const winningBets = playerBets.filter(b => b.spotIndex === finalWinningSpotIndex);
      const winningChipsCount = winningBets.length;
      
      const odds = MAT_LAYOUT[finalWinningSpotIndex].odds;
      const winnings = winningChipsCount * odds;
      
      const losingChips = totalChipsBet - winningChipsCount;
      player.score = Math.max(0, player.score - losingChips + winnings);
    });

    // 2. Payouts for User
    const userPlayer = newScores.find(s => s.isUser)!;
    const userTotalChipsBet = userChipsPlaced;
    const userWinningChipsCount = (userBets[finalWinningSpotIndex] as number) || 0;
    const odds = MAT_LAYOUT[finalWinningSpotIndex].odds;
    const userWinnings = userWinningChipsCount * odds;

    const userLosingChips = userTotalChipsBet - userWinningChipsCount;
    userPlayer.score = Math.max(0, userPlayer.score - userLosingChips + userWinnings);

    // 3. Bonus for winning guess (+1 point)
    let userGotBonus = false;
    const winners: string[] = [];
    if (winningGuessIdx !== -1) {
      const winningGuessObj = uniqueGuesses[winningGuessIdx];
      winningGuessObj.playerNames.forEach(name => {
        winners.push(name);
        const playerIdx = newScores.findIndex(s => s.name === name);
        if (playerIdx !== -1) {
          newScores[playerIdx].score += 1;
          if (name === "You") userGotBonus = true;
        }
      });
    }

    setScores(newScores);
    
    const userNetPoints = userPlayer.score - oldUserScore;
    
    setRoundResult({
      winnings: userWinnings,
      bonus: userGotBonus,
      winners,
      message: (userNetPoints > 0)
        ? `Blessed! You gained ${userNetPoints} Points!` 
        : userNetPoints < 0
          ? `Alas, you lost ${Math.abs(userNetPoints)} points.`
          : "Alas, no points gained this round."
    });
  };

  const matMapping = getMatMapping();

  return (
    <div className="h-[100dvh] bg-[#FDFCF0] font-sans text-[#2c1e11] p-2 sm:p-4 flex flex-col items-center overflow-hidden">
      {/* Header */}
      {phase !== 'LOBBY' && (
        <div className="w-full max-w-2xl flex flex-wrap justify-between items-center gap-2 mb-4 sm:mb-8 bg-[#f4e4bc] p-3 sm:p-4 rounded-2xl border-2 border-[#d4af37] shadow-md">
          <div className="flex items-center gap-2 text-[#2c1e11]">
            <Trophy className="text-[#d4af37] w-5 h-5 sm:w-6 sm:h-6" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold uppercase tracking-tight leading-none">Wits & Wagers</h1>
              <p className="text-[8px] sm:text-[10px] font-bold opacity-60">Round {round} of 7</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-xl border border-[#d4af37]/30 backdrop-blur-md">
              <Music className={cn("w-3.5 h-3.5", isMusicEnabled ? "text-[#d4af37]" : "text-[#2c1e11]/20")} />
              <select 
                value={selectedMusicStyle}
                onChange={(e) => setSelectedMusicStyle(e.target.value)}
                className="bg-transparent text-[#2c1e11] text-[10px] font-bold uppercase tracking-widest outline-none border-none cursor-pointer"
              >
                <option value="hymns" className="bg-[#f4e4bc]">Hymns</option>
                <option value="gospel" className="bg-[#f4e4bc]">Gospel</option>
                <option value="acoustic" className="bg-[#f4e4bc]">Acoustic</option>
                <option value="ambient" className="bg-[#f4e4bc]">Ambient</option>
                <option value="lofi" className="bg-[#f4e4bc]">Lo-Fi</option>
                <option value="classical" className="bg-[#f4e4bc]">Classical</option>
                <option value="retro" className="bg-[#f4e4bc]">Retro</option>
                <option value="epic" className="bg-[#f4e4bc]">Epic</option>
              </select>
              <div className="w-px h-3 bg-[#2c1e11]/10 mx-1" />
              <button 
                onClick={() => setIsMusicEnabled(!isMusicEnabled)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isMusicEnabled ? <Volume2 size={14} className="text-[#2c1e11]" /> : <VolumeX size={14} className="text-[#2c1e11]/40" />}
              </button>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 bg-white/50 px-2 sm:px-4 py-1 rounded-full border border-[#d4af37]">
              <Coins className="text-[#d4af37] w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-bold text-xs sm:text-base whitespace-nowrap">{totalUserChips} Chips</span>
            </div>
            <button 
              onClick={onExit}
              className="w-8 h-8 rounded-lg bg-white/30 hover:bg-white/50 flex items-center justify-center transition-colors border border-[#d4af37]/20"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Scoreboard */}
      {phase !== 'LOBBY' && (phase === 'BETTING' || phase === 'REVEAL') && (
        <div className="w-full max-w-2xl mb-4 overflow-x-auto custom-scrollbar pb-2">
          <div className="flex sm:grid sm:grid-cols-7 gap-2 min-w-max sm:min-w-0">
            {scores.map(s => (
              <div 
                key={s.name} 
                className={`p-1.5 sm:p-2 rounded-lg border text-center transition-all min-w-[60px] sm:min-w-0 ${s.isUser ? 'border-[#d4af37] shadow-sm' : 'border-[#d4af37]/20'}`}
                style={{ backgroundColor: s.isUser ? '#d4af37' : `${s.color}15`, color: s.isUser ? 'white' : s.color }}
              >
                <p className="text-[7px] sm:text-[8px] font-bold uppercase truncate">{s.name}</p>
                <p className="text-xs font-black">{s.score + 2}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <main className={`w-full max-w-2xl flex-1 flex flex-col min-h-0 ${phase === 'LOBBY' ? '' : 'bg-[#f4e4bc] rounded-3xl p-4 sm:p-6 border-4 border-[#d4af37] shadow-2xl relative overflow-hidden'}`}>
        {phase !== 'LOBBY' && (
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/parchment.png')]" />
        )}

        <AnimatePresence mode="wait">
          {phase === 'LOBBY' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center min-h-0 py-4 space-y-6 sm:space-y-8 text-center"
            >
              <div className="space-y-3 sm:space-y-4">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-[#d4af37] rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <HelpCircle className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                </div>
                <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase">
                  Bible <span className="text-[#d4af37]">Wits</span> & Wagers
                </h1>
                <p className="text-[10px] sm:text-sm font-bold opacity-60 uppercase tracking-[0.2em]">The Ultimate Biblical Trivia Challenge</p>
                
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-4 sm:px-6 py-2 sm:py-3 bg-white/40 rounded-2xl border border-[#d4af37]/20 backdrop-blur-md mx-auto w-fit">
                  <div className="flex items-center gap-2">
                    <Music className={cn("w-4 h-4 sm:w-5 sm:h-5", isMusicEnabled ? "text-[#d4af37]" : "text-[#2c1e11]/20")} />
                    <select 
                      value={selectedMusicStyle}
                      onChange={(e) => setSelectedMusicStyle(e.target.value)}
                      className="bg-transparent text-[#2c1e11] text-[10px] sm:text-xs font-bold uppercase tracking-widest outline-none border-none cursor-pointer"
                    >
                      <option value="hymns" className="bg-[#f4e4bc]">Hymns</option>
                      <option value="gospel" className="bg-[#f4e4bc]">Gospel</option>
                      <option value="acoustic" className="bg-[#f4e4bc]">Acoustic</option>
                      <option value="ambient" className="bg-[#f4e4bc]">Ambient</option>
                      <option value="lofi" className="bg-[#f4e4bc]">Lo-Fi</option>
                      <option value="classical" className="bg-[#f4e4bc]">Classical</option>
                      <option value="retro" className="bg-[#f4e4bc]">Retro</option>
                      <option value="epic" className="bg-[#f4e4bc]">Epic</option>
                    </select>
                  </div>
                  <div className="w-px h-4 bg-[#2c1e11]/10 mx-1 sm:mx-2" />
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsMusicEnabled(!isMusicEnabled)}
                      className="p-1 sm:p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                      {isMusicEnabled ? <Volume2 size={16} className="text-[#2c1e11]" /> : <VolumeX size={16} className="text-[#2c1e11]/40" />}
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={volume} 
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-16 sm:w-24 h-1 bg-[#2c1e11]/20 rounded-full appearance-none cursor-pointer accent-[#d4af37]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-sm">
                <div className="bg-white/40 p-3 sm:p-4 rounded-2xl border border-[#d4af37]/20 flex flex-col items-center space-y-1">
                  <Database className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37]" />
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase opacity-50">Total Bank</span>
                  <span className="text-lg sm:text-xl font-black">{dbQuestionCount}</span>
                </div>
                <div className="bg-white/40 p-3 sm:p-4 rounded-2xl border border-[#d4af37]/20 flex flex-col items-center space-y-1">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37]" />
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase opacity-50">Unseen</span>
                  <span className="text-lg sm:text-xl font-black text-[#d4af37]">{unseenQuestionCount}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-xs">
                <button
                  onClick={startGame}
                  disabled={isGenerating}
                  className="group relative w-full py-4 sm:py-5 bg-[#d4af37] text-white rounded-2xl font-black text-lg sm:text-xl shadow-2xl hover:bg-[#b8962e] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-80"
                >
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-base sm:text-lg uppercase tracking-widest">Generating...</span>
                      </div>
                      {generationProgress.total > 0 && (
                        <div className="w-32 sm:w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-white"
                            initial={{ width: 0 }}
                            animate={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                          />
                        </div>
                      )}
                      <span className="text-[8px] sm:text-[10px] font-bold opacity-80 uppercase tracking-tighter">
                        {generationProgress.current}/{generationProgress.total} Questions Found
                      </span>
                    </div>
                  ) : (
                    <>
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                      START GAME
                    </>
                  )}
                </button>
              </div>

              {generationError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-2 sm:p-3 rounded-xl text-[10px] sm:text-xs font-bold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span>{generationError}</span>
                </div>
              )}

              <p className="max-w-xs text-[8px] sm:text-[10px] leading-relaxed opacity-40 uppercase font-bold tracking-widest">
                Questions are generated by AI to be extremely difficult. 
                Searching across all sections of the Bible.
              </p>
            </motion.div>
          )}

          {phase === 'QUESTION' && (
            <motion.div 
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col h-full min-h-0 space-y-4 sm:space-y-6 text-center"
            >
              <div className="flex justify-center shrink-0">
                <div className={`
                  flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-full border-2 sm:border-4 bg-white shadow-xl
                  ${timeLeft <= 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-[#d4af37] text-[#d4af37]'}
                `}>
                  <Timer className="w-6 h-6 sm:w-8 sm:h-8" />
                  <span className="text-2xl sm:text-4xl font-black tabular-nums">{timeLeft}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                <div className="bg-white/40 p-4 sm:p-8 rounded-2xl border-2 border-dashed border-[#d4af37] relative">
                  <HelpCircle className="mx-auto mb-2 sm:mb-4 text-[#d4af37] w-8 h-8 sm:w-12 sm:h-12" />
                  <button 
                    onClick={handleDeleteQuestion}
                    className="absolute top-2 left-2 sm:top-4 sm:left-4 p-1.5 sm:p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete bad question"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <h2 className="text-lg sm:text-2xl font-bold italic leading-tight">
                    "{currentQuestion.text}"
                  </h2>
                </div>
                
                <div className="mt-4 sm:mt-6 space-y-4">
                  <p className="font-bold uppercase text-[10px] sm:text-sm tracking-widest opacity-70">Enter your numeric guess:</p>
                  <input 
                    type="number"
                    inputMode="numeric"
                    value={userGuess}
                    onChange={(e) => setUserGuess(e.target.value)}
                    className="w-full text-center text-2xl sm:text-3xl font-bold p-3 sm:p-4 rounded-xl border-2 border-[#d4af37] bg-white focus:outline-none focus:ring-4 focus:ring-[#d4af37]/20"
                    placeholder="0"
                    autoFocus
                  />
                  <button 
                    onClick={handleGuessSubmit}
                    disabled={!userGuess}
                    className="w-full py-3 sm:py-4 bg-[#d4af37] text-white rounded-xl font-bold text-lg sm:text-xl shadow-lg hover:bg-[#b8962e] transition-all active:scale-95 disabled:opacity-50"
                  >
                    Submit Guess
                  </button>

                  {/* Other Players Waiting */}
                  <div className="pt-4 border-t border-[#d4af37]/20">
                    <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3">Other Players are Waiting...</p>
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {scores.filter(s => !s.isUser).map(bot => (
                        <div key={bot.name} className="flex flex-col items-center gap-1">
                          <div 
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white shadow-md animate-bounce"
                            style={{ backgroundColor: bot.color, animationDelay: `${Math.random() * 2}s` }}
                          >
                            <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                          </div>
                          <span className="text-[7px] sm:text-[8px] font-bold opacity-60">{bot.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {(phase === 'BETTING' || phase === 'REVEAL') && (
            <motion.div 
              key="betting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col h-full min-h-0 space-y-4"
            >
              <div className="text-center relative shrink-0">
                {phase === 'BETTING' && (
                  <div className="flex justify-center mb-2">
                    <div className={`
                      flex items-center gap-2 px-4 py-2 rounded-full border-2 bg-white shadow-lg
                      ${timeLeft <= 10 ? 'border-red-500 text-red-500 animate-pulse' : 'border-[#d4af37] text-[#d4af37]'}
                    `}>
                      <Timer className="w-6 h-6" />
                      <span className="text-2xl font-black tabular-nums">{timeLeft}</span>
                    </div>
                  </div>
                )}
                <h2 className="text-lg font-bold uppercase tracking-widest">
                  {phase === 'BETTING' ? "Place Your Bets!" : "The Reveal"}
                </h2>
                {phase === 'BETTING' && (
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-bold text-[#b8962e]">
                      Chips to place: {totalUserChips - userChipsPlaced}
                    </p>
                    <button 
                      onClick={clearUserBets}
                      className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:underline"
                    >
                      Clear Bets
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 space-y-4 touch-pan-y">
                {phase === 'REVEAL' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-4 sm:p-6 rounded-2xl border-4 border-[#d4af37] text-center space-y-4 relative shrink-0"
                  >
                    <button 
                      onClick={handleDeleteQuestion}
                      className="absolute top-4 left-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete bad question"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">The Question Was:</p>
                      <p className="text-sm font-medium italic leading-tight text-[#2c1e11]">"{currentQuestion.text}"</p>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">The Correct Answer is:</p>
                      <p className="text-5xl font-black text-[#d4af37]">{currentQuestion.answer}</p>
                    </div>
                    
                    {verificationVerse && (
                      <div className="p-4 bg-[#fdfcf0] border-l-4 border-[#d4af37] text-left italic text-sm rounded-r-lg shadow-inner">
                        <p className="mb-2 text-[#2c1e11]">"{verificationVerse}"</p>
                        <p className="text-[10px] font-bold not-italic opacity-60 uppercase tracking-widest">— {currentQuestion.book} {currentQuestion.chapter}:{currentQuestion.verse}</p>
                      </div>
                    )}

                    <p className="font-bold text-lg">{roundResult?.message}</p>
                    {roundResult?.winners && roundResult.winners.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Winning Guess By:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {roundResult.winners.map(name => {
                            const p = scores.find(s => s.name === name);
                            return (
                              <div 
                                key={name}
                                className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-white shadow-sm"
                                style={{ backgroundColor: p?.color }}
                              >
                                {p?.isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                <span>{name}</span>
                                <span className="bg-white/20 px-1 rounded ml-1">+1</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <button 
                      onClick={startNewRound}
                      className="w-full py-4 bg-[#d4af37] text-white rounded-xl font-bold text-xl shadow-lg hover:bg-[#b8962e] transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {round < 7 ? "Next Question" : "See Final Results"} <ArrowRight />
                    </button>
                  </motion.div>
                )}

                <div className="space-y-2">
                  {MAT_LAYOUT.map((spot, idx) => {
                    const isWinning = phase === 'REVEAL' && winningSpotIndex === idx;
                    const guess = matMapping[idx];
                    const userBetAmount = userBets[idx] || 0;
                    const botBets = bets.filter(b => !b.isUser && b.spotIndex === idx);
                    const isActive = activeBetSpot === idx;

                    return (
                      <div 
                        key={idx}
                        onClick={() => phase === 'BETTING' && placeUserChip(idx)}
                        className={`
                          relative flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer min-h-[70px]
                          ${isWinning ? 'bg-green-100 border-green-500 scale-105 shadow-lg z-10' : 'bg-white/60 border-[#d4af37]/30 hover:border-[#d4af37]'}
                          ${phase === 'REVEAL' && !isWinning ? 'opacity-50' : ''}
                          ${!guess && idx !== 0 ? 'bg-gray-100/50 border-dashed border-gray-300 pointer-events-none' : ''}
                          ${isActive ? 'ring-4 ring-[#d4af37]/40 border-[#d4af37]' : ''}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#d4af37] text-white flex flex-col items-center justify-center font-bold text-[10px] sm:text-xs shrink-0">
                            <span>{spot.odds}:1</span>
                            <span className="text-[7px] sm:text-[8px] uppercase">Payout</span>
                          </div>
                          <div>
                            <p className="text-[8px] sm:text-[10px] uppercase font-bold opacity-60">
                              {idx === 0 ? "All Too High" : !guess ? "Empty Space" : "Guess Spot"}
                            </p>
                            <p className="text-base sm:text-lg font-black">
                              {idx === 0 ? "All Too High" : guess ? guess.value : "---"}
                            </p>
                            {guess && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {guess.playerNames.map(name => {
                                  const p = scores.find(s => s.name === name);
                                  return (
                                    <span 
                                      key={name} 
                                      className="text-[7px] sm:text-[8px] font-bold italic px-1 rounded bg-white/40 border border-black/5"
                                      style={{ color: p?.color }}
                                    >
                                      {name}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Chips Display & Input */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex flex-wrap gap-1 max-w-[80px] sm:max-w-[100px] justify-end">
                            {userBetAmount > 0 && (
                              <div 
                                className="flex items-center gap-1 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold shadow-sm"
                                style={{ backgroundColor: scores.find(s => s.isUser)?.color }}
                              >
                                <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span>{userBetAmount}</span>
                              </div>
                            )}
                            {/* Group bot bets by player */}
                            {Object.entries(
                              botBets.reduce((acc, bet) => {
                                acc[bet.playerName] = (acc[bet.playerName] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([name, count]) => {
                              const botPlayer = scores.find(s => s.name === name);
                              return (
                                <div 
                                  key={name}
                                  className="flex items-center gap-1 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold shadow-sm"
                                  style={{ backgroundColor: botPlayer?.color }}
                                >
                                  <Bot className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  <span className="text-[7px] sm:text-[8px]">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                          
                          {isActive && phase === 'BETTING' && (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="number"
                                inputMode="numeric"
                                min="0"
                                max={totalUserChips - (userChipsPlaced - userBetAmount)}
                                defaultValue={userBetAmount === 0 ? (totalUserChips - userChipsPlaced) : userBetAmount}
                                className="w-12 sm:w-16 p-1 text-center font-bold rounded border border-[#d4af37] bg-white text-xs sm:text-sm"
                                onBlur={(e) => {
                                  setUserBetAmount(idx, parseInt(e.target.value) || 0);
                                  setActiveBetSpot(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setUserBetAmount(idx, parseInt((e.target as HTMLInputElement).value) || 0);
                                    setActiveBetSpot(null);
                                  }
                                }}
                                autoFocus
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {phase === 'BETTING' && userChipsPlaced > 0 && (
                <button 
                  onClick={handleReveal}
                  className="w-full py-3 sm:py-4 bg-[#2c1e11] text-white rounded-xl font-bold text-lg sm:text-xl shadow-lg hover:bg-black transition-all active:scale-95 shrink-0"
                >
                  Reveal Answer
                </button>
              )}

              {/* Reveal card moved inside scrollable container above */}
            </motion.div>
          )}

          {phase === 'GAME_OVER' && (
            <motion.div 
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col h-full min-h-0 space-y-6 sm:space-y-8 pb-4"
            >
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 space-y-6 sm:space-y-8">
                <div className="bg-white/40 p-6 sm:p-8 rounded-3xl border-4 border-[#d4af37] shadow-xl text-center">
                  <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-[#d4af37] mx-auto mb-4" />
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Game Over</h2>
                  <p className="text-[#b8962e] font-bold">Final Leaderboard</p>
                </div>

                <div className="space-y-2">
                  {[...scores].sort((a, b) => b.score - a.score).map((s, i) => (
                    <div 
                      key={s.name}
                      className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 transition-all`}
                      style={{ 
                        backgroundColor: s.isUser ? '#d4af37' : 'white',
                        borderColor: s.isUser ? '#b8962e' : `${s.color}40`,
                        color: s.isUser ? 'white' : '#2c1e11'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-black text-lg sm:text-xl opacity-50">#{i + 1}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="font-bold text-sm sm:text-base">{s.name} {s.isUser && "(You)"}</span>
                        </div>
                      </div>
                      <span className="font-black text-xl sm:text-2xl">{s.score} pts</span>
                    </div>
                  ))}
                </div>

                {/* Game Review Section */}
                <div className="bg-white/60 p-4 sm:p-6 rounded-3xl border-2 border-[#d4af37]/30 text-left space-y-6">
                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-widest text-center border-b border-[#d4af37]/20 pb-4">Game Review</h3>
                  {gameHistory.map((h, i) => (
                    <div key={i} className="space-y-3 border-b border-[#d4af37]/10 pb-6 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#d4af37] text-white text-[8px] sm:text-[10px] font-black px-2 py-0.5 rounded">ROUND {h.round}</span>
                        <span className="text-[10px] sm:text-xs font-bold opacity-60 uppercase tracking-widest">Question</span>
                      </div>
                      <p className="text-xs sm:text-sm italic font-medium leading-tight">"{h.question}"</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[8px] sm:text-[10px] font-bold uppercase opacity-40">Correct Answer</p>
                          <p className="text-xl sm:text-2xl font-black text-[#d4af37]">{h.answer}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] sm:text-[10px] font-bold uppercase opacity-40">Winning Guess</p>
                          <p className="text-base sm:text-lg font-black">{h.winningGuess === -1 ? "All Too High" : h.winningGuess}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-[8px] sm:text-[10px] font-bold uppercase opacity-40">Bets Placed</p>
                        <div className="grid grid-cols-1 gap-1">
                          {h.bets.length === 0 ? (
                            <p className="text-[8px] sm:text-[10px] italic opacity-50">No bets placed this round.</p>
                          ) : (
                            h.bets.map((bet, bi) => {
                              const p = scores.find(s => s.name === bet.playerName);
                              return (
                                <div key={bi} className={`flex items-center justify-between p-2 rounded-lg text-[8px] sm:text-[10px] ${bet.isWinning ? 'bg-green-50 border border-green-200' : 'bg-white/40 border border-black/5'}`}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ backgroundColor: p?.color }} />
                                    <span className="font-bold">{bet.playerName}</span>
                                    <span className="opacity-50">bet</span>
                                    <span className="font-black">{bet.amount} chips</span>
                                    <span className="opacity-50">on</span>
                                    <span className="font-bold">{bet.guessValue}</span>
                                  </div>
                                  {bet.isWinning && <span className="text-green-600 font-black uppercase tracking-tighter">Winner!</span>}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:gap-4 shrink-0">
                <button 
                  onClick={startGame}
                  className="w-full py-4 sm:py-5 bg-[#d4af37] text-white rounded-2xl font-black text-lg sm:text-xl shadow-2xl hover:bg-[#b8962e] transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                  PLAY AGAIN
                </button>
                <button 
                  onClick={async () => {
                    const count = await bibleQuestionService.getQuestionCount();
                    setDbQuestionCount(count);
                    setPhase('LOBBY');
                  }}
                  className="w-full py-3 sm:py-4 bg-white border-2 border-[#d4af37] text-[#d4af37] rounded-2xl font-bold text-xs sm:text-sm hover:bg-[#d4af37]/5 transition-all"
                >
                  BACK TO LOBBY
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Instructions */}
      <div className="mt-8 text-center max-w-md">
        <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">How to Play</p>
        <p className="text-sm italic opacity-70">
          "Guess the number. Bet on the closest guess without going over. The middle pays less, the edges pay more. May your wisdom be rewarded!"
        </p>
      </div>
    </div>
  );
};
