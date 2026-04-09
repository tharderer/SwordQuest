import React, { memo, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { Trophy, Heart, BookOpen, Lightbulb, Play, Settings, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { BIBLE_SECTIONS } from '../lib/bibleSections';

export const TriviaHUD = memo(({ score, streak, isPaused, setIsPaused, lastUpdateRef, setIsSettingsOpen, lives, deed, reference, book, chapter, progress, lastSeen, onStudy, onHint, canHint, sectionId, themeColor }: any) => {
  const isNew = !lastSeen;
  const section = BIBLE_SECTIONS.find(s => s.id === sectionId);

  return (
    <div className={cn(
      "flex items-center px-1 sm:px-4 z-50 bg-slate-950 border-b border-white/5 shadow-2xl relative",
      themeColor === '#10b981' ? "min-h-[120px] py-4" : "h-[14vh] min-h-[100px] max-h-[120px]"
    )}>
      {/* Left Section: Score & Hearts & Streak */}
      <div className="flex flex-col items-start gap-1 flex-none w-[75px] sm:w-[140px]">
        <div className="relative">
          <div className={cn(
            "bg-slate-900/60 border border-white/10 px-2 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-1.5 sm:gap-3 shadow-inner",
            themeColor && "border-opacity-50"
          )}
          style={themeColor ? { borderColor: `${themeColor}40` } : {}}
          >
            <Trophy className={cn("w-4 h-4 sm:w-5 sm:h-5", themeColor ? "" : "text-yellow-400")} style={themeColor ? { color: themeColor } : {}} />
            <span className="text-lg sm:text-2xl font-black text-white tracking-tighter leading-none">{score}</span>
          </div>
          {streak >= 5 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-orange-500 text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full border border-white/20 shadow-lg z-10"
              style={themeColor ? { backgroundColor: themeColor } : {}}
            >
              x2
            </motion.div>
          )}
        </div>
        <div className="flex gap-1 pl-1">
          {[...Array(3)].map((_, i) => (
            <Heart 
              key={i} 
              size={12} 
              className={cn(
                "transition-all duration-300",
                i < lives ? "text-red-500 fill-red-500" : "text-slate-800"
              )} 
            />
          ))}
        </div>
      </div>

      {/* Center Section: Deed (Question) - Maximized */}
      <div className="flex-1 flex flex-col items-center justify-center px-0 h-full">
        <div className="flex items-center gap-2 mb-1">
          {(reference || book) && themeColor !== '#8b5cf6' && (
            <div className="flex items-center gap-1">
              <span 
                className="text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest flex items-center gap-1"
                style={{ 
                  backgroundColor: themeColor ? `${themeColor}20` : `${section?.color}20`, 
                  color: themeColor || section?.color,
                  borderColor: themeColor ? `${themeColor}40` : `${section?.color}40`
                }}
              >
                <BookOpen size={10} />
                {reference || `${book} ${chapter}`}
              </span>
            </div>
          )}
          {lastSeen !== undefined && (
            isNew ? (
              <span className="bg-emerald-500 text-white text-[7px] font-black px-1 rounded uppercase tracking-tighter">NEW</span>
            ) : (
              <span className="bg-blue-500 text-white text-[7px] font-black px-1 rounded uppercase tracking-tighter">REVIEW</span>
            )
          )}
          {section && !themeColor && (
            <span 
              className="text-white text-[7px] font-black px-1 rounded uppercase tracking-tighter"
              style={{ backgroundColor: section.color }}
            >
              {section.name}
            </span>
          )}
        </div>
        <div className="text-center w-full px-2">
          <p 
            onClick={onStudy}
            className={cn(
              "text-white font-black tracking-tighter italic drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] cursor-pointer active:scale-95 transition-transform",
              themeColor !== '#10b981' ? "uppercase leading-[1.1] overflow-hidden text-ellipsis" : "leading-normal"
            )}
            style={{ 
              fontSize: themeColor === '#10b981' ? 'clamp(0.85rem, 4.5vw, 1.7rem)' : 'clamp(0.7rem, 3.5vw, 1.4rem)',
              display: themeColor !== '#10b981' ? '-webkit-box' : 'block',
              WebkitLineClamp: themeColor !== '#10b981' ? 3 : undefined,
              WebkitBoxOrient: themeColor !== '#10b981' ? 'vertical' : undefined,
              wordBreak: 'break-word'
            }}
          >
            "{deed}"
          </p>
        </div>
        {progress && !themeColor && (
          <div className="mt-1 w-full max-w-[150px] h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500 transition-all duration-500" 
              style={{ width: `${(progress.chapter / 50) * 100}%` }} // Simplified progress bar
            />
          </div>
        )}
      </div>


      {/* Right Section: Controls */}
      <div className="flex items-center gap-2 sm:gap-3 flex-none w-[75px] sm:w-[140px] justify-end">
        <button 
          onClick={onHint}
          disabled={!canHint || isPaused}
          className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all active:scale-90 border",
            canHint && !isPaused 
              ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/30" 
              : "bg-slate-900/60 border-white/10 text-white/20 cursor-not-allowed"
          )}
        >
          <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button 
          onClick={() => {
            if (isPaused) lastUpdateRef.current = performance.now();
            setIsPaused(!isPaused);
          }}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900/60 border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-90"
        >
          {isPaused ? <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white" /> : <div className="flex gap-1.5"><div className="w-1 h-4 sm:h-5 bg-white rounded-full"/><div className="w-1 h-4 sm:h-5 bg-white rounded-full"/></div>}
        </button>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900/60 border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-90"
        >
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
});

export const MathHUD = memo(({ score, streak, isPaused, setIsPaused, lastUpdateRef, setIsSettingsOpen, lives }: any) => {
  return (
    <div className="h-[14vh] min-h-[100px] max-h-[120px] flex items-center px-1 sm:px-4 z-50 bg-slate-950 border-b border-white/5 shadow-2xl relative">
      {/* Left Section: Score & Hearts & Streak */}
      <div className="flex flex-col items-start gap-1 flex-none w-[75px] sm:w-[140px]">
        <div className="relative">
          <div className="bg-slate-900/60 border border-white/10 px-2 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-1.5 sm:gap-3 shadow-inner">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            <span className="text-lg sm:text-2xl font-black text-white tracking-tighter leading-none">{score}</span>
          </div>
          {streak >= 5 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-orange-500 text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full border border-white/20 shadow-lg z-10"
            >
              x2
            </motion.div>
          )}
        </div>
        <div className="flex gap-1 pl-1">
          {[...Array(3)].map((_, i) => (
            <Heart 
              key={i} 
              size={12} 
              className={cn(
                "transition-all duration-300",
                i < lives ? "text-red-500 fill-red-500" : "text-slate-800"
              )} 
            />
          ))}
        </div>
      </div>

      {/* Center Section: Prompt - Maximized */}
      <div className="flex-1 flex items-center justify-center px-0 overflow-hidden h-full">
        <div className="text-center w-full">
          <p 
            className="text-white font-black leading-[0.85] tracking-tighter italic line-clamp-3 uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
            style={{ 
              fontSize: 'clamp(1.2rem, 5vw, 4rem)',
              wordBreak: 'break-word'
            }}
          >
            "FIND THE TRUTH"
          </p>
        </div>
      </div>

      {/* Right Section: Controls */}
      <div className="flex items-center gap-2 sm:gap-3 flex-none w-[75px] sm:w-[140px] justify-end">
        <button 
          onClick={() => {
            if (isPaused) lastUpdateRef.current = performance.now();
            setIsPaused(!isPaused);
          }}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900/60 border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-90"
        >
          {isPaused ? <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white" /> : <div className="flex gap-1.5"><div className="w-1 h-4 sm:h-5 bg-white rounded-full"/><div className="w-1 h-4 sm:h-5 bg-white rounded-full"/></div>}
        </button>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900/60 border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-90"
        >
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
});

export const HUD = memo(({ score, streak, isPaused, setIsPaused, lastUpdateRef, gameMode, dictStatus, currentVerse, setIsSettingsOpen }: any) => {
  const isMobile = useMemo(() => typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent), []);
  return (
    <div className="h-[10vh] min-h-[64px] max-h-[80px] flex items-center px-1 sm:px-4 z-50 bg-slate-950 border-b border-white/5 shadow-2xl relative">
      {/* Left Section: Score */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1">
        <div className="bg-slate-900/60 border border-white/10 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-1.5 sm:gap-3 shadow-inner">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
          <span className="text-xl sm:text-2xl font-black text-white tracking-tighter leading-none">{score}</span>
        </div>

        {dictStatus === 'loading' && (
          <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 animate-pulse">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Indexing Lexicon...</span>
          </div>
        )}

      {streak >= 5 && (
        isMobile ? (
          <div className="bg-gradient-to-r from-orange-500 to-rose-500 px-2 sm:px-3 py-1 rounded-full shadow-lg border border-white/20 flex items-center gap-1">
            <Zap className="w-3 h-3 text-white fill-white" />
            <span className="hidden xs:inline text-[8px] sm:text-[10px] font-black text-white uppercase tracking-tighter">Streak x2</span>
          </div>
        ) : (
          <motion.div 
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            className="bg-gradient-to-r from-orange-500 to-rose-500 px-2 sm:px-3 py-1 rounded-full shadow-lg border border-white/20 flex items-center gap-1"
          >
            <Zap className="w-3 h-3 text-white fill-white" />
            <span className="hidden xs:inline text-[8px] sm:text-[10px] font-black text-white uppercase tracking-tighter">Streak x2</span>
          </motion.div>
        )
      )}
    </div>

    {/* Center Section: Verse Reference */}
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
      {currentVerse && (
        isMobile ? (
          <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-1.5 rounded-xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-blue-400 font-black text-sm sm:text-xl tracking-tighter italic uppercase whitespace-nowrap">
              {`${currentVerse.book} ${currentVerse.chapter} ${currentVerse.verse}`.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim()}
            </span>
          </div>
        ) : (
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-blue-600/10 border border-blue-500/20 px-4 py-1.5 rounded-xl flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-blue-400 font-black text-sm sm:text-xl tracking-tighter italic uppercase whitespace-nowrap">
              {`${currentVerse.book} ${currentVerse.chapter} ${currentVerse.verse}`.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim()}
            </span>
          </motion.div>
        )
      )}
    </div>

      {/* Right Section: Controls */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
        <button 
          onClick={() => {
            if (isPaused) {
              lastUpdateRef.current = performance.now();
            }
            setIsPaused(!isPaused);
          }}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900/60 border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-90 touch-manipulation"
        >
          {isPaused ? <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white" /> : <div className="flex gap-1.5"><div className="w-1 h-4 sm:h-5 bg-white rounded-full"/><div className="w-1 h-4 sm:h-5 bg-white rounded-full"/></div>}
        </button>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900/60 border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-90"
        >
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
});

export const TowerBlock = memo(({ word, height, bottom, color, isPlatform, reference, questionText, onBlockClick }: any) => {
  const charCount = word.length;
  const baseSize = height * 0.8; 
  
  let scaleFactor = 1;
  if (charCount > 200) scaleFactor = 0.15;
  else if (charCount > 150) scaleFactor = 0.18;
  else if (charCount > 120) scaleFactor = 0.22;
  else if (charCount > 90) scaleFactor = 0.28;
  else if (charCount > 60) scaleFactor = 0.35;
  else if (charCount > 40) scaleFactor = 0.45;
  else if (charCount > 20) scaleFactor = 0.6;
  else scaleFactor = 0.8;

  const fontSize = Math.min(Math.max(baseSize * scaleFactor, 12), 60);
  const lineHeight = 1.1;
  const letterSpacing = charCount > 60 ? '-0.01em' : 'normal';

  return (
    <div 
      className={cn(
        "absolute left-0 right-0 flex items-center justify-center overflow-hidden",
        reference && "cursor-pointer hover:brightness-110 active:scale-95 transition-all pointer-events-auto"
      )}
      style={{ 
        bottom: `${bottom}px`,
        height: `${height}px`,
      }}
      onClick={() => reference && onBlockClick?.(reference, word, questionText)}
    >
      <div 
        className={cn(
          "flex items-center justify-center text-white font-black text-center px-4 h-full w-full",
          isPlatform ? "bg-slate-800" : ""
        )}
        style={{ 
          backgroundColor: color,
          borderTop: '2px solid rgba(255,255,255,0.15)',
          borderBottom: '2px solid rgba(0,0,0,0.25)',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.15)',
        }}
      >
        <span 
          className="uppercase tracking-tight drop-shadow-2xl whitespace-normal break-words overflow-hidden w-full"
          style={{ 
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            letterSpacing: letterSpacing,
            maxHeight: '95%',
            display: 'block'
          }}
        >
          {word}
        </span>
        {isPlatform && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        )}
      </div>
    </div>
  );
});

export const TowerStack = memo(({ stack, onBlockClick }: { stack: any[], onBlockClick?: (ref: string, word: string, qText?: string) => void }) => {
  let currentBottom = 0;
  
  return (
    <div className="absolute bottom-0 left-0 right-0 h-0 overflow-visible">
      {stack.map((item) => {
        const bottom = currentBottom;
        const blockHeight = item.height;
        currentBottom += blockHeight;
        
        return (
          <TowerBlock 
            key={item.id}
            word={item.word}
            height={blockHeight}
            bottom={bottom}
            color={item.color}
            isPlatform={item.isPlatform}
            reference={item.reference}
            questionText={item.questionText}
            onBlockClick={onBlockClick}
          />
        );
      })}
    </div>
  );
});
