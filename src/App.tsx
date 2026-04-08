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
import { getDailyJourneyDay, updateDailyLeaderboard, DailyJourneyDay, generateFullYearSchedule } from './services/dailyJourneyService';
import { SpeedVerseGame } from './components/SpeedVerseGame';
import { BibleReader } from './components/BibleReader';
import { cn } from './lib/utils';
import { Verse, UserProgress, VerseSet } from './types';

const PROMINENT_REFERENCES = [
  "Genesis 1:1", "Genesis 1:26", "Genesis 1:27", "Genesis 2:7", "Genesis 2:24", "Genesis 3:15", "Genesis 12:1", "Genesis 12:2", "Genesis 12:3", "Genesis 15:6", "Genesis 22:12", "Genesis 28:15", "Genesis 50:20",
  "Exodus 3:14", "Exodus 14:14", "Exodus 15:2", "Exodus 20:3", "Exodus 20:4", "Exodus 20:7", "Exodus 20:8", "Exodus 20:12", "Exodus 20:13", "Exodus 20:14", "Exodus 20:15", "Exodus 20:16", "Exodus 20:17", "Exodus 33:14",
  "Leviticus 19:2", "Leviticus 19:18", "Leviticus 20:7",
  "Numbers 6:24", "Numbers 6:25", "Numbers 6:26", "Numbers 23:19",
  "Deuteronomy 4:29", "Deuteronomy 6:4", "Deuteronomy 6:5", "Deuteronomy 7:9", "Deuteronomy 8:3", "Deuteronomy 10:12", "Deuteronomy 31:6", "Deuteronomy 31:8", "Deuteronomy 32:4",
  "Joshua 1:8", "Joshua 1:9", "Joshua 24:15",
  "Judges 21:25",
  "Ruth 1:16",
  "1 Samuel 12:24", "1 Samuel 15:22", "1 Samuel 16:7",
  "2 Samuel 7:22", "2 Samuel 22:31",
  "1 Kings 8:56", "1 Kings 18:21",
  "2 Kings 19:19",
  "1 Chronicles 16:11", "1 Chronicles 16:34", "1 Chronicles 29:11", "1 Chronicles 29:12",
  "2 Chronicles 7:14", "2 Chronicles 16:9", "2 Chronicles 20:12", "2 Chronicles 20:15",
  "Ezra 7:10",
  "Nehemiah 8:10", "Nehemiah 9:6",
  "Esther 4:14",
  "Job 1:21", "Job 19:25", "Job 23:10", "Job 28:28", "Job 42:2",
  "Psalm 1:1", "Psalm 1:2", "Psalm 1:3", "Psalm 8:1", "Psalm 16:11", "Psalm 18:1", "Psalm 18:2", "Psalm 18:30", "Psalm 19:1", "Psalm 19:14", "Psalm 23:1", "Psalm 23:2", "Psalm 23:3", "Psalm 23:4", "Psalm 23:5", "Psalm 23:6", "Psalm 24:1", "Psalm 25:4", "Psalm 25:5", "Psalm 27:1", "Psalm 27:4", "Psalm 27:14", "Psalm 32:8", "Psalm 34:1", "Psalm 34:4", "Psalm 34:8", "Psalm 34:10", "Psalm 34:18", "Psalm 37:4", "Psalm 37:5", "Psalm 37:7", "Psalm 37:23", "Psalm 37:24", "Psalm 40:1", "Psalm 42:1", "Psalm 46:1", "Psalm 46:10", "Psalm 51:1", "Psalm 51:10", "Psalm 51:12", "Psalm 55:22", "Psalm 56:3", "Psalm 62:1", "Psalm 62:5", "Psalm 62:8", "Psalm 63:1", "Psalm 63:3", "Psalm 73:25", "Psalm 73:26", "Psalm 84:10", "Psalm 84:11", "Psalm 86:11", "Psalm 90:12", "Psalm 91:1", "Psalm 91:2", "Psalm 91:11", "Psalm 95:1", "Psalm 100:1", "Psalm 100:2", "Psalm 100:3", "Psalm 100:4", "Psalm 100:5", "Psalm 103:1", "Psalm 103:2", "Psalm 103:8", "Psalm 103:10", "Psalm 103:11", "Psalm 103:12", "Psalm 103:13", "Psalm 107:1", "Psalm 116:15", "Psalm 118:1", "Psalm 118:24", "Psalm 119:9", "Psalm 119:11", "Psalm 119:18", "Psalm 119:105", "Psalm 121:1", "Psalm 121:2", "Psalm 121:3", "Psalm 121:4", "Psalm 121:5", "Psalm 121:6", "Psalm 121:7", "Psalm 121:8", "Psalm 127:1", "Psalm 133:1", "Psalm 136:1", "Psalm 139:1", "Psalm 139:13", "Psalm 139:14", "Psalm 139:23", "Psalm 139:24", "Psalm 143:10", "Psalm 145:18", "Psalm 147:3",
  "Proverbs 1:7", "Proverbs 3:5", "Proverbs 3:6", "Proverbs 3:9", "Proverbs 3:10", "Proverbs 4:23", "Proverbs 6:6", "Proverbs 8:13", "Proverbs 10:19", "Proverbs 11:2", "Proverbs 11:25", "Proverbs 11:30", "Proverbs 12:22", "Proverbs 13:20", "Proverbs 14:12", "Proverbs 15:1", "Proverbs 15:3", "Proverbs 15:13", "Proverbs 15:33", "Proverbs 16:3", "Proverbs 16:9", "Proverbs 16:18", "Proverbs 16:24", "Proverbs 17:17", "Proverbs 17:22", "Proverbs 18:10", "Proverbs 18:21", "Proverbs 18:24", "Proverbs 19:21", "Proverbs 20:1", "Proverbs 21:23", "Proverbs 22:1", "Proverbs 22:6", "Proverbs 23:23", "Proverbs 24:16", "Proverbs 25:21", "Proverbs 25:22", "Proverbs 27:1", "Proverbs 27:17", "Proverbs 28:13", "Proverbs 29:18", "Proverbs 29:25", "Proverbs 30:5", "Proverbs 31:10", "Proverbs 31:30",
  "Ecclesiastes 3:1", "Ecclesiastes 3:11", "Ecclesiastes 4:9", "Ecclesiastes 4:10", "Ecclesiastes 4:12", "Ecclesiastes 7:20", "Ecclesiastes 12:1", "Ecclesiastes 12:13",
  "Song of Solomon 2:4", "Song of Solomon 8:6", "Song of Solomon 8:7",
  "Isaiah 1:18", "Isaiah 6:8", "Isaiah 7:14", "Isaiah 9:6", "Isaiah 12:2", "Isaiah 26:3", "Isaiah 26:4", "Isaiah 30:15", "Isaiah 30:18", "Isaiah 30:21", "Isaiah 35:3", "Isaiah 35:4", "Isaiah 40:8", "Isaiah 40:11", "Isaiah 40:28", "Isaiah 40:29", "Isaiah 40:30", "Isaiah 40:31", "Isaiah 41:10", "Isaiah 41:13", "Isaiah 43:1", "Isaiah 43:2", "Isaiah 43:19", "Isaiah 44:6", "Isaiah 45:22", "Isaiah 48:17", "Isaiah 53:3", "Isaiah 53:4", "Isaiah 53:5", "Isaiah 53:6", "Isaiah 54:10", "Isaiah 54:17", "Isaiah 55:1", "Isaiah 55:6", "Isaiah 55:7", "Isaiah 55:8", "Isaiah 55:9", "Isaiah 55:11", "Isaiah 57:15", "Isaiah 58:11", "Isaiah 59:1", "Isaiah 59:2", "Isaiah 61:1", "Isaiah 61:3", "Isaiah 64:4", "Isaiah 64:8",
  "Jeremiah 1:5", "Jeremiah 9:23", "Jeremiah 9:24", "Jeremiah 10:12", "Jeremiah 15:16", "Jeremiah 17:7", "Jeremiah 17:8", "Jeremiah 17:9", "Jeremiah 20:9", "Jeremiah 23:23", "Jeremiah 23:24", "Jeremiah 29:11", "Jeremiah 29:12", "Jeremiah 29:13", "Jeremiah 31:3", "Jeremiah 31:33", "Jeremiah 32:17", "Jeremiah 32:27", "Jeremiah 33:3",
  "Lamentations 3:22", "Lamentations 3:23", "Lamentations 3:24", "Lamentations 3:25", "Lamentations 3:26",
  "Ezekiel 11:19", "Ezekiel 18:23", "Ezekiel 18:32", "Ezekiel 33:11", "Ezekiel 34:11", "Ezekiel 36:26", "Ezekiel 36:27",
  "Daniel 2:20", "Daniel 2:21", "Daniel 2:22", "Daniel 3:17", "Daniel 3:18", "Daniel 4:35", "Daniel 6:26", "Daniel 6:27", "Daniel 12:3",
  "Hosea 4:6", "Hosea 6:3", "Hosea 6:6", "Hosea 10:12", "Hosea 14:9",
  "Joel 2:12", "Joel 2:13", "Joel 2:28", "Joel 2:32",
  "Amos 3:3", "Amos 3:7", "Amos 4:12", "Amos 5:14", "Amos 5:24",
  "Obadiah 1:15",
  "Jonah 2:9", "Jonah 4:2",
  "Micah 6:8", "Micah 7:7", "Micah 7:18", "Micah 7:19",
  "Nahum 1:7",
  "Habakkuk 2:4", "Habakkuk 2:14", "Habakkuk 2:20", "Habakkuk 3:17", "Habakkuk 3:18", "Habakkuk 3:19",
  "Zephaniah 3:17",
  "Haggai 1:5", "Haggai 2:4", "Haggai 2:9",
  "Zechariah 4:6", "Zechariah 7:9", "Zechariah 8:16", "Zechariah 9:9", "Zechariah 14:9",
  "Malachi 3:1", "Malachi 3:6", "Malachi 3:10", "Malachi 4:2",
  "Matthew 1:21", "Matthew 1:23", "Matthew 3:17", "Matthew 4:4", "Matthew 4:10", "Matthew 4:19", "Matthew 5:3", "Matthew 5:4", "Matthew 5:5", "Matthew 5:6", "Matthew 5:7", "Matthew 5:8", "Matthew 5:9", "Matthew 5:10", "Matthew 5:11", "Matthew 5:12", "Matthew 5:13", "Matthew 5:14", "Matthew 5:16", "Matthew 5:20", "Matthew 5:37", "Matthew 5:44", "Matthew 5:48", "Matthew 6:1", "Matthew 6:6", "Matthew 6:9", "Matthew 6:10", "Matthew 6:11", "Matthew 6:12", "Matthew 6:13", "Matthew 6:14", "Matthew 6:15", "Matthew 6:19", "Matthew 6:20", "Matthew 6:21", "Matthew 6:24", "Matthew 6:25", "Matthew 6:26", "Matthew 6:33", "Matthew 6:34", "Matthew 7:1", "Matthew 7:2", "Matthew 7:7", "Matthew 7:8", "Matthew 7:11", "Matthew 7:12", "Matthew 7:13", "Matthew 7:14", "Matthew 7:21", "Matthew 7:24", "Matthew 7:25", "Matthew 9:37", "Matthew 9:38", "Matthew 10:16", "Matthew 10:28", "Matthew 10:32", "Matthew 10:33", "Matthew 10:37", "Matthew 10:38", "Matthew 10:39", "Matthew 11:28", "Matthew 11:29", "Matthew 11:30", "Matthew 12:30", "Matthew 12:34", "Matthew 12:36", "Matthew 12:37", "Matthew 13:44", "Matthew 15:8", "Matthew 15:11", "Matthew 15:18", "Matthew 15:19", "Matthew 16:15", "Matthew 16:16", "Matthew 16:18", "Matthew 16:24", "Matthew 16:25", "Matthew 16:26", "Matthew 17:20", "Matthew 18:3", "Matthew 18:4", "Matthew 18:11", "Matthew 18:19", "Matthew 18:20", "Matthew 19:6", "Matthew 19:14", "Matthew 19:26", "Matthew 20:26", "Matthew 20:27", "Matthew 20:28", "Matthew 21:22", "Matthew 22:37", "Matthew 22:38", "Matthew 22:39", "Matthew 22:40", "Matthew 23:11", "Matthew 23:12", "Matthew 24:13", "Matthew 24:14", "Matthew 24:35", "Matthew 24:42", "Matthew 24:44", "Matthew 25:21", "Matthew 25:23", "Matthew 25:31", "Matthew 25:40", "Matthew 26:41", "Matthew 28:18", "Matthew 28:19", "Matthew 28:20",
  "Mark 1:15", "Mark 1:17", "Mark 8:34", "Mark 8:35", "Mark 8:36", "Mark 8:37", "Mark 8:38", "Mark 9:23", "Mark 9:24", "Mark 10:14", "Mark 10:15", "Mark 10:27", "Mark 10:43", "Mark 10:44", "Mark 10:45", "Mark 11:22", "Mark 11:23", "Mark 11:24", "Mark 11:25", "Mark 12:29", "Mark 12:30", "Mark 12:31", "Mark 13:31", "Mark 14:38", "Mark 16:15", "Mark 16:16",
  "Luke 1:37", "Luke 1:38", "Luke 1:46", "Luke 1:47", "Luke 2:10", "Luke 2:11", "Luke 2:14", "Luke 2:52", "Luke 4:4", "Luke 4:8", "Luke 4:18", "Luke 4:19", "Luke 6:27", "Luke 6:28", "Luke 6:31", "Luke 6:35", "Luke 6:36", "Luke 6:37", "Luke 6:38", "Luke 6:45", "Luke 6:46", "Luke 9:23", "Luke 9:24", "Luke 9:25", "Luke 9:26", "Luke 9:62", "Luke 10:2", "Luke 10:19", "Luke 10:20", "Luke 10:27", "Luke 11:9", "Luke 11:10", "Luke 11:13", "Luke 11:28", "Luke 12:15", "Luke 12:22", "Luke 12:23", "Luke 12:31", "Luke 12:32", "Luke 12:34", "Luke 12:48", "Luke 14:11", "Luke 14:26", "Luke 14:27", "Luke 14:33", "Luke 15:7", "Luke 15:10", "Luke 16:10", "Luke 16:13", "Luke 17:3", "Luke 17:4", "Luke 18:1", "Luke 18:16", "Luke 18:17", "Luke 18:27", "Luke 19:10", "Luke 21:33", "Luke 22:19", "Luke 22:20", "Luke 22:42", "Luke 23:34", "Luke 23:43", "Luke 24:44", "Luke 24:45", "Luke 24:46", "Luke 24:47", "Luke 24:48",
  "John 1:1", "John 1:2", "John 1:3", "John 1:4", "John 1:5", "John 1:12", "John 1:14", "John 1:17", "John 1:18", "John 1:29", "John 3:3", "John 3:5", "John 3:16", "John 3:17", "John 3:18", "John 3:30", "John 3:36", "John 4:14", "John 4:23", "John 4:24", "John 5:24", "John 5:39", "John 6:35", "John 6:37", "John 6:40", "John 6:44", "John 6:47", "John 6:63", "John 6:68", "John 7:37", "John 7:38", "John 8:12", "John 8:31", "John 8:32", "John 8:36", "John 8:58", "John 10:9", "John 10:10", "John 10:11", "John 10:14", "John 10:27", "John 10:28", "John 10:29", "John 10:30", "John 11:25", "John 11:26", "John 11:35", "John 12:24", "John 12:25", "John 12:26", "John 12:32", "John 12:48", "John 13:7", "John 13:13", "John 13:14", "John 13:15", "John 13:34", "John 13:35", "John 14:1", "John 14:2", "John 14:3", "John 14:6", "John 14:12", "John 14:13", "John 14:14", "John 14:15", "John 14:16", "John 14:17", "John 14:21", "John 14:23", "John 14:26", "John 14:27", "John 15:1", "John 15:2", "John 15:4", "John 15:5", "John 15:7", "John 15:8", "John 15:9", "John 15:10", "John 15:11", "John 15:12", "John 15:13", "John 15:14", "John 15:15", "John 15:16", "John 15:17", "John 15:18", "John 15:19", "John 15:20", "John 16:7", "John 16:8", "John 16:13", "John 16:24", "John 16:33", "John 17:3", "John 17:17", "John 17:21", "John 18:36", "John 18:37", "John 19:30", "John 20:21", "John 20:29", "John 20:31", "John 21:15", "John 21:16", "John 21:17",
  "Acts 1:8", "Acts 2:21", "Acts 2:38", "Acts 2:42", "Acts 3:19", "Acts 4:12", "Acts 4:19", "Acts 4:20", "Acts 5:29", "Acts 5:41", "Acts 5:42", "Acts 10:34", "Acts 10:35", "Acts 10:43", "Acts 13:38", "Acts 13:39", "Acts 16:31", "Acts 17:11", "Acts 17:24", "Acts 17:25", "Acts 17:26", "Acts 17:27", "Acts 17:28", "Acts 17:30", "Acts 17:31", "Acts 20:24", "Acts 20:28", "Acts 20:32", "Acts 20:35", "Acts 26:18",
  "Romans 1:16", "Romans 1:17", "Romans 1:20", "Romans 2:4", "Romans 3:10", "Romans 3:23", "Romans 3:24", "Romans 4:5", "Romans 5:1", "Romans 5:2", "Romans 5:5", "Romans 5:8", "Romans 5:9", "Romans 5:10", "Romans 5:12", "Romans 5:19", "Romans 6:1", "Romans 6:2", "Romans 6:4", "Romans 6:6", "Romans 6:11", "Romans 6:12", "Romans 6:13", "Romans 6:14", "Romans 6:23", "Romans 7:15", "Romans 7:18", "Romans 7:19", "Romans 7:24", "Romans 7:25", "Romans 8:1", "Romans 8:2", "Romans 8:5", "Romans 8:6", "Romans 8:9", "Romans 8:11", "Romans 8:13", "Romans 8:14", "Romans 8:15", "Romans 8:16", "Romans 8:17", "Romans 8:18", "Romans 8:26", "Romans 8:27", "Romans 8:28", "Romans 8:29", "Romans 8:30", "Romans 8:31", "Romans 8:32", "Romans 8:33", "Romans 8:34", "Romans 8:35", "Romans 8:37", "Romans 8:38", "Romans 8:39", "Romans 9:16", "Romans 10:9", "Romans 10:10", "Romans 10:13", "Romans 10:17", "Romans 11:33", "Romans 11:34", "Romans 11:35", "Romans 11:36", "Romans 12:1", "Romans 12:2", "Romans 12:3", "Romans 12:4", "Romans 12:5", "Romans 12:9", "Romans 12:10", "Romans 12:11", "Romans 12:12", "Romans 12:13", "Romans 12:14", "Romans 12:15", "Romans 12:16", "Romans 12:17", "Romans 12:18", "Romans 12:19", "Romans 12:21", "Romans 13:1", "Romans 13:8", "Romans 13:10", "Romans 13:14", "Romans 14:7", "Romans 14:8", "Romans 14:10", "Romans 14:11", "Romans 14:12", "Romans 14:17", "Romans 14:19", "Romans 15:4", "Romans 15:5", "Romans 15:6", "Romans 15:7", "Romans 15:13",
  "1 Corinthians 1:18", "1 Corinthians 1:25", "1 Corinthians 1:27", "1 Corinthians 1:30", "1 Corinthians 2:9", "1 Corinthians 2:10", "1 Corinthians 2:12", "1 Corinthians 2:14", "1 Corinthians 3:6", "1 Corinthians 3:7", "1 Corinthians 3:11", "1 Corinthians 3:16", "1 Corinthians 3:17", "1 Corinthians 4:2", "1 Corinthians 6:12", "1 Corinthians 6:19", "1 Corinthians 6:20", "1 Corinthians 9:24", "1 Corinthians 10:12", "1 Corinthians 10:13", "1 Corinthians 10:31", "1 Corinthians 13:1", "1 Corinthians 13:2", "1 Corinthians 13:3", "1 Corinthians 13:4", "1 Corinthians 13:5", "1 Corinthians 13:6", "1 Corinthians 13:7", "1 Corinthians 13:8", "1 Corinthians 13:11", "1 Corinthians 13:12", "1 Corinthians 13:13", "1 Corinthians 15:3", "1 Corinthians 15:4", "1 Corinthians 15:10", "1 Corinthians 15:20", "1 Corinthians 15:21", "1 Corinthians 15:22", "1 Corinthians 15:33", "1 Corinthians 15:51", "1 Corinthians 15:52", "1 Corinthians 15:54", "1 Corinthians 15:55", "1 Corinthians 15:57", "1 Corinthians 15:58", "1 Corinthians 16:13", "1 Corinthians 16:14",
  "2 Corinthians 1:3", "2 Corinthians 1:4", "2 Corinthians 1:20", "2 Corinthians 3:17", "2 Corinthians 3:18", "2 Corinthians 4:7", "2 Corinthians 4:16", "2 Corinthians 4:17", "2 Corinthians 4:18", "2 Corinthians 5:1", "2 Corinthians 5:7", "2 Corinthians 5:10", "2 Corinthians 5:14", "2 Corinthians 5:15", "2 Corinthians 5:17", "2 Corinthians 5:18", "2 Corinthians 5:19", "2 Corinthians 5:20", "2 Corinthians 5:21", "2 Corinthians 8:9", "2 Corinthians 9:6", "2 Corinthians 9:7", "2 Corinthians 9:8", "2 Corinthians 9:15", "2 Corinthians 10:3", "2 Corinthians 10:4", "2 Corinthians 10:5", "2 Corinthians 12:9", "2 Corinthians 12:10", "2 Corinthians 13:14",
  "Galatians 1:8", "Galatians 2:20", "Galatians 3:13", "Galatians 3:26", "Galatians 3:27", "Galatians 3:28", "Galatians 4:4", "Galatians 4:5", "Galatians 4:6", "Galatians 4:7", "Galatians 5:1", "Galatians 5:6", "Galatians 5:13", "Galatians 5:14", "Galatians 5:16", "Galatians 5:17", "Galatians 5:22", "Galatians 5:23", "Galatians 5:24", "Galatians 5:25", "Galatians 6:1", "Galatians 6:2", "Galatians 6:7", "Galatians 6:8", "Galatians 6:9", "Galatians 6:10", "Galatians 6:14",
  "Ephesians 1:3", "Ephesians 1:4", "Ephesians 1:7", "Ephesians 1:13", "Ephesians 1:14", "Ephesians 2:1", "Ephesians 2:4", "Ephesians 2:5", "Ephesians 2:8", "Ephesians 2:9", "Ephesians 2:10", "Ephesians 2:13", "Ephesians 2:14", "Ephesians 2:19", "Ephesians 2:20", "Ephesians 3:16", "Ephesians 3:17", "Ephesians 3:18", "Ephesians 3:19", "Ephesians 3:20", "Ephesians 3:21", "Ephesians 4:1", "Ephesians 4:2", "Ephesians 4:3", "Ephesians 4:11", "Ephesians 4:12", "Ephesians 4:15", "Ephesians 4:22", "Ephesians 4:23", "Ephesians 4:24", "Ephesians 4:25", "Ephesians 4:26", "Ephesians 4:27", "Ephesians 4:29", "Ephesians 4:30", "Ephesians 4:31", "Ephesians 4:32", "Ephesians 5:1", "Ephesians 5:2", "Ephesians 5:8", "Ephesians 5:15", "Ephesians 5:16", "Ephesians 5:18", "Ephesians 5:19", "Ephesians 5:20", "Ephesians 5:21", "Ephesians 5:22", "Ephesians 5:25", "Ephesians 6:1", "Ephesians 6:2", "Ephesians 6:4", "Ephesians 6:10", "Ephesians 6:11", "Ephesians 6:12", "Ephesians 6:13", "Ephesians 6:14", "Ephesians 6:15", "Ephesians 6:16", "Ephesians 6:17", "Ephesians 6:18",
  "Philippians 1:6", "Philippians 1:21", "Philippians 1:27", "Philippians 2:3", "Philippians 2:4", "Philippians 2:5", "Philippians 2:6", "Philippians 2:7", "Philippians 2:8", "Philippians 2:9", "Philippians 2:10", "Philippians 2:11", "Philippians 2:12", "Philippians 2:13", "Philippians 2:14", "Philippians 2:15", "Philippians 3:7", "Philippians 3:8", "Philippians 3:10", "Philippians 3:12", "Philippians 3:13", "Philippians 3:14", "Philippians 3:20", "Philippians 3:21", "Philippians 4:4", "Philippians 4:5", "Philippians 4:6", "Philippians 4:7", "Philippians 4:8", "Philippians 4:9", "Philippians 4:11", "Philippians 4:12", "Philippians 4:13", "Philippians 4:19",
  "Colossians 1:13", "Colossians 1:14", "Colossians 1:15", "Colossians 1:16", "Colossians 1:17", "Colossians 1:18", "Colossians 1:20", "Colossians 1:27", "Colossians 1:28", "Colossians 2:3", "Colossians 2:6", "Colossians 2:7", "Colossians 2:8", "Colossians 2:9", "Colossians 2:10", "Colossians 2:13", "Colossians 2:14", "Colossians 3:1", "Colossians 3:2", "Colossians 3:3", "Colossians 3:4", "Colossians 3:10", "Colossians 3:12", "Colossians 3:13", "Colossians 3:14", "Colossians 3:15", "Colossians 3:16", "Colossians 3:17", "Colossians 3:23", "Colossians 3:24", "Colossians 4:2", "Colossians 4:5", "Colossians 4:6",
  "1 Thessalonians 1:3", "1 Thessalonians 4:3", "1 Thessalonians 4:13", "1 Thessalonians 4:14", "1 Thessalonians 4:16", "1 Thessalonians 4:17", "1 Thessalonians 4:18", "1 Thessalonians 5:11", "1 Thessalonians 5:16", "1 Thessalonians 5:17", "1 Thessalonians 5:18", "1 Thessalonians 5:19", "1 Thessalonians 5:21", "1 Thessalonians 5:22", "1 Thessalonians 5:23", "1 Thessalonians 5:24",
  "2 Thessalonians 2:13", "2 Thessalonians 3:3", "2 Thessalonians 3:5", "2 Thessalonians 3:10", "2 Thessalonians 3:13",
  "1 Timothy 1:15", "1 Timothy 2:1", "1 Timothy 2:2", "1 Timothy 2:4", "1 Timothy 2:5", "1 Timothy 3:16", "1 Timothy 4:8", "1 Timothy 4:12", "1 Timothy 6:6", "1 Timothy 6:7", "1 Timothy 6:8", "1 Timothy 6:10", "1 Timothy 6:11", "1 Timothy 6:12", "1 Timothy 6:17", "1 Timothy 6:18", "1 Timothy 6:19",
  "2 Timothy 1:7", "2 Timothy 1:8", "2 Timothy 1:9", "2 Timothy 1:12", "2 Timothy 2:1", "2 Timothy 2:3", "2 Timothy 2:11", "2 Timothy 2:12", "2 Timothy 2:13", "2 Timothy 2:15", "2 Timothy 2:19", "2 Timothy 2:21", "2 Timothy 2:22", "2 Timothy 3:12", "2 Timothy 3:14", "2 Timothy 3:15", "2 Timothy 3:16", "2 Timothy 3:17", "2 Timothy 4:2", "2 Timothy 4:5", "2 Timothy 4:7", "2 Timothy 4:8", "2 Timothy 4:18",
  "Titus 2:11", "Titus 2:12", "Titus 2:13", "Titus 2:14", "Titus 3:4", "Titus 3:5", "Titus 3:6", "Titus 3:7",
  "Philemon 1:6",
  "Hebrews 1:1", "Hebrews 1:2", "Hebrews 1:3", "Hebrews 2:1", "Hebrews 2:14", "Hebrews 2:15", "Hebrews 2:18", "Hebrews 3:1", "Hebrews 3:12", "Hebrews 3:13", "Hebrews 4:12", "Hebrews 4:13", "Hebrews 4:14", "Hebrews 4:15", "Hebrews 4:16", "Hebrews 6:10", "Hebrews 6:18", "Hebrews 6:19", "Hebrews 7:25", "Hebrews 9:12", "Hebrews 9:14", "Hebrews 9:22", "Hebrews 9:24", "Hebrews 9:27", "Hebrews 9:28", "Hebrews 10:10", "Hebrews 10:14", "Hebrews 10:19", "Hebrews 10:22", "Hebrews 10:23", "Hebrews 10:24", "Hebrews 10:25", "Hebrews 10:31", "Hebrews 10:35", "Hebrews 10:36", "Hebrews 10:39", "Hebrews 11:1", "Hebrews 11:3", "Hebrews 11:6", "Hebrews 12:1", "Hebrews 12:2", "Hebrews 12:3", "Hebrews 12:4", "Hebrews 12:5", "Hebrews 12:6", "Hebrews 12:11", "Hebrews 12:14", "Hebrews 12:28", "Hebrews 12:29", "Hebrews 13:1", "Hebrews 13:2", "Hebrews 13:5", "Hebrews 13:6", "Hebrews 13:8", "Hebrews 13:14", "Hebrews 13:15", "Hebrews 13:16", "Hebrews 13:17", "Hebrews 13:20", "Hebrews 13:21",
  "James 1:2", "James 1:3", "James 1:4", "James 1:5", "James 1:6", "James 1:12", "James 1:13", "James 1:17", "James 1:19", "James 1:20", "James 1:21", "James 1:22", "James 1:23", "James 1:24", "James 1:25", "James 1:26", "James 1:27", "James 2:10", "James 2:14", "James 2:17", "James 2:18", "James 2:19", "James 2:20", "James 2:24", "James 2:26", "James 3:1", "James 3:2", "James 3:13", "James 3:17", "James 3:18", "James 4:1", "James 4:2", "James 4:3", "James 4:4", "James 4:6", "James 4:7", "James 4:8", "James 4:10", "James 4:14", "James 4:17", "James 5:13", "James 5:14", "James 5:15", "James 5:16", "James 5:17", "James 5:18", "James 5:19", "James 5:20",
  "1 Peter 1:3", "1 Peter 1:4", "1 Peter 1:5", "1 Peter 1:7", "1 Peter 1:8", "1 Peter 1:13", "1 Peter 1:14", "1 Peter 1:15", "1 Peter 1:16", "1 Peter 1:18", "1 Peter 1:19", "1 Peter 1:21", "1 Peter 1:23", "1 Peter 1:24", "1 Peter 1:25", "1 Peter 2:2", "1 Peter 2:5", "1 Peter 2:9", "1 Peter 2:11", "1 Peter 2:12", "1 Peter 2:15", "1 Peter 2:16", "1 Peter 2:21", "1 Peter 2:22", "1 Peter 2:23", "1 Peter 2:24", "1 Peter 3:1", "1 Peter 3:7", "1 Peter 3:8", "1 Peter 3:9", "1 Peter 3:10", "1 Peter 3:11", "1 Peter 3:12", "1 Peter 3:15", "1 Peter 3:16", "1 Peter 3:18", "1 Peter 4:7", "1 Peter 4:8", "1 Peter 4:9", "1 Peter 4:10", "1 Peter 4:11", "1 Peter 4:12", "1 Peter 4:13", "1 Peter 4:14", "1 Peter 4:16", "1 Peter 4:19", "1 Peter 5:5", "1 Peter 5:6", "1 Peter 5:7", "1 Peter 5:8", "1 Peter 5:9", "1 Peter 5:10", "1 Peter 5:11",
  "2 Peter 1:3", "2 Peter 1:4", "2 Peter 1:5", "2 Peter 1:6", "2 Peter 1:7", "2 Peter 1:8", "2 Peter 1:10", "2 Peter 1:11", "2 Peter 1:20", "2 Peter 1:21", "2 Peter 2:9", "2 Peter 3:8", "2 Peter 3:9", "2 Peter 3:10", "2 Peter 3:13", "2 Peter 3:14", "2 Peter 3:18",
  "1 John 1:1", "1 John 1:2", "1 John 1:3", "1 John 1:5", "1 John 1:7", "1 John 1:8", "1 John 1:9", "1 John 1:10", "1 John 2:1", "1 John 2:2", "1 John 2:3", "1 John 2:4", "1 John 2:5", "1 John 2:6", "1 John 2:15", "1 John 2:16", "1 John 2:17", "1 John 2:25", "1 John 2:27", "1 John 3:1", "1 John 3:2", "1 John 3:3", "1 John 3:4", "1 John 3:5", "1 John 3:8", "1 John 3:9", "1 John 3:10", "1 John 3:11", "1 John 3:14", "1 John 3:16", "1 John 3:17", "1 John 3:18", "1 John 3:20", "1 John 3:22", "1 John 3:23", "1 John 3:24", "1 John 4:1", "1 John 4:4", "1 John 4:7", "1 John 4:8", "1 John 4:9", "1 John 4:10", "1 John 4:11", "1 John 4:12", "1 John 4:13", "1 John 4:14", "1 John 4:15", "1 John 4:16", "1 John 4:17", "1 John 4:18", "1 John 4:19", "1 John 4:20", "1 John 4:21", "1 John 5:1", "1 John 5:3", "1 John 5:4", "1 John 5:5", "1 John 5:11", "1 John 5:12", "1 John 5:13", "1 John 5:14", "1 John 5:15", "1 John 5:20", "1 John 5:21",
  "2 John 1:6",
  "3 John 1:2", "3 John 1:4", "3 John 1:11",
  "Jude 1:20", "Jude 1:21", "Jude 1:24", "Jude 1:25",
  "Revelation 1:3", "Revelation 1:7", "Revelation 1:8", "Revelation 1:17", "Revelation 1:18", "Revelation 2:4", "Revelation 2:10", "Revelation 3:5", "Revelation 3:10", "Revelation 3:11", "Revelation 3:12", "Revelation 3:15", "Revelation 3:16", "Revelation 3:19", "Revelation 3:20", "Revelation 3:21", "Revelation 4:8", "Revelation 4:11", "Revelation 5:9", "Revelation 5:12", "Revelation 7:9", "Revelation 7:10", "Revelation 7:17", "Revelation 12:11", "Revelation 14:13", "Revelation 15:3", "Revelation 15:4", "Revelation 17:14", "Revelation 19:6", "Revelation 19:7", "Revelation 19:11", "Revelation 19:16", "Revelation 20:11", "Revelation 20:12", "Revelation 20:15", "Revelation 21:1", "Revelation 21:3", "Revelation 21:4", "Revelation 21:5", "Revelation 21:6", "Revelation 21:7", "Revelation 21:27", "Revelation 22:1", "Revelation 22:2", "Revelation 22:3", "Revelation 22:4", "Revelation 22:5", "Revelation 22:7", "Revelation 22:12", "Revelation 22:13", "Revelation 22:14", "Revelation 22:17", "Revelation 22:20", "Revelation 22:21"
];

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

// --- Components ---

const ProgressBar = ({ current, total }: { current: number, total: number }) => (
  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-100">
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, (current / total) * 100)}%` }}
      className="h-full bg-secondary"
    />
  </div>
);

const HeartDisplay = ({ hearts, max }: { hearts: number, max: number }) => (
  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
    <Heart className={cn("w-5 h-5", hearts > 0 ? "text-red-500 fill-red-500" : "text-gray-300")} />
    <span className={cn("font-bold", hearts === 0 && "text-gray-400")}>{hearts}</span>
  </div>
);

const GemDisplay = ({ gems }: { gems: number }) => (
  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
    <Gem className="w-5 h-5 text-blue-400 fill-blue-400" />
    <span className="font-bold">{gems}</span>
  </div>
);

const Character = ({ mood = 'happy' }: { mood?: 'happy' | 'sad' | 'thinking' | 'excited' }) => {
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

const LeagueLeaderboard = ({ userPoints, leagueName }: { userPoints: number, leagueName: string }) => {
  const rivals = useMemo(() => {
    const names = ['Noah', 'Sarah', 'David', 'Esther', 'Daniel', 'Ruth', 'Samuel', 'Hannah', 'Joseph', 'Lydia'];
    return names.map((name, i) => ({
      name,
      points: Math.max(0, userPoints + (5 - i) * 15 + Math.floor(Math.random() * 10)),
      isUser: false
    })).concat([{ name: 'You', points: userPoints, isUser: true }])
    .sort((a, b) => b.points - a.points);
  }, [userPoints]);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-3xl text-white shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-80">{leagueName} League</h3>
            <p className="text-2xl font-bold">Top 3 advance!</p>
          </div>
          <Trophy size={48} className="opacity-50" />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border-2 border-gray-100 overflow-hidden">
        {rivals.map((rival, i) => (
          <div 
            key={i} 
            className={cn(
              "flex items-center gap-4 p-4 border-b border-gray-50 last:border-0",
              rival.isUser ? "bg-primary/5" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
              i === 0 ? "bg-yellow-400 text-white" : 
              i === 1 ? "bg-gray-300 text-white" :
              i === 2 ? "bg-orange-400 text-white" : "text-gray-400"
            )}>
              {i + 1}
            </div>
            <div className="flex-1 font-bold text-gray-700">{rival.name}</div>
            <div className="flex items-center gap-1 text-primary font-bold">
              <Star size={14} fill="currentColor" />
              {rival.points}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const XPGraph = ({ history }: { history: { date: string, xp: number }[] }) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();
  
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
      <h3 className="font-bold text-gray-400 uppercase tracking-widest text-xs mb-4">Weekly Activity</h3>
      <div className="flex items-end justify-between h-24 gap-2">
        {days.map((day, i) => {
          const date = new Date();
          date.setDate(today.getDate() - (today.getDay() - i));
          const dateStr = date.toISOString().split('T')[0];
          const dayData = history.find(h => h.date === dateStr);
          const xp = dayData ? dayData.xp : 0;
          const height = Math.min(100, (xp / 50) * 100); // Goal is 50 XP per day
          
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="flex-1 w-full bg-gray-50 rounded-t-lg relative overflow-hidden">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  className={cn(
                    "absolute bottom-0 left-0 right-0 transition-colors",
                    i === today.getDay() ? "bg-secondary" : "bg-primary/40"
                  )}
                />
              </div>
              <span className={cn("text-[10px] font-bold", i === today.getDay() ? "text-secondary" : "text-gray-400")}>{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PathNode: React.FC<{ 
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

const RewardModal = ({ xp, onNext }: { xp: number, onNext: () => void }) => (
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

// --- Game Modes ---

const Background = memo(({ masteredKeys, progress }: { masteredKeys: string[], progress: any }) => {
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

const BIBLE_CHAPTER_COUNTS: Record<string, number> = {
  'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34, 'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36, 'Ezra': 10, 'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalm': 150, 'Proverbs': 31,
  'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66, 'Jeremiah': 52, 'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14, 'Joel': 3, 'Amos': 9,
  'Obadiah': 1, 'Jonah': 4, 'Micah': 7, 'Nahum': 3, 'Habakkuk': 3, 'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14, 'Malachi': 4, 'Matthew': 28, 'Mark': 16,
  'Luke': 24, 'John': 21, 'Acts': 28, 'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6, 'Ephesians': 6, 'Philippians': 4,
  'Colossians': 4, '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4, 'Titus': 3, 'Philemon': 1, 'Hebrews': 13, 'James': 5,
  '1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22
};

const TOTAL_BIBLE_CHAPTERS = 1189;

const QuestionBankOverlay = ({ isOpen, onClose, storeName = JEOPARDY_STORE }: { isOpen: boolean, onClose: () => void, storeName?: string }) => {
  const [questions, setQuestions] = useState<BibleQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetBankConfirm, setShowResetBankConfirm] = useState(false);

  const [minedPercentage, setMinedPercentage] = useState(0);

  const calculateMiningPercentage = useCallback(async () => {
    const progress = storeName === WITS_STORE 
      ? await getWitsSectionsProgress()
      : await getBibleProgress();
    
    const sections = progress.sections || {};
    let totalChaptersMined = 0;
    
    for (const section of BIBLE_SECTIONS) {
      const prog = sections[section.id];
      if (!prog) continue;
      
      let chaptersInSectionMined = 0;
      let counting = false;
      
      for (const book of BIBLE_BOOKS) {
        if (book === section.startBook) counting = true;
        
        if (counting) {
          if (book === prog.currentBook) {
            chaptersInSectionMined += Math.max(0, prog.currentChapter - 1);
            break;
          } else {
            chaptersInSectionMined += BIBLE_CHAPTER_COUNTS[book] || 0;
          }
        }
      }
      totalChaptersMined += chaptersInSectionMined;
    }
    
    setMinedPercentage(Math.min(100, Math.round((totalChaptersMined / TOTAL_BIBLE_CHAPTERS) * 100)));
  }, [storeName]);

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = await getQuestionsSortedByLastSeen(storeName);
      setQuestions(q || []);
      await calculateMiningPercentage();
    } catch (error) {
      console.error("Failed to load questions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [storeName, calculateMiningPercentage]);

  const groupedQuestions = useMemo(() => {
    const groups: Record<string, BibleQuestion[]> = {};
    
    questions.forEach(q => {
      const sectionId = q.sectionId || 'other';
      if (!groups[sectionId]) groups[sectionId] = [];
      groups[sectionId].push(q);
    });
    
    Object.keys(groups).forEach(sectionId => {
      groups[sectionId].sort((a, b) => {
        const bookA = BIBLE_BOOKS.indexOf(a.book);
        const bookB = BIBLE_BOOKS.indexOf(b.book);
        if (bookA !== bookB) return bookA - bookB;
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return (a.verse || 0) - (b.verse || 0);
      });
    });
    
    return groups;
  }, [questions]);

  useEffect(() => {
    if (isOpen) {
      loadQuestions();
    }
  }, [isOpen, loadQuestions]);

  const handleGenerateMore = async () => {
    if (storeName === WITS_STORE) {
      setGenerationMessage("Generate in Wits & Wagers Lobby");
      setTimeout(() => setGenerationMessage(null), 3000);
      return;
    }
    setIsGenerating(true);
    setGenerationMessage("Starting generation...");
    try {
      const currentProgress = await getBibleProgress();
      const sectionsProgress = { ...(currentProgress.sections || {}) };
      let totalNew = 0;
      let anyNew = false;

      // Find first section that needs questions
      for (const section of BIBLE_SECTIONS) {
        const sectionStored = await getQuestionsBySection(section.id);
        const unseenCount = sectionStored.filter(q => q.lastSeen === 0).length;
        
        if (unseenCount < 100) {
          setGenerationMessage(`Generating for ${section.name}...`);
          const prog = sectionsProgress[section.id] || { 
            currentBook: section.startBook, 
            currentChapter: section.startChapter, 
            currentVerse: section.startVerse 
          };
          
          try {
            const { questions: newQuestions, nextBook, nextChapter, nextVerse } = 
              await generateBibleQuestionsBatch(section.id, prog.currentBook, prog.currentChapter, prog.currentVerse);
            
            if (newQuestions.length > 0) {
              await saveQuestions(newQuestions, JEOPARDY_STORE);
              sectionsProgress[section.id] = { 
                currentBook: nextBook, 
                currentChapter: nextChapter, 
                currentVerse: nextVerse 
              };
              totalNew = newQuestions.length;
              anyNew = true;
              // Break after one section to keep it fast
              break;
            }
          } catch (e) {
            console.error(`Failed to generate for section ${section.id}:`, e);
          }
        }
      }
      
      if (anyNew) {
        await updateBibleProgress(sectionsProgress);
        setGenerationMessage(`Success! Added ${totalNew} questions.`);
        setTimeout(() => setGenerationMessage(null), 3000);
      } else {
        setGenerationMessage("Bank is already well-stocked!");
        setTimeout(() => setGenerationMessage(null), 3000);
      }
      await loadQuestions();
    } catch (error) {
      console.error("Failed to generate more questions:", error);
      setGenerationMessage("Generation failed. Check console.");
      setTimeout(() => setGenerationMessage(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteSingle = async (id: number) => {
    await deleteQuestion(id, storeName);
    loadQuestions();
  };

  const handleDeleteSelected = async () => {
    await deleteQuestions(Array.from(selectedIds), storeName);
    setSelectedIds(new Set());
    loadQuestions();
  };

  const handleDeleteAll = async () => {
    await deleteAllQuestions(storeName);
    setShowClearConfirm(false);
    loadQuestions();
  };

  const handleResetProgress = async () => {
    await resetBibleProgress();
    setShowResetConfirm(false);
  };

  const handleResetBank = async () => {
    if (storeName === WITS_STORE) {
      await resetWitsAndWagersBank();
    } else {
      await deleteAllQuestions(JEOPARDY_STORE);
      await resetBibleProgress();
    }
    setShowResetBankConfirm(false);
    loadQuestions();
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const qList = questions || [];
    if (selectedIds.size === qList.length && qList.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(qList.map(q => q.id!)));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-slate-950 flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-slate-900 border border-white/10 w-full max-w-2xl h-[80vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                  {storeName === JEOPARDY_STORE ? "Trivia Tower Bank" : "Wits & Wagers Bank"}
                </h2>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{(questions || []).length} Questions Stored</p>
                  <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">{minedPercentage}% Mined</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 bg-slate-800/30 border-b border-white/5 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2">
                <button 
                  onClick={selectAll}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-white/5"
                >
                  {(selectedIds.size === (questions || []).length && (questions || []).length > 0) ? "Deselect All" : "Select All"}
                </button>
                {selectedIds.size > 0 && (
                  <button 
                    onClick={handleDeleteSelected}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-rose-500/20 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Delete ({selectedIds.size})
                  </button>
                )}
                {storeName === JEOPARDY_STORE && (
                  <button 
                    onClick={handleGenerateMore}
                    disabled={isGenerating}
                    className={cn(
                      "px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-orange-500/20 flex items-center gap-1 min-w-[140px] justify-center",
                      isGenerating && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isGenerating ? (
                      <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles size={12} />
                    )}
                    {generationMessage || (isGenerating ? "Generating..." : "Generate More")}
                  </button>
                )}
                {storeName === JEOPARDY_STORE && (
                  <button 
                    onClick={() => setShowResetConfirm(true)}
                    className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-blue-500/20 flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Reset Progress
                  </button>
                )}
                <button 
                  onClick={() => setShowResetBankConfirm(true)}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-amber-500/20 flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Reset Bank
                </button>
              </div>
              <button 
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors shadow-lg shadow-rose-600/20"
              >
                Clear All
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (questions || []).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Database size={48} className="text-white/10 mb-4" />
                  <p className="text-white/30 font-bold uppercase tracking-widest text-sm">No questions stored yet</p>
                </div>
              ) : (
                BIBLE_SECTIONS.map(section => {
                  const sectionQuestions = groupedQuestions[section.id];
                  if (!sectionQuestions || sectionQuestions.length === 0) return null;
                  
                  return (
                    <div key={section.id} className="space-y-4">
                      <div className="flex items-center gap-3 sticky top-0 z-[5] bg-slate-900/90 py-2 backdrop-blur-sm">
                        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: section.color }} />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic">{section.name}</h3>
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                          {sectionQuestions.length} Questions
                        </span>
                      </div>
                      <div className="grid gap-3">
                        {sectionQuestions.map((q) => (
                          <div 
                            key={q.id} 
                            className={cn(
                              "p-4 rounded-2xl border transition-all flex items-start gap-4 group",
                              selectedIds.has(q.id!) 
                                ? "bg-blue-500/10 border-blue-500/30" 
                                : "bg-white/5 border-white/5 hover:border-white/10"
                            )}
                          >
                            <button 
                              onClick={() => toggleSelect(q.id!)}
                              className={cn(
                                "mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0",
                                selectedIds.has(q.id!) 
                                  ? "bg-blue-500 border-blue-500 text-white" 
                                  : "border-white/20 hover:border-white/40"
                              )}
                            >
                              {selectedIds.has(q.id!) && <Check size={14} />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">{q.book} {q.chapter}:{q.verse}</span>
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{q.era}</span>
                              </div>
                              <p className="text-white font-medium text-sm leading-tight mb-2">{q.text}</p>
                              <div className="flex flex-wrap gap-1">
                                {q.options?.map((opt, i) => (
                                  <span 
                                    key={i} 
                                    className={cn(
                                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest",
                                      opt === q.correctAnswer ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/30"
                                    )}
                                  >
                                    {opt}
                                  </span>
                                ))}
                                {!q.options && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400">
                                    Answer: {q.answer}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteSingle(q.id!)}
                              className="p-2 text-white/20 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 shrink-0"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
              {groupedQuestions['other'] && groupedQuestions['other'].length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 sticky top-0 z-[5] bg-slate-900/90 py-2 backdrop-blur-sm">
                    <div className="w-1 h-6 rounded-full bg-slate-500" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Other / Uncategorized</h3>
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                      {groupedQuestions['other'].length} Questions
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {groupedQuestions['other'].map((q) => (
                      <div 
                        key={q.id} 
                        className={cn(
                          "p-4 rounded-2xl border transition-all flex items-start gap-4 group",
                          selectedIds.has(q.id!) 
                            ? "bg-blue-500/10 border-blue-500/30" 
                            : "bg-white/5 border-white/5 hover:border-white/10"
                        )}
                      >
                        <button 
                          onClick={() => toggleSelect(q.id!)}
                          className={cn(
                            "mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0",
                            selectedIds.has(q.id!) 
                              ? "bg-blue-500 border-blue-500 text-white" 
                              : "border-white/20 hover:border-white/40"
                          )}
                        >
                          {selectedIds.has(q.id!) && <Check size={14} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">{q.book} {q.chapter}:{q.verse}</span>
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{q.era}</span>
                          </div>
                          <p className="text-white font-medium text-sm leading-tight mb-2">{q.text}</p>
                          <div className="flex flex-wrap gap-1">
                            {q.options?.map((opt, i) => (
                              <span 
                                key={i} 
                                className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest",
                                  opt === q.correctAnswer ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/30"
                                )}
                              >
                                {opt}
                              </span>
                            ))}
                            {!q.options && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400">
                                Answer: {q.answer}
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteSingle(q.id!)}
                          className="p-2 text-white/20 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-900/80 backdrop-blur-md border-t border-white/10">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-transform"
              >
                DONE
              </button>
            </div>

            {showClearConfirm && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[120] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <div className="bg-slate-900 border border-white/10 p-8 rounded-[2rem] max-w-xs w-full text-center shadow-2xl">
                  <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-500">
                    <Trash2 size={32} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic mb-2">Clear Bank?</h3>
                  <p className="text-white/50 text-sm mb-8">This will permanently delete all stored questions.</p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleDeleteAll}
                      className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-95 transition-transform"
                    >
                      YES, CLEAR ALL
                    </button>
                    <button 
                      onClick={() => setShowClearConfirm(false)}
                      className="w-full py-3 text-white/40 font-bold uppercase tracking-widest text-xs"
                    >
                      Cancel
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
                className="absolute inset-0 z-[120] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <div className="bg-slate-900 border border-white/10 p-8 rounded-[2rem] max-w-xs w-full text-center shadow-2xl">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-500">
                    <RotateCcw size={32} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic mb-2">Reset Progress?</h3>
                  <p className="text-white/50 text-sm mb-8 leading-tight">This will set your Bible generation progress back to Genesis 1. Your current questions will remain.</p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleResetProgress}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-transform"
                    >
                      YES, RESET TO GEN 1
                    </button>
                    <button 
                      onClick={() => setShowResetConfirm(false)}
                      className="w-full py-3 text-white/40 font-bold uppercase tracking-widest text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {showResetBankConfirm && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[120] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <div className="bg-slate-900 border border-white/10 p-8 rounded-[2rem] max-w-xs w-full text-center shadow-2xl">
                  <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500">
                    <RefreshCw size={32} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic mb-2">Reset Bank?</h3>
                  <p className="text-white/50 text-sm mb-8 leading-tight">This will clear all questions and reset the generation pointer to Genesis 1.</p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleResetBank}
                      className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-amber-600/20 active:scale-95 transition-transform"
                    >
                      YES, RESET BANK
                    </button>
                    <button 
                      onClick={() => setShowResetBankConfirm(false)}
                      className="w-full py-3 text-white/40 font-bold uppercase tracking-widest text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SettingsOverlay = memo(({ isOpen, onClose, volume, setVolume, isMusicEnabled, setIsMusicEnabled, selectedMusicStyle, setSelectedMusicStyle, onOpenBank, onOpenWitsBank, onRepair, downloadProgress }: any) => {
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
    <>
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
    </>
  );
});

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
const StarTowerSelectionOverlay = ({ 
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

const VerseSetOverlay = ({ isOpen, onClose, onUpdate }: { isOpen: boolean, onClose: () => void, onUpdate: () => void }) => {
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

// --- Bible Study Overlay ---
const BibleStudyOverlay = ({ reference, questionText, onDelete, onClose }: { reference: string, questionText?: string, onDelete?: () => void, onClose: () => void }) => {
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

const TriviaHUD = memo(({ score, streak, isPaused, setIsPaused, lastUpdateRef, setIsSettingsOpen, lives, deed, reference, book, chapter, progress, lastSeen, onStudy, onHint, canHint, sectionId, themeColor }: any) => {
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

const MathHUD = memo(({ score, streak, isPaused, setIsPaused, lastUpdateRef, setIsSettingsOpen, lives }: any) => {
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

const HUD = memo(({ score, streak, isPaused, setIsPaused, lastUpdateRef, gameMode, dictStatus, currentVerse, setIsSettingsOpen }: any) => {
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

const getLongestWords = (text: string, count: number = 4) => {
  const cleanText = text
    .replace(/\{[^{}]*:[^{}]*\}/g, '') // Remove commentary markers
    .replace(/[\{\}\[\]\(\)]/g, '')     // Remove brackets/braces
    .replace(/[^\w\s]|_/g, "")         // Remove all other punctuation
    .replace(/\s+/g, " ")              // Normalize whitespace
    .trim();
  const words = cleanText.split(/\s+/);
  return words
    .sort((a, b) => b.length - a.length)
    .slice(0, count)
    .join(" ");
};

const TowerBlock = memo(({ word, height, bottom, color, isPlatform, reference, questionText, onBlockClick }: any) => {
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

const TowerStack = memo(({ stack, onBlockClick }: { stack: any[], onBlockClick?: (ref: string, word: string, qText?: string) => void }) => {
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

type Difficulty = 'easy' | 'medium' | 'hard' | 'advanced' | 'master' | 'extreme';
type ReferenceTowerDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';

const BibleTriviaTowerGame = ({ 
  onComplete, 
  onMistake, 
  onExit, 
  isOutOfHearts,
  volume,
  setVolume,
  isMusicEnabled,
  setIsMusicEnabled,
  selectedMusicStyle,
  setSelectedMusicStyle,
  musicStatus,
  setMusicStatus,
  setIsQuestionBankOpen,
  setBankStore,
  downloadProgress
}: { 
  onComplete: (xp: number) => void, 
  onMistake: () => void, 
  onExit: () => void, 
  isOutOfHearts: boolean,
  volume: number,
  setVolume: (v: number) => void,
  isMusicEnabled: boolean,
  setIsMusicEnabled: (v: boolean) => void,
  selectedMusicStyle: string,
  setSelectedMusicStyle: (v: string) => void,
  musicStatus: string,
  setMusicStatus: (v: string) => void,
  setIsQuestionBankOpen: (v: boolean) => void,
  setBankStore: (store: string) => void,
  downloadProgress: number | null
}) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showStart, setShowStart] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isRedAlert, setIsRedAlert] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStudyOpen, setIsStudyOpen] = useState(false);
  const [studyReference, setStudyReference] = useState("");
  const [studyQuestionText, setStudyQuestionText] = useState<string | undefined>(undefined);
  const [isComboActive, setIsComboActive] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [lastPoints, setLastPoints] = useState(0);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  
  const [currentQuestion, setCurrentQuestion] = useState<BibleQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<BibleProgress | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [questionsInCurrentSection, setQuestionsInCurrentSection] = useState(0);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  const questionCounterRef = useRef(0);
  const lastCorrectTimesRef = useRef<number[]>([]);

  const getNextQuestion = useCallback(async (sectionIdx: number, qInSec: number) => {
    const section = BIBLE_SECTIONS[sectionIdx];
    const stored = await getQuestionsBySection(section.id);
    
    if (stored.length === 0) return null;

    // Mastery threshold: 12 consecutive correct answers
    const MASTERY_THRESHOLD = 12;
    
    const unseen = stored.filter(q => q.lastSeen === 0);
    const reviewPool = stored.filter(q => 
      q.lastSeen > 0 && 
      (q.consecutiveCorrect || 0) < MASTERY_THRESHOLD
    ).sort((a, b) => a.lastSeen - b.lastSeen);
    
    // Cold Start: If review pool < 8, serve 100% New
    if (reviewPool.length < 8) {
      if (unseen.length > 0) return unseen[0];
      if (reviewPool.length > 0) return reviewPool[0];
      return stored.sort((a, b) => a.lastSeen - b.lastSeen)[0];
    }

    // 80/20 Interleaved Cycle (4 Review, 1 New)
    if (qInSec < 4) {
      if (reviewPool.length > 0) return reviewPool[0];
      if (unseen.length > 0) return unseen[0];
    } else {
      if (unseen.length > 0) return unseen[0];
      if (reviewPool.length > 0) return reviewPool[0];
    }
    
    return stored.sort((a, b) => a.lastSeen - b.lastSeen)[0] || null;
  }, []);

  const [towerData, setTowerData] = useState<{
    stack: {id: number, word: string, height: number, color: string, isPlatform?: boolean}[]
  }>({ 
    stack: [{ id: -1, word: "", height: 100, color: '#1e293b', isPlatform: true }] 
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const towerContainerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUpdateRef = useRef(performance.now());
  const lastTapTimeRef = useRef(Date.now());
  const nextIdRef = useRef(0);
  
  const platformYRef = useRef(DANGER_LINE_PX);
  const towerHeightRef = useRef(100);
  const cameraYRef = useRef(0);
  const sinkRateRef = useRef(8);
  const isRedAlertRef = useRef(false);
  
  const [containerHeight, setContainerHeight] = useState(() => typeof window !== 'undefined' ? window.innerHeight : 800);
  const containerHeightRef = useRef(containerHeight);

  // Load questions from IndexedDB on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await initBibleQuestionDB();
        const currentProgress = await getBibleProgress();
        setProgress(currentProgress);
        
        const startSecIdx = currentProgress.lastSectionIndex || 0;
        const startQIdx = currentProgress.lastQuestionInCurrentSection || 0;
        
        setCurrentSectionIndex(startSecIdx);
        setQuestionsInCurrentSection(startQIdx);
        
        let firstQuestion = await getNextQuestion(startSecIdx, startQIdx);
        
        // If current section is empty, try to find ANY section with questions
        if (!firstQuestion) {
          for (let i = 0; i < BIBLE_SECTIONS.length; i++) {
            const idx = (startSecIdx + i) % BIBLE_SECTIONS.length;
            const q = await getNextQuestion(idx, 0);
            if (q) {
              firstQuestion = q;
              setCurrentSectionIndex(idx);
              setQuestionsInCurrentSection(0);
              break;
            }
          }
        }

        if (firstQuestion) {
          setCurrentQuestion(firstQuestion);
          setIsLoading(false);
          lastTapTimeRef.current = Date.now();
          
          // Background fetch
          fetchNewBatch();
        } else {
          // Truly no questions anywhere, must fetch
          await fetchNewBatch();
          lastTapTimeRef.current = Date.now();
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    };
    loadInitialData();
  }, []);

  // Initialize AudioContext on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const playSound = useCallback((freq: number, type: OscillatorType, dur: number, vol: number = 0.2, noSweep: boolean = false) => {
    if (!audioCtxRef.current || isPaused || isStudyOpen) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    if (!noSweep) {
      if (freq > 500) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, ctx.currentTime + dur);
      } else if (freq < 300 && freq > 0) {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, ctx.currentTime + dur);
      }
    }

    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(vol * volume, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    
    osc.connect(g);
    g.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }, [isPaused, volume]);

  const playCorrectSound = () => playSound(880, 'sine', 0.1);
  const playIncorrectSound = () => playSound(220, 'sawtooth', 0.2);

  // Music is now universal

  useEffect(() => {
    if (showStart || isGameOver || isPaused || isLoading || isStudyOpen) return;
    
    let active = true;
    const tick = () => {
      if (!active || isStudyOpen) return;
      
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastUpdateRef.current) / 1000); 
      lastUpdateRef.current = now;

      platformYRef.current -= sinkRateRef.current * dt;
      
      const topOfTower = platformYRef.current + towerHeightRef.current;
      const targetCameraY = Math.max(0, topOfTower - containerHeightRef.current * 0.6); 
      
      if (targetCameraY > cameraYRef.current) {
        const followSpeed = 4.0; 
        cameraYRef.current += (targetCameraY - cameraYRef.current) * (1 - Math.exp(-followSpeed * dt));
      } else {
        const followSpeed = 0.05; 
        cameraYRef.current += (targetCameraY - cameraYRef.current) * (1 - Math.exp(-followSpeed * dt));
      }

      const visualTop = topOfTower - cameraYRef.current;
      if (visualTop > containerHeightRef.current * 0.85) {
        cameraYRef.current = topOfTower - containerHeightRef.current * 0.85;
      }

      const redAlertActive = visualTop < containerHeightRef.current * 0.25;

      if (visualTop <= DANGER_LINE_PX) {
        setIsGameOver(true);
        platformYRef.current = cameraYRef.current + DANGER_LINE_PX - towerHeightRef.current;
        return; 
      }

      if (Number.isFinite(platformYRef.current) && towerContainerRef.current) {
        const visualY = platformYRef.current - cameraYRef.current;
        towerContainerRef.current.style.transform = `translate3d(0, ${-visualY}px, 0)`;
      }

      if (redAlertActive !== isRedAlertRef.current) {
        isRedAlertRef.current = redAlertActive;
        setIsRedAlert(redAlertActive);
        
        if (towerContainerRef.current) {
          if (redAlertActive) {
            towerContainerRef.current.classList.add('red-alert-pulse');
          } else {
            towerContainerRef.current.classList.remove('red-alert-pulse');
          }
        }
      }

      sinkRateRef.current += 0.2 * dt; 

      requestAnimationFrame(tick);
    };

    lastUpdateRef.current = performance.now();
    const animId = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(animId);
    };
  }, [showStart, isGameOver, isPaused, isLoading, isStudyOpen]);

  const fetchNewBatch = async () => {
    const now = Date.now();
    // Cooldown of 5 seconds between fetch attempts
    if (now - lastFetchTimeRef.current < 5000) return;
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    try {
      const currentProgress = await getBibleProgress();
      const sectionsProgress = { ...(currentProgress.sections || {}) };
      let anyNew = false;
      let sectionsFetched = 0;
      
      // Prioritize current section and the next one
      const prioritizedSections = [
        BIBLE_SECTIONS[currentSectionIndex],
        BIBLE_SECTIONS[(currentSectionIndex + 1) % BIBLE_SECTIONS.length],
        ...BIBLE_SECTIONS.filter((_, i) => i !== currentSectionIndex && i !== (currentSectionIndex + 1) % BIBLE_SECTIONS.length)
      ].filter(Boolean);

      for (const section of prioritizedSections) {
        // Limit background fetches per call to avoid hitting rate limits
        if (sectionsFetched >= 1) break;

        const sectionStored = await getQuestionsBySection(section.id);
        const unseenCount = sectionStored.filter(q => q.lastSeen === 0).length;
        
        // Background fetch threshold: only fetch if this section is low on unseen questions
        if (unseenCount < 10) {
          const prog = sectionsProgress[section.id] || { 
            currentBook: section.startBook, 
            currentChapter: section.startChapter, 
            currentVerse: section.startVerse 
          };
          
          try {
            const { questions: newQuestions, nextBook, nextChapter, nextVerse } = 
              await generateBibleQuestionsBatch(section.id, prog.currentBook, prog.currentChapter, prog.currentVerse);
            
            if (newQuestions.length > 0) {
              await saveQuestions(newQuestions);
              sectionsProgress[section.id] = { 
                currentBook: nextBook, 
                currentChapter: nextChapter, 
                currentVerse: nextVerse 
              };
              anyNew = true;
              sectionsFetched++;
            }
          } catch (e) {
            console.error(`Background generation failed for section ${section.id}:`, e);
          }
        }
      }
      
      if (anyNew) {
        await updateBibleProgress(sectionsProgress, currentSectionIndex, questionsInCurrentSection);
        const updatedProgress = await getBibleProgress();
        setProgress(updatedProgress);
      }
      
      if (isLoading || !currentQuestion) {
        const firstQuestion = await getNextQuestion(currentSectionIndex, questionsInCurrentSection);
        if (firstQuestion) {
          setCurrentQuestion(firstQuestion);
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch new batch:", error);
      setIsLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  };

  const handleHint = () => {
    if (isGameOver || showStart || isPaused || !currentQuestion) return;
    if (hiddenOptions.length >= currentQuestion.options.length - 1) return;

    const wrongIndices = currentQuestion.options
      .map((opt, idx) => opt !== currentQuestion.correctAnswer ? idx : -1)
      .filter(idx => idx !== -1 && !hiddenOptions.includes(idx));

    if (wrongIndices.length > 0) {
      const randomIndex = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
      setHiddenOptions(prev => [...prev, randomIndex]);
      setHintsUsed(prev => prev + 1);
      playSound(440, 'sine', 0.1, 0.1, true);
    }
  };

  const handleDeleteCurrentQuestion = async () => {
    if (!currentQuestion) return;
    const id = currentQuestion.id;
    if (id !== undefined) {
      await deleteQuestion(id);
      const nextQ = await getNextQuestion(currentSectionIndex, questionsInCurrentSection);
      if (nextQ) {
        setCurrentQuestion(nextQ);
      } else {
        // Current section is dry, try to find another one before fetching
        let foundFallback = false;
        for (let i = 1; i < BIBLE_SECTIONS.length; i++) {
          const idx = (currentSectionIndex + i) % BIBLE_SECTIONS.length;
          const fallbackQ = await getNextQuestion(idx, 0);
          if (fallbackQ) {
            setCurrentQuestion(fallbackQ);
            setCurrentSectionIndex(idx);
            setQuestionsInCurrentSection(0);
            foundFallback = true;
            break;
          }
        }
        
        if (!foundFallback) {
          await fetchNewBatch();
        }
      }
      setIsStudyOpen(false);
    }
  };

  const [gameMode, setGameMode] = useState<'trivia' | 'reference' | 'memory' | 'fourWords'>('trivia');
  const [referenceDifficulty, setReferenceDifficulty] = useState<ReferenceTowerDifficulty>('easy');
  const [allVerses, setAllVerses] = useState<Verse[]>([]);
  const [currentReferenceQuestion, setCurrentReferenceQuestion] = useState<{verse: Verse, options: string[], correctRef: string} | null>(null);

  useEffect(() => {
    if (gameMode === 'reference' || gameMode === 'memory' || gameMode === 'fourWords') {
      getBibleVerses().then(setAllVerses);
    }
  }, [gameMode]);

  const generateReferenceQuestion = useCallback(() => {
    if (allVerses.length === 0) return;

    // Filter for prominent verses if in 4 Words or Reference mode
    const prominentVerses = allVerses.filter(v => {
      const ref = `${v.book} ${v.chapter}:${v.verse}`;
      return PROMINENT_REFERENCES.includes(ref);
    });

    const pool = prominentVerses.length > 0 ? prominentVerses : allVerses;
    const targetIdx = Math.floor(Math.random() * pool.length);
    const targetVerse = pool[targetIdx];
    const correctRef = `${targetVerse.book} ${targetVerse.chapter}:${targetVerse.verse}`;
    
    const distractors: string[] = [];
    const maxDistractors = 3;
    
    let range = 0;
    if (referenceDifficulty === 'medium') range = 2000;
    if (referenceDifficulty === 'hard') range = 1000;
    if (referenceDifficulty === 'extreme') range = 500;

    while (distractors.length < maxDistractors) {
      let dIdx: number;
      if (referenceDifficulty === 'easy') {
        dIdx = Math.floor(Math.random() * allVerses.length);
      } else {
        const offset = Math.floor(Math.random() * (range * 2)) - range;
        dIdx = (targetIdx + offset + allVerses.length) % allVerses.length;
      }

      const dVerse = allVerses[dIdx];
      const dRef = `${dVerse.book} ${dVerse.chapter}:${dVerse.verse}`;
      
      if (dRef !== correctRef && !distractors.includes(dRef)) {
        distractors.push(dRef);
      }
    }

    setCurrentReferenceQuestion({
      verse: targetVerse,
      correctRef,
      options: [...distractors, correctRef].sort(() => Math.random() - 0.5)
    });
    lastTapTimeRef.current = Date.now();
  }, [allVerses, referenceDifficulty]);

  useEffect(() => {
    if ((gameMode === 'reference' || gameMode === 'fourWords') && allVerses.length > 0 && !currentReferenceQuestion) {
      generateReferenceQuestion();
    }
  }, [gameMode, allVerses, currentReferenceQuestion, generateReferenceQuestion]);

  const handleChoice = async (choice: string) => {
    if (isGameOver || showStart || isPaused || (gameMode === 'trivia' && !currentQuestion) || ((gameMode === 'reference' || gameMode === 'fourWords') && !currentReferenceQuestion)) return;
    const now = Date.now();
    const timeDelta = now - lastTapTimeRef.current;

    let isCorrect = false;
    if (gameMode === 'trivia' && currentQuestion) {
      isCorrect = choice.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim() === currentQuestion.correctAnswer.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
    } else if ((gameMode === 'reference' || gameMode === 'fourWords') && currentReferenceQuestion) {
      isCorrect = choice === currentReferenceQuestion.correctRef;
    }

    if (isCorrect) {
      lastTapTimeRef.current = now;
      playCorrectSound();
      
      if (gameMode === 'trivia' && currentQuestion?.id) {
        await updateQuestionLastSeen(currentQuestion.id, true);
      }

      const currentTime = Date.now();
      lastCorrectTimesRef.current = [...lastCorrectTimesRef.current, currentTime].filter(t => currentTime - t < 10000);
      const isCombo = lastCorrectTimesRef.current.length >= 5;
      setIsComboActive(isCombo);
      
      let points = 0;
      if (gameMode === 'reference' || gameMode === 'fourWords') {
        points = Math.max(1, 4 - hiddenOptions.length);
      } else if (hintsUsed > 0 || hiddenOptions.length > 0) {
        points = 0;
      } else {
        const basePoints = 10;
        const speedBonus = Math.max(0, 20 - Math.floor(timeDelta / 200));
        const multiplier = isCombo ? 2 : 1;
        points = (basePoints + speedBonus) * multiplier;
      }
      
      setScore(prev => prev + points);
      setLastPoints(points);
      setStreak(prev => prev + 1);
      
      setHintsUsed(0);
      setHiddenOptions([]);
      
      const newConsecutive = consecutiveCorrect + 1;
      const streakThreshold = (gameMode === 'reference' || gameMode === 'fourWords') ? 5 : 3;
      if (newConsecutive >= streakThreshold) {
        setLives(l => Math.min(3, l + 1));
        setConsecutiveCorrect(0);
      } else {
        setConsecutiveCorrect(newConsecutive);
      }

      const height = containerHeight * 0.20; 
      
      towerHeightRef.current += height;
      
      if (gameMode === 'trivia' && currentQuestion) {
        const section = BIBLE_SECTIONS.find(s => s.id === currentQuestion.sectionId);
        setTowerData(prev => ({
          stack: [
            ...prev.stack,
            {
              id: nextIdRef.current++,
              word: currentQuestion.correctAnswer.replace(/[^\w\s:]|_/g, "").replace(/\s+/g, " ").trim(),
              height,
              color: isCombo ? '#fbbf24' : (section?.color || '#3b82f6'),
              reference: currentQuestion.reference.replace(/[^\w\s:]|_/g, "").replace(/\s+/g, " ").trim(),
              questionText: currentQuestion.text
            }
          ]
        }));

        let nextQInSec = questionsInCurrentSection + 1;
        let nextSecIdx = currentSectionIndex;
        if (nextQInSec >= 5) {
          nextQInSec = 0;
          nextSecIdx = (currentSectionIndex + 1) % BIBLE_SECTIONS.length;
        }
        setQuestionsInCurrentSection(nextQInSec);
        setCurrentSectionIndex(nextSecIdx);
        if (progress) {
          await updateBibleProgress(progress.sections, nextSecIdx, nextQInSec);
        }
        const nextQ = await getNextQuestion(nextSecIdx, nextQInSec);
        if (nextQ) {
          setCurrentQuestion(nextQ);
        } else {
          let foundFallback = false;
          for (let i = 1; i < BIBLE_SECTIONS.length; i++) {
            const idx = (nextSecIdx + i) % BIBLE_SECTIONS.length;
            const fallbackQ = await getNextQuestion(idx, 0);
            if (fallbackQ) {
              setCurrentQuestion(fallbackQ);
              setCurrentSectionIndex(idx);
              setQuestionsInCurrentSection(0);
              foundFallback = true;
              break;
            }
          }
          if (!foundFallback) await fetchNewBatch();
        }
        fetchNewBatch();
      } else if ((gameMode === 'reference' || gameMode === 'fourWords') && currentReferenceQuestion) {
        setTowerData(prev => ({
          stack: [
            ...prev.stack,
            {
              id: nextIdRef.current++,
              word: gameMode === 'fourWords' ? currentReferenceQuestion.verse.text : currentReferenceQuestion.correctRef,
              height,
              color: gameMode === 'fourWords' ? '#8b5cf6' : '#10b981', // purple-500 or emerald-500
              reference: currentReferenceQuestion.correctRef,
              questionText: currentReferenceQuestion.verse.text
            }
          ]
        }));
        generateReferenceQuestion();
      }

    } else {
      playIncorrectSound();
      setStreak(0);
      setConsecutiveCorrect(0);
      setIsComboActive(false);
      lastCorrectTimesRef.current = [];

      if (gameMode === 'trivia' && currentQuestion?.id) {
        await updateQuestionLastSeen(currentQuestion.id, false);
      } else if ((gameMode === 'reference' || gameMode === 'fourWords') && currentReferenceQuestion) {
        const key = `${currentReferenceQuestion.verse.book} ${currentReferenceQuestion.verse.chapter}:${currentReferenceQuestion.verse.verse}`;
        updateVerseLevel(key, 1);
        
        const choiceIdx = currentReferenceQuestion.options.indexOf(choice);
        if (choiceIdx !== -1 && !hiddenOptions.includes(choiceIdx)) {
          setHiddenOptions(prev => [...prev, choiceIdx]);
          return; // Allow user to guess again
        }
      }

      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setIsGameOver(true);
        if (gameMode === 'trivia' && progress) {
          await updateBibleProgress(progress.sections, currentSectionIndex, questionsInCurrentSection);
        }
      }
      if (gameMode === 'reference' || gameMode === 'fourWords') {
        generateReferenceQuestion();
      }
    }
  };

  const startLaunch = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Set sink rate based on difficulty
    if (gameMode === 'trivia') {
      sinkRateRef.current = 8;
    } else if (gameMode === 'reference') {
      sinkRateRef.current = referenceDifficulty === 'extreme' ? 15 : referenceDifficulty === 'hard' ? 12 : referenceDifficulty === 'medium' ? 8 : 5;
    } else {
      sinkRateRef.current = 8;
    }

    lastTapTimeRef.current = Date.now();
    setShowStart(false);
    if (dontShowAgain) {
      localStorage.setItem('hero_tutorial_dismissed', 'true');
    }
    lastUpdateRef.current = performance.now();
    
    // Start background generation when game starts
    fetchNewBatch();
  };

  if (showStart) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 bg-slate-950 text-white overflow-y-auto custom-scrollbar">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center max-w-sm py-8"
        >
          <div className={cn(
            "w-24 h-24 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-2xl transition-all",
            gameMode === 'trivia' ? "bg-orange-500 shadow-orange-500/20" : 
            gameMode === 'reference' ? "bg-emerald-500 shadow-emerald-500/20" : 
            gameMode === 'fourWords' ? "bg-purple-500 shadow-purple-500/20" :
            "bg-blue-500 shadow-blue-500/20"
          )}>
            {gameMode === 'trivia' ? <Shield size={48} className="text-white" /> : 
             gameMode === 'reference' ? <Tower size={48} className="text-white" /> : 
             gameMode === 'fourWords' ? <Quote size={48} className="text-white" /> :
             <BookOpen size={48} className="text-white" />}
          </div>
          <h2 className="text-5xl font-black mb-2 tracking-tighter italic uppercase text-white text-center">
            {gameMode === 'trivia' ? 'TRIVIA TOWER' : 
             gameMode === 'reference' ? 'REFERENCE TOWER' : 
             gameMode === 'fourWords' ? '4 WORDS TOWER' :
             'MEMORY TOWER'}
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8 text-center">
            {gameMode === 'trivia' ? 'Legendary Deeds & Heroes' : 
             gameMode === 'reference' ? 'Identify the Verse' : 
             gameMode === 'fourWords' ? 'Guess from 4 Words' :
             'Memorize the Verse'}
          </p>
          
          {/* Mode Selector */}
          <div className="flex flex-wrap gap-2 p-1 bg-slate-900 rounded-2xl border-2 border-slate-800 mb-8">
            <button 
              onClick={() => setGameMode('trivia')}
              className={cn(
                "flex-1 min-w-[80px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                gameMode === 'trivia' ? "bg-orange-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Trivia
            </button>
            <button 
              onClick={() => setGameMode('reference')}
              className={cn(
                "flex-1 min-w-[80px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                gameMode === 'reference' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Ref
            </button>
            <button 
              onClick={() => setGameMode('fourWords')}
              className={cn(
                "flex-1 min-w-[80px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                gameMode === 'fourWords' ? "bg-purple-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              4 Words
            </button>
            <button 
              onClick={() => setGameMode('memory')}
              className={cn(
                "flex-1 min-w-[80px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                gameMode === 'memory' ? "bg-blue-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Memory
            </button>
          </div>

          {/* Difficulty Selector */}
          {(gameMode === 'reference' || gameMode === 'fourWords') && (
            <div className="mb-8">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-3 text-center">Select Difficulty</p>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard', 'extreme'] as ReferenceTowerDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setReferenceDifficulty(d)}
                    className={cn(
                      "flex-1 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border-2",
                      referenceDifficulty === d 
                        ? (gameMode === 'fourWords' ? "bg-purple-500 border-purple-400 text-white shadow-lg" : "bg-emerald-500 border-emerald-400 text-white shadow-lg")
                        : "bg-slate-900 border-slate-800 text-slate-500 hover:border-emerald-500/50"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-4 mb-8 text-left bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-orange-400 font-bold">1</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-bold">
                  {gameMode === 'trivia' ? 'Identify the Deed.' : 
                   gameMode === 'reference' ? 'Identify the Verse.' : 
                   gameMode === 'fourWords' ? 'Guess from 4 Words.' :
                   'Memorize the Verse.'}
                </span> 
                {gameMode === 'trivia' ? ' A legendary deed appears. Pick the hero who did it.' : 
                 gameMode === 'reference' ? ' A Bible verse appears. Pick the correct reference.' : 
                 gameMode === 'fourWords' ? ' See the 4 longest words from a verse. Guess the reference.' :
                 ' Type the words of the verse as they fall to build the tower.'}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-blue-400 font-bold">2</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-bold">Speed = Height & Points.</span> Faster answers build a taller tower and give <span className="text-emerald-400 font-bold">BONUS POINTS</span>.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-yellow-400 font-bold">3</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-bold">Combo Fire.</span> Get 5 correct in 10 seconds for <span className="text-yellow-400 font-bold">DOUBLE SCORE</span>.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-red-400 font-bold">4</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-bold">Life Recovery.</span> Get {gameMode === 'reference' ? '5' : '3'} correct in a row to <span className="text-emerald-400 font-bold">REGAIN A LIFE</span>.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-rose-400 font-bold">5</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-bold">Stay Above the Line.</span> The tower is sinking. If the <span className="text-rose-400 font-bold underline text-[10px]">TOP</span> of your stack falls below the red laser, you collapse.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6 px-2">
            <button 
              onClick={() => setDontShowAgain(!dontShowAgain)}
              className={cn(
                "w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center",
                dontShowAgain ? "bg-emerald-500 border-emerald-500" : "border-slate-700 bg-slate-800"
              )}
            >
              {dontShowAgain && <CheckCircle2 size={16} className="text-white" />}
            </button>
            <span className="text-xs text-slate-400 font-medium">Don't show this again</span>
          </div>

          <button 
            onClick={startLaunch}
            className={cn(
              "w-full py-5 text-slate-950 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95",
              gameMode === 'trivia' ? "bg-white" : 
              gameMode === 'reference' ? "bg-emerald-500 text-white" : 
              gameMode === 'fourWords' ? "bg-purple-500 text-white" :
              "bg-blue-500 text-white"
            )}
          >
            START {gameMode === 'trivia' ? 'TRIVIA TOWER' : 
                   gameMode === 'reference' ? 'REFERENCE TOWER' : 
                   gameMode === 'fourWords' ? '4 WORDS TOWER' :
                   'MEMORY TOWER'}
          </button>
        </motion.div>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-6 bg-slate-950 rounded-3xl shadow-xl border-2 border-slate-800 h-full text-white overflow-y-auto">
        <div className="text-center w-full">
          <h3 className="text-4xl font-black text-rose-500 mb-4 italic tracking-tighter">COLLAPSED</h3>
          <div className="flex justify-around items-center mb-6">
            <div className="text-center">
              <div className="text-5xl font-black text-white tracking-tighter">{score}</div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.1em] text-[10px]">Points Earned</p>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-5xl font-black text-emerald-400 tracking-tighter">+{score}</div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.1em] text-[10px]">XP Earned</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => onComplete(score)}
          className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
        >
          COLLECT XP
        </button>
      </div>
    );
  }

  if (gameMode === 'memory' && !showStart) {
    return (
      <EndlessBlitzGame 
        allVerses={allVerses}
        onComplete={onComplete}
        onMistake={onMistake}
        onExit={() => setShowStart(true)}
        volume={volume}
        setVolume={setVolume}
        isMusicEnabled={isMusicEnabled}
        setIsMusicEnabled={setIsMusicEnabled}
        musicStatus={musicStatus}
        setMusicStatus={setMusicStatus}
        setIsQuestionBankOpen={setIsQuestionBankOpen}
        setBankStore={setBankStore}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col transition-transform duration-75 h-full overflow-hidden">
      <TriviaHUD 
        score={score}
        streak={streak}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        lastUpdateRef={lastUpdateRef}
        setIsSettingsOpen={setIsSettingsOpen}
        lives={lives}
        deed={gameMode === 'trivia' 
          ? (currentQuestion?.text || "Loading...")
            .replace(/\{[^{}]*:[^{}]*\}/g, '')
            .replace(/[\{\}\[\]\(\)]/g, '')
            .replace(/[^\w\s]|_/g, "")
            .replace(/\s+/g, " ")
            .trim()
          : gameMode === 'fourWords'
            ? (currentReferenceQuestion ? getLongestWords(currentReferenceQuestion.verse.text) : "Loading...")
            : (currentReferenceQuestion?.verse.text || "Loading...")}
        reference={gameMode === 'trivia' ? currentQuestion?.reference?.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim() : currentReferenceQuestion?.correctRef}
        book={gameMode === 'trivia' ? currentQuestion?.book : currentReferenceQuestion?.verse.book}
        chapter={gameMode === 'trivia' ? currentQuestion?.chapter : currentReferenceQuestion?.verse.chapter}
        progress={progress}
        lastSeen={gameMode === 'trivia' ? currentQuestion?.lastSeen : undefined}
        sectionId={gameMode === 'trivia' ? currentQuestion?.sectionId : undefined}
        onStudy={() => {
          if (gameMode === 'trivia' && currentQuestion?.reference) {
            setStudyReference(currentQuestion.reference);
            setStudyQuestionText(currentQuestion.text);
            setIsStudyOpen(true);
            setHintsUsed(prev => prev + 1);
          } else if ((gameMode === 'reference' || gameMode === 'fourWords') && currentReferenceQuestion) {
            setStudyReference(currentReferenceQuestion.correctRef);
            setStudyQuestionText(currentReferenceQuestion.verse.text);
            setIsStudyOpen(true);
          }
        }}
        onHint={gameMode === 'trivia' ? handleHint : undefined}
        canHint={gameMode === 'trivia' && currentQuestion && hiddenOptions.length < currentQuestion.options.length - 1}
        themeColor={gameMode === 'reference' ? '#10b981' : gameMode === 'fourWords' ? '#8b5cf6' : gameMode === 'memory' ? '#3b82f6' : '#f97316'}
      />

      <SettingsOverlay 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        volume={volume}
        setVolume={setVolume}
        isMusicEnabled={isMusicEnabled}
        setIsMusicEnabled={setIsMusicEnabled}
        selectedMusicStyle={selectedMusicStyle}
        setSelectedMusicStyle={setSelectedMusicStyle}
        musicStatus={musicStatus}
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
      />

      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <AnimatePresence>
          {isPaused && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="text-center">
                <h2 className="text-5xl font-black text-white mb-8 tracking-tighter italic">PAUSED</h2>
                <button 
                  onClick={() => {
                    lastUpdateRef.current = performance.now();
                    setIsPaused(false);
                  }}
                  className="px-12 py-4 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-2xl active:scale-95 transition-transform"
                >
                  RESUME
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          ref={towerContainerRef}
          className="absolute inset-0 pointer-events-none z-10 will-change-transform"
        >
          <TowerStack 
            stack={towerData.stack} 
            onBlockClick={(reference, word, qText) => {
              setStudyReference(reference);
              setStudyQuestionText(qText);
              setIsStudyOpen(true);
            }}
          />
        </div>

        <div 
          className={cn(
            "absolute left-0 right-0 h-1 bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1),0_0_40px_rgba(244,63,94,0.6)] z-50 flex items-center justify-center transition-all",
            isRedAlert && "danger-line-pulse bg-rose-400"
          )}
          style={{ bottom: `${DANGER_LINE_PX}px` }}
        />
      </div>

      <div className={cn(
        "h-[120px] bg-slate-950/80 backdrop-blur-md z-40 border-t border-white/10 p-4 transition-all duration-300",
        (isPaused || isStudyOpen) && "blur-2xl pointer-events-none opacity-50"
      )}>
        <div className="grid grid-cols-2 gap-3 h-full">
          {isLoading ? (
            <div className="col-span-2 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (gameMode === 'trivia' ? !currentQuestion : !currentReferenceQuestion) ? (
            <div className="col-span-2 flex items-center justify-center">
              <div className={cn("w-8 h-8 border-4 border-t-transparent rounded-full animate-spin", gameMode === 'trivia' ? "border-orange-500" : (gameMode === 'fourWords' ? "border-purple-500" : "border-emerald-500"))} />
            </div>
          ) : (gameMode === 'trivia' ? currentQuestion!.options : currentReferenceQuestion!.options).map((opt, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleChoice(opt)}
              disabled={hiddenOptions.includes(idx)}
              className={cn(
                "h-full rounded-2xl border-2 flex items-center justify-center text-base sm:text-xl font-black tracking-tighter transition-all px-2 text-center leading-tight",
                hiddenOptions.includes(idx) 
                  ? "opacity-0 pointer-events-none" 
                  : "bg-slate-900 border-slate-800 text-white hover:border-orange-500/50",
                gameMode === 'reference' && "hover:border-emerald-500/50",
                gameMode === 'fourWords' && "hover:border-purple-500/50"
              )}
            >
              {opt.replace(/[^\w\s:]|_/g, "").replace(/\s+/g, " ").trim()}
            </motion.button>
          ))}
        </div>
      </div>
      
      {isComboActive && (
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[70]"
        >
          <div className="text-6xl font-black text-yellow-400 italic tracking-tighter drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]">
            COMBO FIRE!
          </div>
        </motion.div>
      )}

      {/* Verse Overlays */}
      <AnimatePresence>
        {isStudyOpen && (
          <BibleStudyOverlay 
            reference={studyReference}
            questionText={studyQuestionText}
            onDelete={handleDeleteCurrentQuestion}
            onClose={() => {
              lastUpdateRef.current = performance.now();
              setIsStudyOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Boggle Logic ---

const generateBoggleGrid = (words: string[], verseText: string) => {
  const targetWords = words.map(w => w.toUpperCase()).sort((a, b) => b.length - a.length);
  
  // Fixed size of 5x5 as requested
  let size = 5;

  const cleanVerse = verseText.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const letterPool = Array.from(new Set(cleanVerse.split(""))).filter(l => l.length > 0);
  
  if (letterPool.length === 0) {
    return { 
      grid: Array(size).fill(null).map(() => Array(size).fill('A')), 
      placedWords: [] 
    };
  }

  const directions = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  // --- Phase 1: Greedy Skeleton Seeding ---
  let currentGrid: (string | null)[][] = Array(size).fill(null).map(() => Array(size).fill(null));

  const placeWordGreedy = (word: string, grid: (string | null)[][]): boolean => {
    const visited = Array(size).fill(null).map(() => Array(size).fill(false));
    const backtrack = (r: number, c: number, idx: number): boolean => {
      if (idx === word.length) return true;
      if (r < 0 || r >= size || c < 0 || c >= size || visited[r][c]) return false;
      
      const char = word[idx];
      const existing = grid[r][c];
      if (existing !== null && existing !== char) return false;
      
      const oldChar = grid[r][c];
      grid[r][c] = char;
      visited[r][c] = true;
      
      const shuffledDirs = [...directions].sort(() => Math.random() - 0.5);
      for (const [dr, dc] of shuffledDirs) {
        if (backtrack(r + dr, c + dc, idx + 1)) return true;
      }
      
      grid[r][c] = oldChar;
      visited[r][c] = false;
      return false;
    };

    const starts = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        starts.push([r, c]);
      }
    }
    starts.sort(() => Math.random() - 0.5);
    for (const [r, c] of starts) {
      if (backtrack(r, c, 0)) return true;
    }
    return false;
  };

  // Seed the grid with as many words as possible (starting with longest)
  for (const word of targetWords) {
    placeWordGreedy(word, currentGrid);
  }

  // --- Phase 1.5: Targeted Wildcard Injection ---
  // Identify words that are missing just 1 or 2 letters and try to inject them
  const fillRemainingWithSmartLetters = (grid: (string | null)[][]) => {
    const missingLetters: string[] = [];
    targetWords.forEach(word => {
      // If word is not in grid, see if we can "help" it
      // This is a simplified heuristic: just add letters from the verse to the pool
      // but prioritize letters from words that aren't placed yet.
    });
    
    return grid.map(row => 
      row.map(char => char || letterPool[Math.floor(Math.random() * letterPool.length)])
    );
  };

  let workingGrid: string[][] = fillRemainingWithSmartLetters(currentGrid);

  // --- Phase 2: Simulated Annealing Optimization ---
  const solve = (grid: string[][]): string[] => {
    const found = new Set<string>();
    const dfs = (r: number, c: number, word: string, idx: number, visited: boolean[][]): boolean => {
      if (idx === word.length) return true;
      if (r < 0 || r >= size || c < 0 || c >= size || visited[r][c] || grid[r][c] !== word[idx]) return false;
      visited[r][c] = true;
      for (const [dr, dc] of directions) {
        if (dfs(r + dr, c + dc, word, idx + 1, visited)) {
          visited[r][c] = false;
          return true;
        }
      }
      visited[r][c] = false;
      return false;
    };

    for (const word of targetWords) {
      let wordFound = false;
      const visited = Array(size).fill(null).map(() => Array(size).fill(false));
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (dfs(r, c, word, 0, visited)) {
            found.add(word);
            wordFound = true;
            break;
          }
        }
        if (wordFound) break;
      }
    }
    return Array.from(found);
  };

  let bestWords = solve(workingGrid);
  let bestGrid = workingGrid.map(row => [...row]);
  let bestScore = bestWords.reduce((acc, w) => acc + (w.length * w.length), 0);
  let previousScore = bestScore;

  let temp = 10.0;
  const coolingRate = 0.99995;

  for (let i = 0; i < 100000; i++) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    const oldChar = workingGrid[r][c];
    
    workingGrid[r][c] = letterPool[Math.floor(Math.random() * letterPool.length)];
    
    const currentWords = solve(workingGrid);
    const currentScore = currentWords.reduce((acc, w) => acc + (w.length * w.length), 0);
    
    const delta = currentScore - previousScore;
    // Accept if better, or with probability based on temperature if worse
    if (delta >= 0 || Math.random() < Math.exp(delta / temp)) {
      previousScore = currentScore;
      if (currentScore > bestScore) {
        bestScore = currentScore;
        bestWords = currentWords;
        bestGrid = workingGrid.map(row => [...row]);
      }
    } else {
      workingGrid[r][c] = oldChar;
    }
    
    temp *= coolingRate;
    if (bestWords.length === targetWords.length) break;
  }

  return { grid: bestGrid, placedWords: bestWords };
};

const BoggleGame = ({ 
  verse, 
  onComplete, 
  onExit, 
  difficulty, 
  setDifficulty,
  isMusicEnabled,
  setIsMusicEnabled,
  selectedMusicStyle,
  setSelectedMusicStyle,
  volume,
  setVolume
}: { 
  verse: Verse, 
  onComplete: (xp: number) => void, 
  onExit: () => void, 
  difficulty: Difficulty, 
  setDifficulty: (d: Difficulty) => void,
  isMusicEnabled: boolean,
  setIsMusicEnabled: (v: boolean) => void,
  selectedMusicStyle: string,
  setSelectedMusicStyle: (v: string) => void,
  volume: number,
  setVolume: (v: number) => void
}) => {
  const allPossibleWords = useMemo(() => {
    const cleanText = verse.text.replace(/[.,!?;:"'()\[\]]/g, "");
    return Array.from(new Set(cleanText.split(/\s+/).filter(w => w.length >= 3).map(w => w.toUpperCase())));
  }, [verse]);

  const verseParts = useMemo(() => {
    return verse.text.split(/(\s+)/);
  }, [verse.text]);

  const [grid, setGrid] = useState<string[][]>([]);
  const [wordsToFind, setWordsToFind] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [currentSelection, setCurrentSelection] = useState<{r: number, c: number}[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generatingMessage, setGeneratingMessage] = useState("Weaving the verse into the grid...");
  const gridRef = useRef<HTMLDivElement>(null);

  const generatingMessages = [
    "Weaving the verse into the grid...",
    "Searching 100,000 combinations...",
    "Finding the perfect overlaps...",
    "Packing the Word into the grid...",
    "Optimizing for maximum density...",
    "Aligning the letters...",
    "Simulating annealing process...",
    "Polishing the board..."
  ];

  useEffect(() => {
    setIsGenerating(true);
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % generatingMessages.length;
      setGeneratingMessage(generatingMessages[msgIndex]);
    }, 800);

    // Use setTimeout to let the loading UI render first
    const timer = setTimeout(() => {
      const { grid: newGrid, placedWords } = generateBoggleGrid(allPossibleWords, verse.text);
      setGrid(newGrid);
      setWordsToFind(placedWords);
      setFoundWords(new Set());
      setTimeLeft(60);
      setIsGameOver(false);
      setIsGenerating(false);
      clearInterval(msgInterval);
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(msgInterval);
    };
  }, [verse, allPossibleWords]);

  useEffect(() => {
    if (timeLeft > 0 && !isGameOver) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setIsGameOver(true);
    }
  }, [timeLeft, isGameOver]);

  const currentWord = useMemo(() => {
    return currentSelection.map(pos => grid[pos.r][pos.c]).join('');
  }, [currentSelection, grid]);

  const handleTouchStart = (r: number, c: number) => {
    if (isGameOver) return;
    setIsDragging(true);
    setCurrentSelection([{r, c}]);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || isGameOver || !gridRef.current) return;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = gridRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Calculate which cell we are over based on coordinates
    const gridSize = grid.length;
    const cellSize = rect.width / gridSize;
    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);

    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      // Precision check: only select if close to the center of the cell
      const centerX = (c + 0.5) * cellSize;
      const centerY = (r + 0.5) * cellSize;
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      if (dist > cellSize * 0.4) return;

      const last = currentSelection[currentSelection.length - 1];
      if (last.r === r && last.c === c) return;

      const alreadySelected = currentSelection.some(pos => pos.r === r && pos.c === c);
      if (alreadySelected) {
        if (currentSelection.length > 1) {
          const secondLast = currentSelection[currentSelection.length - 2];
          if (secondLast.r === r && secondLast.c === c) {
            setCurrentSelection(prev => prev.slice(0, -1));
          }
        }
        return;
      }

      const dr = Math.abs(r - last.r);
      const dc = Math.abs(c - last.c);
      if (dr <= 1 && dc <= 1) {
        setCurrentSelection(prev => [...prev, {r, c}]);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      if (wordsToFind.includes(currentWord) && !foundWords.has(currentWord)) {
        setFoundWords(prev => new Set([...prev, currentWord]));
        setTimeLeft(prev => prev + 5);
        
        // Confetti for each word found
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#3b82f6', '#8b5cf6', '#ec4899']
        });
      }
      setIsDragging(false);
      setCurrentSelection([]);
    }
  };

  const allFound = wordsToFind.length > 0 && foundWords.size === wordsToFind.length;
  useEffect(() => {
    if (allFound) {
      setIsGameOver(true);
    }
  }, [allFound]);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 p-8 bg-slate-950 rounded-3xl shadow-2xl border-2 border-slate-800 h-full text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)] animate-pulse" />
        
        <div className="relative">
          <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin [animation-direction:reverse]" />
          </div>
        </div>

        <div className="text-center space-y-4 relative z-10">
          <h3 className="text-2xl font-black italic tracking-tighter text-blue-400 animate-bounce">
            GENERATING GRID
          </h3>
          <div className="h-8 flex items-center justify-center">
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 duration-500">
              {generatingMessage}
            </p>
          </div>
        </div>

        <div className="w-full max-w-xs bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '100%', backgroundSize: '200% 100%' }} />
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}} />
      </div>
    );
  }

  if (isGameOver) {
    const xpMultiplier = difficulty === 'hard' ? 2.5 : difficulty === 'medium' ? 1.5 : 1;
    const timeBonus = Math.floor(timeLeft / 2);
    const finalXP = Math.round((foundWords.size * xpMultiplier + timeBonus) * (allFound ? 2 : 1));

    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-6 bg-slate-950 rounded-3xl shadow-xl border-2 border-slate-800 h-full text-white overflow-y-auto">
        <div className="text-center w-full">
          <h3 className={cn("text-4xl font-black mb-4 italic tracking-tighter", allFound ? "text-green-500" : "text-rose-500")}>
            {allFound ? "MISSION COMPLETE" : "TIME EXPIRED"}
          </h3>
          
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 mb-6 text-left">
            <p className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-2">The Verse</p>
            <p className="text-lg font-bold leading-tight mb-2 italic">"{verse.text}"</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              — {verse.book} {verse.chapter}:{verse.verse}
            </p>
          </div>

          <div className="flex justify-around items-center mb-6">
            <div className="text-center">
              <div className="text-5xl font-black text-white tracking-tighter">{foundWords.size}</div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.1em] text-[10px]">Words Found</p>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-5xl font-black text-blue-400 tracking-tighter">+{finalXP}</div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.1em] text-[10px]">XP Earned</p>
            </div>
          </div>

          <div className="bg-blue-600/20 border border-blue-500/30 px-4 py-2 rounded-xl inline-block mb-6">
            <span className="text-blue-400/60 text-[10px] block uppercase tracking-widest font-bold">
              {difficulty === 'hard' ? 'Memory Master' : difficulty === 'medium' ? 'Verse Scholar' : 'Easy Mode'}
            </span>
          </div>
        </div>
        <button 
          onClick={() => onComplete(finalXP)}
          className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
        >
          COLLECT XP
        </button>
      </div>
    );
  }

  const cellColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white p-4 select-none overflow-hidden touch-none"
         onMouseUp={handleTouchEnd}
         onMouseLeave={handleTouchEnd}
         onTouchEnd={handleTouchEnd}>
      
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time</span>
          <span className={cn("text-xl font-black tabular-nums", timeLeft < 10 ? "text-rose-500 animate-pulse" : "text-white")}>
            {timeLeft}s
          </span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-1">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  "px-2 py-1 rounded-lg font-black text-[8px] uppercase tracking-tighter transition-all border",
                  difficulty === d 
                    ? "bg-indigo-500 border-indigo-400 text-white shadow-lg" 
                    : "bg-slate-900 border-slate-800 text-slate-500 hover:border-indigo-500/50"
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
            <Music className={cn("w-3 h-3", isMusicEnabled ? "text-blue-400" : "text-white/20")} />
            <select 
              value={selectedMusicStyle}
              onChange={(e) => setSelectedMusicStyle(e.target.value)}
              className="bg-transparent text-white text-[8px] font-bold uppercase tracking-widest outline-none border-none cursor-pointer"
            >
              <option value="hymns" className="bg-slate-900">Hymns</option>
              <option value="gospel" className="bg-slate-900">Gospel</option>
              <option value="acoustic" className="bg-slate-900">Acoustic</option>
              <option value="ambient" className="bg-slate-900">Ambient</option>
              <option value="lofi" className="bg-slate-900">Lo-Fi</option>
              <option value="classical" className="bg-slate-900">Classical</option>
              <option value="retro" className="bg-slate-900">Retro</option>
              <option value="epic" className="bg-slate-900">Epic</option>
            </select>
            <button 
              onClick={() => setIsMusicEnabled(!isMusicEnabled)}
              className="p-0.5 hover:bg-white/10 rounded transition-colors"
            >
              {isMusicEnabled ? <Volume2 size={10} className="text-white" /> : <VolumeX size={10} className="text-white/40" />}
            </button>
          </div>
        </div>

        <button 
          onClick={onExit}
          className="p-1 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verse Words in Grid</span>
          <span className="text-xl font-black text-blue-400">{foundWords.size}/{wordsToFind.length}</span>
        </div>
      </div>

      <div className="bg-slate-900/50 p-3 rounded-xl mb-3 border border-white/5 flex flex-wrap justify-center gap-x-1 gap-y-0.5 max-h-[25vh] overflow-y-auto">
        {verseParts.map((part, i) => {
          const clean = part.toUpperCase().replace(/[^A-Z]/g, "");
          const isInGrid = wordsToFind.includes(clean);
          const isFound = foundWords.has(clean);
          
          if (part.trim() === "") return <span key={i} className="w-1"></span>;

          // Logic for hiding words based on difficulty
          let displayContent = part;
          let isHidden = false;

          if (!isFound) {
            if (difficulty === 'hard') {
              isHidden = true;
            } else if (difficulty === 'medium' && isInGrid) {
              isHidden = true;
            }
          }

          if (isHidden) {
            displayContent = part.replace(/[A-Za-z]/g, "_");
          }

          return (
            <span 
              key={i} 
              className={cn(
                "text-sm font-bold transition-all duration-300 px-0.5 rounded",
                isFound 
                  ? "bg-green-500/30 text-green-400 scale-105" 
                  : isInGrid 
                    ? difficulty === 'easy' 
                      ? "text-blue-400 border-b border-blue-500/50" 
                      : "text-slate-500"
                    : difficulty === 'hard'
                      ? "text-slate-700"
                      : "text-slate-300"
              )}
            >
              {displayContent}
            </span>
          );
        })}
        <div className="w-full text-[9px] text-slate-600 font-bold text-center mt-1 uppercase tracking-widest">
          {verse.book} {verse.chapter}:{verse.verse}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <div 
          ref={gridRef}
          className={cn(
            "grid gap-1.5 w-full max-w-[360px] aspect-square mb-4 grid-cols-5",
          )}
          onMouseMove={handleTouchMove}
          onTouchMove={handleTouchMove}
        >
          {grid.map((row, r) => row.map((char, c) => {
            const isSelected = currentSelection.some(pos => pos.r === r && pos.c === c);
            const isLast = currentSelection.length > 0 && currentSelection[currentSelection.length - 1].r === r && currentSelection[currentSelection.length - 1].c === c;
            
            return (
              <div
                key={`${r}-${c}`}
                data-boggle-cell
                data-r={r}
                data-c={c}
                onMouseDown={() => handleTouchStart(r, c)}
                onTouchStart={() => handleTouchStart(r, c)}
                className={cn(
                  "relative flex items-center justify-center text-2xl font-black rounded-xl border-b-4 transition-all cursor-pointer",
                  isSelected 
                    ? "bg-white border-blue-400 text-blue-600 scale-95 shadow-[0_0_20px_rgba(59,130,246,0.5)]" 
                    : "bg-slate-800 border-slate-950 text-slate-200 hover:brightness-110"
                )}
                style={{ 
                  borderColor: isSelected ? '#3b82f6' : undefined,
                  backgroundColor: isSelected ? '#ffffff' : undefined,
                  color: isSelected ? '#3b82f6' : undefined
                }}
              >
                {char}
                {isLast && (
                  <motion.div 
                    layoutId="selection-glow"
                    className="absolute inset-0 bg-blue-400/20 rounded-xl blur-md"
                  />
                )}
              </div>
            );
          }))}
        </div>

        <div className="h-14 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {currentWord && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white font-black text-2xl tracking-widest shadow-[0_10px_20px_rgba(37,99,235,0.3)] border border-white/20"
              >
                {currentWord}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const ENGLISH_FREQUENCIES = "EEEEEEEEEEEEETTTTTTTTTTAAAAAAAAAOOOOOOOIIIIIIINNNNNNNSSSSSSRRRRRRHHHHHHLLLLDDDDCCCCUUUUMMMMWWWYYYFFGGPPBBVKXJQZ";

const ReferenceGameUI = memo(({
  availableChunks,
  placedChunks,
  handleChunkTap,
  handlePlacedChunkTap,
  handleClearAll,
  handleShuffle,
  handleSubmit,
  handleReorder,
  isCorrect,
  wordAreaRectRef,
  bonusWordsFoundCount,
  currentVerse
}: any) => {
  const isMobile = useMemo(() => typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent), []);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // No-op
  }, [placedChunks.length]);

  const formationFontSize = useMemo(() => {
    const count = placedChunks.length;
    if (count > 15) return 'text-[10px] sm:text-base';
    if (count > 12) return 'text-xs sm:text-lg';
    if (count > 10) return 'text-sm sm:text-xl';
    if (count > 8) return 'text-base sm:text-2xl';
    if (count > 6) return 'text-lg sm:text-3xl';
    if (count > 4) return 'text-xl sm:text-4xl';
    return 'text-2xl sm:text-5xl';
  }, [placedChunks.length]);

  const formationChunkWidth = useMemo(() => {
    const count = placedChunks.length;
    if (count > 15) return 'min-w-[0.8rem] sm:min-w-[1.2rem]';
    if (count > 12) return 'min-w-[1rem] sm:min-w-[1.5rem]';
    if (count > 10) return 'min-w-[1.2rem] sm:min-w-[1.8rem]';
    if (count > 8) return 'min-w-[1.5rem] sm:min-w-[2.2rem]';
    if (count > 6) return 'min-w-[1.8rem] sm:min-w-[2.8rem]';
    if (count > 4) return 'min-w-[2.2rem] sm:min-w-[3.5rem]';
    return 'min-w-[2.8rem] sm:min-w-[4.5rem]';
  }, [placedChunks.length]);

  const formationPadding = useMemo(() => {
    const count = placedChunks.length;
    if (count > 10) return 'px-1 sm:px-2';
    if (count > 6) return 'px-2 sm:px-3';
    return 'px-3 sm:px-4';
  }, [placedChunks.length]);

  return (
    <div className="h-full flex flex-col p-2 gap-1">
      {/* Scramble Area */}
      <div className="flex-1 relative flex items-center justify-center mb-1 overflow-y-auto min-h-0">
        {/* Bonus Counter - Top Center */}
        {bonusWordsFoundCount > 0 && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-full border border-amber-500/30 z-20">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-black text-amber-400 tracking-tighter">{bonusWordsFoundCount}/10</span>
          </div>
        )}

        {/* Letters Container - Responsive layout: single row on mobile, wrap on tablet */}
        <div className="flex-1 flex flex-nowrap sm:flex-wrap justify-center items-center gap-1 sm:gap-2 px-1 py-4 w-full overflow-x-auto sm:overflow-y-auto h-full">
          {availableChunks.map((chunk: any) => (
            <div 
              key={chunk.id} 
              className="flex-1 min-w-0 max-w-[4.5rem] sm:flex-none sm:w-20 h-14 sm:h-20"
              style={{ 
                flexBasis: typeof window !== 'undefined' && window.innerWidth < 640 ? `${100 / Math.max(7, availableChunks.length)}%` : 'auto'
              }}
            >
              {isMobile ? (
                !chunk.isUsed && (
                  <button
                    onClick={() => handleChunkTap(chunk)}
                    className={cn(
                      "w-full h-full rounded-xl font-black flex items-center justify-center shadow-xl touch-none will-change-transform",
                      "bg-slate-800 text-white border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transform-gpu",
                      availableChunks.length > 15 ? "text-lg sm:text-3xl" :
                      availableChunks.length > 12 ? "text-xl sm:text-4xl" :
                      availableChunks.length > 10 ? "text-2xl sm:text-5xl" :
                      availableChunks.length > 8 ? "text-3xl sm:text-6xl" : 
                      "text-4xl sm:text-7xl"
                    )}
                  >
                    {chunk.text}
                  </button>
                )
              ) : (
                <AnimatePresence mode="wait">
                  {!chunk.isUsed && (
                    <motion.button
                      layoutId={`chunk-${chunk.id}`}
                      drag
                      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                      dragElastic={0.8}
                      onDragEnd={(_, info) => {
                        const rect = wordAreaRectRef.current;
                        if (rect) {
                          if (
                            info.point.y >= rect.top && 
                            info.point.y <= rect.bottom &&
                            info.point.x >= rect.left &&
                            info.point.x <= rect.right
                          ) {
                            const relativeX = info.point.x - rect.left;
                            const chunkWidth = 56;
                            const gap = 6;
                            const totalWidth = placedChunks.length * (chunkWidth + gap);
                            const startX = (rect.width - totalWidth) / 2;
                            const index = Math.max(0, Math.min(placedChunks.length, Math.round((relativeX - startX) / (chunkWidth + gap))));
                            handleChunkTap(chunk, index);
                            return;
                          }
                        }
                        if (info.offset.y > 60) {
                          handleChunkTap(chunk);
                        }
                      }}
                      onClick={() => handleChunkTap(chunk)}
                      whileTap={{ scale: 0.9 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'tween', duration: 0.1, ease: 'easeOut' }}
                      className={cn(
                        "w-full h-full rounded-xl font-black flex items-center justify-center shadow-xl touch-none will-change-transform",
                        "bg-slate-800 text-white border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transform-gpu",
                        availableChunks.length > 8 ? "text-2xl sm:text-5xl" : 
                        availableChunks.length > 6 ? "text-3xl sm:text-6xl" : 
                        "text-4xl sm:text-7xl"
                      )}
                    >
                      {chunk.text}
                    </motion.button>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Control & Word Formation Area (Now at Bottom) */}
      <div className="flex items-center gap-2 px-2 pb-2">
        {/* Word Formation Area */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0 overflow-hidden">
          <div 
            ref={scrollRef}
            className="h-20 flex items-center w-full justify-center"
          >
            <Reorder.Group
              axis="x"
              values={placedChunks}
              onReorder={handleReorder}
              className="flex h-18 gap-2 items-center relative transform-gpu"
              id="placed-chunks-container"
            >
              <AnimatePresence>
                {placedChunks.map((chunk: any) => (
                  <Reorder.Item
                    key={chunk.id}
                    value={chunk}
                    layoutId={`chunk-${chunk.id}`}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'tween', duration: 0.1, ease: 'easeOut' }}
                    className={cn(
                      "h-14 sm:h-20 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg border-b-4 border-blue-800 z-40 touch-none cursor-grab active:cursor-grabbing transform-gpu will-change-transform flex-shrink whitespace-nowrap",
                      formationFontSize,
                      formationChunkWidth,
                      formationPadding
                    )}
                    onClick={() => handlePlacedChunkTap(chunk)}
                    onDragEnd={(_, info) => {
                      if (info.offset.y < -60) {
                        handlePlacedChunkTap(chunk);
                      }
                    }}
                  >
                    {chunk.text}
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className={cn(
            "w-14 h-16 sm:w-20 sm:h-24 rounded-xl flex items-center justify-center transition-all shrink-0 z-50 shadow-2xl",
            "bg-emerald-500 text-white border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1"
          )}
        >
          <CheckCircle2 className="w-10 h-10" />
        </button>
      </div>
    </div>
  );
});

const ChoiceGameUI = memo(({ options, isAskingReference, currentVerse, words, currentIndex, difficulty, handleChoice }: any) => {
  const isMobile = useMemo(() => typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent), []);

  return (
    <div className="h-full p-3 grid grid-cols-2 gap-3">
      {options.map((opt: any, i: number) => {
        const isCorrect = isAskingReference 
          ? opt === `${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`
          : opt.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim() === words[currentIndex];
        
        let displayOpt = isAskingReference ? opt : opt.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
        if (difficulty === 'master' && !isAskingReference) {
          displayOpt = opt[0] + opt.slice(1).replace(/./g, '_');
        }

        let isHighlighted = false;
        if (isCorrect) {
          if (difficulty === 'easy') isHighlighted = true;
          else if (difficulty === 'medium' && currentIndex % 2 === 0) isHighlighted = true;
        }

        return isMobile ? (
          <button
            key={i}
            onClick={() => handleChoice(opt)}
            className={cn(
              "h-full border-2 rounded-2xl text-white font-black text-3xl tracking-tight transition-all shadow-lg active:bg-blue-600 transform-gpu will-change-transform",
              isHighlighted ? "bg-blue-600 border-blue-400" : "bg-slate-900 border-slate-800 hover:border-blue-500"
            )}
          >
            {displayOpt}
          </button>
        ) : (
          <motion.button
            key={i}
            whileTap={{ scale: 0.92 }}
            onClick={() => handleChoice(opt)}
            className={cn(
              "h-full border-2 rounded-2xl text-white font-black text-3xl tracking-tight transition-all shadow-lg active:bg-blue-600 transform-gpu will-change-transform",
              isHighlighted ? "bg-blue-600 border-blue-400" : "bg-slate-900 border-slate-800 hover:border-blue-500"
            )}
          >
            {displayOpt}
          </motion.button>
        );
      })}
    </div>
  );
});

const BibleJeopardyGame = ({ 
  onExit, 
  categories: initialCategories,
  onGameStart,
  isGenerating,
  onRetry,
  savedBoards = [],
  onLoadBoard,
  difficulty: initialDifficulty = 'medium',
  onDifficultyChange,
  mode = 'bible',
  onModeChange,
  onUpdateGameState,
  boardId,
  isMusicEnabled,
  setIsMusicEnabled,
  selectedMusicStyle,
  setSelectedMusicStyle,
  volume,
  setVolume
}: { 
  onExit: () => void, 
  categories: JeopardyCategory[],
  onGameStart: () => void,
  isGenerating: boolean,
  onRetry: (mode: JeopardyMode, difficulty: JeopardyDifficulty) => void,
  savedBoards?: JeopardyBoard[],
  onLoadBoard?: (board: JeopardyBoard) => void,
  difficulty?: JeopardyDifficulty,
  onDifficultyChange?: (difficulty: JeopardyDifficulty) => void,
  mode?: JeopardyMode,
  onModeChange?: (mode: JeopardyMode) => void,
  onUpdateGameState?: (boardId: string, gameState: JeopardyGameState) => void,
  boardId: string | null,
  isMusicEnabled: boolean,
  setIsMusicEnabled: (v: boolean) => void,
  selectedMusicStyle: string,
  setSelectedMusicStyle: (v: string) => void,
  volume: number,
  setVolume: (v: number) => void
}) => {
  const difficulty = initialDifficulty;
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState<Team[]>([
    { name: 'Team A', score: 0, color: 'bg-blue-500' },
    { name: 'Team B', score: 0, color: 'bg-red-500' }
  ]);
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const [gameState, setGameState] = useState<'splash' | 'intro' | 'board' | 'question' | 'final' | 'results'>('splash');

  // Log state changes for debugging (internal)
  useEffect(() => {
    console.log("Jeopardy Game State:", gameState);
  }, [gameState]);
  const [selectedQuestion, setSelectedQuestion] = useState<{ categoryId: string, questionId: string } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [wager, setWager] = useState(0);
  const [showWagerInput, setShowWagerInput] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isManualScoring, setIsManualScoring] = useState(false);
  const [answeredMetadata, setAnsweredMetadata] = useState<Record<string, { teamIndex: number, points: number }>>({});
  const [history, setHistory] = useState<{ teams: Team[], answeredIds: string[], answeredMetadata: Record<string, { teamIndex: number, points: number }> }[]>([]);

  // Load game state if available for this board
  useEffect(() => {
    const currentBoard = savedBoards.find(b => b.id === boardId);
    if (currentBoard?.gameState) {
      const { answeredIds, answeredMetadata, teams } = currentBoard.gameState;
      setAnsweredIds(answeredIds);
      setAnsweredMetadata(answeredMetadata);
      setTeams(teams);
      setTeamCount(teams.length);
      // We don't auto-set to 'board' anymore, we stay at splash/intro to allow setup
    } else {
      // Reset game when categories change (e.g., loading a new board without saved state)
      setAnsweredIds([]);
      setAnsweredMetadata({});
      setHistory([]);
      const colors = ['bg-blue-500', 'bg-red-500', 'bg-emerald-500', 'bg-amber-500'];
      const names = ['Team A', 'Team B', 'Team C', 'Team D'];
      setTeams(Array.from({ length: teamCount }, (_, i) => ({
        name: names[i],
        score: 0,
        color: colors[i]
      })));
    }
  }, [initialCategories, boardId]);

  // Save game state whenever it changes
  useEffect(() => {
    if (boardId && onUpdateGameState && !['splash', 'intro'].includes(gameState)) {
      onUpdateGameState(boardId, {
        answeredIds,
        answeredMetadata,
        teams,
        lastUpdated: Date.now()
      });
    }
  }, [answeredIds, answeredMetadata, teams, boardId, onUpdateGameState, gameState]);

  const saveHistory = useCallback(() => {
    setHistory(prev => [...prev, { 
      teams: JSON.parse(JSON.stringify(teams)), 
      answeredIds: [...answeredIds],
      answeredMetadata: { ...answeredMetadata }
    }]);
  }, [teams, answeredIds, answeredMetadata]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setTeams(lastState.teams);
    setAnsweredIds(lastState.answeredIds);
    setAnsweredMetadata(lastState.answeredMetadata);
    setHistory(prev => prev.slice(0, -1));
  };

  const adjustScore = (teamIdx: number, amount: number) => {
    saveHistory();
    setTeams(prev => prev.map((t, i) => i === teamIdx ? { ...t, score: t.score + amount } : t));
  };

  // Use the categories passed from props
  const categories = initialCategories;

  useEffect(() => {
    if (gameState === 'board' && answeredIds.length === 0) {
      onGameStart();
    }
  }, [gameState, answeredIds.length, onGameStart]);

  const currentQuestion = useMemo(() => {
    if (!selectedQuestion) return null;
    const cat = categories.find(c => c.id === selectedQuestion.categoryId);
    return cat?.questions.find(q => q.id === selectedQuestion.questionId);
  }, [selectedQuestion, categories]);

  const handleQuestionSelect = (categoryId: string, questionId: string) => {
    if (answeredIds.includes(questionId)) {
      if (isEditMode) {
        saveHistory();
        const metadata = answeredMetadata[questionId];
        if (metadata) {
          setTeams(prev => prev.map((team, idx) => {
            if (idx === metadata.teamIndex) {
              return { ...team, score: team.score - metadata.points };
            }
            return team;
          }));
          setAnsweredMetadata(prev => {
            const next = { ...prev };
            delete next[questionId];
            return next;
          });
        }
        setAnsweredIds(prev => prev.filter(id => id !== questionId));
      }
      return;
    }
    const cat = categories.find(c => c.id === categoryId);
    const q = cat?.questions.find(q => q.id === questionId);
    
    setSelectedQuestion({ categoryId, questionId });
    if (q?.isDailyDouble) {
      setShowWagerInput(true);
    } else {
      setGameState('question');
    }
  };

  const handleScore = (correct: boolean) => {
    saveHistory();
    const points = currentQuestion?.isDailyDouble ? wager : (currentQuestion?.value || 0);
    const pointsAwarded = correct ? points : -points;

    setTeams(prev => prev.map((team, idx) => {
      if (idx === activeTeamIndex) {
        return { ...team, score: team.score + pointsAwarded };
      }
      return team;
    }));
    
    if (currentQuestion) {
      setAnsweredIds(prev => [...prev, currentQuestion.id]);
      setAnsweredMetadata(prev => ({
        ...prev,
        [currentQuestion.id]: { teamIndex: activeTeamIndex, points: pointsAwarded }
      }));
    }
    
    setShowAnswer(false);
    setSelectedQuestion(null);
    setGameState('board');

    // Check if all questions are answered
    const totalQuestions = categories.reduce((acc, cat) => acc + cat.questions.length, 0);
    if (answeredIds.length + 1 >= totalQuestions) {
      setGameState('results');
    }
  };

  const handleNoScore = () => {
    saveHistory();
    if (currentQuestion) {
      setAnsweredIds(prev => [...prev, currentQuestion.id]);
      setAnsweredMetadata(prev => ({
        ...prev,
        [currentQuestion.id]: { teamIndex: -1, points: 0 }
      }));
    }
    
    setShowAnswer(false);
    setSelectedQuestion(null);
    setGameState('board');

    const totalQuestions = categories.reduce((acc, cat) => acc + cat.questions.length, 0);
    if (answeredIds.length + 1 >= totalQuestions) {
      setGameState('results');
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-blue-900 text-white font-sans overflow-hidden relative">
      <AnimatePresence mode="wait">
        {gameState === 'splash' && (
          <motion.div 
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-[100] bg-blue-900 flex flex-col items-center justify-center p-8 text-center overflow-hidden"
          >
            {/* Massive Editorial Typography (Recipe 2) */}
            <div className="relative">
              <motion.h1 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                className="text-[15vw] sm:text-[12vw] font-black italic tracking-tighter leading-[0.82] text-yellow-400 uppercase select-none"
              >
                {mode === 'bible' ? 'BIBLE' : mode === 'mixed' ? 'MIXED' : 'TRIVIA'}<br />JEOPARDY
              </motion.h1>
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 1 }}
                className="h-4 bg-white mt-4 origin-left"
              />
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-xl sm:text-2xl font-bold tracking-[0.2em] uppercase mt-4 text-blue-200"
              >
                {mode === 'bible' ? 'The Ultimate Scriptural Challenge' : 
                 mode === 'mixed' ? 'Bible • History • Geography • Science' :
                 mode === 'history' ? 'World History • Major Events • Figures' :
                 mode === 'geography' ? 'World Geography • Landmarks • Cultures' :
                 'Biology • Physics • Chemistry • Discoveries'}
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex flex-col items-center gap-4 mt-12"
            >
              <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                <Music className={cn("w-5 h-5", isMusicEnabled ? "text-yellow-400" : "text-white/20")} />
                <select 
                  value={selectedMusicStyle}
                  onChange={(e) => setSelectedMusicStyle(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold uppercase tracking-widest outline-none border-none cursor-pointer"
                >
                  <option value="hymns" className="bg-blue-900">Hymns</option>
                  <option value="gospel" className="bg-blue-900">Gospel</option>
                  <option value="acoustic" className="bg-blue-900">Acoustic</option>
                  <option value="ambient" className="bg-blue-900">Ambient</option>
                  <option value="lofi" className="bg-blue-900">Lo-Fi</option>
                  <option value="classical" className="bg-blue-900">Classical</option>
                  <option value="retro" className="bg-blue-900">Retro</option>
                  <option value="epic" className="bg-blue-900">Epic</option>
                </select>
                <div className="w-px h-4 bg-white/10 mx-2" />
                <button 
                  onClick={() => setIsMusicEnabled(!isMusicEnabled)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  {isMusicEnabled ? <Volume2 size={18} className="text-white" /> : <VolumeX size={18} className="text-white/40" />}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-yellow-400"
                />
              </div>
              
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ delay: 1.4, type: 'spring', stiffness: 400, damping: 10 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Enter Game Clicked");
                  setGameState('intro');
                }}
                className="px-16 py-6 bg-yellow-400 text-blue-900 rounded-full font-black text-3xl shadow-[0_20px_50px_rgba(250,204,21,0.4)] hover:shadow-[0_25px_60px_rgba(250,204,21,0.5)] transition-all flex items-center gap-4 group relative z-[110]"
              >
                ENTER GAME
                <ChevronRight size={32} className="group-hover:translate-x-2 transition-transform" />
              </motion.button>
            </motion.div>

            {/* Background Decoration - CRITICAL: pointer-events-none to prevent blocking clicks */}
            <div className="absolute top-10 left-10 opacity-10 pointer-events-none select-none">
              <HelpCircle size={300} />
            </div>
            <div className="absolute bottom-10 right-10 opacity-10 pointer-events-none select-none">
              <Sparkles size={300} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header (Hidden in Splash) */}
      {gameState !== 'splash' && (
        <div className="bg-blue-950 p-4 flex justify-between items-center border-b-4 border-yellow-500 shadow-lg z-10">
          <div className="flex items-center gap-3">
            <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black italic tracking-tighter text-yellow-400 leading-none uppercase">
                {mode} JEOPARDY
              </h1>
              {history.length > 0 && (
                <button 
                  onClick={handleUndo}
                  className="text-[10px] font-bold uppercase tracking-widest text-blue-300 hover:text-white flex items-center gap-1 mt-1"
                >
                  <RotateCcw size={10} /> Undo Last Action
                </button>
              )}
            </div>
            <button 
              onClick={() => setIsManualScoring(!isManualScoring)}
              className={cn(
                "p-2 rounded-xl transition-all ml-2",
                isManualScoring ? "bg-emerald-500 text-white shadow-lg" : "bg-white/10 text-white hover:bg-white/20"
              )}
              title="Toggle Manual Scoring"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="flex gap-2">
            {teams.map((team, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "px-3 py-1 rounded-xl border-2 transition-all duration-300 flex flex-col items-center min-w-[90px] relative group",
                  idx === activeTeamIndex ? "border-yellow-400 scale-105 shadow-[0_0_15px_rgba(250,204,21,0.5)]" : "border-white/20 opacity-70",
                  team.color
                )}
                onClick={() => setActiveTeamIndex(idx)}
              >
                <span className="text-[9px] font-bold uppercase tracking-widest">{team.name}</span>
                <span className="text-lg font-black">${team.score}</span>
                
                {/* Manual Score Adjusters */}
                <div className={cn(
                  "absolute -bottom-8 left-0 right-0 flex justify-center gap-1 transition-opacity z-20",
                  isManualScoring ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); adjustScore(idx, -100); }}
                    className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-xs font-bold border border-white/20 hover:scale-110 active:scale-90 transition-transform"
                  >
                    -
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); adjustScore(idx, 100); }}
                    className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-xs font-bold border border-white/20 hover:scale-110 active:scale-90 transition-transform"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          {gameState === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="h-full overflow-y-auto p-8"
            >
              <div className="min-h-full flex flex-col items-center justify-center text-center max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
                  {/* Left Column: Rules & Setup */}
                  <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                    <div className="w-20 h-20 bg-yellow-400 rounded-3xl flex items-center justify-center text-blue-900 mb-6 shadow-2xl rotate-3">
                      <HelpCircle size={48} />
                    </div>
                    <h2 className="text-5xl font-black italic mb-6 tracking-tighter uppercase leading-none">GAME SETUP</h2>
                    
                    <div className="space-y-4 text-left bg-blue-950/50 p-6 rounded-3xl border-2 border-white/10 backdrop-blur-md mb-8 w-full">
                      <p className="flex gap-3 text-sm">
                        <span className="w-5 h-5 bg-yellow-400 text-blue-900 rounded-full flex items-center justify-center font-bold shrink-0 text-[10px]">1</span>
                        <span>Choose a category and point value from the board.</span>
                      </p>
                      <p className="flex gap-3 text-sm">
                        <span className="w-5 h-5 bg-yellow-400 text-blue-900 rounded-full flex items-center justify-center font-bold shrink-0 text-[10px]">2</span>
                        <span>Respond in the form of a <strong>Question</strong> (e.g., "Who is Josiah?").</span>
                      </p>
                    </div>

                    <div className="flex flex-col gap-6 w-full">
                      <div>
                        <p className="text-blue-200 font-bold uppercase tracking-widest text-[10px] mb-3">Game Mode</p>
                        <div className="flex flex-wrap gap-2">
                          {(['bible', 'history', 'geography', 'science', 'mixed'] as JeopardyMode[]).map(m => (
                            <button
                              key={m}
                              onClick={() => onModeChange?.(m)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl font-black text-[10px] uppercase transition-all border-2",
                                mode === m 
                                  ? "bg-yellow-400 text-blue-900 border-yellow-400 scale-105 shadow-lg" 
                                  : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                              )}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-blue-200 font-bold uppercase tracking-widest text-[10px] mb-3">Difficulty Level</p>
                        <div className="flex flex-wrap gap-2">
                          {(['extreme-easy', 'easy', 'medium', 'hard'] as JeopardyDifficulty[]).map(d => (
                            <button
                              key={d}
                              onClick={() => onDifficultyChange?.(d)}
                              className={cn(
                                "px-4 py-2 rounded-xl font-black text-xs uppercase transition-all border-2",
                                difficulty === d 
                                  ? "bg-yellow-400 text-blue-900 border-yellow-400 scale-105 shadow-lg" 
                                  : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                              )}
                            >
                              {d.replace('-', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-blue-200 font-bold uppercase tracking-widest text-[10px] mb-3">Number of Teams</p>
                        <div className="flex gap-2">
                          {[2, 3, 4].map(num => (
                            <button
                              key={num}
                              onClick={() => setTeamCount(num)}
                              className={cn(
                                "w-10 h-10 rounded-xl font-black transition-all border-2",
                                teamCount === num 
                                  ? "bg-yellow-400 text-blue-900 border-yellow-400 scale-105 shadow-lg" 
                                  : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                              )}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full mt-10">
                      <button 
                        onClick={() => setGameState('board')}
                        className="w-full py-5 bg-yellow-400 text-blue-900 rounded-2xl font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-3"
                      >
                        <Play size={28} fill="currentColor" />
                        {answeredIds.length > 0 ? "RESUME GAME" : "START GAME"}
                      </button>
                      
                      <button 
                        onClick={() => onRetry(mode, difficulty)}
                        disabled={isGenerating}
                        className="w-full py-3 bg-white/10 text-white rounded-2xl font-bold text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                            <Sparkles size={18} />
                          </motion.div>
                        ) : <Sparkles size={18} />}
                        GENERATE NEW BOARD
                      </button>
                    </div>
                  </div>

                  {/* Right Column: History */}
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-black italic tracking-tighter text-blue-200 uppercase">GAME HISTORY & REUSE</h3>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-900/50 px-3 py-1 rounded-full border border-white/5">
                        {savedBoards.length} Saved
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                      {savedBoards.map((board) => {
                        const isCurrent = board.id === boardId;
                        const inProgress = board.gameState && board.gameState.answeredIds.length > 0;
                        const completed = board.gameState && board.gameState.answeredIds.length === board.categories.reduce((acc, c) => acc + c.questions.length, 0);

                        return (
                          <button
                            key={board.id}
                            onClick={() => onLoadBoard?.(board)}
                            className={cn(
                              "p-4 bg-blue-950/40 border-2 rounded-2xl text-left transition-all group relative overflow-hidden",
                              isCurrent ? "border-yellow-400/50 bg-blue-900/40" : "border-white/5 hover:border-blue-400/50"
                            )}
                          >
                            {inProgress && !completed && (
                              <div className="absolute top-0 right-0 bg-emerald-500 text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-tighter text-white">
                                In Progress
                              </div>
                            )}
                            {completed && (
                              <div className="absolute top-0 right-0 bg-blue-500 text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-tighter text-white">
                                Completed
                              </div>
                            )}
                            
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">
                                  {new Date(board.createdAt).toLocaleDateString()}
                                </span>
                                <span className={cn(
                                  "text-[8px] font-black uppercase tracking-widest mt-0.5",
                                  board.difficulty === 'easy' ? 'text-emerald-400' : 
                                  board.difficulty === 'hard' ? 'text-red-400' : 'text-amber-400'
                                )}>
                                  {board.mode} • {board.difficulty}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {inProgress && (
                                  <div className="text-[9px] font-bold text-blue-200 bg-white/5 px-1.5 py-0.5 rounded">
                                    {board.gameState?.answeredIds.length} / {board.categories.reduce((acc, c) => acc + c.questions.length, 0)}
                                  </div>
                                )}
                                <RotateCcw size={12} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {board.categories.map((cat, i) => (
                                <span key={i} className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-blue-100 font-medium">
                                  {cat.title}
                                </span>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'board' && (
            <motion.div 
              key="board"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full p-4 flex flex-col gap-4 overflow-hidden"
            >
              {categories.length === 0 ? (
                <div className="flex flex-col flex-1 items-center justify-center p-8 text-center relative overflow-hidden">
                  <motion.div
                    animate={isGenerating ? { rotate: 360, scale: [1, 1.1, 1] } : {}}
                    transition={isGenerating ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                    className="mb-8 relative z-10"
                  >
                    <Sparkles size={120} className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
                  </motion.div>
                  
                  <div className="relative z-10">
                    <h2 className="text-6xl font-black italic mb-4 tracking-tighter uppercase leading-none">
                      {isGenerating ? "CRAFTING THE BOARD" : "BOARD IS EMPTY"}
                    </h2>
                    <p className="text-blue-200 font-bold uppercase tracking-widest text-sm max-w-md mx-auto">
                      {isGenerating 
                        ? `Gemini is deep in the ${mode === 'bible' ? 'scriptures' : 'archives'}, preparing a fresh set of ${mode.toUpperCase()} clues!` 
                        : "No board loaded. Please select a saved board or generate a new one."}
                    </p>
                  </div>

                  <div className="flex gap-4 mt-12 relative z-10">
                    {!isGenerating && (
                      <button 
                        onClick={() => onRetry(mode, difficulty)}
                        className="px-12 py-4 bg-yellow-400 text-blue-900 rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95 shadow-2xl"
                      >
                        GENERATE NEW BOARD
                      </button>
                    )}
                    <button 
                      onClick={() => setGameState('intro')}
                      className="px-12 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-xl transition-colors backdrop-blur-md"
                    >
                      GO TO SETUP
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 grid grid-cols-5 gap-4 overflow-y-auto min-h-0">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex flex-col gap-4">
                        <div className="h-20 bg-blue-800 rounded-xl flex items-center justify-center p-2 text-center border-2 border-white/10 shadow-lg">
                          <span className="text-sm font-black tracking-tighter leading-tight uppercase">{cat.title}</span>
                        </div>
                        {cat.questions.map(q => (
                          <button
                            key={q.id}
                            onClick={() => handleQuestionSelect(cat.id, q.id)}
                            className={cn(
                              "flex-1 rounded-xl flex items-center justify-center text-3xl font-black transition-all duration-300 border-2",
                              answeredIds.includes(q.id) 
                                ? isEditMode 
                                  ? "bg-red-900/40 border-red-500 text-red-200" 
                                  : "bg-blue-950/50 border-transparent text-blue-800" 
                                : "bg-blue-700 border-blue-600 text-yellow-400 hover:bg-blue-600 hover:scale-105 hover:shadow-xl active:scale-95"
                            )}
                          >
                            {answeredIds.includes(q.id) ? (isEditMode ? "REOPEN" : "") : `$${q.value}`}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center gap-4 py-2">
                    <button 
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={cn(
                        "px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                        isEditMode ? "bg-red-500 text-white shadow-lg scale-105" : "bg-white/10 text-white hover:bg-white/20"
                      )}
                    >
                      <Settings size={16} /> {isEditMode ? "EXIT EDIT MODE" : "EDIT BOARD"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {gameState === 'question' && currentQuestion && (
            <motion.div 
              key="question"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col items-center justify-center p-8 text-center bg-blue-900 z-20"
            >
              <div className="mb-4 flex flex-col items-center gap-2">
                <div className="text-yellow-400 font-bold tracking-widest uppercase text-sm">
                  {categories.find(c => c.id === selectedQuestion?.categoryId)?.title} - ${currentQuestion.isDailyDouble ? `DAILY DOUBLE: ${wager}` : currentQuestion.value}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center max-w-4xl w-full">
                {showAnswer ? (
                  <motion.h2 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-5xl sm:text-7xl font-black italic leading-tight text-emerald-400"
                  >
                    {currentQuestion.answer}
                  </motion.h2>
                ) : (
                  <div className="space-y-8 w-full">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-950/50 p-10 rounded-[3rem] border-4 border-white/10 shadow-2xl"
                    >
                      <h2 className="text-3xl sm:text-5xl font-black italic leading-tight">
                        {currentQuestion.clue}
                      </h2>
                    </motion.div>
                  </div>
                )}
              </div>

              <div className="w-full max-w-md space-y-4 mt-8">
                <div className="flex gap-4">
                  {!showAnswer ? (
                    <>
                      <button 
                        onClick={() => {
                          setSelectedQuestion(null);
                          setGameState('board');
                        }}
                        className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-colors"
                      >
                        BACK TO BOARD
                      </button>
                      <button 
                        onClick={handleNoScore}
                        className="flex-1 py-4 bg-red-900/40 text-red-200 rounded-2xl font-bold hover:bg-red-900/60 transition-colors"
                      >
                        SKIP SCORING
                      </button>
                      <button 
                        onClick={() => setShowAnswer(true)}
                        className="flex-[2] py-6 bg-yellow-400 text-blue-900 rounded-2xl font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-transform"
                      >
                        REVEAL ANSWER
                      </button>
                    </>
                  ) : (
                    <div className="w-full space-y-4">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleScore(false)}
                          className="flex-1 py-6 bg-red-500 text-white rounded-2xl font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                          <X size={32} /> WRONG
                        </button>
                        <button 
                          onClick={() => handleScore(true)}
                          className="flex-1 py-6 bg-emerald-500 text-white rounded-2xl font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                          <Check size={32} /> CORRECT
                        </button>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={handleNoScore}
                          className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors"
                        >
                          NO ONE CORRECT
                        </button>
                        <button 
                          onClick={() => setShowAnswer(false)}
                          className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                        >
                          <EyeOff size={16} /> HIDE ANSWER
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center p-8 text-center"
            >
              <Trophy size={120} className="text-yellow-400 mb-6" />
              <h2 className="text-6xl font-black italic mb-8 tracking-tighter uppercase">FINAL SCORES</h2>
              
              <div className="flex gap-8 mb-12">
                {teams.sort((a, b) => b.score - a.score).map((team, idx) => (
                  <div key={idx} className={cn("p-8 rounded-[2.5rem] border-4 border-white/20 flex flex-col items-center min-w-[200px]", team.color)}>
                    <span className="text-sm font-bold uppercase tracking-widest mb-2">{team.name}</span>
                    <span className="text-5xl font-black">${team.score}</span>
                    {idx === 0 && <Star className="text-yellow-400 fill-yellow-400 mt-4" size={32} />}
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mb-12">
                <button 
                  onClick={() => setGameState('board')}
                  className="px-8 py-4 bg-yellow-400 text-blue-900 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
                >
                  <LayoutGrid size={24} /> RESUME GAME
                </button>
                <button 
                  onClick={onExit}
                  className="px-8 py-4 bg-white text-blue-900 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-transform"
                >
                  BACK TO DASHBOARD
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Daily Double Modal */}
        <AnimatePresence>
          {showWagerInput && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-blue-950/90 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <div className="bg-blue-800 rounded-[3rem] p-12 max-w-md w-full text-center border-4 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.3)]">
                <div className="w-24 h-24 bg-yellow-400 rounded-3xl flex items-center justify-center text-blue-900 mx-auto mb-6 shadow-2xl animate-bounce">
                  <Star size={64} fill="currentColor" />
                </div>
                <h2 className="text-5xl font-black italic mb-2 tracking-tighter text-yellow-400">DAILY DOUBLE!</h2>
                <p className="text-blue-200 mb-8 font-bold uppercase tracking-widest">Wager your points!</p>
                
                <div className="flex flex-col gap-4">
                  <div className="text-6xl font-black text-white mb-4">${wager}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[100, 200, 500, 1000, 2000, teams[activeTeamIndex].score].map((val, i) => (
                      <button
                        key={i}
                        onClick={() => setWager(val)}
                        className="py-3 bg-blue-700 rounded-xl font-black hover:bg-blue-600 transition-colors border-2 border-white/10"
                      >
                        {val === teams[activeTeamIndex].score ? 'MAX' : `$${val}`}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      setShowWagerInput(false);
                      setGameState('question');
                    }}
                    className="mt-6 w-full py-6 bg-yellow-400 text-blue-900 rounded-2xl font-black text-2xl shadow-2xl active:scale-95 transition-transform"
                  >
                    LOCK IT IN
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const EndlessBlitzGame = ({ 
  allVerses, 
  onComplete, 
  onMistake, 
  onExit,
  volume,
  setVolume,
  isMusicEnabled,
  setIsMusicEnabled,
  musicStatus,
  setMusicStatus,
  setIsQuestionBankOpen,
  setBankStore
}: { 
  allVerses: Verse[], 
  onComplete: (xp: number) => void, 
  onMistake: () => void, 
  onExit: () => void,
  volume: number,
  setVolume: (v: number) => void,
  isMusicEnabled: boolean,
  setIsMusicEnabled: (v: boolean) => void,
  musicStatus: string,
  setMusicStatus: (v: string) => void,
  setIsQuestionBankOpen: (v: boolean) => void,
  setBankStore: (store: string) => void
}) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [gameMode, setGameMode] = useState<'classic' | 'reference'>('classic');
  const [userInput, setUserInput] = useState('');
  const [sessionMasteredKeys, setSessionMasteredKeys] = useState<string[]>([]);
  const [currentVerse, setCurrentVerse] = useState<Verse>(() => getNextEndlessVerse(allVerses, []));
  const words = useMemo(() => {
    // Remove ALL punctuation and commentary markers as per user request for Star Tower typing mode
    const cleanText = currentVerse.text
      .replace(/\{[^{}]*:[^{}]*\}/g, '') // Remove commentary markers
      .replace(/[\{\}\[\]\(\)]/g, '')     // Remove brackets/braces
      .replace(/[^\w\s]|_/g, "")         // Remove all other punctuation
      .replace(/\s+/g, " ")              // Normalize whitespace
      .trim();
    return cleanText.split(/\s+/).filter(Boolean);
  }, [currentVerse]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isAskingReference = currentIndex >= words.length;
  
  const options = useMemo(() => {
    if (!isAskingReference) {
      const correct = words[currentIndex];
      
      if (difficulty === 'master') {
        const correctFirstLetter = correct[0].toLowerCase();
        const usedLetters = new Set([correctFirstLetter]);
        const finalDistractors: string[] = [];
        
        // Try to get distractors from the verse first
        const verseDistractors = words
          .filter(w => w.toLowerCase() !== correct.toLowerCase())
          .sort(() => Math.random() - 0.5);
          
        for (const w of verseDistractors) {
          const firstLetter = w[0].toLowerCase();
          if (!usedLetters.has(firstLetter)) {
            finalDistractors.push(w);
            usedLetters.add(firstLetter);
            if (finalDistractors.length === 3) break;
          }
        }
        
        // Fallback pool if not enough unique letters in verse
        const fallbacks = ["Faith", "Grace", "Love", "Peace", "Hope", "Joy", "Kindness", "Mercy", "Truth", "Wisdom", "Strength", "Patience", "Christ", "Spirit", "Holy", "Lord", "God", "Bible"];
        const shuffledFallbacks = [...fallbacks].sort(() => Math.random() - 0.5);
        
        for (const w of shuffledFallbacks) {
          if (finalDistractors.length === 3) break;
          const firstLetter = w[0].toLowerCase();
          if (!usedLetters.has(firstLetter)) {
            finalDistractors.push(w);
            usedLetters.add(firstLetter);
          }
        }
        
        return [correct, ...finalDistractors].sort(() => Math.random() - 0.5);
      }

      const distractors = words
        .filter(w => w.toLowerCase() !== correct.toLowerCase())
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      const finalDistractors = [...distractors];
      const fallbackPool = ["Faith", "Grace", "Love", "Peace", "Hope"];
      while (finalDistractors.length < 3) {
        const randomFallback = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
        if (!finalDistractors.includes(randomFallback)) {
          finalDistractors.push(randomFallback);
        } else {
          // If already included, just push it anyway to break the loop if pool is small, 
          // but better to just push a random one.
          finalDistractors.push(randomFallback + " "); 
        }
      }

      return [correct, ...finalDistractors].sort(() => Math.random() - 0.5);
    } else {
      const correct = `${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`;
      const distractors = allVerses
        .filter(v => `${v.book} ${v.chapter}:${v.verse}` !== correct)
        .map(v => `${v.book} ${v.chapter}:${v.verse}`)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      const finalDistractors = [...distractors];
      const fallbackPool = ["Genesis 1:1", "John 3:16", "Psalm 23:1", "Psalm 119:105", "Proverbs 3:5"];
      while (finalDistractors.length < 3) {
        const randomFallback = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
        if (!finalDistractors.includes(randomFallback)) {
          finalDistractors.push(randomFallback);
        } else {
          finalDistractors.push(randomFallback + " ");
        }
      }

      return [correct, ...finalDistractors].sort(() => Math.random() - 0.5);
    }
  }, [currentIndex, words, allVerses, currentVerse, isAskingReference, difficulty]);

  const [mistakesInVerse, setMistakesInVerse] = useState(0);
  const [availableChunks, setAvailableChunks] = useState<{id: number, text: string, trayIndex?: number}[]>([]);
  const [placedChunks, setPlacedChunks] = useState<{id: number, text: string, trayIndex?: number}[]>([]);
  const wordAreaRectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const updateRect = () => {
      const container = document.getElementById('placed-chunks-container');
      if (container) {
        wordAreaRectRef.current = container.getBoundingClientRect();
      }
    };
    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateRect, 500);
    window.addEventListener('resize', updateRect);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
    };
  }, [gameMode, isAskingReference, availableChunks.length, placedChunks.length]);

  const [showSupernova, setShowSupernova] = useState(false);
  
  const [towerData, setTowerData] = useState<{
    stack: {id: number, word: string, height: number, color: string, isPlatform?: boolean}[]
  }>({ 
    stack: [{ id: -1, word: "", height: 100, color: '#1e293b', isPlatform: true }] 
  });

  const towerContainerRef = useRef<HTMLDivElement>(null);
  const verseRefContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showStart, setShowStart] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRedAlert, setIsRedAlert] = useState(false);
  const isRedAlertRef = useRef(false);
  const sinkRateRef = useRef(8); // Pixels per second
  const containerHeightRef = useRef(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [containerHeight, setContainerHeight] = useState(() => typeof window !== 'undefined' ? window.innerHeight : 800); 
  useEffect(() => {
    containerHeightRef.current = containerHeight;
  }, [containerHeight]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [timesSeen, setTimesSeen] = useState(0);
  const [totalNotesPlayed, setTotalNotesPlayed] = useState(0);
  const [bonusWordsFoundCount, setBonusWordsFoundCount] = useState(0);
  const [dictStatus, setDictStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize dictionary
  useEffect(() => {
    setDictStatus('loading');
    dictionaryService.init()
      .then(() => setDictStatus('ready'))
      .catch(err => {
        console.error('Dictionary init failed:', err);
        setDictStatus('error');
      });
  }, []);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUpdateRef = useRef(Date.now());
  const lastTapTimeRef = useRef(Date.now());
  const nextIdRef = useRef(0);
  const towerHeightRef = useRef(100); 
  const platformYRef = useRef(DANGER_LINE_PX); 
  const cameraYRef = useRef(0); // Smooth camera offset
  const stackRef = useRef(towerData.stack);
  useEffect(() => {
    stackRef.current = towerData.stack;
  }, [towerData.stack]);

  const [platformHeight, setPlatformHeight] = useState(100); 

  useEffect(() => {
    if (containerHeight > 0) {
      const newHeight = containerHeight * 0.20;
      setPlatformHeight(newHeight);
      // If game hasn't started or is resetting, update refs
      if (showStart) {
        towerHeightRef.current = newHeight;
        platformYRef.current = DANGER_LINE_PX;
        setTowerData(prev => ({
          stack: [{ id: -1, word: "", height: newHeight, color: '#1e293b', isPlatform: true }]
        }));
      }
    }
  }, [containerHeight, showStart]);

  useEffect(() => {
    if (gameMode === 'reference' && !isAskingReference && !isPaused && !isGameOver && !showTutorial && !showStart) {
      inputRef.current?.focus();
    }
  }, [gameMode, currentIndex, isAskingReference, isPaused, isGameOver, showTutorial, showStart]);

  // Tower colors
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

  useEffect(() => {
    const verseKey = `${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`;
    const updatedProgress = recordVerseSeen(verseKey);
    const count = updatedProgress.verseMastery[verseKey]?.timesSeen || 0;
    setTimesSeen(count);
  }, [currentVerse]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const heightPx = entry.contentRect.height;
        setContainerHeight(heightPx);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const isPruningRef = useRef(false);
  useEffect(() => {
    if (showStart || isGameOver || showTutorial || isPaused) return;
    
    let active = true;
    const tick = () => {
      if (!active) return;
      
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastUpdateRef.current) / 1000); 
      lastUpdateRef.current = now;

      // 1. SINKING - Relentless downward motion
      platformYRef.current -= sinkRateRef.current * dt;
      
      // 2. CAMERA TRACKING - Simple follow
      const topOfTower = platformYRef.current + towerHeightRef.current;
      const targetCameraY = Math.max(0, topOfTower - containerHeightRef.current * 0.6); 
      
      if (targetCameraY > cameraYRef.current) {
        // Follow UP quickly to keep tower top in view
        const followSpeed = 4.0; 
        cameraYRef.current += (targetCameraY - cameraYRef.current) * (1 - Math.exp(-followSpeed * dt));
      } else {
        // Follow DOWN extremely slowly to ensure sinking is visible
        const followSpeed = 0.05; 
        cameraYRef.current += (targetCameraY - cameraYRef.current) * (1 - Math.exp(-followSpeed * dt));
      }

      // Hard safety: never let the top of the tower go above 85% visually
      const visualTop = topOfTower - cameraYRef.current;
      if (visualTop > containerHeightRef.current * 0.85) {
        cameraYRef.current = topOfTower - containerHeightRef.current * 0.85;
      }

      // 3. GAME OVER CHECK
      const redAlertActive = visualTop < containerHeightRef.current * 0.25;

      if (visualTop <= DANGER_LINE_PX) {
        setIsGameOver(true);
        // Sync ref to prevent visual jump on game over screen
        platformYRef.current = cameraYRef.current + DANGER_LINE_PX - towerHeightRef.current;
        return; 
      }

      // 4. RENDER - GPU Accelerated translate3d
      if (Number.isFinite(platformYRef.current) && towerContainerRef.current) {
        const visualY = platformYRef.current - cameraYRef.current;
        towerContainerRef.current.style.transform = `translate3d(0, ${-visualY}px, 0)`;
      }

      // 5. RED ALERT UI SYNC
      if (redAlertActive !== isRedAlertRef.current) {
        isRedAlertRef.current = redAlertActive;
        setIsRedAlert(redAlertActive);
        
        if (towerContainerRef.current) {
          if (redAlertActive) {
            towerContainerRef.current.classList.add('red-alert-pulse');
          } else {
            towerContainerRef.current.classList.remove('red-alert-pulse');
          }
        }
      }

      // 6. PRUNE OFF-SCREEN BLOCKS (REMOVED)
      // This section was causing flashing and is no longer needed.

      // 7. ACCELERATION
      // Ensure sink rate is at least 8 and continues to accelerate
      sinkRateRef.current += 0.05 * dt; 

      requestAnimationFrame(tick);
    };

    lastUpdateRef.current = performance.now();
    const animId = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(animId);
    };
  }, [showStart, isGameOver, showTutorial, isPaused]);

  // Sound Effects Engine
  const playSound = useCallback((freq: number, type: OscillatorType, dur: number, vol: number = 0.2, noSweep: boolean = false) => {
    if (!audioCtxRef.current || isPaused) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    // Frequency sweep for effects
    if (!noSweep) {
      if (freq > 500) { // Correct/High - Bright Chime
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, ctx.currentTime + dur);
      } else if (freq < 300 && freq > 0) { // Incorrect/Low - Dissonant Thud
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, ctx.currentTime + dur);
      }
    }

    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(vol * volume, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    
    osc.connect(g);
    g.connect(ctx.destination); 
    
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }, [volume, isPaused]);

  const playCorrectSound = useCallback(() => {
    // Pleasing bright chime
    playSound(880, 'sine', 0.15, 0.2, false);
    setTimeout(() => playSound(1320, 'sine', 0.2, 0.15, false), 50);
  }, [playSound]);

  const playIncorrectSound = useCallback(() => {
    // Less pleasing thud
    playSound(180, 'triangle', 0.3, 0.4, false);
  }, [playSound]);

  const playMelodyNote = useCallback((word: string, globalIndex: number) => {
    playCorrectSound();
  }, [playCorrectSound]);

  // Music is now universal

  // External Hymn Player - Volume Logic
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume * 0.4;
    }
  }, [volume]);

  const completeVerse = useCallback((choice: string, timeDelta: number) => {
    const correctRef = `${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`;
    
    // Play success sound
    playSound(880, 'sine', 0.2, 0.2);
    setTimeout(() => playSound(1100, 'sine', 0.2, 0.2), 100);
    
    const verseKey = `${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`;
    
    // Promote verse
    promoteVerse(verseKey);
    
    // Track played mastered verses to avoid repeats in same session
    const currentProgress = getProgress();
    const updatedPlayedMastered = [...sessionMasteredKeys];
    if (currentProgress.masteredVerses.includes(verseKey)) {
      if (!updatedPlayedMastered.includes(verseKey)) {
        updatedPlayedMastered.push(verseKey);
      }
      setSessionMasteredKeys(updatedPlayedMastered);
    }
    
    // Get next verse using world-class logic
    const nextVerseKey = getNextVerseKey(allVerses, updatedPlayedMastered);
    
    const nextVerse = allVerses.find(v => `${v.book} ${v.chapter}:${v.verse}` === nextVerseKey) || allVerses[0];
    
    // Set mode and difficulty for next verse
    const nextLevel = getVerseLevel(nextVerseKey);
    const config = getLevelConfig(nextLevel);
    setGameMode(config.mode);
    setDifficulty(config.difficulty);

    setCurrentVerse(nextVerse);
    setCurrentIndex(0);
    setMistakesInVerse(0);
    setUserInput('');
    
    const newStreak = streak + 1;
    setStreak(newStreak);
    setScore(prev => prev + 1); 
    
    setConsecutiveCorrect(prev => prev + 1);
    
    // Speed = Height calculation
    const height = containerHeight * 0.20; 
    
    // ATOMIC UPDATE: Sync refs with state change
    towerHeightRef.current += height;
    
    setTowerData(prev => {
      const newStack = [
        ...prev.stack,
        {
          id: nextIdRef.current++,
          word: "✓ " + correctRef,
          height,
          color: '#fbbf24' // Golden color for reference
        }
      ];
      return { stack: newStack };
    });
  }, [currentVerse, allVerses, streak, containerHeight, volume, isPaused, sessionMasteredKeys]);

  const handleChoice = useCallback((choice: string) => {
    if (isGameOver || showTutorial || isPaused) return;
    const now = Date.now();
    const timeDelta = now - lastTapTimeRef.current;

    if (isAskingReference) {
      const correctRef = `${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`;
      if (choice === correctRef) {
        lastTapTimeRef.current = now;
        completeVerse(choice, timeDelta);
      } else {
        playIncorrectSound();
        setStreak(0);
        setConsecutiveCorrect(0);
        setMistakesInVerse(prev => prev + 1);
        
        if (towerContainerRef.current) {
          towerContainerRef.current.classList.add('animate-shake');
          setTimeout(() => {
            towerContainerRef.current?.classList.remove('animate-shake');
          }, 500);
        }
      }
      return;
    }

    if (choice === words[currentIndex]) {
      lastTapTimeRef.current = now;
      playMelodyNote(words[currentIndex], totalNotesPlayed);
      setTotalNotesPlayed(prev => prev + 1);
      const word = words[currentIndex];
      
      // Speed = Height calculation
      const height = containerHeight * 0.20; 

      // ATOMIC UPDATE: Sync refs with state change
      towerHeightRef.current += height;
      
      setTowerData(prev => {
        const newStack = [
          ...prev.stack, 
          { 
            id: nextIdRef.current++, 
            word, 
            height,
            color: colors[score % colors.length]
          }
        ];
        return { stack: newStack };
      });
      
      const nextIdx = currentIndex + 1;
      if (gameMode === 'reference' && nextIdx >= words.length) {
        completeVerse(words[currentIndex], timeDelta);
      } else {
        setCurrentIndex(nextIdx);
        
        const newStreak = streak + 1;
        setStreak(newStreak);
        setScore(prev => prev + 1); 

        setConsecutiveCorrect(prev => prev + 1);
      }
    } else {
      playIncorrectSound();
      setStreak(0);
      setConsecutiveCorrect(0);
      setMistakesInVerse(prev => prev + 1);
      
      if (towerContainerRef.current) {
        towerContainerRef.current.classList.add('animate-shake');
        setTimeout(() => {
          towerContainerRef.current?.classList.remove('animate-shake');
        }, 500);
      }
    }
  }, [isGameOver, showTutorial, isPaused, isAskingReference, currentVerse, completeVerse, words, currentIndex, totalNotesPlayed, score, streak, consecutiveCorrect, gameMode]);

  const generateTray = useCallback((targetWord: string) => {
    const word = targetWord.toUpperCase();
    let chunks: { id: number, text: string }[] = [];
    
    // Always include target word letters/chunks
    if (word.length > 7) {
      for (let i = 0; i < word.length; i += 3) {
        chunks.push({
          id: i,
          text: word.substring(i, i + 3)
        });
      }
      // No filler letters for words > 7 letters as requested
    } else {
      chunks = word.split('').map((char, i) => ({ id: i, text: char }));
      
      // Fill to at least 7 tiles if needed (only for short words)
      let nextId = Date.now();
      while (chunks.length < 7) {
        const randomChar = ENGLISH_FREQUENCIES[Math.floor(Math.random() * ENGLISH_FREQUENCIES.length)];
        chunks.push({ id: nextId++, text: randomChar });
      }
    }
    
    return chunks.sort(() => Math.random() - 0.5).map((c, i) => ({ ...c, trayIndex: i, isUsed: false }));
  }, []);

  useEffect(() => {
    if (gameMode === 'reference' && !isAskingReference) {
      solvedWordRef.current = null;
      const tray = generateTray(words[currentIndex]);
      setAvailableChunks(tray);
      setPlacedChunks([]);
      setBonusWordsFoundCount(0);
    }
  }, [currentIndex, currentVerse, gameMode, isAskingReference, words, generateTray]);

  const solvedWordRef = useRef<string | null>(null);

  const handleChunkTap = useCallback((chunkObj: {id: number, text: string, trayIndex?: number}, index?: number) => {
    if (isGameOver || isPaused || showStart) return;
    
    setAvailableChunks(prev => prev.map(c => c.id === chunkObj.id ? { ...c, isUsed: true } : c));
    setPlacedChunks(prev => {
      const next = [...prev];
      if (typeof index === 'number') {
        next.splice(index, 0, chunkObj);
      } else {
        next.push(chunkObj);
      }
      // Play sound inside functional update to get correct length without dependency
      playSound(440 + next.length * 40, 'sine', 0.1, 0.1);
      return next;
    });
  }, [isGameOver, isPaused, showStart]);

  // Win detection logic
  const isCorrect = useMemo(() => {
    if (gameMode !== 'reference' || isAskingReference) return false;
    const targetWord = words[currentIndex].toUpperCase();
    const currentText = placedChunks.map(c => c.text).join('');
    return currentText === targetWord;
  }, [placedChunks, currentIndex, words, gameMode, isAskingReference]);

  const handleSubmit = useCallback(async () => {
    const currentText = placedChunks.map(c => c.text).join('');
    const targetWord = words[currentIndex].toUpperCase();

    if (isCorrect && solvedWordRef.current !== targetWord) {
      solvedWordRef.current = targetWord;
      handleChoice(words[currentIndex]);
    } else if (currentText.length >= 4) {
      const isValid = await dictionaryService.isValidWord(currentText);
      if (isValid) {
        const now = Date.now();
        const timeDelta = now - lastTapTimeRef.current;
        lastTapTimeRef.current = now;

        // Valid bonus word!
        playSound(660, 'sine', 0.2, 0.2);
        setTimeout(() => playSound(880, 'sine', 0.2, 0.2), 100);
        
        // Speed = Height calculation
        const height = containerHeight * 0.20; 
        
        // Add block to tower
        towerHeightRef.current += height;
        
        setTowerData(prev => ({
          ...prev,
          stack: [...prev.stack, {
            id: Date.now(),
            word: currentText,
            height,
            color: '#f59e0b', // Gold for bonus
          }]
        }));
        
        // Increment score for bonus word
        setScore(prev => prev + 1);

        const newBonusCount = bonusWordsFoundCount + 1;
        if (newBonusCount >= 10) {
          // Mercy rule!
          solvedWordRef.current = targetWord;
          handleChoice(words[currentIndex]);
          setBonusWordsFoundCount(0);
        } else {
          setBonusWordsFoundCount(newBonusCount);
          // Reroll tray (but keep target word letters)
          const newTray = generateTray(targetWord);
          setAvailableChunks(newTray);
          setPlacedChunks([]);
        }
      } else {
        // Shake effect for wrong answer
        if (towerContainerRef.current) {
          towerContainerRef.current.classList.add('animate-shake');
          setTimeout(() => {
            towerContainerRef.current?.classList.remove('animate-shake');
          }, 500);
        }
        playSound(150, 'sawtooth', 0.2, 0.1);
      }
    } else if (placedChunks.length > 0) {
      // Shake effect for too short
      if (towerContainerRef.current) {
        towerContainerRef.current.classList.add('animate-shake');
        setTimeout(() => {
          towerContainerRef.current?.classList.remove('animate-shake');
        }, 500);
      }
      playSound(150, 'sawtooth', 0.2, 0.1);
    }
  }, [isCorrect, words, currentIndex, handleChoice, placedChunks, bonusWordsFoundCount, generateTray, playSound]);

  const handlePlacedChunkTap = useCallback((chunkObj: {id: number, text: string, trayIndex?: number}) => {
    if (isGameOver || isPaused || showStart) return;
    
    setPlacedChunks(prev => prev.filter(c => c.id !== chunkObj.id));
    setAvailableChunks(prev => prev.map(c => c.id === chunkObj.id ? { ...c, isUsed: false } : c));
    playSound(330, 'sine', 0.1, 0.1);
  }, [isGameOver, isPaused, showStart]);

  const handleClearAll = useCallback(() => {
    if (placedChunks.length === 0) return;
    setAvailableChunks(prev => prev.map(c => ({ ...c, isUsed: false })));
    setPlacedChunks([]);
    playSound(220, 'sine', 0.1, 0.1);
  }, [placedChunks, playSound]);

  const handleShuffle = useCallback(() => {
    if (placedChunks.length > 0) return;
    setAvailableChunks(prev => [...prev].sort(() => Math.random() - 0.5));
    playSound(220, 'sine', 0.1, 0.1);
  }, [placedChunks.length, playSound]);

  const handleReorder = useCallback((newOrder: {id: number, text: string, trayIndex?: number}[]) => {
    setPlacedChunks(newOrder);
  }, []);

  // Optimized drag-to-place detection
  const handleDragToPlace = useCallback((chunk: {id: number, text: string}, info: any) => {
    if (info.offset.y < -60) {
      handleChunkTap(chunk);
    }
  }, [handleChunkTap]);

  const handleDragToUndo = useCallback((chunk: {id: number, text: string}, info: any) => {
    if (info.offset.y > 60) {
      handlePlacedChunkTap(chunk);
    }
  }, [handlePlacedChunkTap]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameMode !== 'reference' || isAskingReference || isGameOver || isPaused || showTutorial || showStart) return;
      
      const char = e.key.toUpperCase();
      if (/^[A-Z]$/.test(char)) {
        const availableChunk = availableChunks.find(c => c.text === char);
        if (availableChunk) {
          handleChunkTap(availableChunk);
        } else {
          // If not in available, maybe it's in placed and user wants to remove it?
          // But usually Jumbline keyboard just types.
          // Let's just play a small error sound if they type something not available.
          playIncorrectSound();
        }
      } else if (e.key === 'Backspace') {
        if (placedChunks.length > 0) {
          handlePlacedChunkTap(placedChunks[placedChunks.length - 1]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode, isAskingReference, isGameOver, isPaused, showTutorial, showStart, availableChunks, placedChunks, handleChunkTap, handlePlacedChunkTap]);

  const startLaunch = () => {
    if (dontShowAgain) {
      localStorage.setItem('endless_tutorial_dismissed', 'true');
    }
    setShowTutorial(false);
    lastTapTimeRef.current = Date.now();
    lastUpdateRef.current = performance.now();
  };

  const handleIgnite = () => {
    if (containerHeight <= 0) return; // Guard against invalid state
    
    // Reset game state
    setScore(0);
    setStreak(0);
    setConsecutiveCorrect(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsRedAlert(false);
    isRedAlertRef.current = false;
    setCurrentIndex(0);
    setMistakesInVerse(0);
    setShowStart(false);
    
    // Initialize learning verses
    const learning = getLearningVerses(allVerses);
    const firstVerseKey = learning[0];
    const firstVerse = allVerses.find(v => `${v.book} ${v.chapter}:${v.verse}` === firstVerseKey) || allVerses[0];
    setCurrentVerse(firstVerse);
    
    // Set initial mode and difficulty based on verse level
    const level = getVerseLevel(firstVerseKey);
    const config = getLevelConfig(level);
    setGameMode(config.mode);
    setDifficulty(config.difficulty);

    // Reset physics refs for a fresh start
    const startHeight = containerHeight * 0.20;
    const startY = containerHeight * 0.3;
    
    platformYRef.current = DANGER_LINE_PX;
    cameraYRef.current = 0;
    towerHeightRef.current = startHeight;
    
    // Set sink rate based on difficulty
    if (difficulty === 'extreme') sinkRateRef.current = 25;
    else if (difficulty === 'master') sinkRateRef.current = 20;
    else if (difficulty === 'advanced') sinkRateRef.current = 15;
    else if (difficulty === 'hard') sinkRateRef.current = 12;
    else if (difficulty === 'medium') sinkRateRef.current = 8;
    else sinkRateRef.current = 5;

    nextIdRef.current = 0;
    lastUpdateRef.current = performance.now();
    lastTapTimeRef.current = Date.now();
    
    setTowerData({
      stack: [{ id: -1, word: "", height: startHeight, color: '#1e293b', isPlatform: true }]
    });

    // Initialize audio context on user gesture
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    
    // Music is now universal
    
    setShowStart(false);
  };

  const masteredKeys = useMemo(() => {
    const progress = getProgress();
    return Object.keys(progress.verseMastery || {})
      .filter(key => progress.verseMastery[key].status === 'supernova');
  }, []);

  const currentProgress = useMemo(() => {
    const p = getProgress();
    return { verseMastery: p.verseMastery };
  }, [sessionMasteredKeys.length]);

  if (showStart) {
    const difficulties: {id: Difficulty, label: string, xp: string}[] = [
      { id: 'easy', label: 'Easy', xp: '1x XP' },
      { id: 'medium', label: 'Medium', xp: '1.5x XP' },
      { id: 'advanced', label: 'Advanced', xp: '2x XP' },
      { id: 'master', label: 'Master', xp: '3x XP' }
    ];

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 bg-slate-950 text-white overflow-y-auto custom-scrollbar">
        {/* Background Stars */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: Math.random() * 3 + 2, delay: Math.random() * 2 }}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
            />
          ))}
        </div>

        <button 
          onClick={onExit}
          className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors z-50"
        >
          <X size={28} />
        </button>

        <div className="text-center z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-24 h-24 mx-auto mb-4"
          >
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
            <Rocket size={60} className="text-blue-400 absolute inset-0 m-auto animate-bounce" />
            <Star size={30} className="text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
          </motion.div>
          
          <h3 className="text-3xl font-black mb-2 tracking-tighter italic">STAR TOWER</h3>
          
          <div className="space-y-2 max-w-[280px] mx-auto mb-6">
            <p className="text-blue-200/60 text-xs font-medium leading-relaxed">
              Build your <span className="text-white font-bold">Constellation of Verses</span> by stacking the Word.
            </p>
          </div>
        </div>

        <button 
          onClick={handleIgnite}
          className="relative group z-10"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative px-12 py-4 bg-slate-900 border border-white/10 rounded-2xl font-black text-lg tracking-widest text-white shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
            IGNITE MISSION <ChevronRight size={20} className="text-blue-400" />
          </div>
        </button>
      </div>
    );
  }

  if (showTutorial) {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-8 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl text-white custom-scrollbar"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center">
              <Zap size={32} className="text-blue-400" />
            </div>
          </div>
          
          <h3 className="text-2xl font-black text-center mb-6 tracking-tight uppercase">Mission Briefing</h3>
          
          <div className="space-y-6 mb-8">
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-blue-400 font-bold">1</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-bold">Speed = Height.</span> Tapping words instantly creates massive blocks. Hesitating creates thin ones.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-rose-400 font-bold">2</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-bold">Stay Above the Line.</span> The tower is sinking. If the <span className="text-rose-400 font-bold underline">TOP</span> of your stack falls below the red laser, you collapse.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-yellow-400 font-bold">3</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-bold">No Hints.</span> Use your memory to build the tower. Every word counts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6 px-2">
            <button 
              onClick={() => setDontShowAgain(!dontShowAgain)}
              className={cn(
                "w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center",
                dontShowAgain ? "bg-blue-500 border-blue-500" : "border-slate-700 bg-slate-800"
              )}
            >
              {dontShowAgain && <CheckCircle2 size={16} className="text-white" />}
            </button>
            <span className="text-xs text-slate-400 font-medium">Don't show this again</span>
          </div>

          <button 
            onClick={startLaunch}
            className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
          >
            I'M READY
          </button>
        </motion.div>
      </div>
    );
  }

  if (isGameOver) {
    const xpMultiplier = difficulty === 'extreme' ? 4 : difficulty === 'master' ? 3 : difficulty === 'advanced' ? 2 : difficulty === 'hard' ? 1.75 : difficulty === 'medium' ? 1.5 : 1;
    const finalXP = Math.round(score * xpMultiplier);

    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-6 bg-slate-950 rounded-3xl shadow-xl border-2 border-slate-800 h-full text-white overflow-y-auto">
        <div className="text-center w-full">
          <h3 className="text-4xl font-black text-rose-500 mb-4 italic tracking-tighter">COLLAPSED</h3>
          
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 mb-6 text-left">
            <p className="text-rose-500 font-black text-[10px] uppercase tracking-widest mb-2">Final Verse</p>
            <p className="text-lg font-bold leading-tight mb-2 italic">"{currentVerse.text.replace(/\{[^{}]*:[^{}]*\}/g, "").replace(/[^\w\s]|_/g, "").replace(/[\{\}\[\]\(\)]/g, "").replace(/\s+/g, " ").trim()}"</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              — {`${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`}
            </p>
          </div>

          <div className="flex justify-around items-center mb-6">
            <div className="text-center">
              <div className="text-5xl font-black text-white tracking-tighter">{score}</div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.1em] text-[10px]">Words Stacked</p>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-5xl font-black text-blue-400 tracking-tighter">+{finalXP}</div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.1em] text-[10px]">XP Earned</p>
            </div>
          </div>

          <div className="bg-blue-600/20 border border-blue-500/30 px-4 py-2 rounded-xl inline-block mb-6">
            <span className="text-blue-400/60 text-[10px] block uppercase tracking-widest font-bold">{difficulty} Multiplier</span>
          </div>
        </div>
        <button 
          onClick={() => onComplete(finalXP)}
          className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
        >
          COLLECT XP
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col transition-transform duration-75 h-full overflow-hidden">
      <Background masteredKeys={masteredKeys} progress={currentProgress} />

      <HUD 
        score={score}
        streak={streak}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        lastUpdateRef={lastUpdateRef}
        gameMode={gameMode}
        dictStatus={dictStatus}
        currentVerse={currentVerse}
        setIsSettingsOpen={setIsSettingsOpen}
      />

      <SettingsOverlay 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        volume={volume}
        setVolume={setVolume}
        isMusicEnabled={isMusicEnabled}
        setIsMusicEnabled={setIsMusicEnabled}
        musicStatus={musicStatus}
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
      />

      {/* The Tower Area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {/* Pause Overlay */}
        <AnimatePresence>
          {isPaused && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="text-center">
                <h2 className="text-5xl font-black text-white mb-8 tracking-tighter italic">PAUSED</h2>
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => {
                      lastUpdateRef.current = performance.now();
                      setIsPaused(false);
                    }}
                    className="px-12 py-4 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-2xl active:scale-95 transition-transform"
                  >
                    RESUME
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          ref={towerContainerRef}
          className="absolute inset-0 pointer-events-none will-change-transform"
        >
          <TowerStack stack={towerData.stack} />
        </div>

        {/* Danger Line - High Visibility Laser */}
        <div 
          className={cn(
            "absolute left-0 right-0 h-1 bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1),0_0_40px_rgba(244,63,94,0.6)] z-50 flex items-center justify-center transition-all",
            isRedAlert && "danger-line-pulse bg-rose-400"
          )}
          style={{ bottom: `${DANGER_LINE_PX}px` }}
        />
      </div>

      {/* Buttons: Minimalist */}
      <div className="h-[180px] bg-slate-950/80 backdrop-blur-md z-40 border-t border-white/10">
        {gameMode === 'reference' && !isAskingReference ? (
          <ReferenceGameUI 
            availableChunks={availableChunks}
            placedChunks={placedChunks}
            handleChunkTap={handleChunkTap}
            handlePlacedChunkTap={handlePlacedChunkTap}
            handleClearAll={handleClearAll}
            handleShuffle={handleShuffle}
            handleSubmit={handleSubmit}
            handleReorder={handleReorder}
            isCorrect={isCorrect}
            wordAreaRectRef={wordAreaRectRef}
            bonusWordsFoundCount={bonusWordsFoundCount}
            currentVerse={currentVerse}
          />
        ) : (
          <ChoiceGameUI 
            options={options}
            isAskingReference={isAskingReference}
            currentVerse={currentVerse}
            words={words}
            currentIndex={currentIndex}
            difficulty={difficulty}
            handleChoice={handleChoice}
          />
        )}
      </div>
    </div>
  );
};

// --- Math Tower Logic ---

type MathOp = 'addition' | 'subtraction' | 'multiplication' | 'division';

interface MathEquation {
  text: string;
  isCorrect: boolean;
  type: MathOp;
}

const generateMathProblem = (score: number, difficulty: Difficulty = 'medium'): { options: MathEquation[], correctEquation: string, type: MathOp } => {
  const ops: MathOp[] = ['addition', 'subtraction', 'multiplication', 'division'];
  const type = ops[Math.floor(Math.random() * ops.length)];
  
  // Scale range with score AND difficulty
  const diffMultiplier = difficulty === 'extreme' ? 3 : difficulty === 'master' ? 2.5 : difficulty === 'advanced' ? 2 : difficulty === 'hard' ? 1.5 : difficulty === 'medium' ? 1 : 0.5;
  const range = (10 + Math.floor(score / 5) * 5) * diffMultiplier;
  let a = 0, b = 0, result = 0;
  let equationText = "";

  if (type === 'addition') {
    a = Math.floor(Math.random() * range) + 1;
    b = Math.floor(Math.random() * range) + 1;
    result = a + b;
    equationText = `${a} + ${b} = ${result}`;
  } else if (type === 'subtraction') {
    result = Math.floor(Math.random() * range) + 1;
    b = Math.floor(Math.random() * range) + 1;
    a = result + b;
    equationText = `${a} - ${b} = ${result}`;
  } else if (type === 'multiplication') {
    const mRange = 5 + Math.floor(score / 10) * 2;
    a = Math.floor(Math.random() * mRange) + 2;
    b = Math.floor(Math.random() * mRange) + 2;
    result = a * b;
    equationText = `${a} × ${b} = ${result}`;
  } else { // division
    const dRange = 5 + Math.floor(score / 10) * 2;
    result = Math.floor(Math.random() * dRange) + 2;
    b = Math.floor(Math.random() * dRange) + 2;
    a = result * b;
    equationText = `${a} ÷ ${b} = ${result}`;
  }

  const correct: MathEquation = { text: equationText, isCorrect: true, type };
  const options: MathEquation[] = [correct];

  // Generate 3 distractors
  while (options.length < 4) {
    let distractorText = "";
    const distractorType = type; // Keep same type for consistency in options
    
    // Smart distractors: same numbers but wrong result
    const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
    const wrongResult = Math.max(0, result + offset);
    
    if (distractorType === 'addition') {
      distractorText = `${a} + ${b} = ${wrongResult}`;
    } else if (distractorType === 'subtraction') {
      distractorText = `${a} - ${b} = ${wrongResult}`;
    } else if (distractorType === 'multiplication') {
      distractorText = `${a} × ${b} = ${wrongResult}`;
    } else {
      distractorText = `${a} ÷ ${b} = ${wrongResult}`;
    }

    if (!options.find(o => o.text === distractorText)) {
      options.push({ text: distractorText, isCorrect: false, type: distractorType });
    }
  }

  return { 
    options: options.sort(() => Math.random() - 0.5), 
    correctEquation: equationText,
    type 
  };
};

// --- Chronology Tower Logic ---

const BIBLE_EVENTS = [
  { id: 1, text: "Creation", order: 1 },
  { id: 2, text: "The Flood", order: 2 },
  { id: 3, text: "Call of Abraham", order: 3 },
  { id: 4, text: "Exodus from Egypt", order: 4 },
  { id: 5, text: "Giving of the Law", order: 5 },
  { id: 6, text: "Entering Promised Land", order: 6 },
  { id: 7, text: "Reign of King David", order: 7 },
  { id: 8, text: "Building First Temple", order: 8 },
  { id: 9, text: "Babylonian Exile", order: 9 },
  { id: 10, text: "Birth of Jesus", order: 10 },
  { id: 11, text: "Baptism of Jesus", order: 11 },
  { id: 12, text: "Crucifixion", order: 12 },
  { id: 13, text: "Pentecost", order: 13 },
  { id: 14, text: "Conversion of Paul", order: 14 }
];

const generateChronologyQuestion = () => {
  const baseIdx = Math.floor(Math.random() * (BIBLE_EVENTS.length - 1));
  const baseEvent = BIBLE_EVENTS[baseIdx];
  const correctEvent = BIBLE_EVENTS[baseIdx + 1];
  
  const distractors = BIBLE_EVENTS
    .filter(e => e.id !== correctEvent.id && e.id !== baseEvent.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
    
  const options = [correctEvent, ...distractors].sort(() => Math.random() - 0.5);
  
  return {
    baseEvent,
    correctEvent,
    options
  };
};

// --- Spelling Tower Logic ---

const BIBLE_NAMES = [
  "ABRAHAM", "ISAAC", "JACOB", "JOSEPH", "MOSES", "JOSHUA", "GIDEON", "SAMSON", "SAMUEL", "DAVID", "SOLOMON", "ELIJAH", "ELISHA", "ISAIAH", "JEREMIAH", "EZEKIEL", "DANIEL", "PETER", "JAMES", "JOHN", "ANDREW", "PHILIP", "THOMAS", "MATTHEW", "PAUL", "TIMOTHY"
];

const generateSpellingQuestion = (currentName: string, currentIndex: number) => {
  const name = currentName || BIBLE_NAMES[Math.floor(Math.random() * BIBLE_NAMES.length)];
  const nextChar = name[currentIndex];
  
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const distractors: string[] = [];
  while (distractors.length < 3) {
    const char = alphabet[Math.floor(Math.random() * alphabet.length)];
    if (char !== nextChar && !distractors.includes(char)) {
      distractors.push(char);
    }
  }
  
  const options = [nextChar, ...distractors].sort(() => Math.random() - 0.5);
  
  return {
    name,
    nextChar,
    options
  };
};

// --- Parable Tower Logic ---

const BIBLE_PARABLES = [
  { name: "The Sower", meaning: "Spreading the Word of God" },
  { name: "The Good Samaritan", meaning: "Loving your neighbor" },
  { name: "The Prodigal Son", meaning: "God's forgiveness" },
  { name: "The Lost Sheep", meaning: "God seeks the lost" },
  { name: "The Mustard Seed", meaning: "Growth of the Kingdom" },
  { name: "The Hidden Treasure", meaning: "Value of the Kingdom" },
  { name: "The Persistent Widow", meaning: "Persistence in prayer" },
  { name: "The Pharisee and Publican", meaning: "Humility in prayer" },
  { name: "The Ten Virgins", meaning: "Being prepared" },
  { name: "The Talents", meaning: "Using God's gifts" }
];

const generateParableQuestion = () => {
  const correct = BIBLE_PARABLES[Math.floor(Math.random() * BIBLE_PARABLES.length)];
  const distractors = BIBLE_PARABLES
    .filter(p => p.name !== correct.name)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
    
  const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
  
  return {
    parable: correct,
    options
  };
};

const ChronologyTowerGame = ({ 
  onComplete, 
  onMistake, 
  onExit, 
  isOutOfHearts,
  volume,
  setVolume,
  isMusicEnabled,
  setIsMusicEnabled,
  musicStatus,
  setMusicStatus
}: { 
  onComplete: (xp: number) => void, 
  onMistake: () => void, 
  onExit: () => void, 
  isOutOfHearts: boolean,
  volume: number,
  setVolume: (v: number) => void,
  isMusicEnabled: boolean,
  setIsMusicEnabled: (v: boolean) => void,
  musicStatus: string,
  setMusicStatus: (v: string) => void
}) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showStart, setShowStart] = useState(true);
  const [question, setQuestion] = useState(() => generateChronologyQuestion());
  const [towerData, setTowerData] = useState<{
    stack: {id: number, word: string, height: number, color: string, isPlatform?: boolean}[]
  }>({ 
    stack: [{ id: -1, word: "", height: 100, color: '#1e293b', isPlatform: true }] 
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const towerContainerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastUpdateRef = useRef(performance.now());
  const lastTapTimeRef = useRef(Date.now());
  const nextIdRef = useRef(0);
  const platformYRef = useRef(DANGER_LINE_PX);
  const towerHeightRef = useRef(100);
  const cameraYRef = useRef(0);
  const sinkRateRef = useRef(8);
  const [containerHeight, setContainerHeight] = useState(800);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (containerHeight > 0 && showStart) {
      const h = containerHeight * 0.20;
      towerHeightRef.current = h;
      setTowerData({ stack: [{ id: -1, word: "", height: h, color: '#1e293b', isPlatform: true }] });
    }
  }, [containerHeight, showStart]);

  useEffect(() => {
    if (showStart || isGameOver || isOutOfHearts) return;
    let active = true;
    const tick = () => {
      if (!active) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastUpdateRef.current) / 1000);
      lastUpdateRef.current = now;
      platformYRef.current -= sinkRateRef.current * dt;
      const topOfTower = platformYRef.current + towerHeightRef.current;
      const targetCameraY = Math.max(0, topOfTower - containerHeight * 0.6);
      cameraYRef.current += (targetCameraY - cameraYRef.current) * (1 - Math.exp(-4 * dt));
      if (topOfTower - cameraYRef.current <= DANGER_LINE_PX) {
        setIsGameOver(true);
        return;
      }
      if (towerContainerRef.current) {
        towerContainerRef.current.style.transform = `translate3d(0, ${-(platformYRef.current - cameraYRef.current)}px, 0)`;
      }
      sinkRateRef.current += 0.3 * dt;
      requestAnimationFrame(tick);
    };
    lastUpdateRef.current = performance.now();
    const animId = requestAnimationFrame(tick);
    return () => { active = false; cancelAnimationFrame(animId); };
  }, [showStart, isGameOver, isOutOfHearts, containerHeight]);

  const handleChoice = (event: any) => {
    if (isGameOver || showStart) return;
    if (event.id === question.correctEvent.id) {
      setScore(s => s + 10);
      setStreak(s => s + 1);
      const h = containerHeight * 0.20;
      towerHeightRef.current += h;
      setTowerData(prev => ({
        stack: [...prev.stack, { id: nextIdRef.current++, word: event.text, height: h, color: '#f43f5e' }]
      }));
      setQuestion(generateChronologyQuestion());
      lastTapTimeRef.current = Date.now();
    } else {
      setStreak(0);
      onMistake();
    }
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden flex flex-col">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500/50 z-20" style={{ bottom: DANGER_LINE_PX }} />
      </div>

      <div ref={towerContainerRef} className="absolute left-0 right-0 bottom-0 flex flex-col-reverse items-center transition-transform duration-75 ease-out will-change-transform">
        {towerData.stack.map((block) => (
          <TowerBlock key={block.id} {...block} containerHeight={containerHeight} />
        ))}
      </div>

      <div className="relative z-30 p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onExit} className="p-2 bg-white/10 rounded-xl text-white"><ArrowLeft /></button>
          <div className="text-white font-black text-2xl">SCORE: {score}</div>
          <div className="w-10" />
        </div>

        <AnimatePresence mode="wait">
          {showStart ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-rose-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl"><Shuffle size={48} /></div>
              <h2 className="text-4xl font-black text-white mb-4 italic tracking-tighter">CHRONOLOGY TOWER</h2>
              <p className="text-rose-200 mb-8 font-bold uppercase tracking-widest">Stack events in order!</p>
              <button onClick={() => setShowStart(false)} className="px-12 py-4 bg-rose-500 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform">START MISSION</button>
            </motion.div>
          ) : isGameOver ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <h2 className="text-6xl font-black text-white mb-4 italic tracking-tighter">TOWER FELL!</h2>
              <p className="text-rose-200 mb-8 text-xl font-bold">Final Score: {score}</p>
              <button onClick={() => onComplete(score)} className="px-12 py-4 bg-rose-500 text-white rounded-2xl font-black text-xl shadow-xl">COLLECT XP</button>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border-2 border-white/20 mb-8">
                <p className="text-rose-200 text-xs font-black uppercase tracking-widest mb-2">What happened after...</p>
                <h3 className="text-2xl font-black text-white italic tracking-tight">{question.baseEvent.text}</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 mt-auto mb-8">
                {question.options.map((opt) => (
                  <button key={opt.id} onClick={() => handleChoice(opt)} className="w-full py-5 bg-white rounded-2xl font-black text-slate-900 shadow-xl active:scale-95 transition-transform hover:bg-rose-50">
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const SpellingTowerGame = ({ 
  onComplete, 
  onMistake, 
  onExit, 
  isOutOfHearts,
  volume,
  setVolume,
  isMusicEnabled,
  setIsMusicEnabled,
  musicStatus,
  setMusicStatus
}: { 
  onComplete: (xp: number) => void, 
  onMistake: () => void, 
  onExit: () => void, 
  isOutOfHearts: boolean,
  volume: number,
  setVolume: (v: number) => void,
  isMusicEnabled: boolean,
  setIsMusicEnabled: (v: boolean) => void,
  musicStatus: string,
  setMusicStatus: (v: string) => void
}) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showStart, setShowStart] = useState(true);
  const [currentName, setCurrentName] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [question, setQuestion] = useState(() => generateSpellingQuestion("", 0));
  const [towerData, setTowerData] = useState<{
    stack: {id: number, word: string, height: number, color: string, isPlatform?: boolean}[]
  }>({ 
    stack: [{ id: -1, word: "", height: 100, color: '#1e293b', isPlatform: true }] 
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const towerContainerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastUpdateRef = useRef(performance.now());
  const lastTapTimeRef = useRef(Date.now());
  const nextIdRef = useRef(0);
  const platformYRef = useRef(DANGER_LINE_PX);
  const towerHeightRef = useRef(100);
  const cameraYRef = useRef(0);
  const sinkRateRef = useRef(8);
  const [containerHeight, setContainerHeight] = useState(800);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (containerHeight > 0 && showStart) {
      const h = containerHeight * 0.20;
      towerHeightRef.current = h;
      setTowerData({ stack: [{ id: -1, word: "", height: h, color: '#1e293b', isPlatform: true }] });
    }
  }, [containerHeight, showStart]);

  useEffect(() => {
    if (showStart || isGameOver || isOutOfHearts) return;
    let active = true;
    const tick = () => {
      if (!active) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastUpdateRef.current) / 1000);
      lastUpdateRef.current = now;
      platformYRef.current -= sinkRateRef.current * dt;
      const topOfTower = platformYRef.current + towerHeightRef.current;
      const targetCameraY = Math.max(0, topOfTower - containerHeight * 0.6);
      cameraYRef.current += (targetCameraY - cameraYRef.current) * (1 - Math.exp(-4 * dt));
      if (topOfTower - cameraYRef.current <= DANGER_LINE_PX) {
        setIsGameOver(true);
        return;
      }
      if (towerContainerRef.current) {
        towerContainerRef.current.style.transform = `translate3d(0, ${-(platformYRef.current - cameraYRef.current)}px, 0)`;
      }
      sinkRateRef.current += 0.3 * dt;
      requestAnimationFrame(tick);
    };
    lastUpdateRef.current = performance.now();
    const animId = requestAnimationFrame(tick);
    return () => { active = false; cancelAnimationFrame(animId); };
  }, [showStart, isGameOver, isOutOfHearts, containerHeight]);

  const handleChoice = (char: string) => {
    if (isGameOver || showStart) return;
    if (char === question.nextChar) {
      const nextIdx = currentIndex + 1;
      const h = containerHeight * 0.20;
      
      if (nextIdx >= question.name.length) {
        setScore(s => s + 50);
        towerHeightRef.current += h;
        setTowerData(prev => ({
          stack: [...prev.stack, { id: nextIdRef.current++, word: question.name, height: h, color: '#06b6d4' }]
        }));
        const newQ = generateSpellingQuestion("", 0);
        setQuestion(newQ);
        setCurrentName(newQ.name);
        setCurrentIndex(0);
      } else {
        setScore(s => s + 5);
        setCurrentIndex(nextIdx);
        setQuestion(generateSpellingQuestion(question.name, nextIdx));
      }
      lastTapTimeRef.current = Date.now();
    } else {
      setStreak(0);
      onMistake();
    }
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden flex flex-col">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500/50 z-20" style={{ bottom: DANGER_LINE_PX }} />
      </div>

      <div ref={towerContainerRef} className="absolute left-0 right-0 bottom-0 flex flex-col-reverse items-center transition-transform duration-75 ease-out will-change-transform">
        {towerData.stack.map((block) => (
          <TowerBlock key={block.id} {...block} containerHeight={containerHeight} />
        ))}
      </div>

      <div className="relative z-30 p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onExit} className="p-2 bg-white/10 rounded-xl text-white"><ArrowLeft /></button>
          <div className="text-white font-black text-2xl">SCORE: {score}</div>
          <div className="w-10" />
        </div>

        <AnimatePresence mode="wait">
          {showStart ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-cyan-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl"><Edit2 size={48} /></div>
              <h2 className="text-4xl font-black text-white mb-4 italic tracking-tighter">SPELLING TOWER</h2>
              <p className="text-cyan-200 mb-8 font-bold uppercase tracking-widest">Spell Bible names to build!</p>
              <button onClick={() => setShowStart(false)} className="px-12 py-4 bg-cyan-500 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform">START MISSION</button>
            </motion.div>
          ) : isGameOver ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <h2 className="text-6xl font-black text-white mb-4 italic tracking-tighter">TOWER FELL!</h2>
              <p className="text-cyan-200 mb-8 text-xl font-bold">Final Score: {score}</p>
              <button onClick={() => onComplete(score)} className="px-12 py-4 bg-cyan-500 text-white rounded-2xl font-black text-xl shadow-xl">COLLECT XP</button>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border-2 border-white/20 mb-8 text-center">
                <p className="text-cyan-200 text-xs font-black uppercase tracking-widest mb-4">Spell the name...</p>
                <div className="flex justify-center gap-2">
                  {question.name.split('').map((char, i) => (
                    <div key={i} className={cn(
                      "w-10 h-12 rounded-lg flex items-center justify-center font-black text-2xl border-2",
                      i < currentIndex ? "bg-cyan-500 border-cyan-400 text-white" : "bg-white/5 border-white/20 text-white/20"
                    )}>
                      {i < currentIndex ? char : '?'}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-auto mb-8">
                {question.options.map((opt, i) => (
                  <button key={i} onClick={() => handleChoice(opt)} className="w-full py-8 bg-white rounded-2xl font-black text-4xl text-slate-900 shadow-xl active:scale-95 transition-transform hover:bg-cyan-50">
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ParableTowerGame = ({ 
  onComplete, 
  onMistake, 
  onExit, 
  isOutOfHearts,
  volume,
  setVolume,
  isMusicEnabled,
  setIsMusicEnabled,
  musicStatus,
  setMusicStatus
}: { 
  onComplete: (xp: number) => void, 
  onMistake: () => void, 
  onExit: () => void, 
  isOutOfHearts: boolean,
  volume: number,
  setVolume: (v: number) => void,
  isMusicEnabled: boolean,
  setIsMusicEnabled: (v: boolean) => void,
  musicStatus: string,
  setMusicStatus: (v: string) => void
}) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showStart, setShowStart] = useState(true);
  const [question, setQuestion] = useState(() => generateParableQuestion());
  const [towerData, setTowerData] = useState<{
    stack: {id: number, word: string, height: number, color: string, isPlatform?: boolean}[]
  }>({ 
    stack: [{ id: -1, word: "", height: 100, color: '#1e293b', isPlatform: true }] 
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const towerContainerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastUpdateRef = useRef(performance.now());
  const lastTapTimeRef = useRef(Date.now());
  const nextIdRef = useRef(0);
  const platformYRef = useRef(DANGER_LINE_PX);
  const towerHeightRef = useRef(100);
  const cameraYRef = useRef(0);
  const sinkRateRef = useRef(8);
  const [containerHeight, setContainerHeight] = useState(800);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (containerHeight > 0 && showStart) {
      const h = containerHeight * 0.20;
      towerHeightRef.current = h;
      setTowerData({ stack: [{ id: -1, word: "", height: h, color: '#1e293b', isPlatform: true }] });
    }
  }, [containerHeight, showStart]);

  useEffect(() => {
    if (showStart || isGameOver || isOutOfHearts) return;
    let active = true;
    const tick = () => {
      if (!active) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastUpdateRef.current) / 1000);
      lastUpdateRef.current = now;
      platformYRef.current -= sinkRateRef.current * dt;
      const topOfTower = platformYRef.current + towerHeightRef.current;
      const targetCameraY = Math.max(0, topOfTower - containerHeight * 0.6);
      cameraYRef.current += (targetCameraY - cameraYRef.current) * (1 - Math.exp(-4 * dt));
      if (topOfTower - cameraYRef.current <= DANGER_LINE_PX) {
        setIsGameOver(true);
        return;
      }
      if (towerContainerRef.current) {
        towerContainerRef.current.style.transform = `translate3d(0, ${-(platformYRef.current - cameraYRef.current)}px, 0)`;
      }
      sinkRateRef.current += 0.3 * dt;
      requestAnimationFrame(tick);
    };
    lastUpdateRef.current = performance.now();
    const animId = requestAnimationFrame(tick);
    return () => { active = false; cancelAnimationFrame(animId); };
  }, [showStart, isGameOver, isOutOfHearts, containerHeight]);

  const handleChoice = (opt: any) => {
    if (isGameOver || showStart) return;
    if (opt.name === question.parable.name) {
      setScore(s => s + 20);
      setStreak(s => s + 1);
      const h = containerHeight * 0.20;
      towerHeightRef.current += h;
      setTowerData(prev => ({
        stack: [...prev.stack, { id: nextIdRef.current++, word: opt.name, height: h, color: '#8b5cf6' }]
      }));
      setQuestion(generateParableQuestion());
      lastTapTimeRef.current = Date.now();
    } else {
      setStreak(0);
      onMistake();
    }
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden flex flex-col">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500/50 z-20" style={{ bottom: DANGER_LINE_PX }} />
      </div>

      <div ref={towerContainerRef} className="absolute left-0 right-0 bottom-0 flex flex-col-reverse items-center transition-transform duration-75 ease-out will-change-transform">
        {towerData.stack.map((block) => (
          <TowerBlock key={block.id} {...block} containerHeight={containerHeight} />
        ))}
      </div>

      <div className="relative z-30 p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onExit} className="p-2 bg-white/10 rounded-xl text-white"><ArrowLeft /></button>
          <div className="text-white font-black text-2xl">SCORE: {score}</div>
          <div className="w-10" />
        </div>

        <AnimatePresence mode="wait">
          {showStart ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-violet-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl"><Sparkles size={48} /></div>
              <h2 className="text-4xl font-black text-white mb-4 italic tracking-tighter">PARABLE TOWER</h2>
              <p className="text-violet-200 mb-8 font-bold uppercase tracking-widest">Match parables to meanings!</p>
              <button onClick={() => setShowStart(false)} className="px-12 py-4 bg-violet-500 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform">START MISSION</button>
            </motion.div>
          ) : isGameOver ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <h2 className="text-6xl font-black text-white mb-4 italic tracking-tighter">TOWER FELL!</h2>
              <p className="text-violet-200 mb-8 text-xl font-bold">Final Score: {score}</p>
              <button onClick={() => onComplete(score)} className="px-12 py-4 bg-violet-500 text-white rounded-2xl font-black text-xl shadow-xl">COLLECT XP</button>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border-2 border-white/20 mb-8">
                <p className="text-violet-200 text-xs font-black uppercase tracking-widest mb-2">What is the meaning of...</p>
                <h3 className="text-2xl font-black text-white italic tracking-tight">{question.parable.name}</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 mt-auto mb-8">
                {question.options.map((opt, i) => (
                  <button key={i} onClick={() => handleChoice(opt)} className="w-full py-5 bg-white rounded-2xl font-black text-slate-900 shadow-xl active:scale-95 transition-transform hover:bg-violet-50">
                    {opt.meaning}
                  </button>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const MathTowerGame = ({ 
  onComplete, 
  onMistake, 
  onExit, 
  isOutOfHearts,
  volume,
  setVolume,
  isMusicEnabled,
  setIsMusicEnabled,
  selectedMusicStyle,
  setSelectedMusicStyle,
  musicStatus,
  setMusicStatus,
  setIsQuestionBankOpen,
  setBankStore
}: { 
  onComplete: (xp: number) => void, 
  onMistake: () => void, 
  onExit: () => void, 
  isOutOfHearts: boolean,
  volume: number,
  setVolume: (v: number) => void,
  isMusicEnabled: boolean,
  setIsMusicEnabled: (v: boolean) => void,
  selectedMusicStyle: string,
  setSelectedMusicStyle: (v: string) => void,
  musicStatus: string,
  setMusicStatus: (v: string) => void,
  setIsQuestionBankOpen: (v: boolean) => void,
  setBankStore: (store: string) => void
}) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showStart, setShowStart] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isRedAlert, setIsRedAlert] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [isComboActive, setIsComboActive] = useState(false);
  const lastCorrectTimesRef = useRef<number[]>([]);

  const [problem, setProblem] = useState(() => generateMathProblem(0, 'medium'));
  const [towerData, setTowerData] = useState<{
    stack: {id: number, word: string, height: number, color: string, isPlatform?: boolean}[]
  }>({ 
    stack: [{ id: -1, word: "", height: 100, color: '#1e293b', isPlatform: true }] 
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const towerContainerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUpdateRef = useRef(performance.now());
  const lastTapTimeRef = useRef(Date.now());
  const nextIdRef = useRef(0);
  
  const platformYRef = useRef(DANGER_LINE_PX);
  const towerHeightRef = useRef(100);
  const cameraYRef = useRef(0);
  const sinkRateRef = useRef(15);
  const isRedAlertRef = useRef(false);
  
  const [containerHeight, setContainerHeight] = useState(() => typeof window !== 'undefined' ? window.innerHeight : 800);
  const containerHeightRef = useRef(containerHeight);

  useEffect(() => {
    containerHeightRef.current = containerHeight;
  }, [containerHeight]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const heightPx = entry.contentRect.height;
        setContainerHeight(heightPx);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (containerHeight > 0) {
      const newHeight = containerHeight * 0.20;
      if (showStart) {
        towerHeightRef.current = newHeight;
        platformYRef.current = DANGER_LINE_PX;
        setTowerData({
          stack: [{ id: -1, word: "", height: newHeight, color: '#1e293b', isPlatform: true }]
        });
      }
    }
  }, [containerHeight, showStart]);

  useEffect(() => {
    if (showStart || isGameOver || isPaused || isOutOfHearts) return;
    
    let active = true;
    const tick = () => {
      if (!active) return;
      
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastUpdateRef.current) / 1000); 
      lastUpdateRef.current = now;

      platformYRef.current -= sinkRateRef.current * dt;
      
      const topOfTower = platformYRef.current + towerHeightRef.current;
      const targetCameraY = Math.max(0, topOfTower - containerHeightRef.current * 0.6); 
      
      if (targetCameraY > cameraYRef.current) {
        const followSpeed = 4.0; 
        cameraYRef.current += (targetCameraY - cameraYRef.current) * (1 - Math.exp(-followSpeed * dt));
      } else {
        const followSpeed = 0.05; 
        cameraYRef.current += (targetCameraY - cameraYRef.current) * (1 - Math.exp(-followSpeed * dt));
      }

      const visualTop = topOfTower - cameraYRef.current;
      if (visualTop > containerHeightRef.current * 0.85) {
        cameraYRef.current = topOfTower - containerHeightRef.current * 0.85;
      }

      const redAlertActive = visualTop < containerHeightRef.current * 0.25;

      if (visualTop <= DANGER_LINE_PX) {
        setIsGameOver(true);
        platformYRef.current = cameraYRef.current + DANGER_LINE_PX - towerHeightRef.current;
        return; 
      }

      if (Number.isFinite(platformYRef.current) && towerContainerRef.current) {
        const visualY = platformYRef.current - cameraYRef.current;
        towerContainerRef.current.style.transform = `translate3d(0, ${-visualY}px, 0)`;
      }

      if (redAlertActive !== isRedAlertRef.current) {
        isRedAlertRef.current = redAlertActive;
        setIsRedAlert(redAlertActive);
        
        if (towerContainerRef.current) {
          if (redAlertActive) {
            towerContainerRef.current.classList.add('red-alert-pulse');
          } else {
            towerContainerRef.current.classList.remove('red-alert-pulse');
          }
        }
      }

      sinkRateRef.current += 0.5 * dt; 

      requestAnimationFrame(tick);
    };

    lastUpdateRef.current = performance.now();
    const animId = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(animId);
    };
  }, [showStart, isGameOver, isPaused, isOutOfHearts]);

  const playSound = useCallback((freq: number, type: OscillatorType, dur: number, vol: number = 0.2, noSweep: boolean = false) => {
    if (!audioCtxRef.current || isPaused || isOutOfHearts) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    if (!noSweep) {
      if (freq > 500) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, ctx.currentTime + dur);
      } else if (freq < 300 && freq > 0) {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, ctx.currentTime + dur);
      }
    }

    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(vol * volume, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    
    osc.connect(g);
    g.connect(ctx.destination); 
    
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }, [volume, isPaused, isOutOfHearts]);

  const playCorrectSound = useCallback(() => {
    playSound(880, 'sine', 0.15, 0.2, false);
    setTimeout(() => playSound(1320, 'sine', 0.2, 0.15, false), 50);
  }, [playSound]);

  const playIncorrectSound = useCallback(() => {
    playSound(180, 'triangle', 0.3, 0.4, false);
  }, [playSound]);

  // Music is now universal

  const OP_COLORS = {
    addition: '#3b82f6', // blue
    subtraction: '#f59e0b', // orange
    multiplication: '#f43f5e', // red
    division: '#10b981', // emerald
  };

  const handleChoice = (eq: MathEquation) => {
    if (isGameOver || showStart || isPaused || isOutOfHearts) return;
    const now = Date.now();
    const timeDelta = now - lastTapTimeRef.current;

    if (eq.isCorrect) {
      lastTapTimeRef.current = now;
      playCorrectSound();
      
      // Combo logic: 5 correct in 10 seconds
      const currentTime = Date.now();
      lastCorrectTimesRef.current = [...lastCorrectTimesRef.current, currentTime].filter(t => currentTime - t < 10000);
      
      const isCombo = lastCorrectTimesRef.current.length >= 5;
      setIsComboActive(isCombo);
      
      // NEW SCORING: Base 10 + Speed Bonus (up to 20)
      const basePoints = 10;
      const speedBonus = Math.max(0, 20 - Math.floor(timeDelta / 200)); // Max 20 bonus, drops over 4 seconds
      const multiplier = isCombo ? 2 : 1;
      
      const points = (basePoints + speedBonus) * multiplier;
      
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      setConsecutiveCorrect(prev => prev + 1);

      // Speed = Height
      const height = containerHeight * 0.20; 
      
      towerHeightRef.current += height;
      
      setTowerData(prev => ({
        stack: [
          ...prev.stack,
          {
            id: nextIdRef.current++,
            word: eq.text,
            height,
            color: isCombo ? '#fbbf24' : OP_COLORS[eq.type]
          }
        ]
      }));

      setProblem(generateMathProblem(score + points, difficulty));
    } else {
      playIncorrectSound();
      setStreak(0);
      setConsecutiveCorrect(0);
      setIsComboActive(false);
      lastCorrectTimesRef.current = [];
      
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setIsGameOver(true);
      }
    }
  };

  const startLaunch = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Set sink rate based on difficulty
    sinkRateRef.current = difficulty === 'extreme' ? 25 : difficulty === 'master' ? 20 : difficulty === 'advanced' ? 15 : difficulty === 'hard' ? 12 : difficulty === 'medium' ? 8 : 5;

    setProblem(generateMathProblem(0, difficulty));
    lastTapTimeRef.current = Date.now();
    setShowStart(false);
    if (dontShowAgain) {
      localStorage.setItem('math_tutorial_dismissed', 'true');
    }
  };

  if (showStart) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 bg-slate-950 text-white overflow-y-auto custom-scrollbar">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center max-w-sm py-8"
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
            <Calculator size={48} className="text-white" />
          </div>
          <h2 className="text-5xl font-black mb-2 tracking-tighter italic">MATH TOWER</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">Mental Math Marathon</p>
          
          {/* Difficulty Selector */}
          <div className="mb-8">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-3">Select Difficulty</p>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard', 'advanced', 'master', 'extreme'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "flex-1 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border-2",
                    difficulty === d 
                      ? "bg-emerald-500 border-emerald-400 text-white shadow-lg" 
                      : "bg-slate-900 border-slate-800 text-slate-500 hover:border-emerald-500/50"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 mb-8 text-left bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-emerald-400 font-bold">1</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-bold">Pick the Truth.</span> Only one equation is mathematically correct. Find it fast.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-blue-400 font-bold">2</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-bold">Speed = Height & Points.</span> Faster answers build a taller tower and give <span className="text-emerald-400 font-bold">BONUS POINTS</span>.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-yellow-400 font-bold">3</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-bold">Combo Fire.</span> Get 5 correct in 10 seconds for <span className="text-yellow-400 font-bold">DOUBLE SCORE</span> and golden blocks.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center text-rose-400 font-bold">4</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-bold">Stay Above the Line.</span> The tower is sinking. If the <span className="text-rose-400 font-bold underline text-[10px]">TOP</span> of your stack falls below the red laser, you collapse.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6 px-2">
            <button 
              onClick={() => setDontShowAgain(!dontShowAgain)}
              className={cn(
                "w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center",
                dontShowAgain ? "bg-emerald-500 border-emerald-500" : "border-slate-700 bg-slate-800"
              )}
            >
              {dontShowAgain && <CheckCircle2 size={16} className="text-white" />}
            </button>
            <span className="text-xs text-slate-400 font-medium">Don't show this again</span>
          </div>

          <button 
            onClick={startLaunch}
            className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
          >
            START MATH TOWER
          </button>
        </motion.div>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-6 bg-slate-950 rounded-3xl shadow-xl border-2 border-slate-800 h-full text-white overflow-y-auto">
        <div className="text-center w-full">
          <h3 className="text-4xl font-black text-rose-500 mb-4 italic tracking-tighter">COLLAPSED</h3>
          
          <div className="flex justify-around items-center mb-6">
            <div className="text-center">
              <div className="text-5xl font-black text-white tracking-tighter">{score}</div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.1em] text-[10px]">Points Earned</p>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-5xl font-black text-emerald-400 tracking-tighter">+{score}</div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.1em] text-[10px]">XP Earned</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => onComplete(score)}
          className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
        >
          COLLECT XP
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col transition-transform duration-75 h-full overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
      </div>

      <MathHUD 
        score={score}
        streak={streak}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        lastUpdateRef={lastUpdateRef}
        setIsSettingsOpen={setIsSettingsOpen}
        lives={lives}
      />

      <SettingsOverlay 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        volume={volume}
        setVolume={setVolume}
        isMusicEnabled={isMusicEnabled}
        setIsMusicEnabled={setIsMusicEnabled}
        selectedMusicStyle={selectedMusicStyle}
        setSelectedMusicStyle={setSelectedMusicStyle}
        musicStatus={musicStatus}
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
      />

      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <AnimatePresence>
          {isPaused && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="text-center">
                <h2 className="text-5xl font-black text-white mb-8 tracking-tighter italic">PAUSED</h2>
                <button 
                  onClick={() => {
                    lastUpdateRef.current = performance.now();
                    setIsPaused(false);
                  }}
                  className="px-12 py-4 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-2xl active:scale-95 transition-transform"
                >
                  RESUME
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          ref={towerContainerRef}
          className="absolute inset-0 pointer-events-none will-change-transform"
        >
          <TowerStack stack={towerData.stack} />
        </div>

        <div 
          className={cn(
            "absolute left-0 right-0 h-1 bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1),0_0_40px_rgba(244,63,94,0.6)] z-50 flex items-center justify-center transition-all",
            isRedAlert && "danger-line-pulse bg-rose-400"
          )}
          style={{ bottom: `${DANGER_LINE_PX}px` }}
        />
      </div>

      <div className={cn(
        "h-[120px] bg-slate-950/80 backdrop-blur-md z-40 border-t border-white/10 p-4 transition-all duration-300",
        isPaused && "blur-xl pointer-events-none opacity-50"
      )}>
        <div className="grid grid-cols-2 gap-3 h-full">
          {problem.options.map((opt, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleChoice(opt)}
              className={cn(
                "h-full rounded-2xl border-2 flex items-center justify-center text-2xl sm:text-4xl font-black tracking-tighter transition-all",
                "bg-slate-900 border-slate-800 text-white hover:border-orange-500/50"
              )}
            >
              {opt.text}
            </motion.button>
          ))}
        </div>
      </div>
      
      {isComboActive && (
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[70]"
        >
          <div className="text-6xl font-black text-yellow-400 italic tracking-tighter drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]">
            COMBO FIRE!
          </div>
        </motion.div>
      )}
    </div>
  );
};

const CustomVerseForm = ({ onAdd, onCancel }: { onAdd: (v: Verse) => void, onCancel: () => void }) => {
  const [verse, setVerse] = useState({ book: '', chapter: 1, verse: 1, text: '' });
  const [mode, setMode] = useState<'type' | 'browse'>('browse');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Verse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (mode === 'browse') {
        setIsSearching(true);
        const searchResults = await searchBible(search);
        setResults(searchResults);
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, mode]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
    >
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-secondary max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-display text-secondary">Add Verse</h2>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setMode('browse')}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", mode === 'browse' ? "bg-white shadow-sm text-secondary" : "text-gray-400")}
            >
              Browse
            </button>
            <button 
              onClick={() => setMode('type')}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", mode === 'type' ? "bg-white shadow-sm text-secondary" : "text-gray-400")}
            >
              Type
            </button>
          </div>
        </div>

        {mode === 'browse' ? (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <div className="relative">
              <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", isSearching ? "text-secondary animate-pulse" : "text-gray-400")} size={18} />
              <input 
                type="text" 
                placeholder="Search KJV Library..." 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-secondary"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {results.map((v, i) => (
                <button 
                  key={i}
                  onClick={() => onAdd(v)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-secondary/5 rounded-2xl border-2 border-transparent hover:border-secondary/20 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-secondary">{v.book} {v.chapter}:{v.verse}</span>
                    <Plus size={16} className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{v.text}</p>
                </button>
              ))}
              {!isSearching && results.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Search size={40} className="mx-auto mb-2 opacity-20" />
                  <p>No verses found</p>
                </div>
              )}
            </div>
            <button 
              onClick={onCancel}
              className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold mt-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Book (e.g. Genesis)" 
              className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-secondary"
              value={verse.book}
              onChange={e => setVerse({...verse, book: e.target.value})}
            />
            <div className="flex gap-4">
              <input 
                type="number" 
                placeholder="Ch" 
                className="w-1/2 p-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-secondary"
                value={verse.chapter}
                onChange={e => setVerse({...verse, chapter: parseInt(e.target.value) || 1})}
              />
              <input 
                type="number" 
                placeholder="Vs" 
                className="w-1/2 p-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-secondary"
                value={verse.verse}
                onChange={e => setVerse({...verse, verse: parseInt(e.target.value) || 1})}
              />
            </div>
            <textarea 
              placeholder="Verse Text..." 
              rows={3}
              className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-secondary resize-none"
              value={verse.text}
              onChange={e => setVerse({...verse, text: e.target.value})}
            />
            <div className="flex gap-3 pt-2">
              <button 
                onClick={onCancel}
                className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={() => verse.text && verse.book && onAdd(verse)}
                className="flex-1 py-3 bg-secondary text-white rounded-xl font-bold shadow-lg shadow-secondary/20"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showMasteredVerses, setShowMasteredVerses] = useState(false);
  const [view, setView] = useState<'dashboard' | 'game' | 'shop' | 'leagues' | 'profile' | 'boggle' | 'math_tower' | 'tower_games' | 'bible_reader' | 'bible_jeopardy' | 'missionary_journeys' | 'verse_chomper' | 'sequence_chomper' | 'verse_darts' | 'verse_tetris' | 'verse_crush' | 'speed_verse' | 'daily_journey'>('dashboard');
  const [dailyDay, setDailyDay] = useState<DailyJourneyDay | null>(null);
  const [dailyVerseIdx, setDailyVerseIdx] = useState(0);
  const [dailyTimes, setDailyTimes] = useState<number[]>([]);
  const isGameView = view === 'game' || view === 'boggle' || view === 'math_tower' || view === 'tower_games' || view === 'bible_reader' || view === 'bible_jeopardy' || view === 'missionary_journeys' || view === 'wits_and_wagers' || view === 'verse_chomper' || view === 'sequence_chomper' || view === 'verse_darts' || view === 'verse_tetris' || view === 'verse_crush' || view === 'speed_verse' || view === 'daily_journey';
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
        const today = new Date().toISOString().split('T')[0];
        const day = await getDailyJourneyDay(today);
        setDailyDay(day);
      } catch (error) {
        console.error("Failed to fetch daily journey:", error);
        // Retry once after a short delay if it failed
        setTimeout(async () => {
          try {
            const today = new Date().toISOString().split('T')[0];
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

  const handleDailyComplete = async (xp: number, timeMs?: number) => {
    if (timeMs !== undefined) {
      const newTimes = [...dailyTimes, timeMs];
      setDailyTimes(newTimes);
      
      if (dailyVerseIdx === 0) {
        setDailyVerseIdx(1);
      } else {
        // Day complete!
        if (user && dailyDay) {
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
        setView('dashboard');
      }
    } else {
      setView('dashboard');
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
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

  // Jeopardy State
  const [jeopardyCategories, setJeopardyCategories] = useState<JeopardyCategory[]>([]);
  const [isGeneratingJeopardy, setIsGeneratingJeopardy] = useState(false);
  const [savedJeopardyBoards, setSavedJeopardyBoards] = useState<JeopardyBoard[]>([]);
  const [jeopardyDifficulty, setJeopardyDifficulty] = useState<JeopardyDifficulty>('medium');
  const [jeopardyMode, setJeopardyMode] = useState<JeopardyMode>('classic');
  const [currentJeopardyBoardId, setCurrentJeopardyBoardId] = useState<string | null>(null);

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

  // Jeopardy Handlers
  const triggerJeopardyGeneration = async (mode: JeopardyMode, diff: JeopardyDifficulty, forceNew = false) => {
    setIsGeneratingJeopardy(true);
    try {
      const categories = await generateJeopardyBoard(mode, diff);
      
      const newBoard: JeopardyBoard = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        categories,
        difficulty: diff,
        mode: mode
      };

      await saveJeopardyBoard(newBoard);
      
      setJeopardyCategories(categories);
      setCurrentJeopardyBoardId(newBoard.id);
      
      // Refresh saved boards
      const boards = await getAllJeopardyBoards();
      setSavedJeopardyBoards(boards);
    } catch (error) {
      console.error("Failed to generate Jeopardy board:", error);
    } finally {
      setIsGeneratingJeopardy(false);
    }
  };

  const loadSavedBoard = (board: JeopardyBoard) => {
    setJeopardyCategories(board.categories);
    setCurrentJeopardyBoardId(board.id);
    setJeopardyDifficulty(board.difficulty);
    setJeopardyMode(board.mode);
  };

  const updateJeopardyGameState = async (boardId: string, state: JeopardyGameState) => {
    await saveJeopardyGameState(boardId, state);
  };

  useEffect(() => {
    if (isDbReady) {
      initJeopardyDB().then(() => {
        getAllJeopardyBoards().then(setSavedJeopardyBoards);
      });
    }
  }, [isDbReady]);

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

              {/* Bible Jeopardy Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('bible_jeopardy')}
                className="w-full py-6 bg-slate-950 text-white rounded-3xl font-black text-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-4 group border-b-8 border-slate-800"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Layout size={28} className="text-white" />
                </div>
                PLAY BIBLE JEOPARDY
              </motion.button>

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

          {view === 'tower_games' && (
            <motion.div 
              key="tower_games"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col bg-slate-950"
            >
              <BibleTriviaTowerGame 
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
                downloadProgress={downloadProgress}
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

        {view === 'daily_journey' && dailyDay && (
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
              customReference={dailyDay.references[dailyVerseIdx]}
            />
            {/* Overlay for daily reference */}
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full">
                <span className="text-amber-400 font-black uppercase italic tracking-tighter">
                  Verse {dailyVerseIdx + 1}: {dailyDay.references[dailyVerseIdx]}
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

      <AnimatePresence>
        {view === 'bible_jeopardy' && (
          <motion.div 
            key="bible_jeopardy"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] flex flex-col bg-blue-900"
          >
            <BibleJeopardyGame 
              onExit={() => setView('dashboard')}
              categories={jeopardyCategories}
              onGameStart={() => {
                // Only generate if we don't have categories
                if (jeopardyCategories.length === 0) {
                  triggerJeopardyGeneration(jeopardyMode, jeopardyDifficulty);
                }
              }}
              isGenerating={isGeneratingJeopardy}
              onRetry={(mode, diff) => triggerJeopardyGeneration(mode, diff, true)}
              savedBoards={savedJeopardyBoards}
              onLoadBoard={loadSavedBoard}
              difficulty={jeopardyDifficulty}
              onDifficultyChange={setJeopardyDifficulty}
              mode={jeopardyMode}
              onModeChange={setJeopardyMode}
              onUpdateGameState={updateJeopardyGameState}
              boardId={currentJeopardyBoardId}
              isMusicEnabled={isMusicEnabled}
              setIsMusicEnabled={setIsMusicEnabled}
              selectedMusicStyle={selectedMusicStyle}
              setSelectedMusicStyle={setSelectedMusicStyle}
              volume={volume}
              setVolume={setVolume}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
        {showCustomForm && <CustomVerseForm onAdd={handleAddCustom} onCancel={() => setShowCustomForm(false)} />}
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
