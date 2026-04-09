import React from 'react';
import { motion } from 'motion/react';
import { X, Library, ArrowRight, BookOpen } from 'lucide-react';
import { VerseSet } from '../types';

export const StarTowerSelectionOverlay = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  verseSets 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSelect: (setId: string | null) => void,
  verseSets: VerseSet[]
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Select Verse Set</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Choose your mission target</p>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* All Verses Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(null)}
            className="w-full p-6 rounded-[2rem] border-2 border-blue-100 bg-blue-50/50 flex items-center gap-6 group hover:border-blue-300 transition-all text-left"
          >
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
              <Library size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-blue-900">All Verses</h3>
              <p className="text-sm font-bold text-blue-600/60 uppercase tracking-wider">The Ultimate Challenge</p>
            </div>
            <div className="ml-auto w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 opacity-0 group-hover:opacity-100 transition-all">
              <ArrowRight size={20} />
            </div>
          </motion.button>

          <div className="pt-4 pb-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4 mb-4">Your Collections</h4>
          </div>

          {verseSets.map((set) => (
            <motion.button
              key={set.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(set.id)}
              className="w-full p-6 rounded-[2rem] border-2 border-slate-100 bg-white flex items-center gap-6 group hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:rotate-6 transition-all">
                <BookOpen size={32} className="text-slate-400 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors">{set.name}</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{set.verses.length} Verses</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <ArrowRight size={20} />
              </div>
            </motion.button>
          ))}

          {verseSets.length === 0 && (
            <div className="text-center py-12 px-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold">No custom collections yet.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
