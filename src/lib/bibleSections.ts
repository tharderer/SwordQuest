export interface BibleSection {
  id: string;
  name: string;
  description: string;
  startBook: string;
  startChapter: number;
  startVerse: number;
  color: string;
}

export const BIBLE_SECTIONS: BibleSection[] = [
  {
    id: 'foundations',
    name: 'The Foundations',
    description: 'Creation, Patriarchs, and the beginnings of Israel.',
    startBook: 'Genesis',
    startChapter: 1,
    startVerse: 1,
    color: '#f59e0b' // amber-500
  },
  {
    id: 'deliverance',
    name: 'Deliverance & Law',
    description: 'The Exodus, the wilderness, and the Ten Commandments.',
    startBook: 'Exodus',
    startChapter: 1,
    startVerse: 1,
    color: '#3b82f6' // blue-500
  },
  {
    id: 'conquest',
    name: 'Conquest & Judges',
    description: 'Entering the Promised Land and the era of the Judges.',
    startBook: 'Joshua',
    startChapter: 1,
    startVerse: 1,
    color: '#f43f5e' // rose-500
  },
  {
    id: 'kingdom',
    name: 'The Kingdom Years',
    description: 'The rise and fall of the monarchy, David, and Solomon.',
    startBook: '1 Samuel',
    startChapter: 1,
    startVerse: 1,
    color: '#eab308' // yellow-500
  },
  {
    id: 'wisdom',
    name: 'Wisdom & Poetry',
    description: 'Psalms, Proverbs, and the search for meaning.',
    startBook: 'Job',
    startChapter: 1,
    startVerse: 1,
    color: '#6366f1' // indigo-500
  },
  {
    id: 'prophets',
    name: 'The Prophets',
    description: 'God’s warnings and promises through His messengers.',
    startBook: 'Isaiah',
    startChapter: 1,
    startVerse: 1,
    color: '#a855f7' // purple-500
  },
  {
    id: 'christ',
    name: 'The Life of Christ',
    description: 'The birth, ministry, death, and resurrection of Jesus.',
    startBook: 'Matthew',
    startChapter: 1,
    startVerse: 1,
    color: '#10b981' // emerald-500
  },
  {
    id: 'church',
    name: 'The Early Church',
    description: 'The birth of the church and the spread of the Gospel.',
    startBook: 'Acts',
    startChapter: 1,
    startVerse: 1,
    color: '#f97316' // orange-500
  },
  {
    id: 'letters',
    name: 'Letters & Revelation',
    description: 'Instructions for believers and the vision of the end.',
    startBook: 'Romans',
    startChapter: 1,
    startVerse: 1,
    color: '#64748b' // slate-500
  }
];
