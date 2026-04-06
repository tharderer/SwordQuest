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

export const generateDailyJourneyDay = async (dateStr: string): Promise<DailyJourneyDay | null> => {
  const date = new Date(dateStr);
  const monthName = date.toLocaleString('default', { month: 'long' });
  const theme = MONTHLY_THEMES[monthName] || "Faith";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 2 unique and meaningful Bible references (KJV) for the date ${dateStr}. 
      The theme for this month (${monthName}) is "${theme}". 
      Return the references as a JSON array of strings. 
      Example: ["John 3:16", "Psalm 23:1"]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const references = JSON.parse(response.text);
    
    const dayData: DailyJourneyDay = {
      date: dateStr,
      month: monthName,
      theme,
      references
    };

    // Save to global collection (might fail for guests, that's okay)
    try {
      await setDoc(doc(db, 'daily_journey_2026', dateStr), dayData);
    } catch (e) {
      console.warn("Could not save daily journey day (likely guest user):", e);
    }
    
    return dayData;
  } catch (error) {
    console.error("Failed to generate daily journey day:", error);
    return null;
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
