import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Library, Trash2, Plus, Search, ChevronLeft, BookOpen, ArrowRight, Star } from 'lucide-react';
import { 
  getProgress, 
  createVerseSet, 
  deleteVerseSet, 
  addVersesToSet, 
  removeVerseFromSet 
} from '../lib/storage';
import { 
  getBooks, 
  getChapters, 
  getVersesByBook, 
  getVersesByChapter, 
  getVersesByRange, 
  searchBible 
} from '../lib/bibleDb';
import { Verse, UserProgress, VerseSet } from '../types';
import { cn } from '../lib/utils';

export const VerseSetOverlay = ({ isOpen, onClose, onUpdate }: { isOpen: boolean, onClose: () => void, onUpdate: () => void }) => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [sets, setSets] = useState<VerseSet[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [newSetName, setNewSetName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Verse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'verses' | 'add'>('verses');
  const [progress, setProgress] = useState<UserProgress | null>(null);
  
  // Range selection state
  const [books, setBooks] = useState<string[]>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [startVerse, setStartVerse] = useState<number | null>(null);
  const [endVerse, setEndVerse] = useState<number | null>(null);
  
  const loadSets = useCallback(() => {
    const p = getProgress();
    setProgress(p);
    setSets(p.verseSets || []);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadSets();
      getBooks().then(setBooks);
    }
  }, [isOpen, loadSets]);

  useEffect(() => {
    if (selectedBook) {
      getChapters(selectedBook).then(setChapters);
      setSelectedChapter(null);
    } else {
      setChapters([]);
    }
  }, [selectedBook]);

  const handleCreateSet = () => {
    if (!newSetName.trim()) return;
    createVerseSet(newSetName);
    setNewSetName('');
    loadSets();
    onUpdate();
  };

  const handleDeleteSet = (id: string) => {
    deleteVerseSet(id);
    if (activeSetId === id) {
      setActiveSetId(null);
      setView('list');
    }
    loadSets();
    onUpdate();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchBible(searchQuery);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddVerse = (verse: Verse) => {
    if (!activeSetId) return;
    addVersesToSet(activeSetId, [verse]);
    loadSets();
    onUpdate();
  };

  const handleAddBulk = async (type: 'book' | 'chapter' | 'range') => {
    if (!activeSetId || !selectedBook) return;
    
    let verses: Verse[] = [];
    if (type === 'book') {
      verses = await getVersesByBook(selectedBook);
    } else if (type === 'chapter' && selectedChapter !== null) {
      verses = await getVersesByChapter(selectedBook, selectedChapter);
    } else if (type === 'range' && selectedChapter !== null && startVerse !== null && endVerse !== null) {
      verses = await getVersesByRange(selectedBook, selectedChapter, startVerse, endVerse);
    }

    if (verses.length > 0) {
      addVersesToSet(activeSetId, verses);
      loadSets();
      onUpdate();
      setActiveTab('verses');
    }
  };

  const activeSet = sets.find(s => s.id === activeSetId);

  const handleOpenSet = (id: string) => {
    setActiveSetId(id);
    setView('detail');
    setActiveTab('verses');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-0 sm:p-6"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-4xl h-full sm:h-[85vh] sm:rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden relative"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-4">
                {view === 'detail' && (
                  <button 
                    onClick={() => setView('list')}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/10">
                    <Library className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">
                      {view === 'list' ? 'Verse Collections' : activeSet?.name}
                    </h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">
                      {view === 'list' ? `${sets.length} Collections Ready` : `${activeSet?.verses.length} Verses in Set`}
                    </p>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-all">
                <X size={24} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {view === 'list' ? (
                  <motion.div 
                    key="list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6 sm:p-8 space-y-8"
                  >
                    {/* Create New Section */}
                    <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Create New Collection</h3>
                      <div className="flex gap-3">
                        <input 
                          type="text"
                          value={newSetName}
                          onChange={(e) => setNewSetName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateSet()}
                          placeholder="e.g., Morning Devotion, Strength, Promises..."
                          className="flex-1 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-lg font-bold focus:outline-none focus:border-primary transition-all shadow-sm"
                        />
                        <button 
                          onClick={handleCreateSet}
                          className="px-8 bg-primary text-white rounded-2xl font-black uppercase italic tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
                        >
                          Create
                        </button>
                      </div>
                    </div>

                    {/* Grid of Sets */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sets.map((set, idx) => (
                        <motion.div 
                          key={set.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleOpenSet(set.id)}
                          className="group bg-white p-6 rounded-[2rem] border-2 border-gray-100 hover:border-primary cursor-pointer transition-all hover:shadow-2xl hover:shadow-primary/5 flex flex-col justify-between h-48 relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-4">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteSet(set.id); }}
                              className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100"
                              title="Delete Collection"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                          
                          <div>
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              <BookOpen size={20} />
                            </div>
                            <h4 className="text-xl font-black text-gray-900 tracking-tight uppercase italic truncate pr-8">{set.name}</h4>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{set.verses.length} Verses</p>
                          </div>

                          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                            Open Collection <ArrowRight size={12} />
                          </div>
                        </motion.div>
                      ))}

                      {sets.length === 0 && (
                        <div className="col-span-full py-20 text-center space-y-4">
                          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                            <Library size={40} />
                          </div>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No collections yet. Create your first one above!</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col h-full"
                  >
                    {/* Detail Tabs */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-8 bg-white sticky top-0 z-10">
                      <div className="flex">
                        <button 
                          onClick={() => setActiveTab('verses')}
                          className={cn(
                            "px-6 py-4 font-black text-xs uppercase tracking-[0.2em] transition-all border-b-4",
                            activeTab === 'verses' ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-600"
                          )}
                        >
                          Verses ({activeSet?.verses.length})
                        </button>
                        <button 
                          onClick={() => setActiveTab('add')}
                          className={cn(
                            "px-6 py-4 font-black text-xs uppercase tracking-[0.2em] transition-all border-b-4",
                            activeTab === 'add' ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-600"
                          )}
                        >
                          Add Scriptures
                        </button>
                      </div>
                      <button 
                        onClick={() => handleDeleteSet(activeSetId!)}
                        className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                      >
                        <Trash2 size={14} />
                        Delete Collection
                      </button>
                    </div>

                    <div className="p-6 sm:p-8">
                      {activeTab === 'verses' ? (
                        <div className="space-y-4">
                          {activeSet?.verses.length === 0 ? (
                            <div className="py-20 text-center space-y-6">
                              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary/20">
                                <Plus size={40} />
                              </div>
                              <div className="space-y-2">
                                <p className="text-gray-900 font-black text-xl uppercase italic">This set is empty</p>
                                <p className="text-gray-400 font-medium max-w-xs mx-auto">Start adding your favorite scriptures to build this collection.</p>
                              </div>
                              <button 
                                onClick={() => setActiveTab('add')}
                                className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-primary/20"
                              >
                                Add Scriptures Now
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-4">
                              {activeSet?.verses.map((v, i) => {
                                const key = `${v.book} ${v.chapter}:${v.verse}`;
                                const level = progress?.verseLevels?.[key] || 1;
                                const isMastered = progress?.masteredVerses?.includes(key);
                                const isCracked = progress?.crackedVerses?.includes(key);

                                return (
                                  <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="group bg-white p-6 rounded-3xl border-2 border-gray-50 hover:border-slate-200 transition-all flex items-start justify-between shadow-sm hover:shadow-md"
                                  >
                                    <div className="flex-1 pr-6">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                          {v.book} {v.chapter}:{v.verse}
                                        </span>
                                        {isMastered && (
                                          <div className="flex items-center gap-0.5">
                                            {[...Array(3)].map((_, i) => (
                                              <Star key={i} size={10} className={cn("fill-yellow-400 text-yellow-400", isCracked && "opacity-30")} />
                                            ))}
                                            {isCracked && <span className="ml-1 text-[8px] font-black text-rose-500 uppercase tracking-tighter">Cracked</span>}
                                          </div>
                                        )}
                                        {!isMastered && level > 1 && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-black text-blue-500 uppercase">Lvl {level}</span>
                                            <div className="flex gap-0.5">
                                              {[...Array(level)].map((_, i) => (
                                                <div key={i} className="w-1 h-1 rounded-full bg-blue-400" />
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-gray-800 font-medium leading-relaxed italic">"{v.text}"</p>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        removeVerseFromSet(activeSetId!, key);
                                        loadSets();
                                        onUpdate();
                                      }}
                                      className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                    >
                                      <Trash2 size={20} />
                                    </button>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-10">
                          {/* Search Tool */}
                          <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Search the Bible</h3>
                            <div className="flex gap-3">
                              <div className="flex-1 relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                  type="text"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                  placeholder="Search keywords or reference (e.g., John 3:16)"
                                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-lg font-bold focus:outline-none focus:border-primary transition-all"
                                />
                              </div>
                              <button 
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="px-8 bg-slate-900 text-white rounded-2xl font-black uppercase italic tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                              >
                                {isSearching ? "..." : "Search"}
                              </button>
                            </div>

                            {searchResults.length > 0 && (
                              <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar border-2 border-slate-100">
                                <div className="flex justify-between items-center sticky top-0 bg-slate-50 py-2 z-10">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{searchResults.length} Results Found</span>
                                  <button onClick={() => setSearchResults([])} className="text-[10px] font-black text-primary uppercase tracking-widest">Clear Results</button>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                  {searchResults.map((v, i) => (
                                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group shadow-sm">
                                      <div className="flex-1 min-w-0 pr-4">
                                        <div className="text-[10px] font-black text-primary uppercase mb-1">{v.book} {v.chapter}:{v.verse}</div>
                                        <p className="text-sm text-gray-600 line-clamp-2 italic">"{v.text}"</p>
                                      </div>
                                      <button 
                                        onClick={() => handleAddVerse(v)}
                                        className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                      >
                                        <Plus size={20} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Bulk Tools */}
                          <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Bulk Add Tools</h3>
                            <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 space-y-8">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Book</label>
                                  <select 
                                    value={selectedBook}
                                    onChange={(e) => setSelectedBook(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                                  >
                                    <option value="">Select Book</option>
                                    {books.map(b => <option key={b} value={b}>{b}</option>)}
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Chapter</label>
                                  <select 
                                    value={selectedChapter || ''}
                                    onChange={(e) => setSelectedChapter(e.target.value ? parseInt(e.target.value) : null)}
                                    disabled={!selectedBook}
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-primary transition-all disabled:opacity-50"
                                  >
                                    <option value="">Select Ch</option>
                                    {chapters.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Start Verse</label>
                                  <input 
                                    type="number"
                                    placeholder="Start"
                                    value={startVerse || ''}
                                    onChange={(e) => setStartVerse(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">End Verse</label>
                                  <input 
                                    type="number"
                                    placeholder="End"
                                    value={endVerse || ''}
                                    onChange={(e) => setEndVerse(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <button 
                                  onClick={() => handleAddBulk('book')}
                                  disabled={!selectedBook}
                                  className="py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic tracking-widest hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
                                >
                                  Add Entire Book
                                </button>
                                <button 
                                  onClick={() => handleAddBulk('chapter')}
                                  disabled={!selectedBook || selectedChapter === null}
                                  className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase italic tracking-widest hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20"
                                >
                                  Add Chapter
                                </button>
                                <button 
                                  onClick={() => handleAddBulk('range')}
                                  disabled={!selectedBook || selectedChapter === null || startVerse === null || endVerse === null}
                                  className="py-4 bg-orange-600 text-white rounded-2xl font-black uppercase italic tracking-widest hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-orange-600/20"
                                >
                                  Add Range
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 sm:p-8 bg-white border-t border-gray-100 flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-xl uppercase italic tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95 transition-all"
              >
                Close Library
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
