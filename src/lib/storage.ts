import { UserProgress, Verse, DailyQuest, VerseSet } from '../types';
import { KJV_LIBRARY } from './bibleData';
import { getLocalDateString } from './utils';

const STORAGE_KEY = 'sword_quest_progress';

const DEFAULT_PROGRESS: UserProgress = {
  xp: 0,
  streak: 0,
  lastActive: new Date().toISOString(),
  masteredVerses: [],
  verseXP: {},
  currentLevel: 1,
  customVerses: [],
  hearts: 5,
  maxHearts: 5,
  gems: 100,
  lastHeartRegen: new Date().toISOString(),
  league: 'Bronze',
  leaguePoints: 0,
  xpHistory: [],
  dailyQuests: [],
  lastQuestReset: new Date().toISOString(),
  legendaryVerses: [],
  crackedVerses: [],
  verseTopTimes: {},
  verseMastery: {},
  verseLevels: {},
  learningVerses: []
};

const generateDailyQuests = (): DailyQuest[] => [
  { id: 'xp-1', title: 'Earn 50 XP', goal: 50, current: 0, reward: 10, completed: false, type: 'xp' },
  { id: 'verses-1', title: 'Master 2 Verses', goal: 2, current: 0, reward: 15, completed: false, type: 'verses' },
  { id: 'perfect-1', title: '1 Perfect Run', goal: 1, current: 0, reward: 20, completed: false, type: 'perfect' }
];

export const getProgress = (): UserProgress => {
  const stored = localStorage.getItem(STORAGE_KEY);
  let progress: UserProgress;
  if (!stored) {
    progress = { ...DEFAULT_PROGRESS, dailyQuests: generateDailyQuests() };
  } else {
    try {
      const parsed = JSON.parse(stored);
      progress = { 
        ...DEFAULT_PROGRESS, 
        ...parsed,
        verseXP: parsed.verseXP || {},
        masteredVerses: parsed.masteredVerses || [],
        legendaryVerses: parsed.legendaryVerses || [],
        crackedVerses: parsed.crackedVerses || [],
        verseTopTimes: parsed.verseTopTimes || {},
        verseMastery: parsed.verseMastery || {},
        verseLevels: parsed.verseLevels || {},
        learningVerses: parsed.learningVerses || [],
        dailyQuests: parsed.dailyQuests || generateDailyQuests(),
        customVerses: parsed.customVerses || []
      };
    } catch {
      progress = { ...DEFAULT_PROGRESS, dailyQuests: generateDailyQuests() };
    }
  }

  // Daily Quest Reset
  const now = new Date();
  const lastReset = new Date(progress.lastQuestReset);
  if (now.toDateString() !== lastReset.toDateString()) {
    progress.dailyQuests = generateDailyQuests();
    progress.lastQuestReset = now.toISOString();
    saveProgress(progress);
  }

  // Heart regeneration logic: 1 heart every 4 hours
  const lastRegen = new Date(progress.lastHeartRegen);
  const hoursPassed = (now.getTime() - lastRegen.getTime()) / (1000 * 60 * 60);
  
  if (hoursPassed >= 4 && progress.hearts < progress.maxHearts) {
    const heartsToAdd = Math.floor(hoursPassed / 4);
    progress.hearts = Math.min(progress.maxHearts, progress.hearts + heartsToAdd);
    progress.lastHeartRegen = now.toISOString();
    saveProgress(progress);
  }

  // Fuel Decay Logic: -5 fuel per day
  let fuelChanged = false;
  Object.keys(progress.verseMastery).forEach(key => {
    const mastery = progress.verseMastery[key];
    const lastPlayed = new Date(mastery.lastPlayed);
    const daysSince = Math.floor((now.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24));
    
    // Decay fuel if it's been at least 1 day since last played
    const newFuel = Math.max(0, 100 - (daysSince * 5));
    if (newFuel !== mastery.fuel) {
      mastery.fuel = newFuel;
      fuelChanged = true;
    }
  });

  if (fuelChanged) {
    saveProgress(progress);
  }

  return progress;
};

export const useHeart = () => {
  const progress = getProgress();
  if (progress.hearts > 0) {
    progress.hearts -= 1;
    if (progress.hearts === progress.maxHearts - 1) {
      progress.lastHeartRegen = new Date().toISOString();
    }
    saveProgress(progress);
    return true;
  }
  return false;
};

export const addHeart = () => {
  const progress = getProgress();
  if (progress.hearts < progress.maxHearts) {
    progress.hearts += 1;
    saveProgress(progress);
    return true;
  }
  return false;
};

export const addGems = (amount: number) => {
  const progress = getProgress();
  progress.gems += amount;
  saveProgress(progress);
  return progress;
};

export const saveProgress = (progress: UserProgress) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

export const updateXP = (amount: number) => {
  const progress = getProgress();
  progress.xp += amount;
  progress.leaguePoints += amount;
  
  // Update XP history
  const today = getLocalDateString();
  const historyIndex = progress.xpHistory.findIndex(h => h.date === today);
  if (historyIndex >= 0) {
    progress.xpHistory[historyIndex].xp += amount;
  } else {
    progress.xpHistory.push({ date: today, xp: amount });
    // Keep only last 7 days
    if (progress.xpHistory.length > 7) progress.xpHistory.shift();
  }

  // Simple level up logic: 100 XP per level
  const newLevel = Math.floor(progress.xp / 100) + 1;
  if (newLevel > progress.currentLevel) {
    progress.currentLevel = newLevel;
  }
  
  saveProgress(progress);
  return progress;
};

export const addVerseXP = (verseKey: string, amount: number, isReview: boolean) => {
  const progress = getProgress();
  const today = getLocalDateString();
  
  if (!progress.dailyReviewCounts) progress.dailyReviewCounts = {};
  
  if (isReview) {
    const reviewData = progress.dailyReviewCounts[verseKey] || { count: 0, lastDate: today };
    
    // Reset count if it's a new day
    if (reviewData.lastDate !== today) {
      reviewData.count = 0;
      reviewData.lastDate = today;
    }
    
    if (reviewData.count >= 3) {
      // Limit reached, no XP awarded
      return progress;
    }
    
    reviewData.count += 1;
    progress.dailyReviewCounts[verseKey] = reviewData;
    saveProgress(progress); // Save the updated count
  }
  
  return updateXP(amount);
};

export const getRemainingReviewXP = (verseKey: string, wordCount: number): number => {
  const progress = getProgress();
  const today = getLocalDateString();
  
  if (!progress.dailyReviewCounts) return 3 * wordCount;
  
  const reviewData = progress.dailyReviewCounts[verseKey];
  if (!reviewData || reviewData.lastDate !== today) return 3 * wordCount;
  
  const remainingReviews = Math.max(0, 3 - reviewData.count);
  return remainingReviews * wordCount;
};

export const checkStreak = () => {
  const progress = getProgress();
  const now = new Date();
  const last = new Date(progress.lastActive);
  
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    progress.streak += 1;
  } else if (diffDays > 1) {
    progress.streak = 0;
  }
  
  progress.lastActive = now.toISOString();
  saveProgress(progress);
  return progress.streak;
};

export const addCustomVerse = (verse: Verse) => {
  const progress = getProgress();
  progress.customVerses.push(verse);
  saveProgress(progress);
  return progress;
};

export const createVerseSet = (name: string) => {
  const progress = getProgress();
  if (!progress.verseSets) progress.verseSets = [];
  const newSet: VerseSet = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    verses: [],
    createdAt: new Date().toISOString()
  };
  progress.verseSets.push(newSet);
  saveProgress(progress);
  return progress;
};

export const deleteVerseSet = (setId: string) => {
  const progress = getProgress();
  if (!progress.verseSets) return progress;
  progress.verseSets = progress.verseSets.filter(s => s.id !== setId);
  saveProgress(progress);
  return progress;
};

export const addVersesToSet = (setId: string, verses: Verse[]) => {
  const progress = getProgress();
  if (!progress.verseSets) return progress;
  const setIndex = progress.verseSets.findIndex(s => s.id === setId);
  if (setIndex === -1) return progress;
  
  const existingRefs = new Set(progress.verseSets[setIndex].verses.map(v => `${v.book} ${v.chapter}:${v.verse}`));
  const newVerses = verses.filter(v => !existingRefs.has(`${v.book} ${v.chapter}:${v.verse}`));
  
  progress.verseSets[setIndex].verses.push(...newVerses);
  saveProgress(progress);
  return progress;
};

export const removeVerseFromSet = (setId: string, verseKey: string) => {
  const progress = getProgress();
  if (!progress.verseSets) return progress;
  const setIndex = progress.verseSets.findIndex(s => s.id === setId);
  if (setIndex === -1) return progress;
  
  progress.verseSets[setIndex].verses = progress.verseSets[setIndex].verses.filter(v => `${v.book} ${v.chapter}:${v.verse}` !== verseKey);
  saveProgress(progress);
  return progress;
};

export const crackRandomVerse = () => {
  const progress = getProgress();
  if (progress.masteredVerses.length > 0) {
    const randomVerse = progress.masteredVerses[Math.floor(Math.random() * progress.masteredVerses.length)];
    if (!progress.crackedVerses.includes(randomVerse)) {
      progress.crackedVerses.push(randomVerse);
      saveProgress(progress);
    }
  }
  return progress;
};

export const resetVerseProgress = (verseKey: string) => {
  const progress = getProgress();
  
  // Ensure objects exist
  if (!progress.verseXP) progress.verseXP = {};
  if (!progress.masteredVerses) progress.masteredVerses = [];
  if (!progress.legendaryVerses) progress.legendaryVerses = [];
  if (!progress.crackedVerses) progress.crackedVerses = [];
  if (!progress.verseMastery) progress.verseMastery = {};

  // Reset values
  progress.verseXP[verseKey] = 0;
  delete progress.verseMastery[verseKey];
  
  // Filter out from arrays
  progress.masteredVerses = progress.masteredVerses.filter(v => v !== verseKey);
  progress.legendaryVerses = progress.legendaryVerses.filter(v => v !== verseKey);
  progress.crackedVerses = progress.crackedVerses.filter(v => v !== verseKey);
  
  saveProgress(progress);
  return progress;
};

export const resetAllProgress = () => {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULT_PROGRESS, dailyQuests: generateDailyQuests() };
};

export const saveVerseTime = (verseKey: string, timeMs: number) => {
  const progress = getProgress();
  if (!progress.verseTopTimes) progress.verseTopTimes = {};
  if (!progress.verseTopTimes[verseKey]) progress.verseTopTimes[verseKey] = [];
  
  progress.verseTopTimes[verseKey].push(timeMs);
  progress.verseTopTimes[verseKey].sort((a, b) => a - b);
  progress.verseTopTimes[verseKey] = progress.verseTopTimes[verseKey].slice(0, 10);
  
  saveProgress(progress);
  return progress;
};

export const updateVerseMastery = (verseKey: string, isPerfect: boolean) => {
  const progress = getProgress();
  if (!progress.verseMastery) progress.verseMastery = {};
  
  const current = progress.verseMastery[verseKey] || {
    status: 'protostar',
    perfectRuns: 0,
    timesSeen: 0,
    lastPlayed: new Date().toISOString(),
    fuel: 100
  };

  // REMOVED: current.timesSeen += 1; (Handled by recordVerseSeen at start of verse)

  if (isPerfect) {
    current.perfectRuns += 1;
    // Mastery: If they've seen it at least 4 times (meaning they are on the 4th run or later)
    // AND it was perfect.
    if (current.timesSeen >= 4) {
      current.status = 'supernova';
      if (!progress.masteredVerses.includes(verseKey)) {
        progress.masteredVerses.push(verseKey);
      }
    }
  }

  // Status updates for visual feedback
  if (current.status !== 'supernova') {
    if (current.timesSeen >= 3) current.status = 'red_giant';
    else if (current.timesSeen >= 1) current.status = 'main_sequence';
  }

  current.lastPlayed = new Date().toISOString();
  progress.verseMastery[verseKey] = current;
  
  saveProgress(progress);
  return progress;
};

export const recordVerseSeen = (verseKey: string) => {
  const progress = getProgress();
  if (!progress.verseMastery) progress.verseMastery = {};
  
  const current = progress.verseMastery[verseKey] || {
    status: 'protostar',
    perfectRuns: 0,
    timesSeen: 0,
    lastPlayed: new Date().toISOString(),
    fuel: 100
  };

  current.timesSeen += 1;
  progress.verseMastery[verseKey] = current;
  saveProgress(progress);
  return progress;
};

export const getNextEndlessVerse = (allVerses: Verse[], excludeKeys: string[] = []): Verse => {
  const progress = getProgress();
  const mastery = progress.verseMastery || {};
  
  // Create a set of keys for fast lookup
  const allVerseKeys = new Set(allVerses.map(v => `${v.book} ${v.chapter}:${v.verse}`));
  
  // Just find the first verse that hasn't been mastered yet and is in the current set
  for (const verse of allVerses) {
    const key = `${verse.book} ${verse.chapter}:${verse.verse}`;
    if (excludeKeys.includes(key)) continue;
    const m = mastery[key];
    if (!m || m.timesSeen < 1) {
      return verse;
    }
  }

  // If all are seen, pick one that isn't session-excluded and is in the current set
  const available = allVerses.filter(v => !excludeKeys.includes(`${v.book} ${v.chapter}:${v.verse}`));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }

  // Fallback to absolute first of the provided set
  return allVerses[0] || KJV_LIBRARY[0];
};

export const getVerseLevel = (verseKey: string): number => {
  const progress = getProgress();
  return progress.verseLevels[verseKey] || 1;
};

export const updateVerseLevel = (verseKey: string, level: number) => {
  const progress = getProgress();
  if (!progress.verseLevels) progress.verseLevels = {};
  progress.verseLevels[verseKey] = level;
  saveProgress(progress);
  return progress;
};

export const getLearningVerses = (allVerses: Verse[]): string[] => {
  const progress = getProgress();
  const allVerseKeys = new Set(allVerses.map(v => `${v.book} ${v.chapter}:${v.verse}`));
  
  // Get current learning verses that are in the requested set
  let currentInSet = (progress.learningVerses || []).filter(key => allVerseKeys.has(key));
  
  if (currentInSet.length >= 2) {
    return currentInSet;
  }

  // Initialize learning verses if needed, but prioritize those in the set
  const learning = progress.learningVerses || [];
  const mastered = progress.masteredVerses || [];
  
  const availableFromSet = allVerses.filter(v => {
    const key = `${v.book} ${v.chapter}:${v.verse}`;
    return !mastered.includes(key) && !learning.includes(key);
  });

  let added = 0;
  while (currentInSet.length + added < 2 && availableFromSet.length > 0) {
    const next = availableFromSet.shift();
    if (next) {
      const key = `${next.book} ${next.chapter}:${next.verse}`;
      learning.push(key);
      if (!progress.verseLevels) progress.verseLevels = {};
      progress.verseLevels[key] = 1;
      added++;
    }
  }

  if (added > 0) {
    progress.learningVerses = learning;
    saveProgress(progress);
  }

  // Return only those in the current set
  const finalLearning = learning.filter(key => allVerseKeys.has(key));
  
  // If we still have nothing (e.g. all verses in set are mastered), 
  // we might need to return something so the game doesn't break, 
  // but getNextVerseKey handles the fallback to mastered verses.
  return finalLearning;
};

export const promoteVerse = (verseKey: string) => {
  const progress = getProgress();
  const currentLevel = progress.verseLevels[verseKey] || 1;
  
  if (currentLevel < 5) {
    progress.verseLevels[verseKey] = currentLevel + 1;
  } else {
    // Mastered!
    if (!progress.masteredVerses.includes(verseKey)) {
      progress.masteredVerses.push(verseKey);
    }
    // Remove from learning verses
    progress.learningVerses = progress.learningVerses.filter(v => v !== verseKey);
  }
  
  saveProgress(progress);
  return progress;
};

export const demoteVerse = (verseKey: string) => {
  const progress = getProgress();
  // Only demote if it was mastered
  if (progress.masteredVerses.includes(verseKey)) {
    progress.masteredVerses = progress.masteredVerses.filter(v => v !== verseKey);
    if (!progress.verseLevels) progress.verseLevels = {};
    progress.verseLevels[verseKey] = 3; // Demote to Level 3
    
    // Add back to learning verses if there's space, or just let it be demoted
    // The user said "introduce 2 new verses immediately", so we should probably keep 2 learning verses.
    // If we demote a mastered verse, it becomes a "learning" verse again?
    // "Demote ... drops back to Level 3. They must climb it back up to Level 5 to re-master it."
    if (!progress.learningVerses.includes(verseKey)) {
      progress.learningVerses.push(verseKey);
    }
  }
  saveProgress(progress);
  return progress;
};

export const updateQuestProgress = (type: 'xp' | 'verses' | 'perfect', amount: number) => {
  const progress = getProgress();
  let changed = false;
  
  progress.dailyQuests = progress.dailyQuests.map(quest => {
    if (quest.type === type && !quest.completed) {
      quest.current = Math.min(quest.goal, quest.current + amount);
      if (quest.current >= quest.goal) {
        quest.completed = true;
        progress.gems += quest.reward;
        changed = true;
      }
      changed = true;
    }
    return quest;
  });

  if (changed) {
    saveProgress(progress);
  }
  return progress;
};
