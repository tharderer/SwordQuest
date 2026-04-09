import { Difficulty } from '../types';

export type MathOp = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface MathEquation {
  text: string;
  isCorrect: boolean;
  type: MathOp;
}

export const generateMathProblem = (score: number, difficulty: Difficulty = 'medium'): { options: MathEquation[], correctEquation: string, type: MathOp } => {
  const ops: MathOp[] = ['addition', 'subtraction', 'multiplication', 'division'];
  const type = ops[Math.floor(Math.random() * ops.length)];
  
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

  while (options.length < 4) {
    let distractorText = "";
    const distractorType = type;
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

export const BIBLE_EVENTS = [
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

export const generateChronologyQuestion = () => {
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

export const BIBLE_NAMES = [
  "ABRAHAM", "ISAAC", "JACOB", "JOSEPH", "MOSES", "JOSHUA", "GIDEON", "SAMSON", "SAMUEL", "DAVID", "SOLOMON", "ELIJAH", "ELISHA", "ISAIAH", "JEREMIAH", "EZEKIEL", "DANIEL", "PETER", "JAMES", "JOHN", "ANDREW", "PHILIP", "THOMAS", "MATTHEW", "PAUL", "TIMOTHY"
];

export const generateSpellingQuestion = (currentName: string, currentIndex: number) => {
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

export const BIBLE_PARABLES = [
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

export const generateParableQuestion = () => {
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

export const DANGER_LINE_PX = 8;
