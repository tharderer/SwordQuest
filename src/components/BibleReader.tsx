import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  X, 
  ArrowLeft,
  Filter,
  Star,
  Bookmark,
  Share2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Settings,
  Maximize2,
  Minimize2,
  Type,
  Moon,
  Sun,
  Palette,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import { 
  getBooks, 
  getChapters, 
  getVersesByChapter, 
  searchBible,
  BIBLE_BOOKS 
} from '../lib/bibleDb';
import { Verse } from '../types';
import { cn } from '../lib/utils';

interface BibleReaderProps {
  onExit: () => void;
  initialBook?: string;
  initialChapter?: number;
}

export const BibleReader: React.FC<BibleReaderProps> = ({ 
  onExit, 
  initialBook = 'Genesis', 
  initialChapter = 1 
}) => {
  const [view, setView] = useState<'selection' | 'reading' | 'search'>('selection');
  const [selectedBook, setSelectedBook] = useState(initialBook);
  const [selectedChapter, setSelectedChapter] = useState(initialChapter);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [books, setBooks] = useState<string[]>(BIBLE_BOOKS);
  const [chapters, setChapters] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Reading Settings
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [showSettings, setShowSettings] = useState(false);

  // Load books on mount
  useEffect(() => {
    getBooks().then(setBooks);
  }, []);

  // Load chapters when book changes
  useEffect(() => {
    if (selectedBook) {
      getChapters(selectedBook).then(setChapters);
    }
  }, [selectedBook]);

  // Load verses when chapter changes
  useEffect(() => {
    if (selectedBook && selectedChapter && view === 'reading') {
      setIsLoading(true);
      getVersesByChapter(selectedBook, selectedChapter)
        .then(v => {
          setVerses(v);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to load verses:", err);
          setIsLoading(false);
        });
    }
  }, [selectedBook, selectedChapter, view]);

  // Handle Search
  useEffect(() => {
    if (searchQuery.length > 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        searchBible(searchQuery).then(results => {
          setSearchResults(results);
          setIsSearching(false);
        });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleBookSelect = (book: string) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setView('reading');
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setView('reading');
  };

  const nextChapter = () => {
    if (selectedChapter < chapters.length) {
      setSelectedChapter(prev => prev + 1);
    } else {
      const bookIndex = BIBLE_BOOKS.indexOf(selectedBook);
      if (bookIndex < BIBLE_BOOKS.length - 1) {
        setSelectedBook(BIBLE_BOOKS[bookIndex + 1]);
        setSelectedChapter(1);
      }
    }
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(prev => prev - 1);
    } else {
      const bookIndex = BIBLE_BOOKS.indexOf(selectedBook);
      if (bookIndex > 0) {
        const prevBook = BIBLE_BOOKS[bookIndex - 1];
        setSelectedBook(prevBook);
        getChapters(prevBook).then(chaps => {
          setSelectedChapter(chaps.length);
        });
      }
    }
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fontSizeClasses = {
    sm: 'text-sm leading-relaxed',
    md: 'text-base leading-relaxed',
    lg: 'text-lg leading-relaxed',
    xl: 'text-xl leading-relaxed'
  };

  const themeClasses = {
    light: 'bg-white text-slate-900',
    dark: 'bg-slate-950 text-slate-200',
    sepia: 'bg-[#f4ecd8] text-[#5b4636]'
  };

  return (
    <div className={cn("fixed inset-0 z-[100] flex flex-col overflow-hidden", themeClasses[theme])}>
      {/* Header */}
      <header className={cn(
        "p-4 flex items-center justify-between border-b shrink-0",
        theme === 'dark' ? "border-slate-800 bg-slate-900" : "border-gray-100 bg-white"
      )}>
        <div className="flex items-center gap-3">
          <button 
            onClick={view === 'reading' ? () => setView('selection') : onExit}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          {view === 'reading' ? (
            <div 
              className="flex flex-col cursor-pointer"
              onClick={() => setView('selection')}
            >
              <h2 className="font-black italic uppercase tracking-tight text-lg leading-none">
                {selectedBook} {selectedChapter}
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Change Chapter</span>
            </div>
          ) : (
            <h2 className="font-black italic uppercase tracking-tight text-xl">BIBLE READER</h2>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setView(view === 'search' ? 'reading' : 'search')}
            className={cn(
              "p-2 rounded-full transition-colors",
              view === 'search' ? "bg-primary text-white" : "hover:bg-black/5"
            )}
          >
            <Search size={20} />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {view === 'selection' && (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 space-y-8"
            >
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-50">Select a Book</h3>
                <div className="grid grid-cols-2 gap-3">
                  {books.map(book => (
                    <button
                      key={book}
                      onClick={() => handleBookSelect(book)}
                      className={cn(
                        "p-4 rounded-2xl border-2 text-left font-bold transition-all active:scale-95",
                        selectedBook === book 
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                          : "bg-black/5 border-transparent hover:border-primary/30"
                      )}
                    >
                      {book}
                    </button>
                  ))}
                </div>
              </div>

              {selectedBook && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-50">Select a Chapter</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {chapters.map(ch => (
                      <button
                        key={ch}
                        onClick={() => handleChapterSelect(ch)}
                        className={cn(
                          "aspect-square rounded-xl border-2 flex items-center justify-center font-bold transition-all active:scale-95",
                          selectedChapter === ch 
                            ? "bg-secondary border-secondary text-white shadow-lg shadow-secondary/20" 
                            : "bg-black/5 border-transparent hover:border-secondary/30"
                        )}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'reading' && (
            <motion.div 
              key="reading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn("p-6 pb-32 max-w-2xl mx-auto", fontSizeClasses[fontSize])}
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-xs font-black uppercase tracking-widest opacity-50">Loading Verses...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mb-8 text-center">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
                      {selectedBook} {selectedChapter}
                    </h1>
                    <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
                  </div>
                  
                  {verses.map((v, i) => (
                    <div key={i} className="group relative">
                      <span className="inline-block w-8 font-black text-primary text-xs align-top pt-1 opacity-50">
                        {v.verse}
                      </span>
                      <span className="inline">
                        {v.text}
                      </span>
                    </div>
                  ))}

                  {/* Navigation Buttons */}
                  <div className="pt-12 flex items-center justify-between gap-4">
                    <button 
                      onClick={prevChapter}
                      className="flex-1 py-4 bg-black/5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/10 transition-colors"
                    >
                      <ChevronLeft size={20} /> Previous
                    </button>
                    <button 
                      onClick={nextChapter}
                      className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                    >
                      Next <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'search' && (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 space-y-6"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search the Bible..."
                  className={cn(
                    "w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none transition-all font-bold",
                    theme === 'dark' ? "bg-slate-900 border-slate-800 focus:border-primary" : "bg-gray-50 border-gray-100 focus:border-primary"
                  )}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {isSearching ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedBook(v.book);
                        setSelectedChapter(v.chapter);
                        setView('reading');
                        // Small delay to allow DOM to update before scrolling
                        setTimeout(() => {
                          const verseElement = document.getElementById(`verse-${v.verse}`);
                          if (verseElement) verseElement.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className={cn(
                        "w-full p-4 rounded-2xl border-2 text-left transition-all hover:border-primary/30 active:scale-[0.98]",
                        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-black text-primary text-xs uppercase tracking-tight">
                          {v.book} {v.chapter}:{v.verse}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 opacity-70 italic">
                        {v.text}
                      </p>
                    </button>
                  ))}
                  {searchQuery.length > 2 && searchResults.length === 0 && (
                    <div className="text-center py-12 opacity-50">
                      <p className="font-bold">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className={cn(
                "fixed bottom-0 left-0 right-0 z-[120] p-8 rounded-t-[2.5rem] shadow-2xl border-t",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
              )}
            >
              <div className="max-w-md mx-auto space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black italic uppercase tracking-tight">Reader Settings</h3>
                  <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-black/5 rounded-full">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Font Size */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-50">
                      <Type size={14} /> Font Size
                    </div>
                    <div className="flex gap-2">
                      {(['sm', 'md', 'lg', 'xl'] as const).map(size => (
                        <button
                          key={size}
                          onClick={() => setFontSize(size)}
                          className={cn(
                            "flex-1 py-3 rounded-xl font-bold uppercase text-xs transition-all",
                            fontSize === size ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-black/5 hover:bg-black/10"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-50">
                      <Palette size={14} /> Theme
                    </div>
                    <div className="flex gap-2">
                      {(['light', 'dark', 'sepia'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={cn(
                            "flex-1 py-3 rounded-xl font-bold uppercase text-xs transition-all flex items-center justify-center gap-2",
                            theme === t ? "ring-2 ring-primary" : "border border-black/10",
                            t === 'light' ? "bg-white text-slate-900" : 
                            t === 'dark' ? "bg-slate-950 text-white" : "bg-[#f4ecd8] text-[#5b4636]"
                          )}
                        >
                          {t === 'light' && <Sun size={14} />}
                          {t === 'dark' && <Moon size={14} />}
                          {t === 'sepia' && <Palette size={14} />}
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl"
                >
                  Apply Changes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
