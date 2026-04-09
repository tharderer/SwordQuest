export type Difficulty = 'easy' | 'medium' | 'hard' | 'advanced' | 'master' | 'extreme';

export type Team = {
  name: string;
  score: number;
  color: string;
};

export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface DailyQuest {
  id: string;
  title: string;
  goal: number;
  current: number;
  reward: number;
  completed: boolean;
  type: 'xp' | 'verses' | 'perfect';
}

export interface VerseSet {
  id: string;
  name: string;
  verses: Verse[];
  createdAt: string;
}

export interface UserProgress {
  xp: number;
  streak: number;
  lastActive: string; // ISO date
  masteredVerses: string[]; // "Book Chapter:Verse" (Reached Supernova)
  verseXP: Record<string, number>; // Total XP earned per verse
  currentLevel: number;
  customVerses: Verse[];
  verseSets?: VerseSet[];
  hearts: number;
  maxHearts: number;
  gems: number;
  lastHeartRegen: string; // ISO date
  league: string;
  leaguePoints: number;
  xpHistory: { date: string, xp: number }[];
  dailyQuests: DailyQuest[];
  lastQuestReset: string; // ISO date
  legendaryVerses: string[]; // Verses that passed the legendary challenge
  crackedVerses: string[]; // Verses that need review
  verseTopTimes: Record<string, number[]>; // "Book Chapter:Verse" -> Array of top 10 times in ms
  verseMastery: Record<string, { 
    status: 'protostar' | 'main_sequence' | 'red_giant' | 'supernova';
    perfectRuns: number;
    timesSeen: number;
    lastPlayed: string; // ISO date
    fuel: number; // 0-100
  }>;
  verseLevels: Record<string, number>; // "Book Chapter:Verse" -> Level (1-5)
  learningVerses: string[]; // Verses currently being learned
}
