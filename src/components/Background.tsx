import React, { useMemo, memo } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

export const Background = memo(({ masteredKeys, progress }: { masteredKeys: string[], progress: any }) => {
  const stars = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: 3 + Math.random() * 5
    }));
  }, []);

  const isMobile = useMemo(() => typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-slate-950">
      {masteredKeys.map((key, i) => {
        const mastery = progress.verseMastery?.[key] || {};
        const fuel = mastery.fuel || 100;
        return isMobile ? (
          <div
            key={`constellation-${key}`}
            className="absolute"
            style={{
              top: `${(i * 137) % 70 + 15}%`,
              left: `${(i * 223) % 70 + 15}%`,
              opacity: fuel / 100
            }}
          >
            <div className="relative">
              <Star 
                size={10 + (fuel / 25 || 4)} 
                className="text-yellow-400/40 fill-yellow-400/20" 
              />
            </div>
          </div>
        ) : (
          <motion.div
            key={`constellation-${key}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: fuel / 100 }}
            className="absolute"
            style={{
              top: `${(i * 137) % 70 + 15}%`,
              left: `${(i * 223) % 70 + 15}%`,
            }}
          >
            <div className="relative">
              <Star 
                size={10 + (fuel / 25 || 4)} 
                className="text-yellow-400/40 fill-yellow-400/20" 
              />
            </div>
          </motion.div>
        );
      })}

      {stars.map((star, i) => (
        <div 
          key={i}
          className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-10"
          style={{ 
            top: star.top, 
            left: star.left,
            animation: `pulse ${star.duration}s infinite`
          }}
        />
      ))}
    </div>
  );
}, (prev, next) => {
  return prev.masteredKeys.length === next.masteredKeys.length && 
         prev.masteredKeys.every((v, i) => v === next.masteredKeys[i]);
});
