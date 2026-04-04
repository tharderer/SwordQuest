import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, MapPin, ChevronRight, Award, RotateCcw, X, BookOpen, AlertCircle, Music, Volume2, VolumeX } from 'lucide-react';
import { MISSIONARY_JOURNEYS, MissionaryNode } from '../missionaryData';
import { cn } from '../lib/utils';

interface MissionaryJourneysGameProps {
  onComplete: (xp: number) => void;
  onExit: () => void;
  isMusicEnabled: boolean;
  setIsMusicEnabled: (enabled: boolean) => void;
  selectedMusicStyle: string;
  setSelectedMusicStyle: (style: string) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

export const MissionaryJourneysGame: React.FC<MissionaryJourneysGameProps> = ({ 
  onComplete, 
  onExit,
  isMusicEnabled,
  setIsMusicEnabled,
  selectedMusicStyle,
  setSelectedMusicStyle,
  volume,
  setVolume
}) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>('start');
  const [totalXp, setTotalXp] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean; xpReward?: number } | null>(null);
  const [wrongChoice, setWrongChoice] = useState<{ text: string; explanation: string } | null>(null);
  const [shuffledChoices, setShuffledChoices] = useState<any[]>([]);
  
  // Competitive States
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isGameOver, setIsGameOver] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number; date: string }[]>([]);

  const currentNode = MISSIONARY_JOURNEYS[currentNodeId];

  // Load Leaderboard
  useEffect(() => {
    const saved = localStorage.getItem('missionary_leaderboard');
    if (saved) setLeaderboard(JSON.parse(saved));
  }, []);

  const saveScore = (finalScore: number) => {
    const newEntry = {
      name: "You",
      score: finalScore,
      date: new Date().toLocaleDateString()
    };
    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    setLeaderboard(updated);
    localStorage.setItem('missionary_leaderboard', JSON.stringify(updated));
  };

  // Shuffle choices when node changes
  useEffect(() => {
    if (currentNode && !isTransitioning && !wrongChoice && !isGameOver) {
      const choices = [...currentNode.choices];
      for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
      }
      setShuffledChoices(choices);
      setTimeLeft(30);
    }
  }, [currentNodeId, isTransitioning, wrongChoice, isGameOver]);

  // Timer logic
  useEffect(() => {
    if (timeLeft > 0 && !isTransitioning && !wrongChoice && !isGameOver && currentNodeId !== 'victory') {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isTransitioning && !wrongChoice && !isGameOver && currentNodeId !== 'victory') {
      handleTimeOut();
    }
  }, [timeLeft, isTransitioning, wrongChoice, isGameOver, currentNodeId]);

  const handleTimeOut = () => {
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) setIsGameOver(true);
      return newLives;
    });
    setWrongChoice({ 
      text: "Time Expired!", 
      explanation: "The mission requires prompt action. You took too long to decide!" 
    });
    setStreak(0);
  };

  const handleChoice = (choice: any) => {
    if (choice.isCorrect) {
      const timeBonus = Math.floor(timeLeft * 2);
      const streakBonus = streak * 10;
      const finalXp = (choice.xpReward || 0) + timeBonus + streakBonus;
      
      setFeedback({ 
        text: `Correct! +${finalXp} XP (Base: ${choice.xpReward || 0}, Time: ${timeBonus}, Streak: ${streakBonus})`, 
        isCorrect: true, 
        xpReward: finalXp 
      });
      
      setStreak(prev => prev + 1);
      setIsTransitioning(true);
      
      setTimeout(() => {
        setTotalXp(prev => prev + finalXp);
        setHistory(prev => [...prev, currentNodeId]);
        setCurrentNodeId(choice.nextNodeId);
        setIsTransitioning(false);
        setFeedback(null);
        
        if (choice.nextNodeId === 'victory') {
          const perfectBonus = lives === 3 ? 1000 : 0;
          const finalScore = totalXp + finalXp + perfectBonus;
          saveScore(finalScore);
          onComplete(finalScore);
        }
      }, 1500);
    } else {
      setStreak(0);
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) setIsGameOver(true);
        return newLives;
      });
      setWrongChoice({ text: choice.text, explanation: choice.explanation || "That's not quite right. Try again!" });
    }
  };

  const resetGame = () => {
    setCurrentNodeId('start');
    setTotalXp(0);
    setHistory([]);
    setFeedback(null);
    setWrongChoice(null);
    setLives(3);
    setStreak(0);
    setTimeLeft(30);
    setIsGameOver(false);
  };

  const getRank = () => {
    if (totalXp > 2000) return "Apostle";
    if (totalXp > 1500) return "Evangelist";
    if (totalXp > 1000) return "Teacher";
    if (totalXp > 500) return "Disciple";
    return "Novice";
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white font-sans overflow-hidden relative">
      {/* Game Over Screen */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[60] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-24 h-24 bg-rose-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-rose-500/40">
              <X size={48} className="text-white" />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Mission Failed</h2>
            <p className="text-slate-400 max-w-md mb-8">
              You have run out of hearts. The journey was long and the path was narrow. Do not lose heart, for every end is a new beginning.
            </p>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-12 py-5 bg-white text-slate-950 rounded-2xl font-black text-xl hover:bg-amber-400 transition-colors shadow-2xl"
            >
              <RotateCcw size={24} />
              RESTART MISSION
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Overlay (Correct Only) */}
      <AnimatePresence>
        {feedback && feedback.isCorrect && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl border-2 flex items-center gap-3 max-w-md w-[90%] bg-emerald-500/90 border-emerald-400 text-white"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Award size={18} />
            </div>
            <p className="font-bold text-sm leading-tight flex-1">{feedback.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incorrect Choice Screen */}
      <AnimatePresence>
        {wrongChoice && !isGameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-rose-500/30">
              <AlertCircle size={40} className="text-rose-500" />
            </div>
            
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 text-rose-500">Not Quite Right</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8 italic">"{wrongChoice.text}"</p>
            
            <div className="max-w-md bg-slate-900/50 border border-white/5 p-6 rounded-2xl mb-8">
              <p className="text-lg text-slate-200 leading-relaxed">
                {wrongChoice.explanation}
              </p>
            </div>

            <button
              onClick={() => setWrongChoice(null)}
              className="flex items-center gap-2 px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-lg hover:bg-amber-400 transition-colors shadow-xl shadow-white/5"
            >
              <RotateCcw size={20} />
              GO BACK & TRY AGAIN
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="p-4 flex flex-col gap-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Compass className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase leading-none">Missionary Journeys</h1>
              <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase tracking-widest mt-1">
                <MapPin size={10} />
                {currentNode.location}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
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
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rank: {getRank()}</span>
              <span className="text-xl font-black text-amber-400 leading-none">{totalXp} XP</span>
            </div>
            <button 
              onClick={onExit}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-col gap-2 px-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: i < lives ? 1 : 0.8, 
                    opacity: i < lives ? 1 : 0.3,
                    x: i === lives && wrongChoice ? [0, -5, 5, -5, 5, 0] : 0
                  }}
                  className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center",
                    i < lives ? "text-rose-500" : "text-slate-700"
                  )}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Streak</span>
                <motion.div 
                  key={streak}
                  initial={{ scale: 1.5, color: '#fbbf24' }}
                  animate={{ scale: 1, color: '#fbbf24' }}
                  className="px-2 py-0.5 bg-amber-500/20 rounded text-amber-400 text-xs font-black"
                >
                  x{streak}
                </motion.div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time</span>
                <div className={cn(
                  "px-2 py-0.5 rounded text-xs font-black min-w-[40px] text-center",
                  timeLeft < 10 ? "bg-rose-500/20 text-rose-500 animate-pulse" : "bg-white/10 text-white"
                )}>
                  {timeLeft}s
                </div>
              </div>
            </div>
          </div>

          {/* Timer Bar */}
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ 
                width: `${(timeLeft / 30) * 100}%`,
                backgroundColor: timeLeft < 10 ? '#f43f5e' : timeLeft < 20 ? '#fbbf24' : '#10b981'
              }}
              transition={{ duration: 1, ease: "linear" }}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {!isTransitioning && !isGameOver && (
            <motion.div
              key={currentNodeId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-8"
            >
              {/* Story Section */}
              <div className="space-y-6">
                <div className="inline-block px-4 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-bold uppercase tracking-widest">
                  {currentNode.title}
                </div>
                
                <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-500/30 rounded-full" />
                  <p className="text-xl sm:text-2xl font-medium leading-relaxed text-slate-200 italic">
                    "{currentNode.description}"
                  </p>
                </div>
              </div>

              {/* Choices Section */}
              <div className="grid gap-3">
                {shuffledChoices.map((choice, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChoice(choice)}
                    className="group flex items-center justify-between p-5 bg-slate-900/50 hover:bg-slate-800 border border-white/5 hover:border-amber-500/30 rounded-2xl transition-all text-left"
                  >
                    <span className="text-lg font-bold text-slate-300 group-hover:text-white transition-colors">
                      {choice.text}
                    </span>
                    <div className="flex items-center gap-3">
                      <ChevronRight className="text-slate-600 group-hover:text-amber-400 transition-colors" size={20} />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Victory State Extra Actions */}
              {currentNodeId === 'victory' && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="pt-8 flex flex-col items-center gap-6"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/40 animate-bounce">
                      <Award size={40} className="text-white" />
                    </div>
                    {lives === 3 && (
                      <div className="px-4 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-black uppercase tracking-widest">
                        Perfect Run Bonus: +1000 XP
                      </div>
                    )}
                  </div>

                  {/* Local Leaderboard */}
                  <div className="w-full max-w-sm bg-slate-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 text-center">Personal Best</h3>
                    <div className="space-y-2">
                      {leaderboard.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-600 font-bold">{i + 1}.</span>
                            <span className="font-bold text-slate-300">{entry.date}</span>
                          </div>
                          <span className="font-black text-amber-400">{entry.score} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={resetGame}
                    className="flex items-center gap-2 px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-lg hover:bg-amber-400 transition-colors"
                  >
                    <RotateCcw size={20} />
                    RESTART JOURNEY
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Progress */}
      <div className="p-4 border-t border-white/5 bg-slate-950/80 backdrop-blur-md flex items-center justify-center gap-8">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
          <BookOpen size={14} />
          Based on the Book of Acts
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
    </div>
  );
};
