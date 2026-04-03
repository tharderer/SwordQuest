import { openDB, IDBPDatabase } from 'idb';
import { Verse } from '../types';
import { KJV_LIBRARY } from './bibleData';

const DB_NAME = 'bible_db';
const STORE_NAME = 'verses';

export const BIBLE_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalm', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark',
  'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians',
  'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

const BOOK_MAPPING: Record<string, string> = {
  'Gen': 'Genesis', 'Ex': 'Exodus', 'Exo': 'Exodus', 'Lev': 'Leviticus', 'Num': 'Numbers', 'Deut': 'Deuteronomy',
  'Josh': 'Joshua', 'Judg': 'Judges', 'Ruth': 'Ruth', '1Sam': '1 Samuel', '2Sam': '2 Samuel',
  '1Kings': '1 Kings', '2Kings': '2 Kings', '1Chron': '1 Chronicles', '2Chron': '2 Chronicles',
  'Ezra': 'Ezra', 'Neh': 'Nehemiah', 'Esth': 'Esther', 'Job': 'Job', 'Ps': 'Psalm', 'Psa': 'Psalm', 'Prov': 'Proverbs',
  'Eccl': 'Ecclesiastes', 'Song': 'Song of Solomon', 'Isa': 'Isaiah', 'Jer': 'Jeremiah', 'Lam': 'Lamentations',
  'Ezek': 'Ezekiel', 'Dan': 'Daniel', 'Hos': 'Hosea', 'Joel': 'Joel', 'Amos': 'Amos', 'Obad': 'Obadiah',
  'Jonah': 'Jonah', 'Mic': 'Micah', 'Nah': 'Nahum', 'Hab': 'Habakkuk', 'Zeph': 'Zephaniah', 'Hag': 'Haggai',
  'Zech': 'Zechariah', 'Mal': 'Malachi', 'Matt': 'Matthew', 'Mark': 'Mark', 'Luke': 'Luke', 'John': 'John',
  'Acts': 'Acts', 'Rom': 'Romans', '1Cor': '1 Corinthians', '2Cor': '2 Corinthians', 'Gal': 'Galatians',
  'Eph': 'Ephesians', 'Phil': 'Philippians', 'Col': 'Colossians', '1Thess': '1 Thessalonians', '2Thess': '2 Thessalonians',
  '1Tim': '1 Timothy', '2Tim': '2 Timothy', 'Titus': 'Titus', 'Philem': 'Philemon', 'Heb': 'Hebrews', 'James': 'James',
  '1Pet': '1 Peter', '2Pet': '2 Peter', '1John': '1 John', '2John': '2 John', '3John': '3 John', 'Jude': 'Jude',
  'Rev': 'Revelation', '1 Sam': '1 Samuel', '2 Sam': '2 Samuel', '1 Kin': '1 Kings', '2 Kin': '2 Kings',
  '1 Chr': '1 Chronicles', '2 Chr': '2 Chronicles', '1 Cor': '1 Corinthians', '2 Cor': '2 Corinthians',
  '1 Thess': '1 Thessalonians', '2 Thess': '2 Thessalonians', '1 Tim': '1 Timothy', '2 Tim': '2 Timothy',
  '1 Pet': '1 Peter', '2 Pet': '2 Peter', '1 Jo': '1 John', '2 Jo': '2 John', '3 Jo': '3 John'
};

function normalizeBookName(name: string): string {
  const trimmed = name.trim();
  if (BOOK_MAPPING[trimmed]) return BOOK_MAPPING[trimmed];
  
  // Try to find a match in BIBLE_BOOKS
  const match = BIBLE_BOOKS.find(b => b.toLowerCase() === trimmed.toLowerCase());
  if (match) return match;
  
  return trimmed;
}

function getBookName(bookNum: number): string {
  return BIBLE_BOOKS[bookNum - 1] || `Book ${bookNum}`;
}

/**
 * Cleans verse text of common markers while preserving the core KJV text.
 */
function cleanVerseText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\{[^{}]*:[^{}]*\}/g, '') // Remove commentary markers
    .replace(/[\[\]\{\}\(\)]/g, '')     // Remove brackets/braces
    .replace(/\s+/g, " ")              // Normalize whitespace
    .trim();
}

let dbPromise: Promise<IDBPDatabase> | null = null;
let useFallback = false;

export async function initBibleDB() {
  if (dbPromise) return dbPromise;
  if (useFallback) throw new Error('Using local library fallback');

  try {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('book', 'book');
          store.createIndex('reference', ['book', 'chapter', 'verse']);
        }
      },
      blocked() {
        console.warn('Bible DB open blocked by another tab. Please close other tabs of this app.');
      },
      blocking() {
        console.warn('Bible DB blocking another tab from opening. Closing connection...');
      },
      terminated() {
        console.error('Bible DB connection terminated unexpectedly');
        dbPromise = null;
      }
    });

    // Increase safety timeout to 15 seconds to handle slow environments
    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('IndexedDB open timed out (15s). This can happen if another tab is blocking the database or the environment is slow.')), 15000)
    );

    const db = await Promise.race([dbPromise, timeout]);
    return db;
  } catch (error) {
    console.error('Failed to initialize Bible DB:', error);
    dbPromise = null;
    // Don't permanently set useFallback to true on the first timeout
    // Only use fallback for the current operation if needed
    if (error instanceof Error && error.message.includes('timed out')) {
      console.warn('Bible DB timed out, will try again on next request but providing fallback for now.');
    } else {
      useFallback = true;
    }
    throw error;
  }
}

export async function searchBible(query: string): Promise<Verse[]> {
  try {
    const db = await initBibleDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const allVerses = await store.getAll();
    
    const s = query.toLowerCase();
    return allVerses.filter(v => 
      v.book.toLowerCase().includes(s) || 
      v.text.toLowerCase().includes(s) ||
      `${v.book} ${v.chapter}:${v.verse}`.toLowerCase().includes(s)
    ).slice(0, 50);
  } catch (error) {
    console.warn('Search falling back to local library:', error);
    const s = query.toLowerCase();
    return KJV_LIBRARY.filter(v => 
      v.book.toLowerCase().includes(s) || 
      v.text.toLowerCase().includes(s) ||
      `${v.book} ${v.chapter}:${v.verse}`.toLowerCase().includes(s)
    ).slice(0, 50);
  }
}

export async function getVerseByRef(book: string, chapter: number, verse: number): Promise<Verse | undefined> {
  try {
    const db = await initBibleDB();
    const index = db.transaction(STORE_NAME).store.index('reference');
    return await index.get([book, chapter, verse]);
  } catch (error) {
    console.warn('GetVerseByRef falling back to local library:', error);
    return KJV_LIBRARY.find(v => v.book === book && v.chapter === chapter && v.verse === verse);
  }
}

export async function getVersesByRange(book: string, chapter: number, startVerse: number, endVerse: number): Promise<Verse[]> {
  try {
    const db = await initBibleDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('reference');
    
    const range = IDBKeyRange.bound([book, chapter, startVerse], [book, chapter, endVerse]);
    return await index.getAll(range);
  } catch (error) {
    console.warn('GetVersesByRange falling back to local library:', error);
    return KJV_LIBRARY.filter(v => 
      v.book === book && 
      v.chapter === chapter && 
      v.verse >= startVerse && 
      v.verse <= endVerse
    );
  }
}

export async function getVersesByChapter(book: string, chapter: number): Promise<Verse[]> {
  try {
    const db = await initBibleDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('reference');
    
    // The index is ['book', 'chapter', 'verse']
    const range = IDBKeyRange.bound([book, chapter, 0], [book, chapter, 999]);
    return await index.getAll(range);
  } catch (error) {
    console.warn('GetVersesByChapter falling back to local library:', error);
    return KJV_LIBRARY.filter(v => v.book === book && v.chapter === chapter);
  }
}

export async function getVersesByBook(book: string): Promise<Verse[]> {
  try {
    const db = await initBibleDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('book');
    return await index.getAll(book);
  } catch (error) {
    console.warn('GetVersesByBook falling back to local library:', error);
    return KJV_LIBRARY.filter(v => v.book === book);
  }
}

export async function getBooks(): Promise<string[]> {
  try {
    const db = await initBibleDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('book');
    
    const books: string[] = [];
    let cursor = await index.openCursor(null, 'nextunique');
    while (cursor) {
      books.push(cursor.key.toString());
      cursor = await cursor.continue();
    }
    
    if (books.length === 0) throw new Error('No books in DB');
    return books;
  } catch (error) {
    console.warn('GetBooks falling back to full book list:', error);
    // Return all books even if they don't have verses in the fallback library
    // This allows the user to see the full list in the creator
    return BIBLE_BOOKS;
  }
}

export async function getBibleVerses(): Promise<Verse[]> {
  try {
    const db = await initBibleDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return await store.getAll();
  } catch (error) {
    console.warn('getBibleVerses falling back to local library:', error);
    return KJV_LIBRARY;
  }
}

export async function getChapters(book: string): Promise<number[]> {
  try {
    const db = await initBibleDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('reference');
    
    // The reference index is [book, chapter, verse]
    // We can use a cursor to find unique chapters for this book
    const chapters: number[] = [];
    const range = IDBKeyRange.bound([book, 0, 0], [book, 999, 999]);
    let cursor = await index.openCursor(range);
    
    while (cursor) {
      const chapter = cursor.key[1] as number;
      if (!chapters.includes(chapter)) {
        chapters.push(chapter);
      }
      // Jump to the next chapter to be efficient
      cursor = await cursor.continue([book, chapter + 1, 0]);
    }
    return chapters;
  } catch (error) {
    console.warn('GetChapters falling back to local library:', error);
    return Array.from(new Set(KJV_LIBRARY.filter(v => v.book === book).map(v => v.chapter))).sort((a, b) => a - b);
  }
}

export async function seedBible(verses: Verse[]) {
  const db = await initBibleDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  await store.clear();
  
  for (const verse of verses) {
    store.put(verse);
  }
  
  return tx.done;
}

export async function isBibleSeeded(): Promise<boolean> {
  try {
    const db = await initBibleDB();
    const count = await db.count(STORE_NAME);
    return count > 30000; // KJV has ~31,102 verses
  } catch (e) {
    return false;
  }
}

export async function clearBibleDB() {
  const db = await initBibleDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).clear();
  await tx.done;
  console.log('Bible DB cleared');
}

let isDownloading = false;

export async function downloadFullKJV(onProgress?: (progress: number) => void, force: boolean = false) {
  if (isDownloading) return;
  isDownloading = true;

  try {
    const db = await initBibleDB();
    
    if (force) {
      await clearBibleDB();
    } else {
      const count = await db.count(STORE_NAME);
      if (count > 30000) {
        console.log('Bible already fully downloaded');
        if (onProgress) onProgress(100);
        isDownloading = false;
        return;
      }
    }

  console.log('Downloading Full KJV Bible...');
  
  const sources = [
    'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/kjv/kjv.txt',
    'https://raw.githubusercontent.com/OpenBibleInfo/Bible-Data/master/kjv.txt',
    'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json',
    'https://raw.githubusercontent.com/getbible/v2/main/json/kjv.json',
    '/kjv.txt'
  ];

  let data = null;
  let error = null;
  let isTextFormat = false;

  for (const url of sources) {
    try {
      console.log(`Attempting to fetch from: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout per source

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        let rawData;
        let currentIsText = false;
        if (url.endsWith('.txt')) {
          rawData = await response.text();
          currentIsText = true;
        } else {
          rawData = await response.json();
          currentIsText = false;
        }

        // Quick validation: does it look like a full Bible?
        // KJV is ~4.5MB text. If it's less than 2MB, it's likely truncated.
        if (typeof rawData === 'string' && rawData.length < 2000000 && url === '/kjv.txt') {
          console.warn(`Local source ${url} appears truncated (${rawData.length} bytes). Trying next...`);
          continue;
        }

        data = rawData;
        isTextFormat = currentIsText;
        console.log(`Successfully fetched Bible data from ${url}`);
        break;
      } else {
        console.warn(`Source ${url} returned status ${response.status}`);
      }
    } catch (e) {
      error = e;
      console.warn(`Failed to fetch from ${url}:`, e);
    }
  }

  if (!data) throw error || new Error('Failed to fetch Bible data from all sources');
  
  const verses: Verse[] = [];
  
  if (isTextFormat && typeof data === 'string') {
    const lines = data.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Format: [LineNumber:] Book Chapter:Verse Text
      // Also handle OpenBible format: Book\tChapter\tVerse\tText
      // Improved regex to handle optional line numbers with colons or periods, and various spacing
      const match = trimmed.match(/^(?:\d+[:.]?\s+)?(.+)\s+(\d+)[:.](\d+)\s+(.*)$/) || 
                    trimmed.match(/^(?:\d+[:.]?\s+)?([^\t]+)\t(\d+)\t(\d+)\t(.*)$/);
      if (match) {
        verses.push({
          book: normalizeBookName(match[1]),
          chapter: Number(match[2]),
          verse: Number(match[3]),
          text: cleanVerseText(match[4])
        });
      }
    }
  } else {
    // Normalize data structure
    // Case 1: Flat array of verses or object with result/verses array
    const flatList = Array.isArray(data) ? data : (data.result || data.verses);
    if (Array.isArray(flatList) && flatList.length > 0 && (flatList[0].text || flatList[0].t || flatList[0].v)) {
      flatList.forEach((v: any) => {
        const text = String(v.text || v.t || v.v || '');
        if (text) {
          verses.push({
            book: v.book || v.b || 'Unknown',
            chapter: Number(v.chapter || v.c || 1),
            verse: Number(v.verse || v.v || v.n || 1),
            text: cleanVerseText(text)
          });
        }
      });
    } 
    // Case 2: Nested structure (Books -> Chapters -> Verses)
    else {
      let books = data.books || data.library || (Array.isArray(data) ? data : []);
      
      if (!Array.isArray(books) && typeof data === 'object') {
        // Maybe it's an object where keys are book names?
        books = Object.entries(data).map(([name, content]: [string, any]) => ({
          name,
          ...content
        }));
      }

      if (Array.isArray(books)) {
        books.forEach((book: any, bIdx: number) => {
          const bookName = book.name || book.book || book.title || `Book ${bIdx + 1}`;
          const chapters = book.chapters || book.chapter || [];
          
          if (Array.isArray(chapters)) {
            chapters.forEach((chapter: any, cIdx: number) => {
              const chapterNum = chapter.num || chapter.number || (cIdx + 1);
              
              // Case 2a: chapter is an array of verses (either strings or objects)
              if (Array.isArray(chapter)) {
                chapter.forEach((vData: any, vIdx: number) => {
                  const text = typeof vData === 'string' ? vData : (vData.text || vData.verse || vData.v || '');
                  const verseNum = vData.num || vData.number || vData.v || (vIdx + 1);
                  if (text) {
                    verses.push({
                      book: bookName,
                      chapter: Number(chapterNum),
                      verse: Number(verseNum),
                      text: cleanVerseText(String(text))
                    });
                  }
                });
              } 
              // Case 2b: chapter is an object with a verses array
              else if (chapter.verses && Array.isArray(chapter.verses)) {
                chapter.verses.forEach((vData: any, vIdx: number) => {
                  const text = typeof vData === 'string' ? vData : (vData.text || vData.verse || vData.v || '');
                  const verseNum = vData.num || vData.number || vData.v || (vIdx + 1);
                  if (text) {
                    verses.push({
                      book: bookName,
                      chapter: Number(chapterNum),
                      verse: Number(verseNum),
                      text: cleanVerseText(String(text))
                    });
                  }
                });
              }
              // Case 2c: chapter is an object where keys are verse numbers
              else if (typeof chapter === 'object' && chapter !== null) {
                Object.entries(chapter).forEach(([vNum, vText]: [string, any]) => {
                  if (vNum !== 'num' && vNum !== 'number') {
                    const text = typeof vText === 'string' ? vText : (vText.text || vText.verse || vText.v || '');
                    if (text) {
                      verses.push({
                        book: bookName,
                        chapter: Number(chapterNum),
                        verse: Number(vNum),
                        text: cleanVerseText(String(text))
                      });
                    }
                  }
                });
              }
            });
          }
          // Case 2d: book has a verses array directly (some formats skip chapter objects)
          else if (Array.isArray(book.verses)) {
            book.verses.forEach((vData: any) => {
              if (vData.chapter && vData.verse && vData.text) {
                verses.push({
                  book: bookName,
                  chapter: Number(vData.chapter),
                  verse: Number(vData.verse),
                  text: cleanVerseText(String(vData.text))
                });
              }
            });
          }
        });
      }
    }
  }

  // Final check: if we have book numbers instead of names, try to map them
  if (verses.length > 0 && typeof verses[0].book === 'number') {
    verses.forEach(v => {
      v.book = getBookName(Number(v.book));
    });
  }

  if (verses.length === 0) {
    console.error('Data structure received:', typeof data, Array.isArray(data) ? 'Array' : 'Object');
    if (!Array.isArray(data)) console.log('Keys:', Object.keys(data).slice(0, 10));
    throw new Error('Parsed 0 verses from Bible data. The JSON structure might be unsupported.');
  }

  console.log(`Parsed ${verses.length} verses. Inserting into IndexedDB...`);

  // Clear existing data to avoid duplicates if we're re-downloading
  const txClear = db.transaction(STORE_NAME, 'readwrite');
  await txClear.objectStore(STORE_NAME).clear();
  await txClear.done;

  // Use multiple transactions to avoid long-running transaction issues
  const batchSize = 1000;
  for (let i = 0; i < verses.length; i += batchSize) {
    const batch = verses.slice(i, i + batchSize);
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    await Promise.all(batch.map(v => store.put(v)));
    await tx.done;
    
    if (onProgress) {
      onProgress(Math.round((i / verses.length) * 100));
    }
  }
  
  if (onProgress) onProgress(100);
  console.log('Full KJV Bible download complete');
  } finally {
    isDownloading = false;
  }
}

export function parseReference(ref: string) {
  // Handle range like "John 3:16-18" or single "John 3:16"
  const rangeMatch = ref.match(/^(.+)\s(\d+):(\d+)-(\d+)$/);
  if (rangeMatch) {
    return {
      book: rangeMatch[1],
      chapter: parseInt(rangeMatch[2]),
      startVerse: parseInt(rangeMatch[3]),
      endVerse: parseInt(rangeMatch[4])
    };
  }

  const singleMatch = ref.match(/^(.+)\s(\d+):(\d+)$/);
  if (singleMatch) {
    return {
      book: singleMatch[1],
      chapter: parseInt(singleMatch[2]),
      startVerse: parseInt(singleMatch[3]),
      endVerse: parseInt(singleMatch[3])
    };
  }
  return null;
}
