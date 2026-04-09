import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, BookOpen, AlertCircle, Trash2 } from 'lucide-react';
import { parseReference, getVersesByRange } from '../lib/bibleDb';

export const BibleStudyOverlay = ({ reference, questionText, onDelete, onClose }: { reference: string, questionText?: string, onDelete?: () => void, onClose: () => void }) => {
  const [verses, setVerses] = useState<{ verse: number, text: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerses = async () => {
      try {
        setLoading(true);
        const parsed = parseReference(reference);
        if (!parsed) {
          setError("Invalid reference format.");
          return;
        }

        const result = await getVersesByRange(parsed.book, parsed.chapter, parsed.startVerse, parsed.endVerse);
        if (result.length === 0) {
          setError(`Could not find ${reference} in the downloaded Bible. Please wait for the download to complete.`);
        } else {
          setVerses(result);
        }
      } catch (err) {
        console.error("Error fetching verses:", err);
        setError("Failed to load Bible text.");
      } finally {
        setLoading(false);
      }
    };

    fetchVerses();
  }, [reference]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-xl">
              <BookOpen className="text-orange-500" size={24} />
            </div>
            <div>
              <h3 className="text-white font-black text-xl tracking-tight uppercase italic">Bible Study</h3>
              <p className="text-orange-400 font-bold text-xs uppercase tracking-widest">{reference.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim()}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {questionText && (
            <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Question</p>
              <p className="text-white text-lg font-bold italic tracking-tight leading-tight">"{questionText.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim()}"</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Searching Scriptures...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex p-3 bg-red-500/10 rounded-2xl">
                <AlertCircle className="text-red-500" size={32} />
              </div>
              <p className="text-slate-300 font-medium leading-relaxed">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {verses.map((v, i) => (
                <motion.div 
                  key={v.verse}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <span className="text-orange-500 font-black text-lg italic shrink-0 mt-1">{v.verse}</span>
                  <p className="text-white text-xl font-medium leading-relaxed tracking-tight">
                    {v.text.replace(/\{[^{}]*:[^{}]*\}/g, "").replace(/[^\w\s]|_/g, "").replace(/[\{\}\[\]\(\)]/g, "").replace(/\s+/g, " ").trim()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-950/50 border-t border-white/5 flex gap-3">
          {onDelete && (
            <button 
              onClick={onDelete}
              className="px-6 py-4 bg-rose-500/20 text-rose-500 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform hover:bg-rose-500/30 border border-rose-500/20"
              title="Delete Question"
            >
              <Trash2 size={24} />
            </button>
          )}
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform uppercase italic tracking-tighter"
          >
            Resume Mission
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
