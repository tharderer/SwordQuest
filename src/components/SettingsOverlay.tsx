import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, Music, Database, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

export const SettingsOverlay = memo(({ 
  isOpen, 
  onClose, 
  volume, 
  setVolume, 
  isMusicEnabled, 
  setIsMusicEnabled, 
  selectedMusicStyle, 
  setSelectedMusicStyle, 
  onOpenBank, 
  onOpenWitsBank, 
  onRepair, 
  downloadProgress 
}: any) => {
  const musicStyles = [
    { id: 'hymns', name: 'Piano Hymns', icon: <Music className="w-4 h-4" /> },
    { id: 'gospel', name: 'Gospel Classics', icon: <Music className="w-4 h-4" /> },
    { id: 'acoustic', name: 'Acoustic Worship', icon: <Music className="w-4 h-4" /> },
    { id: 'ambient', name: 'Ambient Prayer', icon: <Music className="w-4 h-4" /> },
    { id: 'lofi', name: 'Lo-Fi Study', icon: <Music className="w-4 h-4" /> },
    { id: 'classical', name: 'Classical Sacred', icon: <Music className="w-4 h-4" /> },
    { id: 'retro', name: 'Retro 8-bit', icon: <Music className="w-4 h-4" /> },
    { id: 'epic', name: 'Epic Orchestral', icon: <Music className="w-4 h-4" /> }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Settings</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-bold uppercase tracking-widest text-xs">Volume</span>
                  </div>
                  <span className="text-white/50 font-mono text-xs">{Math.round(volume * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Music className={cn("w-5 h-5", isMusicEnabled ? "text-blue-400" : "text-white/30")} />
                    <div>
                      <span className="text-white font-bold uppercase tracking-widest text-xs block">Background Music</span>
                      <span className="text-[10px] text-white/40 uppercase font-bold">{isMusicEnabled ? "Playing" : "Muted"}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMusicEnabled(!isMusicEnabled)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      isMusicEnabled ? "bg-blue-600" : "bg-slate-700"
                    )}
                  >
                    <motion.div 
                      animate={{ x: isMusicEnabled ? 24 : 4 }}
                      className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>

                {isMusicEnabled && (
                  <div className="grid grid-cols-1 gap-2">
                    <span className="text-[10px] text-white/40 uppercase font-bold px-2">Music Style</span>
                    {musicStyles.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedMusicStyle(style.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all",
                          selectedMusicStyle === style.id 
                            ? "bg-blue-600/20 border-blue-500/50 text-blue-400" 
                            : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                        )}
                      >
                        {style.icon}
                        <span className="text-xs font-bold uppercase tracking-wider">{style.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => {
                    onClose();
                    onOpenBank();
                  }}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-orange-400" />
                    <span className="text-white font-bold uppercase tracking-widest text-xs">Trivia Tower Bank</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                </button>

                <button 
                  onClick={() => {
                    onClose();
                    onOpenWitsBank();
                  }}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-[#d4af37]" />
                    <span className="text-white font-bold uppercase tracking-widest text-xs">Wits & Wagers Bank</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                </button>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    <span className="text-white font-bold uppercase tracking-widest text-xs">Bible Data</span>
                  </div>
                  {downloadProgress !== null && (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {downloadProgress === 100 ? 'READY' : `${downloadProgress}%`}
                    </span>
                  )}
                </div>
                
                {downloadProgress !== 100 && downloadProgress !== null && (
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${downloadProgress}%` }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                )}

                <button 
                  onClick={onRepair}
                  disabled={downloadProgress !== null && downloadProgress < 100}
                  className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  {downloadProgress === 100 ? 'Repair / Re-download Bible' : 'Downloading...'}
                </button>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full mt-10 py-4 bg-white text-slate-950 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-transform"
            >
              DONE
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
