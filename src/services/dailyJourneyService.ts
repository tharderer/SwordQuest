import { GoogleGenAI, Type } from "@google/genai";
import { db, doc, auth } from '../firebase';
import { getDoc, setDoc, collection, query, where, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface DailyJourneyDay {
  date: string;
  month: string;
  theme: string;
  references: string[];
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

export const getDailyJourneyDay = async (dateStr: string): Promise<DailyJourneyDay | null> => {
  const docRef = doc(db, 'daily_journey_2026', dateStr);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as DailyJourneyDay;
  }
  
  // If not exists, generate it on the fly (for demo/initial population)
  return await generateDailyJourneyDay(dateStr);
};

export const generateDailyJourneyBatch = async (dates: string[]): Promise<void> => {
  if (dates.length === 0) return;
  
  const monthName = new Date(dates[0]).toLocaleString('default', { month: 'long' });
  const theme = MONTHLY_THEMES[monthName] || "Faith";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 2 unique and meaningful Bible references (KJV) for each of the following dates: ${dates.join(', ')}. 
      The theme for this month (${monthName}) is "${theme}". 
      Return the result as a JSON object where the keys are the dates and the values are arrays of 2 strings (references).
      Example: {"2026-01-01": ["John 3:16", "Psalm 23:1"], "2026-01-02": ["Genesis 1:1", "John 1:1"]}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          additionalProperties: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    
    for (const dateStr of dates) {
      if (data[dateStr]) {
        const dayData: DailyJourneyDay = {
          date: dateStr,
          month: monthName,
          theme,
          references: data[dateStr]
        };
        await setDoc(doc(db, 'daily_journey_2026', dateStr), dayData);
      }
    }
  } catch (error) {
    console.error(`Failed to generate batch for ${monthName}:`, error);
  }
};

export const generateDailyJourneyDay = async (dateStr: string): Promise<DailyJourneyDay | null> => {
  await generateDailyJourneyBatch([dateStr]);
  const docRef = doc(db, 'daily_journey_2026', dateStr);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as DailyJourneyDay : null;
};

export const populateYear2026 = async (onProgress?: (progress: number) => void): Promise<void> => {
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  let totalDays = 0;
  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(2026, m + 1, 0).getDate();
    totalDays += daysInMonth;
  }

  let processedDays = 0;
  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(2026, m + 1, 0).getDate();
    const monthDates: string[] = [];
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `2026-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      monthDates.push(dateStr);
    }

    // Generate in batches of 5 to avoid long Gemini responses or timeouts
    for (let i = 0; i < monthDates.length; i += 5) {
      const batch = monthDates.slice(i, i + 5);
      await generateDailyJourneyBatch(batch);
      processedDays += batch.length;
      onProgress?.(Math.round((processedDays / totalDays) * 100));
    }
  }
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
