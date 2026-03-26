
import { BIBLE_SECTIONS } from '../lib/bibleSections';

const DB_NAME = 'BibleHeroTowerDB';
const DB_VERSION = 2;
const QUESTIONS_STORE = 'questions';
const PROGRESS_STORE = 'progress';

export interface BibleQuestion {
  id?: number;
  text: string;
  correctAnswer: string;
  options: string[];
  era: string;
  reference?: string;
  lastSeen: number;
  book: string;
  chapter: number;
  verse?: number;
  sectionId: string;
  consecutiveCorrect?: number;
}

export interface SectionProgress {
  currentBook: string;
  currentChapter: number;
  currentVerse: number;
}

export interface BibleProgress {
  id: string;
  sections: Record<string, SectionProgress>;
  lastSectionIndex?: number;
  lastQuestionInCurrentSection?: number;
  lastQuestionId?: number;
}

export const initBibleQuestionDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('BibleHeroTowerDB open timed out (10s). This can happen if another tab is blocking the database.'));
    }, 10000);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction;
      
      if (!db.objectStoreNames.contains(QUESTIONS_STORE)) {
        const questionStore = db.createObjectStore(QUESTIONS_STORE, { keyPath: 'id', autoIncrement: true });
        questionStore.createIndex('lastSeen', 'lastSeen', { unique: false });
        questionStore.createIndex('sectionId', 'sectionId', { unique: false });
        questionStore.createIndex('book_chapter', ['book', 'chapter'], { unique: false });
      } else if (transaction) {
        // If store exists, ensure indices exist
        const questionStore = transaction.objectStore(QUESTIONS_STORE);
        if (!questionStore.indexNames.contains('lastSeen')) {
          questionStore.createIndex('lastSeen', 'lastSeen', { unique: false });
        }
        if (!questionStore.indexNames.contains('sectionId')) {
          questionStore.createIndex('sectionId', 'sectionId', { unique: false });
        }
        if (!questionStore.indexNames.contains('book_chapter')) {
          questionStore.createIndex('book_chapter', ['book', 'chapter'], { unique: false });
        }
      }

      if (!db.objectStoreNames.contains(PROGRESS_STORE)) {
        db.createObjectStore(PROGRESS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      clearTimeout(timeout);
      resolve(request.result);
    };
    request.onerror = () => {
      clearTimeout(timeout);
      reject(request.error);
    };
    request.onblocked = () => {
      console.warn('BibleHeroTowerDB open blocked by another tab');
    };
  });
};

export const saveQuestions = async (questions: BibleQuestion[]): Promise<void> => {
  const db = await initBibleQuestionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUESTIONS_STORE, 'readwrite');
    const store = transaction.objectStore(QUESTIONS_STORE);
    
    // Check for duplicates before adding
    const getAllRequest = store.getAll();
    getAllRequest.onsuccess = () => {
      const existing = getAllRequest.result as BibleQuestion[];
      questions.forEach(q => {
        const isDuplicate = existing.some(e => e.text === q.text && e.correctAnswer === q.correctAnswer);
        if (!isDuplicate) {
          // Initialize consecutiveCorrect if not present
          if (q.consecutiveCorrect === undefined) q.consecutiveCorrect = 0;
          store.add(q);
        }
      });
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getQuestionsSortedByLastSeen = async (): Promise<BibleQuestion[]> => {
  const db = await initBibleQuestionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUESTIONS_STORE, 'readonly');
    const store = transaction.objectStore(QUESTIONS_STORE);
    const index = store.index('lastSeen');
    const request = index.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getQuestionsBySection = async (sectionId: string): Promise<BibleQuestion[]> => {
  const db = await initBibleQuestionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUESTIONS_STORE, 'readonly');
    const store = transaction.objectStore(QUESTIONS_STORE);
    const index = store.index('sectionId');
    const request = index.getAll(sectionId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const updateQuestionLastSeen = async (id: number, correct: boolean = true): Promise<void> => {
  const db = await initBibleQuestionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUESTIONS_STORE, 'readwrite');
    const store = transaction.objectStore(QUESTIONS_STORE);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const question = getRequest.result as BibleQuestion;
      if (question) {
        question.lastSeen = Date.now();
        if (correct) {
          question.consecutiveCorrect = (question.consecutiveCorrect || 0) + 1;
        } else {
          question.consecutiveCorrect = 0;
        }
        store.put(question);
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getQuestionById = async (id: number): Promise<BibleQuestion | null> => {
  const db = await initBibleQuestionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUESTIONS_STORE, 'readonly');
    const store = transaction.objectStore(QUESTIONS_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const getBibleProgress = async (): Promise<BibleProgress> => {
  const db = await initBibleQuestionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROGRESS_STORE, 'readonly');
    const store = transaction.objectStore(PROGRESS_STORE);
    const request = store.get('current');

    request.onsuccess = () => {
      resolve(request.result || { id: 'current', sections: {} });
    };
    request.onerror = () => reject(request.error);
  });
};

export const updateBibleProgress = async (
  sections: Record<string, SectionProgress>,
  lastSectionIndex?: number,
  lastQuestionInCurrentSection?: number,
  lastQuestionId?: number
): Promise<void> => {
  const db = await initBibleQuestionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROGRESS_STORE, 'readwrite');
    const store = transaction.objectStore(PROGRESS_STORE);
    store.put({ id: 'current', sections, lastSectionIndex, lastQuestionInCurrentSection, lastQuestionId });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const deleteQuestion = async (id: number): Promise<void> => {
  const db = await initBibleQuestionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUESTIONS_STORE, 'readwrite');
    const store = transaction.objectStore(QUESTIONS_STORE);
    store.delete(id);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const deleteQuestions = async (ids: number[]): Promise<void> => {
  const db = await initBibleQuestionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUESTIONS_STORE, 'readwrite');
    const store = transaction.objectStore(QUESTIONS_STORE);
    ids.forEach(id => store.delete(id));

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const deleteAllQuestions = async (): Promise<void> => {
  const db = await initBibleQuestionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUESTIONS_STORE, 'readwrite');
    const store = transaction.objectStore(QUESTIONS_STORE);
    store.clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const resetBibleProgress = async (): Promise<void> => {
  const db = await initBibleQuestionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROGRESS_STORE, 'readwrite');
    const store = transaction.objectStore(PROGRESS_STORE);
    
    const sections: Record<string, SectionProgress> = {};
    BIBLE_SECTIONS.forEach(section => {
      sections[section.id] = {
        currentBook: section.startBook,
        currentChapter: section.startChapter,
        currentVerse: section.startVerse
      };
    });
    
    store.put({ 
      id: 'current', 
      sections, 
      lastSectionIndex: 0, 
      lastQuestionInCurrentSection: 0 
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};
