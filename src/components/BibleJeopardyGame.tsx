import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Plus, 
  HelpCircle, 
  Sparkles, 
  Music, 
  Volume2, 
  VolumeX, 
  ChevronRight,
  X,
  Minus,
  Check,
  Trophy
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  JeopardyCategory, 
  JeopardyDifficulty, 
  JeopardyMode 
} from '../services/bibleJeopardyService';
import { 
  JeopardyBoard, 
  JeopardyGameState,
  Team
} from '../services/jeopardyDbService';

export const BibleJeopardyGame = ({ 
  onExit, 
  categories: initialCategories,
  onGameStart,
  isGenerating,
  onRetry,
  savedBoards = [],
  onLoadBoard,
  difficulty = 'medium',
  onDifficultyChange,
  mode = 'bible',
  onModeChange,
  onUpdateGameState,
  boardId,
  isMusicEnabled,
  setIsMusicEnabled,
  selectedMusicStyle,
  setSelectedMusicStyle,
  volume,
  setVolume
}: { 
  onExit: () => void, 
  categories: JeopardyCategory[],
  onGameStart: () => void,
  isGenerating: boolean,
  onRetry: (mode: JeopardyMode, difficulty: JeopardyDifficulty) => void,
  savedBoards?: JeopardyBoard[],
  onLoadBoard?: (board: JeopardyBoard) => void,
  difficulty?: JeopardyDifficulty,
  onDifficultyChange?: (difficulty: JeopardyDifficulty) => void,
  mode?: JeopardyMode,
  onModeChange?: (mode: JeopardyMode) => void,
  onUpdateGameState?: (boardId: string, gameState: JeopardyGameState) => void,
  boardId: string | null,
  isMusicEnabled: boolean,
  setIsMusicEnabled: (v: boolean) => void,
  selectedMusicStyle: string,
  setSelectedMusicStyle: (v: string) => void,
  volume: number,
  setVolume: (v: number) => void
}) => {
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState<Team[]>([
    { name: 'Team A', score: 0, color: 'bg-blue-500' },
    { name: 'Team B', score: 0, color: 'bg-red-500' }
  ]);
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const [gameState, setGameState] = useState<'splash' | 'intro' | 'board' | 'question' | 'final' | 'results'>('splash');
  const [selectedQuestion, setSelectedQuestion] = useState<{ categoryId: string, questionId: string } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [wager, setWager] = useState(0);
  const [showWagerInput, setShowWagerInput] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isManualScoring, setIsManualScoring] = useState(false);
  const [answeredMetadata, setAnsweredMetadata] = useState<Record<string, { teamIndex: number, points: number }>>({});
  const [history, setHistory] = useState<{ teams: Team[], answeredIds: string[], answeredMetadata: Record<string, { teamIndex: number, points: number }> }[]>([]);

  useEffect(() => {
    const currentBoard = savedBoards.find(b => b.id === boardId);
    if (currentBoard?.gameState) {
      const { answeredIds, answeredMetadata, teams } = currentBoard.gameState;
      setAnsweredIds(answeredIds);
      setAnsweredMetadata(answeredMetadata);
      setTeams(teams);
      setTeamCount(teams.length);
    } else {
      setAnsweredIds([]);
      setAnsweredMetadata({});
      setHistory([]);
      const colors = ['bg-blue-500', 'bg-red-500', 'bg-emerald-500', 'bg-amber-500'];
      const names = ['Team A', 'Team B', 'Team C', 'Team D'];
      setTeams(Array.from({ length: teamCount }, (_, i) => ({
        name: names[i],
        score: 0,
        color: colors[i]
      })));
    }
  }, [initialCategories, boardId, teamCount]);

  useEffect(() => {
    if (boardId && onUpdateGameState && !['splash', 'intro'].includes(gameState)) {
      onUpdateGameState(boardId, {
        answeredIds,
        answeredMetadata,
        teams,
        lastUpdated: Date.now()
      });
    }
  }, [answeredIds, answeredMetadata, teams, boardId, onUpdateGameState, gameState]);

  const saveHistory = useCallback(() => {
    setHistory(prev => [...prev, { 
      teams: JSON.parse(JSON.stringify(teams)), 
      answeredIds: [...answeredIds],
      answeredMetadata: { ...answeredMetadata }
    }]);
  }, [teams, answeredIds, answeredMetadata]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setTeams(lastState.teams);
    setAnsweredIds(lastState.answeredIds);
    setAnsweredMetadata(lastState.answeredMetadata);
    setHistory(prev => prev.slice(0, -1));
  };

  const adjustScore = (teamIdx: number, amount: number) => {
    saveHistory();
    setTeams(prev => prev.map((t, i) => i === teamIdx ? { ...t, score: t.score + amount } : t));
  };

  const categories = initialCategories;

  useEffect(() => {
    if (gameState === 'board' && answeredIds.length === 0) {
      onGameStart();
    }
  }, [gameState, answeredIds.length, onGameStart]);

  const currentQuestion = useMemo(() => {
    if (!selectedQuestion) return null;
    const cat = categories.find(c => c.id === selectedQuestion.categoryId);
    return cat?.questions.find(q => q.id === selectedQuestion.questionId);
  }, [selectedQuestion, categories]);

  const handleQuestionSelect = (categoryId: string, questionId: string) => {
    if (answeredIds.includes(questionId)) {
      if (isEditMode) {
        saveHistory();
        const metadata = answeredMetadata[questionId];
        if (metadata) {
          setTeams(prev => prev.map((team, idx) => {
            if (idx === metadata.teamIndex) {
              return { ...team, score: team.score - metadata.points };
            }
            return team;
          }));
          setAnsweredMetadata(prev => {
            const next = { ...prev };
            delete next[questionId];
            return next;
          });
        }
        setAnsweredIds(prev => prev.filter(id => id !== questionId));
      }
      return;
    }
    const cat = categories.find(c => c.id === categoryId);
    const q = cat?.questions.find(q => q.id === questionId);
    
    setSelectedQuestion({ categoryId, questionId });
    if (q?.isDailyDouble) {
      setShowWagerInput(true);
    } else {
      setGameState('question');
    }
  };

  const handleScore = (correct: boolean) => {
    saveHistory();
    const points = currentQuestion?.isDailyDouble ? wager : (currentQuestion?.value || 0);
    const pointsAwarded = correct ? points : -points;

    setTeams(prev => prev.map((team, idx) => {
      if (idx === activeTeamIndex) {
        return { ...team, score: team.score + pointsAwarded };
      }
      return team;
    }));
    
    if (currentQuestion) {
      setAnsweredIds(prev => [...prev, currentQuestion.id]);
      setAnsweredMetadata(prev => ({
        ...prev,
        [currentQuestion.id]: { teamIndex: activeTeamIndex, points: pointsAwarded }
      }));
    }
    
    setShowAnswer(false);
    setSelectedQuestion(null);
    setGameState('board');

    const totalQuestions = categories.reduce((acc, cat) => acc + cat.questions.length, 0);
    if (answeredIds.length + 1 >= totalQuestions) {
      setGameState('results');
    }
  };

  const handleNoScore = () => {
    saveHistory();
    if (currentQuestion) {
      setAnsweredIds(prev => [...prev, currentQuestion.id]);
      setAnsweredMetadata(prev => ({
        ...prev,
        [currentQuestion.id]: { teamIndex: -1, points: 0 }
      }));
    }
    
    setShowAnswer(false);
    setSelectedQuestion(null);
    setGameState('board');

    const totalQuestions = categories.reduce((acc, cat) => acc + cat.questions.length, 0);
    if (answeredIds.length + 1 >= totalQuestions) {
      setGameState('results');
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-blue-900 text-white font-sans overflow-hidden relative">
      <AnimatePresence mode="wait">
        {gameState === 'splash' && (
          <motion.div 
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-[100] bg-blue-900 flex flex-col items-center justify-center p-8 text-center overflow-hidden"
          >
            <div className="relative">
              <motion.h1 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                className="text-[15vw] sm:text-[12vw] font-black italic tracking-tighter leading-[0.82] text-yellow-400 uppercase select-none"
              >
                {mode === 'bible' ? 'BIBLE' : mode === 'mixed' ? 'MIXED' : 'TRIVIA'}<br />JEOPARDY
              </motion.h1>
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 1 }}
                className="h-4 bg-white mt-4 origin-left"
              />
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-xl sm:text-2xl font-bold tracking-[0.2em] uppercase mt-4 text-blue-200"
              >
                {mode === 'bible' ? 'The Ultimate Scriptural Challenge' : 
                 mode === 'mixed' ? 'Bible • History • Geography • Science' :
                 mode === 'history' ? 'World History • Major Events • Figures' :
                 mode === 'geography' ? 'World Geography • Landmarks • Cultures' :
                 'Biology • Physics • Chemistry • Discoveries'}
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex flex-col items-center gap-4 mt-12"
            >
              <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                <Music className={cn("w-5 h-5", isMusicEnabled ? "text-yellow-400" : "text-white/20")} />
                <select 
                  value={selectedMusicStyle}
                  onChange={(e) => setSelectedMusicStyle(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold uppercase tracking-widest outline-none border-none cursor-pointer"
                >
                  <option value="hymns" className="bg-blue-900">Hymns</option>
                  <option value="gospel" className="bg-blue-900">Gospel</option>
                  <option value="acoustic" className="bg-blue-900">Acoustic</option>
                  <option value="ambient" className="bg-blue-900">Ambient</option>
                  <option value="lofi" className="bg-blue-900">Lo-Fi</option>
                  <option value="classical" className="bg-blue-900">Classical</option>
                  <option value="retro" className="bg-blue-900">Retro</option>
                  <option value="epic" className="bg-blue-900">Epic</option>
                </select>
                <div className="w-px h-4 bg-white/10 mx-2" />
                <button 
                  onClick={() => setIsMusicEnabled(!isMusicEnabled)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  {isMusicEnabled ? <Volume2 size={18} className="text-white" /> : <VolumeX size={18} className="text-white/40" />}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-yellow-400"
                />
              </div>
              
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ delay: 1.4, type: 'spring', stiffness: 400, damping: 10 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setGameState('intro');
                }}
                className="px-16 py-6 bg-yellow-400 text-blue-900 rounded-full font-black text-3xl shadow-[0_20px_50px_rgba(250,204,21,0.4)] hover:shadow-[0_25px_60px_rgba(250,204,21,0.5)] transition-all flex items-center gap-4 group relative z-[110]"
              >
                ENTER GAME
                <ChevronRight size={32} className="group-hover:translate-x-2 transition-transform" />
              </motion.button>
            </motion.div>

            <div className="absolute top-10 left-10 opacity-10 pointer-events-none select-none">
              <HelpCircle size={300} />
            </div>
            <div className="absolute bottom-10 right-10 opacity-10 pointer-events-none select-none">
              <Sparkles size={300} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {gameState !== 'splash' && (
        <div className="bg-blue-950 p-4 flex justify-between items-center border-b-4 border-yellow-500 shadow-lg z-10">
          <div className="flex items-center gap-3">
            <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black italic tracking-tighter text-yellow-400 leading-none uppercase">
                {mode} JEOPARDY
              </h1>
              {history.length > 0 && (
                <button 
                  onClick={handleUndo}
                  className="text-[10px] font-bold uppercase tracking-widest text-blue-300 hover:text-white flex items-center gap-1 mt-1"
                >
                  <RotateCcw size={10} /> Undo Last Action
                </button>
              )}
            </div>
            <button 
              onClick={() => setIsManualScoring(!isManualScoring)}
              className={cn(
                "p-2 rounded-xl transition-all ml-2",
                isManualScoring ? "bg-emerald-500 text-white shadow-lg" : "bg-white/10 text-white hover:bg-white/20"
              )}
              title="Toggle Manual Scoring"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="flex gap-2">
            {teams.map((team, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "px-3 py-1 rounded-xl border-2 transition-all duration-300 flex flex-col items-center min-w-[90px] relative group",
                  idx === activeTeamIndex ? "border-yellow-400 scale-105 shadow-[0_0_15px_rgba(250,204,21,0.5)]" : "border-white/20 opacity-70",
                  team.color
                )}
                onClick={() => setActiveTeamIndex(idx)}
              >
                <span className="text-[9px] font-bold uppercase tracking-widest">{team.name}</span>
                <span className="text-lg font-black">${team.score}</span>
                
                <div className={cn(
                  "absolute -bottom-8 left-0 right-0 flex justify-center gap-1 transition-opacity z-20",
                  isManualScoring ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); adjustScore(idx, -100); }}
                    className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-xs font-bold border border-white/20 hover:scale-110 active:scale-90 transition-transform"
                  >
                    <Minus size={12} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); adjustScore(idx, 100); }}
                    className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-xs font-bold border border-white/20 hover:scale-110 active:scale-90 transition-transform"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {gameState === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 overflow-y-auto"
            >
              <div className="max-w-4xl w-full bg-blue-950/50 backdrop-blur-xl p-10 rounded-[3rem] border-2 border-white/10 shadow-2xl">
                <h2 className="text-5xl font-black italic tracking-tighter text-yellow-400 mb-8 text-center uppercase">GAME SETUP</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h3 className="text-blue-200 font-bold uppercase tracking-widest text-sm">Teams Configuration</h3>
                    <div className="flex items-center gap-6">
                      <div className="flex-1 flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                        <button onClick={() => setTeamCount(Math.max(1, teamCount - 1))} className="p-2 hover:bg-white/10 rounded-xl"><Minus /></button>
                        <span className="text-4xl font-black">{teamCount} TEAMS</span>
                        <button onClick={() => setTeamCount(Math.min(4, teamCount + 1))} className="p-2 hover:bg-white/10 rounded-xl"><Plus /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {teams.map((team, i) => (
                        <div key={i} className={cn("p-4 rounded-2xl border border-white/10 flex items-center gap-3", team.color)}>
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">{i+1}</div>
                          <input 
                            value={team.name}
                            onChange={(e) => setTeams(prev => prev.map((t, idx) => idx === i ? { ...t, name: e.target.value } : t))}
                            className="bg-transparent border-none outline-none font-black uppercase text-sm w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-blue-200 font-bold uppercase tracking-widest text-sm">Game Mode & Difficulty</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(['bible', 'history', 'geography', 'science', 'mixed'] as JeopardyMode[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => onModeChange?.(m)}
                          className={cn(
                            "p-4 rounded-2xl border-2 font-black uppercase text-xs transition-all",
                            mode === m ? "bg-yellow-400 border-yellow-300 text-blue-900" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {(['extreme-easy', 'easy', 'medium', 'hard'] as JeopardyDifficulty[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => onDifficultyChange?.(d)}
                          className={cn(
                            "p-4 rounded-2xl border-2 font-black uppercase text-xs transition-all",
                            difficulty === d ? "bg-emerald-500 border-emerald-400 text-white" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                          )}
                        >
                          {d.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex flex-col items-center gap-4">
                  <button 
                    onClick={() => setGameState('board')}
                    className="px-16 py-6 bg-yellow-400 text-blue-900 rounded-full font-black text-3xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    START GAME
                  </button>
                  <button 
                    onClick={() => onRetry(mode, difficulty)}
                    className="text-blue-300 font-bold uppercase tracking-widest text-xs hover:text-white flex items-center gap-2"
                  >
                    <RotateCcw size={14} /> Regenerate Board
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'board' && (
            <motion.div 
              key="board"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 p-4 flex flex-col"
            >
              <div className="flex-1 grid grid-cols-5 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex flex-col gap-4">
                    <div className="bg-blue-950 p-4 rounded-2xl border-2 border-blue-800 shadow-xl h-24 flex items-center justify-center text-center">
                      <h3 className="text-sm font-black uppercase tracking-tighter leading-tight text-blue-200">
                        {category.title}
                      </h3>
                    </div>
                    {category.questions.map((q) => {
                      const isAnswered = answeredIds.includes(q.id);
                      const metadata = answeredMetadata[q.id];
                      const teamColor = metadata && metadata.teamIndex !== -1 ? teams[metadata.teamIndex].color : '';
                      
                      return (
                        <button
                          key={q.id}
                          onClick={() => handleQuestionSelect(category.id, q.id)}
                          className={cn(
                            "flex-1 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center relative overflow-hidden group",
                            isAnswered 
                              ? cn("opacity-40 grayscale", teamColor || "bg-slate-800 border-slate-700") 
                              : "bg-blue-800 border-blue-700 hover:bg-blue-700 hover:border-blue-600 hover:scale-[1.02] shadow-lg",
                            isEditMode && isAnswered && "opacity-100 grayscale-0 border-yellow-400"
                          )}
                        >
                          {isAnswered ? (
                            <div className="flex flex-col items-center">
                              <Check size={24} className="text-white/50" />
                              {metadata && metadata.points !== 0 && (
                                <span className="text-[10px] font-black">{metadata.points > 0 ? '+' : ''}{metadata.points}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-3xl font-black text-yellow-400 tracking-tighter">${q.value}</span>
                          )}
                          {q.isDailyDouble && !isAnswered && (
                            <div className="absolute top-1 right-1">
                              <Sparkles size={12} className="text-yellow-400 animate-pulse" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={cn(
                      "px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all",
                      isEditMode ? "bg-yellow-400 text-blue-900" : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    {isEditMode ? 'Exit Edit Mode' : 'Edit Board'}
                  </button>
                  <button 
                    onClick={() => setGameState('results')}
                    className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all"
                  >
                    End Game
                  </button>
                </div>
                
                <div className="flex gap-2">
                  {savedBoards.length > 0 && (
                    <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Saved Boards:</span>
                      <select 
                        onChange={(e) => {
                          const board = savedBoards.find(b => b.id === e.target.value);
                          if (board) onLoadBoard?.(board);
                        }}
                        value={boardId || ''}
                        className="bg-transparent text-white text-[10px] font-bold outline-none border-none"
                      >
                        <option value="" disabled>Select Board</option>
                        {savedBoards.map(b => (
                          <option key={b.id} value={b.id} className="bg-blue-900">
                            {b.mode.toUpperCase()} - {new Date(b.createdAt).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'question' && currentQuestion && (
            <motion.div 
              key="question"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-blue-900"
            >
              <div className="max-w-5xl w-full text-center space-y-12">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <span className="px-6 py-2 bg-yellow-400 text-blue-900 rounded-full font-black text-sm uppercase tracking-widest">
                    {categories.find(c => c.id === selectedQuestion?.categoryId)?.title} • ${currentQuestion.isDailyDouble ? wager : currentQuestion.value}
                  </span>
                  <h2 className="text-5xl sm:text-7xl font-black italic tracking-tighter leading-tight uppercase">
                    {currentQuestion.clue}
                  </h2>
                </motion.div>

                <AnimatePresence>
                  {showAnswer && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="h-px bg-white/20 w-32 mx-auto" />
                      <p className="text-blue-300 font-bold uppercase tracking-[0.3em] text-sm">The Response</p>
                      <h3 className="text-4xl sm:text-6xl font-black text-yellow-400 italic tracking-tighter uppercase">
                        {currentQuestion.answer}
                      </h3>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-12 flex flex-col items-center gap-8">
                  {!showAnswer ? (
                    <button 
                      onClick={() => setShowAnswer(true)}
                      className="px-16 py-6 bg-white text-blue-900 rounded-full font-black text-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
                    >
                      SHOW ANSWER
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-6">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleScore(true)}
                          className="px-12 py-5 bg-emerald-500 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-emerald-400 transition-all flex items-center gap-3"
                        >
                          <Check /> CORRECT
                        </button>
                        <button 
                          onClick={() => handleScore(false)}
                          className="px-12 py-5 bg-rose-500 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-rose-400 transition-all flex items-center gap-3"
                        >
                          <X /> INCORRECT
                        </button>
                      </div>
                      <button 
                        onClick={handleNoScore}
                        className="text-blue-300 font-bold uppercase tracking-widest text-xs hover:text-white"
                      >
                        No one answered
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-blue-950"
            >
              <div className="max-w-4xl w-full text-center space-y-12">
                <h2 className="text-7xl font-black italic tracking-tighter text-yellow-400 uppercase">FINAL RESULTS</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[...teams].sort((a, b) => b.score - a.score).map((team, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn("p-8 rounded-[2.5rem] border-2 border-white/10 flex flex-col items-center relative overflow-hidden", team.color)}
                    >
                      {i === 0 && (
                        <div className="absolute top-4 right-4 text-yellow-400 rotate-12">
                          <Trophy size={48} />
                        </div>
                      )}
                      <span className="text-sm font-bold uppercase tracking-widest opacity-70 mb-2">{i === 0 ? 'Champion' : `Rank #${i+1}`}</span>
                      <h3 className="text-4xl font-black uppercase tracking-tighter mb-4">{team.name}</h3>
                      <div className="text-6xl font-black tracking-tighter">${team.score}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => {
                      setAnsweredIds([]);
                      setAnsweredMetadata({});
                      setTeams(prev => prev.map(t => ({ ...t, score: 0 })));
                      setGameState('board');
                    }}
                    className="px-12 py-5 bg-yellow-400 text-blue-900 rounded-full font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    PLAY AGAIN
                  </button>
                  <button 
                    onClick={onExit}
                    className="px-12 py-5 bg-white/10 text-white rounded-full font-black text-xl hover:bg-white/20 transition-all"
                  >
                    EXIT TO HUB
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Daily Double Wager Overlay */}
      <AnimatePresence>
        {showWagerInput && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-blue-950/90 backdrop-blur-xl flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-blue-900 p-10 rounded-[3rem] border-2 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.3)] text-center space-y-8"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-yellow-400 rounded-3xl flex items-center justify-center text-blue-900 shadow-xl">
                  <Sparkles size={48} />
                </div>
                <h2 className="text-4xl font-black italic tracking-tighter text-yellow-400 uppercase">DAILY DOUBLE!</h2>
                <p className="text-blue-200 font-bold uppercase tracking-widest text-xs">
                  {teams[activeTeamIndex].name}, enter your wager
                </p>
              </div>

              <div className="space-y-4">
                <div className="text-6xl font-black text-white tracking-tighter">${wager}</div>
                <input 
                  type="range"
                  min="0"
                  max={Math.max(1000, teams[activeTeamIndex].score)}
                  step="100"
                  value={wager}
                  onChange={(e) => setWager(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-yellow-400"
                />
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-blue-400">
                  <span>$0</span>
                  <span>Max: ${Math.max(1000, teams[activeTeamIndex].score)}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowWagerInput(false);
                  setGameState('question');
                }}
                className="w-full py-5 bg-yellow-400 text-blue-900 rounded-2xl font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                PLACE WAGER
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-blue-950 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative w-32 h-32 mb-8">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <HelpCircle size={48} className="text-yellow-400 animate-pulse" />
              </div>
            </div>
            <h3 className="text-3xl font-black italic tracking-tighter text-yellow-400 uppercase mb-4">GENERATING BOARD</h3>
            <p className="text-blue-200 font-bold uppercase tracking-widest text-sm animate-bounce">Consulting the archives...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
