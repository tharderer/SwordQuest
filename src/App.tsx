/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  Trophy, 
  User,
  ShoppingBag,
  Shield,
  X,
  AlertCircle,
  Flame, 
  BookOpen, 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  Star, 
  Sword,
  Zap,
  Grid,
  Gamepad2,
  RotateCcw,
  Shuffle,
  ArrowLeft,
  Search,
  Plus,
  Heart,
  Gem,
  Settings,
  Rocket,
  Calculator,
  Skull,
  TowerControl as Tower,
  Quote,
  Volume2,
  VolumeX,
  Music,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Home,
  Pause,
  Trash2,
  Database,
  Check,
  Sparkles,
  Lightbulb,
  Users,
  HelpCircle,
  ArrowUp,
  EyeOff,
  LayoutGrid,
  Library,
  ChevronLeft,
  History as HistoryIcon,
  MoreVertical,
  Edit2,
  Copy,
  Share2,
  Filter,
  ArrowRight,
  Layout,
  Compass,
  Coins,
  RefreshCw,
  Target,
  Timer
} from 'lucide-react';
import { 
  initBibleQuestionDB, 
  getQuestionsSortedByLastSeen, 
  getQuestionsBySection,
  updateQuestionLastSeen, 
  getBibleProgress, 
  getWitsSectionsProgress,
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
  BibleProgress,
  SectionProgress
} from './services/bibleQuestionService';
import { generateBibleQuestionsBatch } from './services/geminiService';
import confetti from 'canvas-confetti';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  User as FirebaseUser
} from './firebase';
import { MissionaryJourneysGame } from './components/MissionaryJourneysGame';
import { BibleWitsAndWagersGame } from './components/BibleWitsAndWagersGame';
import { VerseChomperGame } from './components/VerseChomperGame';
import { SequenceChomperGame } from './components/SequenceChomperGame';
import { VerseDartsGame } from './components/VerseDartsGame';
import { VerseTetrisGame } from './components/VerseTetrisGame';
import { VerseCrushGame } from './components/VerseCrushGame';
import { getDailyJourneyDay, updateDailyLeaderboard, DailyJourneyDay, generateFullYearSchedule, getAllScheduleDays, recordVerseCompletion } from './services/dailyJourneyService';
import { SpeedVerseGame } from './components/SpeedVerseGame';
import { BibleReader } from './components/BibleReader';
import { DailyJourneyHub } from './components/DailyJourneyHub';
import { ProgressBar, HeartDisplay, GemDisplay, Character, RewardModal } from './components/CommonUI';
import { LeagueLeaderboard, XPGraph } from './components/Stats';
import { PathNode } from './components/PathNode';
import { Background } from './components/Background';
import { QuestionBankOverlay } from './components/QuestionBankOverlay';
import { SettingsOverlay } from './components/SettingsOverlay';
import { VerseSetOverlay } from './components/VerseSetOverlay';
import { StarTowerSelectionOverlay } from './components/StarTowerSelectionOverlay';
import { BibleStudyOverlay } from './components/BibleStudyOverlay';
import { BoggleGame } from './components/BoggleGame';
import { BibleJeopardyGame } from './components/BibleJeopardyGame';
import { EndlessBlitzGame } from './components/EndlessBlitzGame';
import { TriviaHUD, MathHUD, HUD, TowerBlock, TowerStack } from './components/TriviaTowerComponents';
import { ChronologyTowerGame, SpellingTowerGame, ParableTowerGame, MathTowerGame } from './components/TowerGames';
import { cn, getLocalDateString } from './lib/utils';
import { Verse, UserProgress, VerseSet, Difficulty } from './types';
import { PROMINENT_REFERENCES } from './constants';


// PROMINENT_REFERENCES moved to constants.ts

import { 
  getProgress, 
  saveProgress, 
  updateXP, 
  checkStreak, 
  addCustomVerse, 
  useHeart, 
  addGems, 
  addHeart, 
  updateQuestProgress, 
  crackRandomVerse, 
  resetVerseProgress, 
  saveVerseTime, 
  updateVerseMastery, 
  getNextEndlessVerse, 
  recordVerseSeen, 
  resetAllProgress, 
  getVerseLevel, 
  updateVerseLevel, 
  getLearningVerses, 
  promoteVerse,
  createVerseSet,
  deleteVerseSet,
  addVersesToSet,
  removeVerseFromSet
} from './lib/storage';
import { 
  initBibleDB, 
  isBibleSeeded, 
  seedBible, 
  searchBible, 
  downloadFullKJV, 
  getVerseByRef, 
  parseReference, 
  getVersesByRange,
  getVersesByChapter,
  getVersesByBook,
  getBooks,
  getChapters,
  getBibleVerses,
  getAllVerses,
  isScheduleSeeded
} from './lib/bibleDb';
import { KJV_LIBRARY } from './lib/bibleData';

import { 
  JeopardyCategory, 
  JeopardyDifficulty, 
  JeopardyMode,
  generateJeopardyBoard
} from './services/bibleJeopardyService';
import { 
  JeopardyBoard, 
  JeopardyGameState,
  initJeopardyDB,
  getAllJeopardyBoards,
  getJeopardyBoard,
  saveJeopardyBoard,
  saveJeopardyGameState
} from './services/jeopardyDbService';

import { dictionaryService } from './lib/dictionary';

import { BIBLE_HEROES, BibleHero } from './lib/bibleHeroes';
import { BIBLE_BOOKS } from './lib/bibleDb';
import { BIBLE_SECTIONS, BibleSection } from './lib/bibleSections';

// --- Types ---
type Team = {
  name: string;
  score: number;
  color: string;
};

// --- Constants ---
const DANGER_LINE_PX = 8;
const hymnUrls = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3"
];

const getLevelConfig = (level: number): { mode: 'classic' | 'reference', difficulty: Difficulty } => {
  switch (level) {
    case 1: return { mode: 'classic', difficulty: 'easy' };
    case 2: return { mode: 'classic', difficulty: 'medium' };
    case 3: return { mode: 'classic', difficulty: 'advanced' };
    case 4: return { mode: 'classic', difficulty: 'master' };
    case 5: return { mode: 'reference', difficulty: 'easy' };
    default: return { mode: 'classic', difficulty: 'easy' };
  }
};

const getNextVerseKey = (allVerses: Verse[], playedMastered: string[]): string => {
  const progress = getProgress();
  const allVerseKeys = new Set(allVerses.map(v => `${v.book} ${v.chapter}:${v.verse}`));
  
  // Replenish learning pool if needed
  const learning = getLearningVerses(allVerses);
  
  // Only consider mastered verses that are in the current set and haven't been played this session
  const mastered = (progress.masteredVerses || []).filter(v => 
    allVerseKeys.has(v) && !playedMastered.includes(v)
  );
  
  // 70/30 mix: 70% Learning, 30% Review
  // Only review if there are mastered verses that haven't been played this session
  const isReview = Math.random() < 0.3 && mastered.length > 0;
  
  if (isReview) {
    // Pick oldest mastered verse from those not yet played this session
    const oldest = [...mastered].sort((a, b) => {
      const ma = progress.verseMastery[a]?.lastPlayed || '';
      const mb = progress.verseMastery[b]?.lastPlayed || '';
      return ma.localeCompare(mb);
    });
    return oldest[0];
  } else {
    // Pick from learning verses
    if (learning.length === 0) {
      // Fallback: if no learning verses, pick a mastered one that hasn't been played
      if (mastered.length > 0) return mastered[0];
      
      // Absolute fallback: if everything has been played, pick a random mastered verse 
      // from the current set instead of always the first one
      const masteredInSet = (progress.masteredVerses || []).filter(v => allVerseKeys.has(v));
      if (masteredInSet.length > 0) {
        return masteredInSet[Math.floor(Math.random() * masteredInSet.length)];
      }
      
      // If still nothing, just return the first verse of the set
      if (allVerses.length > 0) {
        const v = allVerses[0];
        return `${v.book} ${v.chapter}:${v.verse}`;
      }
      
      return "";
    }
    // Pick a random learning verse
    return learning[Math.floor(Math.random() * learning.length)];
  }
};

// --- Verse Set Overlay ---

type ReferenceTowerDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';

// --- Boggle Game Component ---
// (Moved to components/BoggleGame.tsx)

// --- Reference Game UI ---
// (Moved to components/EndlessBlitzGame.tsx)

// --- Choice Game UI ---
// (Moved to components/EndlessBlitzGame.tsx)

// --- Bible Jeopardy Game Component ---
// (Moved to components/BibleJeopardyGame.tsx)


// --- Main App ---

export default function App() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showMasteredVerses, setShowMasteredVerses] = useState(false);
  const [view, setView] = useState<'dashboard' | 'game' | 'shop' | 'leagues' | 'profile' | 'boggle' | 'math_tower' | 'tower_games' | 'bible_reader' | 'bible_jeopardy' | 'missionary_journeys' | 'verse_chomper' | 'sequence_chomper' | 'verse_darts' | 'verse_tetris' | 'verse_crush' | 'speed_verse' | 'daily_journey' | 'daily_hub'>('dashboard');
  const [dailyDay, setDailyDay] = useState<DailyJourneyDay | null>(null);
  const [dailyVerseIdx, setDailyVerseIdx] = useState(0);
  const [dailyTimes, setDailyTimes] = useState<number[]>([]);
  const [reviewQueue, setReviewQueue] = useState<{ date: string; reference: string }[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const isGameView = view === 'game' || view === 'boggle' || view === 'math_tower' || view === 'tower_games' || view === 'bible_reader' || view === 'bible_jeopardy' || view === 'missionary_journeys' || view === 'wits_and_wagers' || view === 'verse_chomper' || view === 'sequence_chomper' || view === 'verse_darts' || view === 'verse_tetris' || view === 'verse_crush' || view === 'speed_verse' || view === 'daily_journey' || view === 'daily_hub';
  const [boggleDifficulty, setBoggleDifficulty] = useState<Difficulty>('easy');
  const [referenceTowerDifficulty, setReferenceTowerDifficulty] = useState<ReferenceTowerDifficulty>('easy');
  const [showReward, setShowReward] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [mistakesInSession, setMistakesInSession] = useState(0);
  const [isDbReady, setIsDbReady] = useState(false);
  const [isSeeded, setIsSeeded] = useState<boolean | null>(null);
  const [allVerses, setAllVerses] = useState<Verse[]>(KJV_LIBRARY);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [isVerseSetOpen, setIsVerseSetOpen] = useState(false);
  const [selectedGameSetId, setSelectedGameSetId] = useState<string | null>(null);
  const [isStarTowerSelectionOpen, setIsStarTowerSelectionOpen] = useState(false);
  
  // Jeopardy State
  const [jeopardyCategories, setJeopardyCategories] = useState<JeopardyCategory[]>([]);
  const [isGeneratingJeopardy, setIsGeneratingJeopardy] = useState(false);
  const [jeopardyBoardId, setJeopardyBoardId] = useState<string | null>(null);
  const [jeopardyDifficulty, setJeopardyDifficulty] = useState<JeopardyDifficulty>('medium');
  const [jeopardyMode, setJeopardyMode] = useState<JeopardyMode>('bible');
  const [savedJeopardyBoards, setSavedJeopardyBoards] = useState<JeopardyBoard[]>([]);
  
  // Firebase Auth State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      if (currentUser) {
        // Fetch or create user profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const newProfile = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'Anonymous',
            photoURL: currentUser.photoURL || '',
            email: currentUser.email || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            speedVerseProgress: {
              unlockedLevels: ['1'],
              completedRounds: {}
            }
          };
          await setDoc(userDocRef, newProfile);
          setUserProfile(newProfile);
        } else {
          setUserProfile(userDoc.data());
          
          // Sync daily progress from Firebase to local IndexedDB
          import('./services/dailyJourneyService').then(m => m.syncDailyProgress(currentUser.uid));
          
          // Listen for real-time updates
          onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              setUserProfile(doc.data());
            }
          });
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        const today = getLocalDateString();
        const day = await getDailyJourneyDay(today);
        setDailyDay(day);
      } catch (error) {
        console.error("Failed to fetch daily journey:", error);
        // Retry once after a short delay if it failed
        setTimeout(async () => {
          try {
            const today = getLocalDateString();
            const day = await getDailyJourneyDay(today);
            setDailyDay(day);
          } catch (retryError) {
            console.error("Retry failed:", retryError);
          }
        }, 3000);
      }
    };
    fetchDaily();
  }, [user]);

  const startDailyJourney = (day: DailyJourneyDay, startIdx: number = 0) => {
    setDailyDay(day);
    setDailyVerseIdx(startIdx);
    setDailyTimes([]);
    setView('daily_journey');
  };

  const handleDailyComplete = async (xp: number, timeMs?: number, timePerWord?: number) => {
    if (timeMs !== undefined && timePerWord !== undefined && (dailyDay || isReviewMode)) {
      // XP is already recorded in SpeedVerseGame and passed as the 'xp' argument
      if (progress) {
        const newProgress = updateXP(xp);
        setProgress(newProgress);
      }
      
      const newTimes = [...dailyTimes, timeMs];
      setDailyTimes(newTimes);
      
      const maxIdx = isReviewMode ? reviewQueue.length - 1 : (dailyDay?.references.length || 1) - 1;
      
      if (dailyVerseIdx < maxIdx) {
        setDailyVerseIdx(dailyVerseIdx + 1);
      } else {
        // Day or Review complete!
        if (!isReviewMode && user && dailyDay) {
          const userDocRef = doc(db, 'users', user.uid);
          const dateStr = dailyDay.date;
          
          await updateDoc(userDocRef, {
            [`dailyJourneyProgress.completedDays.${dateStr}`]: {
              verse1Time: newTimes[0],
              verse2Time: newTimes[1],
              completedAt: new Date().toISOString()
            },
            'dailyJourneyProgress.lastCompletedDate': dateStr,
            updatedAt: serverTimestamp()
          });

          // Update leaderboards
          const avgTime = (newTimes[0] + newTimes[1]) / 2;
          await updateDailyLeaderboard(user.uid, user.displayName || 'Anonymous', user.photoURL || '', avgTime, dailyDay.month);
        }
        
        setIsReviewMode(false);
        setReviewQueue([]);
        setView('daily_hub');
      }
    } else {
      setView('daily_hub');
    }
  };

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        import('./services/dailyJourneyService').then(m => m.syncDailyProgress(result.user.uid));
      }
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const handleRetryJeopardy = async (mode: JeopardyMode, difficulty: JeopardyDifficulty) => {
    setIsGeneratingJeopardy(true);
    setJeopardyMode(mode);
    setJeopardyDifficulty(difficulty);
    try {
      const categories = await generateJeopardyBoard(mode, difficulty);
      setJeopardyCategories(categories);
      const board: JeopardyBoard = {
        id: Date.now().toString(),
        mode,
        difficulty,
        categories,
        createdAt: Date.now()
      };
      await saveJeopardyBoard(board);
      setJeopardyBoardId(board.id);
      setSavedJeopardyBoards(prev => [board, ...prev]);
    } catch (error) {
      console.error("Failed to generate Jeopardy board:", error);
    } finally {
      setIsGeneratingJeopardy(false);
    }
  };

  const handleStartJeopardy = async () => {
    if (jeopardyCategories.length === 0) {
      await handleRetryJeopardy(jeopardyMode, jeopardyDifficulty);
    }
    setView('bible_jeopardy');
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [bankStore, setBankStore] = useState(JEOPARDY_STORE);
  const [volume, setVolume] = useState(0.5);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [selectedMusicStyle, setSelectedMusicStyle] = useState('hymns');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const musicUrls: Record<string, string[]> = {
      hymns: [
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
      ],
      gospel: [
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
      ],
      acoustic: [
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3"
      ],
      ambient: [
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"
      ],
      lofi: [
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3"
      ],
      classical: [
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3"
      ],
      retro: [
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3"
      ],
      epic: [
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3"
      ]
    };

    const currentUrls = musicUrls[selectedMusicStyle] || musicUrls.hymns;
    const randomUrl = currentUrls[Math.floor(Math.random() * currentUrls.length)];

    if (!audioRef.current) {
      audioRef.current = new Audio(randomUrl);
      audioRef.current.loop = true;
    } else if (audioRef.current.src !== randomUrl) {
      audioRef.current.src = randomUrl;
    }

    audioRef.current.muted = !isMusicEnabled;
    audioRef.current.volume = volume * 0.3;

    const playAudio = () => {
      if (isMusicEnabled && audioRef.current) {
        audioRef.current.play()
          .then(() => setMusicStatus("Playing"))
          .catch(e => {
            if (e.name === "NotAllowedError") {
              setMusicStatus("Waiting for interaction");
            } else {
              console.error("Audio playback failed:", e);
              setMusicStatus("Error");
            }
          });
      } else if (audioRef.current) {
        audioRef.current.pause();
        setMusicStatus(isMusicEnabled ? "Paused" : "Muted");
      }
    };

    playAudio();

    const handleInteraction = () => {
      if (isMusicEnabled && audioRef.current && audioRef.current.paused) {
        playAudio();
      }
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      audioRef.current?.pause();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [isMusicEnabled, selectedMusicStyle, volume]);
  const [musicStatus, setMusicStatus] = useState<string>("Stopped");
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

// (Removed)

  useEffect(() => {
    async function setup() {
      try {
        checkStreak();
        
        // Occasionally crack a mastered verse (5% chance on load)
        if (Math.random() < 0.05) {
          crackRandomVerse();
        }

        const currentProgress = getProgress();
        setProgress(currentProgress);
        
        console.log("Starting Bible DB check...");
        const db = await initBibleDB();
        const seeded = await isBibleSeeded();
        const scheduleSeeded = await isScheduleSeeded();
        setIsSeeded(seeded);
        console.log("Bible DB check complete. Seeded:", seeded, "Schedule Seeded:", scheduleSeeded);
        
        if (seeded && scheduleSeeded) {
          console.log("Bible and Schedule already seeded, loading verses into memory...");
          const verses = await getAllVerses();
          if (verses.length > 0) {
            setAllVerses([...verses, ...(progress?.customVerses || [])]);
          }
          setDownloadProgress(100);
        } else {
          console.log("Bible or Schedule not seeded, starting download...");
          setDownloadProgress(0);
          downloadFullKJV(async (progressVal) => {
            console.log(`Download progress: ${progressVal}%`);
            setDownloadProgress(progressVal);
            if (progressVal === 100) {
              console.log("Download complete, generating schedule...");
              await generateFullYearSchedule();
              console.log("Schedule generated, loading verses into memory...");
              const verses = await getAllVerses();
              if (verses.length > 0) {
                setAllVerses([...verses, ...(progress?.customVerses || [])]);
              }
              setIsSeeded(true);
            }
          }).catch(err => {
            console.error("Bible download failed:", err);
            setDownloadProgress(null);
            setDownloadError(err instanceof Error ? err.message : String(err));
          });
        }

        setIsDbReady(true);
      } catch (error) {
        console.error("Setup failed:", error);
        // Fallback to ready if DB fails, so app at least works with KJV_LIBRARY
        setIsDbReady(true);
        if (!progress) setProgress(getProgress());
      }
    }
    const timer = setTimeout(setup, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAddCustom = (verse: Verse) => {
    const newProgress = addCustomVerse(verse);
    setProgress({ ...newProgress });
    setShowCustomForm(false);
  };

  const filteredGameVerses = useMemo(() => {
    if (selectedGameSetId && progress?.verseSets) {
      const set = progress.verseSets.find(s => s.id === selectedGameSetId);
      if (set && set.verses.length > 0) return set.verses;
    }
    return allVerses;
  }, [selectedGameSetId, progress?.verseSets, allVerses]);

  const handleStartStarTower = () => {
    if (progress?.verseSets && progress.verseSets.length > 0) {
      setIsStarTowerSelectionOpen(true);
    } else {
      setSelectedGameSetId(null);
      setMistakesInSession(0);
      setView('game');
    }
  };

  const handleSelectGameSet = (setId: string | null) => {
    setSelectedGameSetId(setId);
    setIsStarTowerSelectionOpen(false);
    setMistakesInSession(0);
    setView('game');
  };

  const handleStartBoggle = () => {
    if (progress && progress.hearts <= 0) {
      setOutOfHearts(true);
      return;
    }
    setMistakesInSession(0);
    setView('boggle');
  };

  const handleRestoreHearts = useCallback(() => {
    if (progress && progress.hearts < 3) {
      const newProgress = { ...progress, hearts: 3 };
      saveProgress(newProgress);
      setProgress(newProgress);
    }
  }, [progress]);

  const handleMistake = () => {
    setMistakesInSession(prev => prev + 1);
    const success = useHeart();
    if (!success) {
      setOutOfHearts(true);
    }
    setProgress(getProgress());
  };

  const handleGameComplete = (xp: number) => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#4CAF50', '#FF5722']
    });
    
    let newProgress = updateXP(xp);
    
    // Update Quests
    newProgress = updateQuestProgress('xp', xp);
    newProgress = updateQuestProgress('verses', 1);
    if (mistakesInSession === 0) {
      newProgress = updateQuestProgress('perfect', 1);
    }

    addGems(Math.floor(xp / 10));

    setProgress({ ...newProgress });
    setEarnedXP(xp);
    setShowReward(true);
  };

// (Removed)

  const closeReward = () => {
    setShowReward(false);
    setView('dashboard');
  };



  if (!progress || !isDbReady) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
        <Character mood="thinking" />
        <h2 className="text-2xl font-bold font-display mt-4">Preparing Your Sword...</h2>
        <p className="text-gray-500 mt-2">Sharpening the Word for offline use.</p>
        <div className="w-48 h-2 bg-gray-100 rounded-full mt-6 overflow-hidden">
          <motion.div 
            animate={{ x: [-200, 200] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-1/2 h-full bg-primary"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "max-w-md mx-auto h-screen flex flex-col font-sans bg-background overflow-hidden",
      !isGameView && "pb-0"
    )}>
      {/* Header */}
      {!isGameView && (
        <header className="p-4 flex items-center justify-between bg-white border-b-2 border-gray-100 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <img 
                  src={user.photoURL || ''} 
                  alt={user.displayName || ''} 
                  className="w-8 h-8 rounded-full border-2 border-primary shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <span className="font-bold text-xs truncate max-w-[80px]">{user.displayName?.split(' ')[0]}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-accent fill-accent" />
                <span className="font-bold text-lg">{progress.streak}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <GemDisplay gems={progress.gems} />
            <HeartDisplay hearts={progress.hearts} max={progress.maxHearts} />
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <Settings size={24} />
            </button>
          </div>
        </header>
      )}

      {/* Bible Initial Download Overlay */}
      {isSeeded === false && (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                Bundling Bible Data
              </h2>
              <p className="text-slate-400 text-sm font-medium">
                We're preparing the full KJV Bible for offline use. This only happens once.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${downloadProgress || 0}%` }}
                  transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                />
              </div>
              
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-orange-500">
                  {downloadError ? `Error: ${downloadError}` : (downloadProgress === null ? 'Connection Error' : 'Downloading...')}
                </span>
                <span className="text-white">
                  {downloadProgress || 0}%
                </span>
              </div>

              {downloadProgress === null && (
                <button 
                  onClick={async () => {
                    setDownloadError(null);
                    setDownloadProgress(0);
                    try {
                      await downloadFullKJV((p) => setDownloadProgress(p));
                      const verses = await getAllVerses();
                      if (verses.length > 0) {
                        setAllVerses([...verses, ...(progress?.customVerses || [])]);
                      }
                      setIsSeeded(true);
                    } catch (err) {
                      console.error("Retry failed:", err);
                      setDownloadProgress(null);
                      setDownloadError(err instanceof Error ? err.message : String(err));
                    }
                  }}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-orange-900/20"
                >
                  Retry Download
                </button>
              )}
            </div>

            <div className="pt-8 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                Please keep this tab open
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {downloadProgress !== 100 && downloadProgress !== null && isSeeded === true && (
        <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest z-50">
          <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          Finalizing Bible: {downloadProgress}%
        </div>
      )}

      <main className={cn("flex-1", !isGameView ? "overflow-y-auto pb-24" : "overflow-hidden h-dvh")}>
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold font-display">Mission Control</h2>
                  <p className="text-gray-500">Welcome back, Sword Bearer!</p>
                </div>
                <Character mood="excited" />
              </div>

              {/* Daily Journey Section */}
              {!dailyDay ? (
                <div className="bg-slate-100 animate-pulse rounded-[2.5rem] p-8 mb-8 flex flex-col gap-4 border-2 border-slate-200">
                  <div className="flex gap-3">
                    <div className="h-6 w-32 bg-slate-200 rounded-full" />
                    <div className="h-6 w-32 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-12 w-48 bg-slate-200 rounded-xl" />
                  <div className="h-4 w-64 bg-slate-200 rounded-full" />
                  <div className="flex gap-4 mt-4">
                    <div className="h-14 w-40 bg-slate-200 rounded-2xl" />
                    <div className="h-14 w-40 bg-slate-200 rounded-2xl" />
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 mb-8 text-white shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="px-4 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">
                        Daily Journey 2026
                      </div>
                      <div className="px-4 py-1 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {dailyDay.month}: {dailyDay.theme}
                      </div>
                    </div>
                    
                    <h2 className="text-4xl font-black mb-2 italic uppercase tracking-tighter">Day {new Date(dailyDay.date).getDate()}</h2>
                    <p className="text-indigo-100 mb-8 font-medium max-w-md">
                      Complete today's 2 verses to climb the {dailyDay.month} leaderboard!
                    </p>

                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => startDailyJourney(dailyDay)}
                        className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 uppercase italic"
                      >
                        <Play size={24} fill="currentColor" /> Start Today
                      </button>
                      
                      <div className="flex items-center gap-2 px-6 py-4 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10">
                        <Trophy size={20} className="text-amber-400" />
                        <span className="text-sm font-bold uppercase tracking-tight">View Leaderboards</span>
                      </div>
                      <button 
                        onClick={() => setView('daily_hub')}
                        className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-2xl font-black text-lg border border-white/20 hover:bg-white/20 active:scale-95 transition-all flex items-center gap-2 uppercase italic"
                      >
                        <HistoryIcon size={24} /> Journey Hub
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Auth Section */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100 space-y-4">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.photoURL || ''} 
                        alt={user.displayName || ''} 
                        className="w-12 h-12 rounded-full border-2 border-primary shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h3 className="font-bold text-gray-800">{user.displayName}</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Cloud Sync Active</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleSignOut}
                      className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                        <Users size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">Sign in to Save Progress</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">Guests cannot see leaderboards or sync progress across devices.</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleSignIn}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-black tracking-widest uppercase shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Database size={20} />
                      Sign In with Google
                    </button>
                  </div>
                )}
              </div>

              {/* Verse Progress Summary */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowMasteredVerses(true)}
                className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100 cursor-pointer hover:border-blue-200 transition-colors group"
              >
                <div className="flex justify-between items-end mb-2">
                  <h3 className="font-bold text-lg group-hover:text-blue-500 transition-colors">Verse Mastery</h3>
                  <span className="text-primary font-black text-xl">
                    {progress.masteredVerses.length} / {allVerses.length}
                  </span>
                </div>
                <ProgressBar current={progress.masteredVerses.length} total={allVerses.length} />
                <div className="flex justify-between items-center mt-3">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                    Master all verses to become a Legend
                  </p>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                </div>
              </motion.div>

              {/* Bible Reader Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('bible_reader')}
                className="w-full py-6 bg-slate-950 text-white rounded-3xl font-black text-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-4 group border-b-8 border-slate-800"
              >
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <BookOpen size={28} className="text-white" />
                </div>
                READ THE BIBLE
              </motion.button>

              {/* Verse Chomper Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('verse_chomper')}
                className="w-full py-6 bg-amber-500 text-slate-950 rounded-3xl font-black text-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-4 group border-b-8 border-amber-700"
              >
                <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Zap size={28} className="text-amber-500" />
                </div>
                VERSE CHOMPER
              </motion.button>

              {/* Sequence Chomper Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('sequence_chomper')}
                className="w-full py-6 bg-slate-900 text-amber-400 rounded-3xl font-black text-2xl shadow-xl shadow-amber-500/10 flex items-center justify-center gap-4 group border-b-8 border-slate-950"
              >
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Zap size={28} className="text-slate-950" />
                </div>
                SEQUENCE CHOMPER
              </motion.button>

              {/* Verse Darts Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('verse_darts')}
                className="w-full py-6 bg-rose-500 text-white rounded-3xl font-black text-2xl shadow-xl shadow-rose-500/20 flex items-center justify-center gap-4 group border-b-8 border-rose-700"
              >
                <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Target size={28} className="text-rose-500" />
                </div>
                VERSE DARTS
              </motion.button>

              {/* Verse Tetris Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('verse_tetris')}
                className="w-full py-6 bg-slate-900 text-amber-500 rounded-3xl font-black text-2xl shadow-xl shadow-amber-500/10 flex items-center justify-center gap-4 group border-b-8 border-slate-950"
              >
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <LayoutGrid size={28} className="text-slate-950" />
                </div>
                VERSE TETRIS
              </motion.button>

              {/* Verse Crush Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('verse_crush')}
                className="w-full py-6 bg-slate-900 text-amber-500 rounded-3xl font-black text-2xl shadow-xl shadow-amber-500/10 flex items-center justify-center gap-4 group border-b-8 border-slate-950"
              >
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <LayoutGrid size={28} className="text-slate-950" />
                </div>
                VERSE CRUSH
              </motion.button>

              {/* Speed Verse Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('speed_verse')}
                className="w-full py-6 bg-slate-950 text-amber-400 rounded-3xl font-black text-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-4 group border-b-8 border-slate-800"
              >
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Timer size={28} className="text-slate-950" />
                </div>
                SPEED VERSE
              </motion.button>

              {/* Verse Boggle Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartBoggle}
                className="w-full py-6 bg-slate-950 text-white rounded-3xl font-black text-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-4 group border-b-8 border-slate-800"
              >
                <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Grid size={28} className="text-white" />
                </div>
                PLAY VERSE BOGGLE
              </motion.button>

              {/* Tower Games Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (progress && progress.hearts <= 0) {
                    setOutOfHearts(true);
                    return;
                  }
                  setMistakesInSession(0);
                  setView('tower_games');
                }}
                className="w-full py-6 bg-slate-950 text-white rounded-3xl font-black text-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-4 group border-b-8 border-slate-800"
              >
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Tower size={28} className="text-white" />
                </div>
                TOWER GAMES
              </motion.button>

              {/* Math Tower Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('math_tower')}
                className="w-full py-6 bg-slate-950 text-white rounded-3xl font-black text-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-4 group border-b-8 border-slate-800"
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Calculator size={28} className="text-white" />
                </div>
                PLAY MATH TOWER
              </motion.button>

// (Removed)

              {/* Missionary Journeys Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('missionary_journeys')}
                className="w-full py-6 bg-slate-950 text-white rounded-3xl font-black text-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-4 group border-b-8 border-slate-800"
              >
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Compass size={28} className="text-white" />
                </div>
                MISSIONARY JOURNEYS
              </motion.button>

              {/* Bible Wits & Wagers Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('wits_and_wagers')}
                className="w-full py-6 bg-slate-950 text-white rounded-3xl font-black text-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-4 group border-b-8 border-slate-800"
              >
                <div className="w-12 h-12 bg-[#d4af37] rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Coins size={28} className="text-white" />
                </div>
                WITS & WAGERS
              </motion.button>

              {/* Verse Sets Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsVerseSetOpen(true)}
                className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-4 group border-b-8 border-slate-800"
              >
                <div className="w-12 h-12 bg-indigo-400 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Library size={28} className="text-white" />
                </div>
                VERSE SETS
              </motion.button>

              {/* Question Bank Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsQuestionBankOpen(true)}
                className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-4 group border-b-8 border-slate-800"
              >
                <div className="w-12 h-12 bg-orange-400 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Database size={28} className="text-white" />
                </div>
                QUESTION BANK
              </motion.button>

              {/* Daily Quests Card */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Daily Quests</h3>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resets in 12h</div>
                </div>
                <div className="space-y-4">
                  {progress.dailyQuests.map(quest => (
                    <div key={quest.id} className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span className={cn(quest.completed ? "text-secondary" : "text-gray-700")}>{quest.title}</span>
                        <span className="text-gray-400">{quest.current}/{quest.goal}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(quest.current / quest.goal) * 100}%` }}
                          className={cn("h-full transition-colors", quest.completed ? "bg-secondary" : "bg-primary")}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'leagues' && (
            <motion.div 
              key="leagues"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 pb-12"
            >
              <h2 className="text-3xl font-bold font-display mb-6">Leagues</h2>
              <LeagueLeaderboard userPoints={progress.leaguePoints} leagueName={progress.league} />
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="w-32 h-32 bg-primary/10 rounded-full mx-auto flex items-center justify-center text-primary">
                  <Trophy size={64} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold font-display">Level {progress.currentLevel}</h2>
                  <p className="text-gray-500 font-medium">Sword Bearer</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100 text-center">
                  <div className="text-2xl font-bold text-primary">{progress.xp}</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total XP</div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100 text-center">
                  <div className="text-2xl font-bold text-secondary">{progress.masteredVerses.length}</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verses</div>
                </div>
              </div>

              <XPGraph history={progress.xpHistory} />

              <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
                <h3 className="font-bold mb-4">Achievements</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                  {[1, 7, 30].map(days => (
                    <div key={days} className={cn(
                      "flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1",
                      progress.streak >= days ? "bg-accent/10 text-accent" : "bg-gray-50 text-gray-300"
                    )}>
                      <Flame size={24} fill={progress.streak >= days ? "currentColor" : "none"} />
                      <span className="text-[10px] font-bold">{days} Day</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'bible_reader' && (
            <motion.div 
              key="bible_reader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              <BibleReader onExit={() => setView('dashboard')} />
            </motion.div>
          )}

          {view === 'math_tower' && (
            <motion.div 
              key="math_tower"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col bg-slate-950"
            >
              <MathTowerGame 
                onComplete={handleGameComplete} 
                onMistake={handleMistake} 
                onExit={() => setView('dashboard')}
                isOutOfHearts={outOfHearts}
                volume={volume}
                setVolume={setVolume}
                isMusicEnabled={isMusicEnabled}
                setIsMusicEnabled={setIsMusicEnabled}
                selectedMusicStyle={selectedMusicStyle}
                setSelectedMusicStyle={setSelectedMusicStyle}
                musicStatus={musicStatus}
                setMusicStatus={setMusicStatus}
                setIsQuestionBankOpen={setIsQuestionBankOpen}
                setBankStore={setBankStore}
              />
            </motion.div>
          )}

          {view === 'game' && (
            <motion.div 
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col bg-slate-950"
            >
              <EndlessBlitzGame 
                allVerses={allVerses}
                onComplete={handleGameComplete} 
                onMistake={handleMistake} 
                onExit={() => setView('dashboard')}
                volume={volume}
                setVolume={setVolume}
                isMusicEnabled={isMusicEnabled}
                setIsMusicEnabled={setIsMusicEnabled}
                musicStatus={musicStatus}
                setMusicStatus={setMusicStatus}
                setIsQuestionBankOpen={setIsQuestionBankOpen}
                setBankStore={setBankStore}
              />
            </motion.div>
          )}

          {view === 'boggle' && (
            <motion.div 
              key="boggle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col bg-slate-950"
            >
              <BoggleGame 
                verse={allVerses[Math.floor(Math.random() * allVerses.length)]}
                difficulty={boggleDifficulty}
                setDifficulty={setBoggleDifficulty}
                onComplete={handleGameComplete} 
                onExit={() => setView('dashboard')}
                volume={volume}
                setVolume={setVolume}
                isMusicEnabled={isMusicEnabled}
                setIsMusicEnabled={setIsMusicEnabled}
                selectedMusicStyle={selectedMusicStyle}
                setSelectedMusicStyle={setSelectedMusicStyle}
              />
            </motion.div>
          )}

          {view === 'bible_jeopardy' && (
            <motion.div 
              key="bible_jeopardy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col bg-slate-950"
            >
              <BibleJeopardyGame 
                categories={jeopardyCategories}
                onGameStart={() => {}}
                isGenerating={isGeneratingJeopardy}
                onRetry={handleRetryJeopardy}
                boardId={jeopardyBoardId}
                savedBoards={savedJeopardyBoards}
                onLoadBoard={(board) => {
                  setJeopardyCategories(board.categories);
                  setJeopardyBoardId(board.id);
                  setJeopardyMode(board.mode);
                  setJeopardyDifficulty(board.difficulty);
                }}
                difficulty={jeopardyDifficulty}
                onDifficultyChange={setJeopardyDifficulty}
                mode={jeopardyMode}
                onModeChange={setJeopardyMode}
                onExit={() => setView('dashboard')}
                volume={volume}
                setVolume={setVolume}
                isMusicEnabled={isMusicEnabled}
                setIsMusicEnabled={setIsMusicEnabled}
                selectedMusicStyle={selectedMusicStyle}
                setSelectedMusicStyle={setSelectedMusicStyle}
              />
            </motion.div>
          )}

          {view === 'missionary_journeys' && (
            <motion.div 
              key="missionary_journeys"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col bg-slate-950"
            >
              <MissionaryJourneysGame 
                onComplete={handleGameComplete} 
                onMistake={handleMistake} 
                onExit={() => setView('dashboard')}
                volume={volume}
                setVolume={setVolume}
                isMusicEnabled={isMusicEnabled}
                setIsMusicEnabled={setIsMusicEnabled}
                musicStatus={musicStatus}
                setMusicStatus={setMusicStatus}
              />
            </motion.div>
          )}

          {view === 'wits_and_wagers' && (
            <motion.div 
              key="wits_and_wagers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col bg-slate-950"
            >
              <BibleWitsAndWagersGame 
                onComplete={handleGameComplete} 
                onMistake={handleMistake} 
                onExit={() => setView('dashboard')}
                volume={volume}
                setVolume={setVolume}
                isMusicEnabled={isMusicEnabled}
                setIsMusicEnabled={setIsMusicEnabled}
                musicStatus={musicStatus}
                setMusicStatus={setMusicStatus}
              />
            </motion.div>
          )}

          {view === 'speed_verse' && (
            <motion.div 
              key="speed_verse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col bg-slate-950"
            >
              <SpeedVerseGame 
                onComplete={handleGameComplete} 
                onMistake={handleMistake} 
                onExit={() => setView('dashboard')}
                volume={volume}
                setVolume={setVolume}
                isMusicEnabled={isMusicEnabled}
                setIsMusicEnabled={setIsMusicEnabled}
                musicStatus={musicStatus}
                setMusicStatus={setMusicStatus}
              />
            </motion.div>
          )}

          {view === 'verse_chomper' && (
          <motion.div 
            key="verse_chomper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col bg-slate-950"
          >
            <VerseChomperGame 
              onComplete={(xp) => {
                if (progress) {
                  setProgress({ ...progress, xp: progress.xp + xp });
                }
                setView('dashboard');
              }}
              onExit={() => setView('dashboard')}
              isMusicEnabled={isMusicEnabled}
              setIsMusicEnabled={setIsMusicEnabled}
              selectedMusicStyle={selectedMusicStyle}
              setSelectedMusicStyle={setSelectedMusicStyle}
              volume={volume}
              setVolume={setVolume}
            />
          </motion.div>
        )}

        {view === 'sequence_chomper' && (
          <motion.div 
            key="sequence_chomper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col bg-slate-950"
          >
            <SequenceChomperGame 
              onComplete={(xp) => {
                if (progress) {
                  setProgress({ ...progress, xp: progress.xp + xp });
                }
                setView('dashboard');
              }}
              onExit={() => setView('dashboard')}
              isMusicEnabled={isMusicEnabled}
              setIsMusicEnabled={setIsMusicEnabled}
              selectedMusicStyle={selectedMusicStyle}
              setSelectedMusicStyle={setSelectedMusicStyle}
              volume={volume}
              setVolume={setVolume}
            />
          </motion.div>
        )}

        {view === 'verse_darts' && (
          <motion.div 
            key="verse_darts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col bg-slate-950"
          >
            <VerseDartsGame 
              onComplete={(xp) => {
                if (progress) {
                  setProgress({ ...progress, xp: progress.xp + xp });
                }
                setView('dashboard');
              }}
              onExit={() => setView('dashboard')}
              isMusicEnabled={isMusicEnabled}
              setIsMusicEnabled={setIsMusicEnabled}
              selectedMusicStyle={selectedMusicStyle}
              setSelectedMusicStyle={setSelectedMusicStyle}
              volume={volume}
              setVolume={setVolume}
            />
          </motion.div>
        )}

        {view === 'verse_tetris' && (
          <motion.div 
            key="verse_tetris"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col bg-slate-950"
          >
            <VerseTetrisGame 
              onComplete={(xp) => {
                if (progress) {
                  const newProgress = updateXP(xp);
                  setProgress(newProgress);
                }
                setView('dashboard');
              }}
              onExit={() => setView('dashboard')}
              isMusicEnabled={isMusicEnabled}
              setIsMusicEnabled={setIsMusicEnabled}
              selectedMusicStyle={selectedMusicStyle}
              setSelectedMusicStyle={setSelectedMusicStyle}
              volume={volume}
              setVolume={setVolume}
            />
          </motion.div>
        )}

        {view === 'verse_crush' && (
          <motion.div 
            key="verse_crush"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col bg-slate-950"
          >
            <VerseCrushGame 
              onComplete={(xp) => {
                if (progress) {
                  const newProgress = updateXP(xp);
                  setProgress(newProgress);
                }
                setView('dashboard');
              }}
              onUpdateXP={(xp) => {
                if (progress) {
                  const newProgress = updateXP(xp);
                  setProgress(newProgress);
                }
              }}
              onExit={() => setView('dashboard')}
              isMusicEnabled={isMusicEnabled}
              setIsMusicEnabled={setIsMusicEnabled}
              selectedMusicStyle={selectedMusicStyle}
              setSelectedMusicStyle={setSelectedMusicStyle}
              volume={volume}
              setVolume={setVolume}
            />
          </motion.div>
        )}

        {view === 'daily_hub' && (
          <motion.div 
            key="daily_hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950"
          >
            <DailyJourneyHub 
              onStartDay={(day) => {
                setDailyDay(day);
                setDailyVerseIdx(0);
                setDailyTimes([]);
                setIsReviewMode(false);
                setView('daily_journey');
              }}
              onStartReview={(queue) => {
                setReviewQueue(queue);
                setDailyVerseIdx(0);
                setDailyTimes([]);
                setIsReviewMode(true);
                setView('daily_journey');
              }}
              onExit={() => setView('dashboard')}
            />
          </motion.div>
        )}

        {view === 'daily_journey' && (dailyDay || isReviewMode) && (
          <motion.div 
            key="daily_journey"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 z-50 bg-slate-950"
          >
            <SpeedVerseGame 
              onComplete={handleDailyComplete}
              onUpdateXP={(xp) => {
                // XP is handled in handleDailyComplete for Daily Journey
              }}
              onExit={() => setView('daily_hub')}
              isMusicEnabled={isMusicEnabled}
              setIsMusicEnabled={setIsMusicEnabled}
              selectedMusicStyle={selectedMusicStyle}
              setSelectedMusicStyle={setSelectedMusicStyle}
              volume={volume}
              setVolume={setVolume}
              user={user}
              userProfile={userProfile}
              customReference={isReviewMode ? reviewQueue[dailyVerseIdx].reference : dailyDay?.references[dailyVerseIdx]}
              dailyDate={isReviewMode ? reviewQueue[dailyVerseIdx].date : dailyDay?.date}
              isReviewMode={isReviewMode}
              isLastVerse={dailyVerseIdx === (isReviewMode ? reviewQueue.length - 1 : (dailyDay?.references.length || 1) - 1)}
            />
            {/* Overlay for daily reference */}
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full">
                <span className="text-amber-400 font-black uppercase italic tracking-tighter">
                  {isReviewMode ? `Review ${dailyVerseIdx + 1}/${reviewQueue.length}` : `Verse ${dailyVerseIdx + 1}: ${dailyDay?.references[dailyVerseIdx]}`}
                </span>
              </div>
            </div>
          </motion.div>
        )}
        {view === 'speed_verse' && (
          <motion.div 
            key="speed_verse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col bg-slate-950"
          >
            <SpeedVerseGame 
              onComplete={(xp) => {
                if (progress) {
                  const newProgress = updateXP(xp);
                  setProgress(newProgress);
                }
                setView('dashboard');
              }}
              onUpdateXP={(xp) => {
                if (progress) {
                  const newProgress = updateXP(xp);
                  setProgress(newProgress);
                }
              }}
              onExit={() => setView('dashboard')}
              isMusicEnabled={isMusicEnabled}
              setIsMusicEnabled={setIsMusicEnabled}
              selectedMusicStyle={selectedMusicStyle}
              setSelectedMusicStyle={setSelectedMusicStyle}
              volume={volume}
              setVolume={setVolume}
              user={user}
              userProfile={userProfile}
            />
          </motion.div>
        )}

        {view === 'missionary_journeys' && (
            <motion.div 
              key="missionary_journeys"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col bg-slate-950"
            >
              <MissionaryJourneysGame 
                onComplete={handleGameComplete} 
                onExit={() => setView('dashboard')}
                isMusicEnabled={isMusicEnabled}
                setIsMusicEnabled={setIsMusicEnabled}
                selectedMusicStyle={selectedMusicStyle}
                setSelectedMusicStyle={setSelectedMusicStyle}
                volume={volume}
                setVolume={setVolume}
              />
            </motion.div>
          )}

          {view === 'wits_and_wagers' && (
            <motion.div 
              key="wits_and_wagers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col bg-[#FDFCF0]"
            >
              <BibleWitsAndWagersGame 
              onExit={() => setView('map')}
              isMusicEnabled={isMusicEnabled}
              setIsMusicEnabled={setIsMusicEnabled}
              selectedMusicStyle={selectedMusicStyle}
              setSelectedMusicStyle={setSelectedMusicStyle}
              volume={volume}
              setVolume={setVolume}
            />
            </motion.div>
          )}

          {view === 'boggle' && (
            <motion.div 
              key="boggle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col bg-slate-950"
            >
              <BoggleGame 
                verse={getNextEndlessVerse(filteredGameVerses)} 
                difficulty={boggleDifficulty}
                setDifficulty={setBoggleDifficulty}
                onComplete={handleGameComplete} 
                onExit={() => setView('dashboard')}
                isMusicEnabled={isMusicEnabled}
                setIsMusicEnabled={setIsMusicEnabled}
                selectedMusicStyle={selectedMusicStyle}
                setSelectedMusicStyle={setSelectedMusicStyle}
                volume={volume}
                setVolume={setVolume}
              />
            </motion.div>
          )}

          {view === 'shop' && (
            <motion.div 
              key="shop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 space-y-8"
            >
              <h2 className="text-3xl font-bold font-display">Shop</h2>
              
              <div className="space-y-4">
                <h3 className="text-xl font-bold font-display text-gray-400 uppercase tracking-widest text-sm">Power-ups</h3>
                
                <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100 flex items-center gap-4">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-500">
                    <Heart size={32} fill="currentColor" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">Refill Hearts</h4>
                    <p className="text-sm text-gray-500">
                      {progress.hearts === progress.maxHearts 
                        ? "You're at full health!" 
                        : "Next heart in ~4 hours"}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      if (progress.gems >= 50 && progress.hearts < progress.maxHearts) {
                        const p = getProgress();
                        p.gems -= 50;
                        p.hearts = p.maxHearts;
                        saveProgress(p);
                        setProgress(p);
                      }
                    }}
                    className={cn(
                      "px-4 py-2 rounded-xl font-bold flex items-center gap-1",
                      progress.gems >= 50 ? "bg-blue-400 text-white" : "bg-gray-100 text-gray-400"
                    )}
                  >
                    <Gem size={16} fill="currentColor" /> 50
                  </button>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100 flex items-center gap-4 opacity-50">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-500">
                    <Shield size={32} fill="currentColor" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">Streak Freeze</h4>
                    <p className="text-sm text-gray-500">Protect your streak for a day.</p>
                  </div>
                  <div className="px-4 py-2 bg-gray-100 text-gray-400 rounded-xl font-bold">
                    SOON
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 p-6 rounded-3xl border-2 border-primary/20">
                <h4 className="font-bold text-primary mb-2">Pro Tip!</h4>
                <p className="text-sm text-primary/80">Mastering verses earns you gems. Use them to keep your hearts full during tough challenges!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

// (Removed)

      {/* Bottom Nav */}
      {!isGameView && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-gray-100 px-4 py-4 flex justify-around items-center max-w-md mx-auto z-40">
          <button 
            onClick={() => setView('dashboard')}
            className={cn("flex flex-col items-center gap-1 transition-all", view === 'dashboard' ? "text-primary" : "text-gray-400")}
          >
            <Home size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
          </button>
          <button 
            onClick={() => setView('leagues')}
            className={cn("flex flex-col items-center gap-1 transition-all", view === 'leagues' ? "text-primary" : "text-gray-400")}
          >
            <Trophy size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Leagues</span>
          </button>
          <button 
            onClick={() => setView('shop')}
            className={cn("flex flex-col items-center gap-1 transition-all", view === 'shop' ? "text-primary" : "text-gray-400")}
          >
            <Shield size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Shop</span>
          </button>
          <button 
            onClick={() => setView('profile')}
            className={cn("flex flex-col items-center gap-1 transition-all", view === 'profile' ? "text-primary" : "text-gray-400")}
          >
            <User size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
          </button>
        </nav>
      )}

      <AnimatePresence>
        {showReward && <RewardModal xp={earnedXP} onNext={closeReward} />}
// (Removed)
        {isQuestionBankOpen && (
          <QuestionBankOverlay 
            isOpen={isQuestionBankOpen} 
            onClose={() => setIsQuestionBankOpen(false)} 
            storeName={bankStore}
          />
        )}
        {isVerseSetOpen && (
          <VerseSetOverlay 
            isOpen={isVerseSetOpen} 
            onClose={() => setIsVerseSetOpen(false)} 
            onUpdate={() => setProgress(getProgress())}
          />
        )}
        {isStarTowerSelectionOpen && (
          <StarTowerSelectionOverlay
            isOpen={isStarTowerSelectionOpen}
            onClose={() => setIsStarTowerSelectionOpen(false)}
            onSelect={handleSelectGameSet}
            verseSets={progress?.verseSets || []}
          />
        )}
        {isSettingsOpen && (
          <SettingsOverlay 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)}
            volume={volume}
            setVolume={setVolume}
            isMusicEnabled={isMusicEnabled}
            setIsMusicEnabled={setIsMusicEnabled}
            selectedMusicStyle={selectedMusicStyle}
            setSelectedMusicStyle={setSelectedMusicStyle}
            onOpenBank={() => {
              setBankStore(JEOPARDY_STORE);
              setIsQuestionBankOpen(true);
              setIsSettingsOpen(false);
            }}
            onOpenWitsBank={() => {
              setBankStore(WITS_STORE);
              setIsQuestionBankOpen(true);
              setIsSettingsOpen(false);
            }}
            downloadProgress={downloadProgress}
            onRepair={async () => {
              try {
                setDownloadError(null);
                setDownloadProgress(0);
                await downloadFullKJV((p) => setDownloadProgress(p), true);
                await generateFullYearSchedule();
                const verses = await getAllVerses();
                if (verses.length > 0) {
                  setAllVerses([...verses, ...(progress?.customVerses || [])]);
                }
                setIsSeeded(true);
              } catch (err) {
                console.error("Repair failed:", err);
                setDownloadProgress(null);
                setDownloadError(err instanceof Error ? err.message : String(err));
              }
            }}
          />
        )}
        {showMasteredVerses && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-2xl font-black italic tracking-tight">MASTERED VERSES</h3>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Your Constellation</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowResetConfirm(true)}
                    className="px-3 py-1 bg-red-50 text-red-500 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-red-100 transition-colors"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => setShowMasteredVerses(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {progress?.masteredVerses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Star className="text-gray-200" size={32} />
                    </div>
                    <p className="text-gray-400 font-medium">No verses mastered yet. Start your journey!</p>
                  </div>
                ) : (
                  progress?.masteredVerses.map((verseRef, i) => {
                    const verse = allVerses.find(v => `${v.book} ${v.chapter}:${v.verse}` === verseRef);
                    return (
                      <div key={i} className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Star size={14} className="text-yellow-400 fill-yellow-400" />
                          <span className="font-black text-sm tracking-tight">{verseRef}</span>
                        </div>
                        <p className="text-sm text-gray-600 italic leading-relaxed">
                          {verse?.text || "Verse content unavailable"}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100 shrink-0">
                <button 
                  onClick={() => setShowMasteredVerses(false)}
                  className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black tracking-widest uppercase shadow-lg active:scale-95 transition-transform"
                >
                  CLOSE MAP
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {outOfHearts && view !== 'tower_games' && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
              <Character mood="sad" />
              <h2 className="text-2xl font-bold mb-2">Out of Hearts!</h2>
              <p className="text-gray-500 mb-6">You can wait for hearts to refill, or use gems to get back in the game!</p>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    if (progress.gems >= 50) {
                      const p = getProgress();
                      p.gems -= 50;
                      p.hearts = p.maxHearts;
                      saveProgress(p);
                      setProgress(p);
                      setOutOfHearts(false);
                    }
                  }}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all",
                    progress.gems >= 50 
                      ? "bg-blue-400 text-white border-blue-400 shadow-lg shadow-blue-400/20" 
                      : "bg-gray-50 text-gray-400 border-gray-100"
                  )}
                >
                  <Gem size={20} fill={progress.gems >= 50 ? "white" : "currentColor"} /> Refill for 50 Gems
                </button>
                <button 
                  onClick={() => setOutOfHearts(false)}
                  className="w-full py-3 text-gray-400 font-bold"
                >
                  Maybe Later
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
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500">
                <RotateCcw size={40} />
              </div>
              <h3 className="text-2xl font-black italic tracking-tight mb-2 uppercase">Reset Progress?</h3>
              <p className="text-gray-500 mb-8 leading-relaxed text-sm">
                This will <span className="text-red-500 font-bold">permanently delete</span> all your mastered verses, XP, and gems. This cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    localStorage.removeItem('sword_quest_progress');
                    window.location.reload();
                  }}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-black tracking-widest uppercase shadow-lg shadow-red-500/20 active:scale-95 transition-transform"
                >
                  YES, RESET ALL
                </button>
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black tracking-widest uppercase active:scale-95 transition-transform"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
