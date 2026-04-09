import React from 'react';
import { motion } from 'motion/react';
import { Heart, Gem, Trophy, Star } from 'lucide-react';
import { cn } from '../lib/utils';

export const ProgressBar = ({ current, total }: { current: number, total: number }) => (
  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-100">
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, (current / total) * 100)}%` }}
      className="h-full bg-secondary"
    />
  </div>
);

export const HeartDisplay = ({ hearts, max }: { hearts: number, max: number }) => (
  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
    <Heart className={cn("w-5 h-5", hearts > 0 ? "text-red-500 fill-red-500" : "text-gray-300")} />
    <span className={cn("font-bold", hearts === 0 && "text-gray-400")}>{hearts}</span>
  </div>
);

export const GemDisplay = ({ gems }: { gems: number }) => (
  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
    <Gem className="w-5 h-5 text-blue-400 fill-blue-400" />
    <span className="font-bold">{gems}</span>
  </div>
);

export const Character = ({ mood = 'happy' }: { mood?: 'happy' | 'sad' | 'thinking' | 'excited' }) => {
  const colors = {
    happy: 'bg-secondary',
    sad: 'bg-gray-400',
    thinking: 'bg-primary',
    excited: 'bg-accent'
  };

  return (
    <div className="relative w-24 h-24 mx-auto mb-4">
      <motion.div 
        animate={{ 
          y: mood === 'excited' ? [0, -10, 0] : 0,
          rotate: mood === 'thinking' ? [0, 5, -5, 0] : 0
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        className={cn("w-full h-full rounded-3xl shadow-lg flex items-center justify-center relative overflow-hidden", colors[mood])}
      >
        {/* Eyes */}
        <div className="flex gap-4">
          <motion.div 
            animate={{ scaleY: mood === 'happy' ? [1, 0.1, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 3, delay: 1 }}
            className="w-3 h-3 bg-white rounded-full" 
          />
          <motion.div 
            animate={{ scaleY: mood === 'happy' ? [1, 0.1, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 3, delay: 1.1 }}
            className="w-3 h-3 bg-white rounded-full" 
          />
        </div>
        {/* Mouth */}
        <div className={cn(
          "absolute bottom-6 w-8 h-4 border-white transition-all",
          mood === 'happy' || mood === 'excited' ? "border-b-4 rounded-full" : "border-t-4 rounded-full translate-y-2",
          mood === 'thinking' && "w-4 h-1 bg-white rounded-full border-0"
        )} />
      </motion.div>
      {/* Cape for "Sword Quest" theme */}
      <div className="absolute -z-10 top-4 -left-2 w-28 h-20 bg-red-600 rounded-lg transform -rotate-12 opacity-80" />
    </div>
  );
};

export const RewardModal = ({ xp, onNext }: { xp: number, onNext: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
  >
    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-primary">
      <motion.div 
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="inline-block mb-4"
      >
        <Trophy className="w-20 h-20 text-primary" />
      </motion.div>
      <h2 className="text-3xl font-bold mb-2 font-display">Awesome Job!</h2>
      <p className="text-gray-600 mb-6">You mastered this verse and earned</p>
      <div className="flex items-center justify-center gap-2 mb-8">
        <Star className="w-8 h-8 text-primary fill-primary" />
        <span className="text-4xl font-bold text-primary">+{xp} XP</span>
      </div>
      <button 
        onClick={onNext}
        className="w-full py-4 bg-secondary text-white rounded-2xl font-bold text-xl shadow-lg hover:brightness-110 transition-all active:scale-95"
      >
        Keep Going!
      </button>
    </div>
  </motion.div>
);
