import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Trophy, Star } from 'lucide-react';
import { cn, getLocalDateString } from '../lib/utils';

export const LeagueLeaderboard = ({ userPoints, leagueName }: { userPoints: number, leagueName: string }) => {
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

export const XPGraph = ({ history }: { history: { date: string, xp: number }[] }) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();
  
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
      <h3 className="font-bold text-gray-400 uppercase tracking-widest text-xs mb-4">Weekly Activity</h3>
      <div className="flex items-end justify-between h-24 gap-2">
        {days.map((day, i) => {
          const date = new Date();
          date.setDate(today.getDate() - (today.getDay() - i));
          const dateStr = getLocalDateString(date);
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
