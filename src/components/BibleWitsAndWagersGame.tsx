import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, User, Bot, Trophy, ArrowRight, RotateCcw, HelpCircle, Sparkles, Database, Play } from 'lucide-react';
import { bibleQuestionService, BibleQuestion } from '../services/bibleQuestionService';

interface Question {
  text: string;
  answer: number;
}

const DEFAULT_QUESTIONS: Question[] = [
  { text: "How many years did the Israelites wander in the wilderness?", answer: 40 },
  { text: "How many people were on Noah's Ark?", answer: 8 },
  { text: "How many chapters are in the Book of Psalms?", answer: 150 },
  { text: "How many disciples did Jesus have?", answer: 12 },
  { text: "How many days and nights did it rain during the Great Flood?", answer: 40 },
  { text: "How many stones did David pick up to fight Goliath?", answer: 5 },
  { text: "How many books are in the New Testament?", answer: 27 },
  { text: "How many years did Jacob work for Laban to marry Rachel?", answer: 14 },
  { text: "How many plagues did God send upon Egypt?", answer: 10 },
  { text: "How many times did Peter deny Jesus?", answer: 3 }
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

export const BibleWitsAndWagersGame: React.FC = () => {
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
  const [dbQuestionCount, setDbQuestionCount] = useState(0);
  const [lastChapter, setLastChapter] = useState({ book: 'Genesis', chapter: 0 });
  const [currentGameChapter, setCurrentGameChapter] = useState({ book: 'Genesis', chapter: 1 });

  useEffect(() => {
    const init = async () => {
      const count = await bibleQuestionService.getQuestionCount();
      setDbQuestionCount(count);
      const last = await bibleQuestionService.getLastGeneratedChapter();
      setLastChapter(last);
      const current = await bibleQuestionService.getCurrentGameChapter();
      setCurrentGameChapter(current);
    };
    init();
  }, []);

  const currentQuestion = questions[currentQuestionIndex] || { text: "Loading...", answer: 0 };

  const userScore = scores.find(s => s.isUser)?.score || 0;
  const totalUserChips = userScore + 2;
  const userChipsPlaced = (Object.values(userBets) as number[]).reduce((a, b) => a + b, 0);

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      await bibleQuestionService.generateQuestions(process.env.GEMINI_API_KEY!);
      const count = await bibleQuestionService.getQuestionCount();
      setDbQuestionCount(count);
      const last = await bibleQuestionService.getLastGeneratedChapter();
      setLastChapter(last);
    } catch (error) {
      console.error("Failed to generate questions:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const startGame = async () => {
    const current = await bibleQuestionService.getCurrentGameChapter();
    let gameQuestions = await bibleQuestionService.getQuestionsForChapter(current.book, current.chapter);
    
    // If not enough questions for this specific chapter, generate them
    if (gameQuestions.length < 7) {
      setIsGenerating(true);
      try {
        // We need to set the last generated chapter to current.chapter - 1 
        // so generateQuestions picks up the right one if it's not yet generated
        const lastGen = await bibleQuestionService.getLastGeneratedChapter();
        if (lastGen.chapter < current.chapter) {
          await bibleQuestionService.setLastGeneratedChapter(current.book, current.chapter - 1);
        }
        await bibleQuestionService.generateQuestions(process.env.GEMINI_API_KEY!);
        gameQuestions = await bibleQuestionService.getQuestionsForChapter(current.book, current.chapter);
        
        // Refresh stats
        const count = await bibleQuestionService.getQuestionCount();
        setDbQuestionCount(count);
        const last = await bibleQuestionService.getLastGeneratedChapter();
        setLastChapter(last);
      } catch (error) {
        console.error("Failed to auto-generate questions:", error);
        const fallback = DEFAULT_QUESTIONS.map(q => ({ ...q, book: 'Genesis', chapter: 0, used: false })) as BibleQuestion[];
        gameQuestions = fallback.slice(0, 7);
      } finally {
        setIsGenerating(false);
      }
    }

    setQuestions(gameQuestions.slice(0, 7));
    setPhase('QUESTION');
    setRound(1);
    setCurrentQuestionIndex(0);
    setScores(scores.map(s => ({ ...s, score: 0 })));
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
      // Mark questions as used in DB
      const ids = questions.map(q => q.id).filter((id): id is number => id !== undefined);
      await bibleQuestionService.markAsUsed(ids);
      
      // Increment current game chapter
      const current = await bibleQuestionService.getCurrentGameChapter();
      await bibleQuestionService.setCurrentGameChapter(current.book, current.chapter + 1);
      
      setPhase('GAME_OVER');
      return;
    }
    setPhase('QUESTION');
    setUserGuess('');
    setUniqueGuesses([]);
    setBets([]);
    setWinningSpotIndex(null);
    setRoundResult(null);
    setTimeLeft(30);
    setRound(prev => prev + 1);
    setCurrentQuestionIndex((prev) => (prev + 1) % questions.length);
  }, [round, questions]);

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
          isUser: false
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

  const handleReveal = () => {
    setPhase('REVEAL');
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
    const userWinningChipsCount = userBets[finalWinningSpotIndex] || 0;
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
    <div className="min-h-screen bg-[#FDFCF0] font-sans text-[#2c1e11] p-4 flex flex-col items-center">
      {/* Header */}
      {phase !== 'LOBBY' && (
        <div className="w-full max-w-2xl flex justify-between items-center mb-8 bg-[#f4e4bc] p-4 rounded-2xl border-2 border-[#d4af37] shadow-md">
          <div className="flex items-center gap-2 text-[#2c1e11]">
            <Trophy className="text-[#d4af37]" />
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight leading-none">Wits & Wagers</h1>
              <p className="text-[10px] font-bold opacity-60">Round {round} of 7</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/50 px-4 py-1 rounded-full border border-[#d4af37]">
            <Coins className="text-[#d4af37] w-5 h-5" />
            <span className="font-bold">{totalUserChips} Chips</span>
          </div>
        </div>
      )}

      {/* Scoreboard */}
      {phase !== 'LOBBY' && (phase === 'BETTING' || phase === 'REVEAL') && (
        <div className="w-full max-w-2xl mb-4 grid grid-cols-4 sm:grid-cols-7 gap-2">
          {scores.map(s => (
            <div 
              key={s.name} 
              className={`p-2 rounded-lg border text-center transition-all ${s.isUser ? 'border-[#d4af37] shadow-sm' : 'border-[#d4af37]/20'}`}
              style={{ backgroundColor: s.isUser ? '#d4af37' : `${s.color}15`, color: s.isUser ? 'white' : s.color }}
            >
              <p className="text-[8px] font-bold uppercase truncate">{s.name}</p>
              <p className="text-xs font-black">{s.score + 2}</p>
            </div>
          ))}
        </div>
      )}

      <main className={`w-full max-w-2xl ${phase === 'LOBBY' ? '' : 'bg-[#f4e4bc] rounded-3xl p-6 border-4 border-[#d4af37] shadow-2xl relative overflow-hidden'}`}>
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
              className="flex flex-col items-center justify-center min-h-[600px] space-y-8 text-center"
            >
              <div className="space-y-4">
                <div className="w-24 h-24 bg-[#d4af37] rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <HelpCircle className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-5xl font-black italic tracking-tighter uppercase">
                  Bible <span className="text-[#d4af37]">Wits</span> & Wagers
                </h1>
                <p className="text-sm font-bold opacity-60 uppercase tracking-[0.2em]">The Ultimate Biblical Trivia Challenge</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                <div className="bg-white/40 p-6 rounded-2xl border border-[#d4af37]/20 flex flex-col items-center space-y-2">
                  <Database className="w-6 h-6 text-[#d4af37]" />
                  <span className="text-xs font-bold uppercase opacity-50">Question Bank</span>
                  <span className="text-2xl font-black">{dbQuestionCount}</span>
                  <span className="text-[10px] opacity-40">Stored in IndexedDB</span>
                </div>
                <div className="bg-white/40 p-6 rounded-2xl border border-[#d4af37]/20 flex flex-col items-center space-y-2">
                  <Sparkles className="w-6 h-6 text-[#d4af37]" />
                  <span className="text-xs font-bold uppercase opacity-50">Next Game</span>
                  <span className="text-2xl font-black">{currentGameChapter.book} {currentGameChapter.chapter}</span>
                  <span className="text-[10px] opacity-40">Sequential Chapter Mode</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full max-w-xs">
                <button
                  onClick={startGame}
                  className="group relative w-full py-5 bg-[#d4af37] text-white rounded-2xl font-black text-xl shadow-2xl hover:bg-[#b8962e] transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <Play className="w-6 h-6 fill-current" />
                  START GAME
                </button>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-4 bg-white border-2 border-[#d4af37] text-[#d4af37] rounded-2xl font-bold text-sm hover:bg-[#d4af37]/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isGenerating ? 'GENERATING...' : 'GENERATE HARD QUESTIONS'}
                </button>
              </div>

              <p className="max-w-xs text-[10px] leading-relaxed opacity-40 uppercase font-bold tracking-widest">
                Questions are generated by AI to be extremely difficult. 
                Progress is saved chapter-by-chapter starting from Genesis 1.
              </p>
            </motion.div>
          )}

          {phase === 'QUESTION' && (
            <motion.div 
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 text-center"
            >
              <div className="bg-white/40 p-8 rounded-2xl border-2 border-dashed border-[#d4af37] relative">
                <div className={`absolute top-4 right-4 w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold ${timeLeft <= 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-[#d4af37] text-[#d4af37]'}`}>
                  {timeLeft}
                </div>
                <HelpCircle className="mx-auto mb-4 text-[#d4af37] w-12 h-12" />
                <h2 className="text-2xl font-bold italic leading-tight">
                  "{currentQuestion.text}"
                </h2>
              </div>
              
              <div className="space-y-4">
                <p className="font-bold uppercase text-sm tracking-widest opacity-70">Enter your numeric guess:</p>
                <input 
                  type="number"
                  value={userGuess}
                  onChange={(e) => setUserGuess(e.target.value)}
                  className="w-full text-center text-3xl font-bold p-4 rounded-xl border-2 border-[#d4af37] bg-white focus:outline-none focus:ring-4 focus:ring-[#d4af37]/20"
                  placeholder="0"
                  autoFocus
                />
                <button 
                  onClick={handleGuessSubmit}
                  disabled={!userGuess}
                  className="w-full py-4 bg-[#d4af37] text-white rounded-xl font-bold text-xl shadow-lg hover:bg-[#b8962e] transition-all active:scale-95 disabled:opacity-50"
                >
                  Submit Guess
                </button>

                {/* Other Players Waiting */}
                <div className="pt-4 border-t border-[#d4af37]/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3">Other Players are Waiting...</p>
                  <div className="flex justify-center gap-3">
                    {scores.filter(s => !s.isUser).map(bot => (
                      <div key={bot.name} className="flex flex-col items-center gap-1">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md animate-bounce"
                          style={{ backgroundColor: bot.color, animationDelay: `${Math.random() * 2}s` }}
                        >
                          <Bot className="w-4 h-4" />
                        </div>
                        <span className="text-[8px] font-bold opacity-60">{bot.name}</span>
                      </div>
                    ))}
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
              className="space-y-6"
            >
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold uppercase tracking-widest">
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
                        <div className="w-12 h-12 rounded-lg bg-[#d4af37] text-white flex flex-col items-center justify-center font-bold text-xs shrink-0">
                          <span>{spot.odds}:1</span>
                          <span className="text-[8px] uppercase">Payout</span>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold opacity-60">
                            {idx === 0 ? "All Too High" : !guess ? "Empty Space" : "Guess Spot"}
                          </p>
                          <p className="text-lg font-black">
                            {idx === 0 ? "All Too High" : guess ? guess.value : "---"}
                          </p>
                          {guess && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {guess.playerNames.map(name => {
                                const p = scores.find(s => s.name === name);
                                return (
                                  <span 
                                    key={name} 
                                    className="text-[8px] font-bold italic px-1 rounded bg-white/40 border border-black/5"
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
                        <div className="flex flex-wrap gap-1 max-w-[100px] justify-end">
                          {userBetAmount > 0 && (
                            <div 
                              className="flex items-center gap-1 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-sm"
                              style={{ backgroundColor: scores.find(s => s.isUser)?.color }}
                            >
                              <User className="w-3 h-3" />
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
                                className="flex items-center gap-1 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-sm"
                                style={{ backgroundColor: botPlayer?.color }}
                              >
                                <Bot className="w-3 h-3" />
                                <span className="text-[8px]">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                        
                        {isActive && phase === 'BETTING' && (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="number"
                              min="0"
                              max={totalUserChips - (userChipsPlaced - userBetAmount)}
                              defaultValue={userBetAmount === 0 ? (totalUserChips - userChipsPlaced) : userBetAmount}
                              className="w-16 p-1 text-center font-bold rounded border border-[#d4af37] bg-white text-sm"
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

              {phase === 'BETTING' && userChipsPlaced > 0 && (
                <button 
                  onClick={handleReveal}
                  className="w-full py-4 bg-[#2c1e11] text-white rounded-xl font-bold text-xl shadow-lg hover:bg-black transition-all active:scale-95"
                >
                  Reveal Answer
                </button>
              )}

              {phase === 'REVEAL' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-2xl border-4 border-[#d4af37] text-center space-y-4"
                >
                  <p className="text-sm font-bold uppercase tracking-widest opacity-60">The Correct Answer is:</p>
                  <p className="text-5xl font-black text-[#d4af37]">{currentQuestion.answer}</p>
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
            </motion.div>
          )}

          {phase === 'GAME_OVER' && (
            <motion.div 
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              <div className="bg-white/40 p-8 rounded-3xl border-4 border-[#d4af37] shadow-xl">
                <Trophy className="w-20 h-20 text-[#d4af37] mx-auto mb-4" />
                <h2 className="text-3xl font-black uppercase tracking-tighter">Game Over</h2>
                <p className="text-[#b8962e] font-bold">Final Leaderboard</p>
              </div>

              <div className="space-y-2">
                {[...scores].sort((a, b) => b.score - a.score).map((s, i) => (
                  <div 
                    key={s.name}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all`}
                    style={{ 
                      backgroundColor: s.isUser ? '#d4af37' : 'white',
                      borderColor: s.isUser ? '#b8962e' : `${s.color}40`,
                      color: s.isUser ? 'white' : '#2c1e11'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-black text-xl opacity-50">#{i + 1}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="font-bold">{s.name} {s.isUser && "(You)"}</span>
                      </div>
                    </div>
                    <span className="font-black text-2xl">{s.score} pts</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={startGame}
                  className="w-full py-5 bg-[#d4af37] text-white rounded-2xl font-black text-xl shadow-2xl hover:bg-[#b8962e] transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <RotateCcw className="w-6 h-6" />
                  PLAY AGAIN
                </button>
                <button 
                  onClick={async () => {
                    const count = await bibleQuestionService.getQuestionCount();
                    setDbQuestionCount(count);
                    const last = await bibleQuestionService.getLastGeneratedChapter();
                    setLastChapter(last);
                    const current = await bibleQuestionService.getCurrentGameChapter();
                    setCurrentGameChapter(current);
                    setPhase('LOBBY');
                  }}
                  className="w-full py-4 bg-white border-2 border-[#d4af37] text-[#d4af37] rounded-2xl font-bold text-sm hover:bg-[#d4af37]/5 transition-all"
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
