import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Database, Trash2, RotateCcw, RefreshCw, Sparkles, Check } from 'lucide-react';
import { 
  getQuestionsSortedByLastSeen, 
  getQuestionsBySection,
  updateBibleProgress, 
  resetBibleProgress,
  resetWitsAndWagersBank,
  saveQuestions, 
  deleteQuestion,
  deleteQuestions,
  deleteAllQuestions,
  JEOPARDY_STORE,
  WITS_STORE,
  BibleQuestion,
  getBibleProgress,
  getWitsSectionsProgress
} from '../services/bibleQuestionService';
import { generateBibleQuestionsBatch } from '../services/geminiService';
import { BIBLE_BOOKS } from '../lib/bibleDb';
import { BIBLE_SECTIONS } from '../lib/bibleSections';
import { cn } from '../lib/utils';

const BIBLE_CHAPTER_COUNTS: Record<string, number> = {
  'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34, 'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36, 'Ezra': 10, 'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalm': 150, 'Proverbs': 31,
  'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66, 'Jeremiah': 52, 'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14, 'Joel': 3, 'Amos': 9,
  'Obadiah': 1, 'Jonah': 4, 'Micah': 7, 'Nahum': 3, 'Habakkuk': 3, 'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14, 'Malachi': 4, 'Matthew': 28, 'Mark': 16,
  'Luke': 24, 'John': 21, 'Acts': 28, 'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6, 'Ephesians': 6, 'Philippians': 4,
  'Colossians': 4, '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4, 'Titus': 3, 'Philemon': 1, 'Hebrews': 13, 'James': 5,
  '1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22
};

const TOTAL_BIBLE_CHAPTERS = 1189;

export const QuestionBankOverlay = ({ isOpen, onClose, storeName = JEOPARDY_STORE }: { isOpen: boolean, onClose: () => void, storeName?: string }) => {
  const [questions, setQuestions] = useState<BibleQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetBankConfirm, setShowResetBankConfirm] = useState(false);

  const [minedPercentage, setMinedPercentage] = useState(0);

  const calculateMiningPercentage = useCallback(async () => {
    const progress = storeName === WITS_STORE 
      ? await getWitsSectionsProgress()
      : await getBibleProgress();
    
    const sections = progress.sections || {};
    let totalChaptersMined = 0;
    
    for (const section of BIBLE_SECTIONS) {
      const prog = sections[section.id];
      if (!prog) continue;
      
      let chaptersInSectionMined = 0;
      let counting = false;
      
      for (const book of BIBLE_BOOKS) {
        if (book === section.startBook) counting = true;
        
        if (counting) {
          if (book === prog.currentBook) {
            chaptersInSectionMined += Math.max(0, prog.currentChapter - 1);
            break;
          } else {
            chaptersInSectionMined += BIBLE_CHAPTER_COUNTS[book] || 0;
          }
        }
      }
      totalChaptersMined += chaptersInSectionMined;
    }
    
    setMinedPercentage(Math.min(100, Math.round((totalChaptersMined / TOTAL_BIBLE_CHAPTERS) * 100)));
  }, [storeName]);

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = await getQuestionsSortedByLastSeen(storeName);
      setQuestions(q || []);
      await calculateMiningPercentage();
    } catch (error) {
      console.error("Failed to load questions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [storeName, calculateMiningPercentage]);

  const groupedQuestions = useMemo(() => {
    const groups: Record<string, BibleQuestion[]> = {};
    
    questions.forEach(q => {
      const sectionId = q.sectionId || 'other';
      if (!groups[sectionId]) groups[sectionId] = [];
      groups[sectionId].push(q);
    });
    
    Object.keys(groups).forEach(sectionId => {
      groups[sectionId].sort((a, b) => {
        const bookA = BIBLE_BOOKS.indexOf(a.book);
        const bookB = BIBLE_BOOKS.indexOf(b.book);
        if (bookA !== bookB) return bookA - bookB;
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return (a.verse || 0) - (b.verse || 0);
      });
    });
    
    return groups;
  }, [questions]);

  useEffect(() => {
    if (isOpen) {
      loadQuestions();
    }
  }, [isOpen, loadQuestions]);

  const handleGenerateMore = async () => {
    if (storeName === WITS_STORE) {
      setGenerationMessage("Generate in Wits & Wagers Lobby");
      setTimeout(() => setGenerationMessage(null), 3000);
      return;
    }
    setIsGenerating(true);
    setGenerationMessage("Starting generation...");
    try {
      const currentProgress = await getBibleProgress();
      const sectionsProgress = { ...(currentProgress.sections || {}) };
      let totalNew = 0;
      let anyNew = false;

      // Find first section that needs questions
      for (const section of BIBLE_SECTIONS) {
        const sectionStored = await getQuestionsBySection(section.id);
        const unseenCount = sectionStored.filter(q => q.lastSeen === 0).length;
        
        if (unseenCount < 100) {
          setGenerationMessage(`Generating for ${section.name}...`);
          const prog = sectionsProgress[section.id] || { 
            currentBook: section.startBook, 
            currentChapter: section.startChapter, 
            currentVerse: section.startVerse 
          };
          
          try {
            const { questions: newQuestions, nextBook, nextChapter, nextVerse } = 
              await generateBibleQuestionsBatch(section.id, prog.currentBook, prog.currentChapter, prog.currentVerse);
            
            if (newQuestions.length > 0) {
              await saveQuestions(newQuestions, JEOPARDY_STORE);
              sectionsProgress[section.id] = { 
                currentBook: nextBook, 
                currentChapter: nextChapter, 
                currentVerse: nextVerse 
              };
              totalNew = newQuestions.length;
              anyNew = true;
              // Break after one section to keep it fast
              break;
            }
          } catch (e) {
            console.error(`Failed to generate for section ${section.id}:`, e);
          }
        }
      }
      
      if (anyNew) {
        await updateBibleProgress(sectionsProgress);
        setGenerationMessage(`Success! Added ${totalNew} questions.`);
        setTimeout(() => setGenerationMessage(null), 3000);
      } else {
        setGenerationMessage("Bank is already well-stocked!");
        setTimeout(() => setGenerationMessage(null), 3000);
      }
      await loadQuestions();
    } catch (error) {
      console.error("Failed to generate more questions:", error);
      setGenerationMessage("Generation failed. Check console.");
      setTimeout(() => setGenerationMessage(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteSingle = async (id: number) => {
    await deleteQuestion(id, storeName);
    loadQuestions();
  };

  const handleDeleteSelected = async () => {
    await deleteQuestions(Array.from(selectedIds), storeName);
    setSelectedIds(new Set());
    loadQuestions();
  };

  const handleDeleteAll = async () => {
    await deleteAllQuestions(storeName);
    setShowClearConfirm(false);
    loadQuestions();
  };

  const handleResetProgress = async () => {
    await resetBibleProgress();
    setShowResetConfirm(false);
  };

  const handleResetBank = async () => {
    if (storeName === WITS_STORE) {
      await resetWitsAndWagersBank();
    } else {
      await deleteAllQuestions(JEOPARDY_STORE);
      await resetBibleProgress();
    }
    setShowResetBankConfirm(false);
    loadQuestions();
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const qList = questions || [];
    if (selectedIds.size === qList.length && qList.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(qList.map(q => q.id!)));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-slate-950 flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-slate-900 border border-white/10 w-full max-w-2xl h-[80vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                  {storeName === JEOPARDY_STORE ? "Trivia Tower Bank" : "Wits & Wagers Bank"}
                </h2>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{(questions || []).length} Questions Stored</p>
                  <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">{minedPercentage}% Mined</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 bg-slate-800/30 border-b border-white/5 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2">
                <button 
                  onClick={selectAll}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-white/5"
                >
                  {(selectedIds.size === (questions || []).length && (questions || []).length > 0) ? "Deselect All" : "Select All"}
                </button>
                {selectedIds.size > 0 && (
                  <button 
                    onClick={handleDeleteSelected}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-rose-500/20 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Delete ({selectedIds.size})
                  </button>
                )}
                {storeName === JEOPARDY_STORE && (
                  <button 
                    onClick={handleGenerateMore}
                    disabled={isGenerating}
                    className={cn(
                      "px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-orange-500/20 flex items-center gap-1 min-w-[140px] justify-center",
                      isGenerating && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isGenerating ? (
                      <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles size={12} />
                    )}
                    {generationMessage || (isGenerating ? "Generating..." : "Generate More")}
                  </button>
                )}
                {storeName === JEOPARDY_STORE && (
                  <button 
                    onClick={() => setShowResetConfirm(true)}
                    className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-blue-500/20 flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Reset Progress
                  </button>
                )}
                <button 
                  onClick={() => setShowResetBankConfirm(true)}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-amber-500/20 flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Reset Bank
                </button>
              </div>
              <button 
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors shadow-lg shadow-rose-600/20"
              >
                Clear All
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (questions || []).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Database size={48} className="text-white/10 mb-4" />
                  <p className="text-white/30 font-bold uppercase tracking-widest text-sm">No questions stored yet</p>
                </div>
              ) : (
                BIBLE_SECTIONS.map(section => {
                  const sectionQuestions = groupedQuestions[section.id];
                  if (!sectionQuestions || sectionQuestions.length === 0) return null;
                  
                  return (
                    <div key={section.id} className="space-y-4">
                      <div className="flex items-center gap-3 sticky top-0 z-[5] bg-slate-900/90 py-2 backdrop-blur-sm">
                        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: section.color }} />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic">{section.name}</h3>
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                          {sectionQuestions.length} Questions
                        </span>
                      </div>
                      <div className="grid gap-3">
                        {sectionQuestions.map((q) => (
                          <div 
                            key={q.id} 
                            className={cn(
                              "p-4 rounded-2xl border transition-all flex items-start gap-4 group",
                              selectedIds.has(q.id!) 
                                ? "bg-blue-500/10 border-blue-500/30" 
                                : "bg-white/5 border-white/5 hover:border-white/10"
                            )}
                          >
                            <button 
                              onClick={() => toggleSelect(q.id!)}
                              className={cn(
                                "mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0",
                                selectedIds.has(q.id!) 
                                  ? "bg-blue-500 border-blue-500 text-white" 
                                  : "border-white/20 hover:border-white/40"
                              )}
                            >
                              {selectedIds.has(q.id!) && <Check size={14} />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">{q.book} {q.chapter}:{q.verse}</span>
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{q.era}</span>
                              </div>
                              <p className="text-white font-medium text-sm leading-tight mb-2">{q.text}</p>
                              <div className="flex flex-wrap gap-1">
                                {q.options?.map((opt, i) => (
                                  <span 
                                    key={i} 
                                    className={cn(
                                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest",
                                      opt === q.correctAnswer ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/30"
                                    )}
                                  >
                                    {opt}
                                  </span>
                                ))}
                                {!q.options && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400">
                                    Answer: {q.answer}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteSingle(q.id!)}
                              className="p-2 text-white/20 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 shrink-0"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
              {groupedQuestions['other'] && groupedQuestions['other'].length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 sticky top-0 z-[5] bg-slate-900/90 py-2 backdrop-blur-sm">
                    <div className="w-1 h-6 rounded-full bg-slate-500" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Other / Uncategorized</h3>
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                      {groupedQuestions['other'].length} Questions
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {groupedQuestions['other'].map((q) => (
                      <div 
                        key={q.id} 
                        className={cn(
                          "p-4 rounded-2xl border transition-all flex items-start gap-4 group",
                          selectedIds.has(q.id!) 
                            ? "bg-blue-500/10 border-blue-500/30" 
                            : "bg-white/5 border-white/5 hover:border-white/10"
                        )}
                      >
                        <button 
                          onClick={() => toggleSelect(q.id!)}
                          className={cn(
                            "mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0",
                            selectedIds.has(q.id!) 
                              ? "bg-blue-500 border-blue-500 text-white" 
                              : "border-white/20 hover:border-white/40"
                          )}
                        >
                          {selectedIds.has(q.id!) && <Check size={14} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">{q.book} {q.chapter}:{q.verse}</span>
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{q.era}</span>
                          </div>
                          <p className="text-white font-medium text-sm leading-tight mb-2">{q.text}</p>
                          <div className="flex flex-wrap gap-1">
                            {q.options?.map((opt, i) => (
                              <span 
                                key={i} 
                                className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest",
                                  opt === q.correctAnswer ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/30"
                                )}
                              >
                                {opt}
                              </span>
                            ))}
                            {!q.options && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400">
                                Answer: {q.answer}
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteSingle(q.id!)}
                          className="p-2 text-white/20 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-900/80 backdrop-blur-md border-t border-white/10">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-transform"
              >
                DONE
              </button>
            </div>

            {showClearConfirm && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[120] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <div className="bg-slate-900 border border-white/10 p-8 rounded-[2rem] max-w-xs w-full text-center shadow-2xl">
                  <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-500">
                    <Trash2 size={32} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic mb-2">Clear Bank?</h3>
                  <p className="text-white/50 text-sm mb-8">This will permanently delete all stored questions.</p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleDeleteAll}
                      className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-95 transition-transform"
                    >
                      YES, CLEAR ALL
                    </button>
                    <button 
                      onClick={() => setShowClearConfirm(false)}
                      className="w-full py-3 text-white/40 font-bold uppercase tracking-widest text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {showResetConfirm && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[120] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <div className="bg-slate-900 border border-white/10 p-8 rounded-[2rem] max-w-xs w-full text-center shadow-2xl">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-500">
                    <RotateCcw size={32} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic mb-2">Reset Progress?</h3>
                  <p className="text-white/50 text-sm mb-8 leading-tight">This will set your Bible generation progress back to Genesis 1. Your current questions will remain.</p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleResetProgress}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-transform"
                    >
                      YES, RESET TO GEN 1
                    </button>
                    <button 
                      onClick={() => setShowResetConfirm(false)}
                      className="w-full py-3 text-white/40 font-bold uppercase tracking-widest text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {showResetBankConfirm && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[120] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <div className="bg-slate-900 border border-white/10 p-8 rounded-[2rem] max-w-xs w-full text-center shadow-2xl">
                  <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500">
                    <RefreshCw size={32} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic mb-2">Reset Bank?</h3>
                  <p className="text-white/50 text-sm mb-8 leading-tight">This will clear all questions and reset the generation pointer to Genesis 1.</p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleResetBank}
                      className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-amber-600/20 active:scale-95 transition-transform"
                    >
                      YES, RESET BANK
                    </button>
                    <button 
                      onClick={() => setShowResetBankConfirm(false)}
                      className="w-full py-3 text-white/40 font-bold uppercase tracking-widest text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
