import { db, doc } from '../firebase';
import { getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDailyScheduleDay, saveDailySchedule, getDailyProgress, saveDailyProgress, getAllDailyProgress, initBibleDB } from '../lib/bibleDb';

export interface DailyJourneyDay {
  date: string;
  month: string;
  theme: string;
  references: string[];
  isCompleted?: boolean;
  isInitialPass?: boolean;
}

export interface DailyProgress {
  id: string; // date_reference
  date: string;
  reference: string;
  bestTimePerWord: number;
  completedCount: number;
  lastPlayed: string;
  isInitialPass: boolean;
}

const MONTHLY_THEMES: Record<string, string> = {
  "January": "New Beginnings & Foundations",
  "February": "Love & Relationships",
  "March": "Growth & Renewal",
  "April": "Sacrifice & Redemption",
  "May": "Faith & Perseverance",
  "June": "Wisdom & Guidance",
  "July": "Freedom & Truth",
  "August": "Strength & Courage",
  "September": "Harvest & Service",
  "October": "Light & Protection",
  "November": "Gratitude & Provision",
  "December": "Hope & Incarnation"
};

// Curated Topical Library (Open Bible Inspired)
const TOPICAL_LIBRARY: Record<string, string[]> = {
  "January": [
    "Lamentations 3:22-23", "Isaiah 43:19", "2 Corinthians 5:17", "Ezekiel 36:26", 
    "Philippians 3:13-14", "Revelation 21:5", "Psalm 98:1", "Isaiah 40:31",
    "Psalm 51:10", "Job 8:7", "Proverbs 3:5-6", "Matthew 6:33"
  ],
  "February": [
    "1 Corinthians 13:4-7", "1 John 4:7-8", "John 15:13", "Romans 5:8", 
    "1 John 3:18", "Ephesians 5:2", "Proverbs 17:17", "1 John 4:19",
    "John 13:34", "Colossians 3:14", "1 Peter 4:8", "Psalm 143:8"
  ],
  "March": [
    "Psalm 51:10", "Romans 12:2", "2 Peter 3:18", "Colossians 2:6-7", 
    "Galatians 5:22-23", "Isaiah 40:31", "2 Corinthians 4:16", "Philippians 1:6",
    "John 15:5", "Ephesians 4:23-24", "Psalm 1:3", "Jeremiah 17:7-8"
  ],
  "April": [
    "John 3:16", "Romans 5:8", "Ephesians 1:7", "Galatians 3:13", 
    "1 Peter 2:24", "Hebrews 9:12", "Romans 6:23", "Isaiah 53:5",
    "Colossians 1:14", "2 Corinthians 5:21", "Titus 2:14", "1 John 1:9"
  ],
  "May": [
    "Hebrews 11:1", "Proverbs 3:5-6", "Matthew 17:20", "Romans 10:17", 
    "2 Corinthians 5:7", "James 1:6", "Mark 11:24", "Ephesians 2:8-9",
    "Matthew 21:22", "Hebrews 11:6", "Psalm 37:5", "Isaiah 26:3"
  ],
  "June": [
    "James 1:5", "Psalm 119:105", "Proverbs 2:6", "Proverbs 16:9", 
    "Psalm 32:8", "Isaiah 30:21", "Proverbs 3:13", "Colossians 1:9",
    "Proverbs 4:7", "Psalm 25:4-5", "James 3:17", "Proverbs 19:21"
  ],
  "July": [
    "John 8:32", "Galatians 5:1", "2 Corinthians 3:17", "John 14:6", 
    "Psalm 119:45", "Romans 6:22", "John 17:17", "Psalm 25:5",
    "1 Peter 2:16", "John 16:13", "Psalm 86:11", "Ephesians 4:21"
  ],
  "August": [
    "Joshua 1:9", "Philippians 4:13", "Isaiah 41:10", "Psalm 27:1", 
    "2 Timothy 1:7", "Ephesians 6:10", "Psalm 18:2", "Isaiah 40:29",
    "Psalm 46:1", "2 Corinthians 12:9", "Exodus 15:2", "Habakkuk 3:19"
  ],
  "September": [
    "Galatians 5:13", "1 Peter 4:10", "Matthew 20:28", "Colossians 3:23", 
    "Ephesians 2:10", "Romans 12:1", "Matthew 5:16", "Hebrews 6:10",
    "1 Corinthians 15:58", "Mark 10:45", "Joshua 24:15", "Psalm 100:2"
  ],
  "October": [
    "Psalm 27:1", "Matthew 5:14", "Psalm 91:1-2", "2 Thessalonians 3:3", 
    "Psalm 121:7-8", "John 8:12", "Isaiah 54:17", "Proverbs 18:10",
    "Psalm 34:7", "Deuteronomy 31:6", "Psalm 46:1", "Isaiah 43:2"
  ],
  "November": [
    "1 Thessalonians 5:18", "Psalm 107:1", "Philippians 4:6", "Psalm 100:4", 
    "Colossians 3:17", "Psalm 95:2", "Psalm 118:1", "1 Chronicles 16:34",
    "Psalm 136:1", "Ephesians 5:20", "Psalm 106:1", "2 Corinthians 9:15"
  ],
  "December": [
    "Romans 15:13", "Isaiah 9:6", "Luke 2:10-11", "Nehemiah 8:10", 
    "Psalm 16:11", "Matthew 2:10", "John 15:11", "Psalm 30:5",
    "Isaiah 12:2", "Galatians 5:22", "Psalm 118:24", "1 Peter 1:8"
  ]
};

export const generateFullYearSchedule = async () => {
  const days: DailyJourneyDay[] = [];
  const startDate = new Date('2026-01-01');
  
  for (let i = 0; i < 366; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    // Stop if we hit 2027 (handles leap year 366 vs 365)
    if (date.getFullYear() > 2026) break;
    
    const dateStr = date.toISOString().split('T')[0];
    const monthName = date.toLocaleString('default', { month: 'long' });
    const theme = MONTHLY_THEMES[monthName] || "Faith";
    const dayOfYear = i + 1;
    
    const monthVerses = TOPICAL_LIBRARY[monthName] || TOPICAL_LIBRARY["January"];
    
    // Deterministically pick 2 verses based on the day of the year to ensure variety
    const idx1 = (dayOfYear * 2) % monthVerses.length;
    const idx2 = (dayOfYear * 2 + 1) % monthVerses.length;
    
    const references = [monthVerses[idx1], monthVerses[idx2]];
    
    days.push({
      date: dateStr,
      month: monthName,
      theme,
      references
    });
  }
  
  await saveDailySchedule(days);
};

export const getAllScheduleDays = async (): Promise<DailyJourneyDay[]> => {
  try {
    const db = await initBibleDB();
    const days = await db.getAll('daily_schedule');
    const progress = await getAllDailyProgress();
    
    return days.map(day => {
      const dayProgress = progress.filter(p => p.date === day.date);
      const isCompleted = dayProgress.length === day.references.length;
      const isInitialPass = dayProgress.length > 0 && dayProgress.every(p => p.isInitialPass);
      
      return {
        ...day,
        isCompleted,
        isInitialPass
      };
    });
  } catch (e) {
    return [];
  }
};

export const getDailyJourneyDay = async (dateStr: string): Promise<DailyJourneyDay | null> => {
  // 1. Try local IndexedDB first
  const localDay = await getDailyScheduleDay(dateStr);
  if (localDay) return localDay;

  // 2. Fallback to Firestore (for legacy or if local failed)
  const docRef = doc(db, 'daily_journey_2026', dateStr);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as DailyJourneyDay;
  }
  
  // 3. Last resort: Generate on the fly (shouldn't happen if bundled)
  const date = new Date(dateStr);
  const monthName = date.toLocaleString('default', { month: 'long' });
  const theme = MONTHLY_THEMES[monthName] || "Faith";
  const dayOfMonth = date.getDate();
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  
  const monthVerses = TOPICAL_LIBRARY[monthName] || TOPICAL_LIBRARY["January"];
  const idx1 = (dayOfYear * 2) % monthVerses.length;
  const idx2 = (dayOfYear * 2 + 1) % monthVerses.length;
  
  const references = [monthVerses[idx1], monthVerses[idx2]];
  
  const dayData: DailyJourneyDay = {
    date: dateStr,
    month: monthName,
    theme,
    references
  };

  return dayData;
};

export const recordVerseCompletion = async (
  date: string, 
  reference: string, 
  timePerWord: number
): Promise<{ xp: number; isInitialPass: boolean }> => {
  const id = `${date}_${reference}`;
  const existing = await getDailyProgress(id);
  
  const isInitialPass = !existing && timePerWord < 1.0;
  const xpPerWord = isInitialPass ? 3 : 1;
  
  const newProgress: DailyProgress = {
    id,
    date,
    reference,
    bestTimePerWord: existing ? Math.min(existing.bestTimePerWord, timePerWord) : timePerWord,
    completedCount: (existing?.completedCount || 0) + 1,
    lastPlayed: new Date().toISOString(),
    isInitialPass: existing?.isInitialPass || isInitialPass
  };
  
  await saveDailyProgress(newProgress);
  
  return { xp: xpPerWord, isInitialPass };
};

export const updateDailyLeaderboard = async (
  userId: string, 
  displayName: string, 
  photoURL: string, 
  timeMs: number, 
  month: string
) => {
  const periods = ['yearly', `monthly_${month.toLowerCase()}`];
  
  for (const period of periods) {
    const rankingRef = doc(db, 'daily_leaderboards_2026', period, 'rankings', userId);
    const rankingSnap = await getDoc(rankingRef);
    
    if (rankingSnap.exists()) {
      const data = rankingSnap.data();
      const newCount = (data.versesCompleted || 0) + 1;
      const newAverage = ((data.averageTime * data.versesCompleted) + timeMs) / newCount;
      
      await updateDoc(rankingRef, {
        averageTime: newAverage,
        versesCompleted: newCount,
        updatedAt: serverTimestamp(),
        displayName,
        photoURL
      });
    } else {
      await setDoc(rankingRef, {
        userId,
        displayName,
        photoURL,
        averageTime: timeMs,
        versesCompleted: 1,
        updatedAt: serverTimestamp()
      });
    }
  }
};
