import React from 'react';
import { motion } from 'motion/react';
import { Shield, RotateCcw, Star, Sword, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Verse } from '../types';

export const PathNode: React.FC<{ 
  verse: Verse, 
  level: number, 
  isLocked: boolean,
  isCracked: boolean,
  isLegendary: boolean,
  index: number,
  onClick: () => void,
  onReset: () => void
}> = ({ verse, level, isLocked, isCracked, isLegendary, index, onClick, onReset }) => {
  const xOffset = (index % 4 === 0 || index % 4 === 3) ? 0 : (index % 4 === 1 ? 40 : -40);
  
  return (
    <div className="relative flex flex-col items-center py-8" style={{ transform: `translateX(${xOffset}px)` }}>
      <div className="relative group">
        <motion.button
          whileHover={!isLocked ? { scale: 1.1 } : {}}
          whileTap={!isLocked ? { scale: 0.9 } : {}}
          onClick={onClick}
          disabled={isLocked}
          className={cn(
            "relative w-20 h-20 rounded-full flex items-center justify-center transition-all border-b-8",
            isLocked ? "bg-gray-200 border-gray-300 text-gray-400" : 
            isCracked ? "bg-red-100 border-red-300 text-red-500" :
            isLegendary ? "bg-yellow-400 border-yellow-600 text-white" :
            level === 7 ? "bg-secondary border-secondary/70 text-white" :
            "bg-primary border-primary/70 text-white"
          )}
        >
          <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-gray-100">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
              {level}/7
            </div>
          </div>
          {isLocked ? <Shield size={28} /> : 
           isCracked ? <RotateCcw size={28} /> :
           isLegendary ? <Star size={28} fill="currentColor" /> :
           level === 7 ? <CheckCircle2 size={28} /> :
           <Sword size={28} />}
           
          {/* Progress Ring */}
          {!isLocked && level < 7 && (
            <svg className="absolute -inset-2 w-24 h-24 -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={276}
                strokeDashoffset={276 - (276 * level) / 7}
                className="text-secondary opacity-40"
              />
            </svg>
          )}
        </motion.button>
        
        {/* Reset Button - Positioned to be easily clickable outside the main button area */}
        {!isLocked && level > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Remove confirm for now to ensure it's not the blocker
              onReset();
            }}
            className="absolute -top-4 -left-4 w-10 h-10 bg-red-500 rounded-full shadow-xl flex items-center justify-center text-white hover:bg-red-600 transition-all z-[100] active:scale-75 border-2 border-white"
            title="Reset Progress"
          >
            <RotateCcw size={20} />
          </button>
        )}
      </div>
      <div className="mt-2 text-center">
        <div className="font-bold text-sm text-gray-800">{verse.book} {verse.chapter}:{verse.verse}</div>
        {isCracked && <div className="text-[10px] font-bold text-red-500 uppercase">Needs Review</div>}
      </div>
    </div>
  );
};
