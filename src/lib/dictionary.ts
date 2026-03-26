
const DB_NAME = 'BibleGameDict';
const STORE_NAME = 'words';
const DICT_URL = 'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt';

export class DictionaryService {
  private db: IDBDatabase | null = null;
  private isLoaded = false;
  private initPromise: Promise<void> | null = null;

  async init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Dictionary DB open timed out (10s). This can happen if another tab is blocking the database.'));
      }, 10000);

      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onblocked = () => {
        console.warn('Dictionary DB open blocked by another tab');
      };
      request.onsuccess = () => {
        clearTimeout(timeout);
        this.db = request.result;
        this.db.onversionchange = () => {
          this.db?.close();
          console.warn('Dictionary DB version change, closing connection');
        };
        this.checkIfSeeded().then(seeded => {
          if (!seeded) {
            this.downloadAndSeed().then(resolve).catch(reject);
          } else {
            this.isLoaded = true;
            resolve();
          }
        });
      };
      request.onerror = () => {
        clearTimeout(timeout);
        reject(request.error);
      };
    });
  }

  private async checkIfSeeded(): Promise<boolean> {
    if (!this.db) return false;
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openKeyCursor();
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => resolve(false);
    });
  }

  private async downloadAndSeed() {
    console.log('Downloading massive dictionary...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for download
      
      const response = await fetch(DICT_URL, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      const words = text.split(/\r?\n/);
      
      // Batch seeding in chunks to avoid blocking the main thread and transaction timeout
      const chunkSize = 5000;
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize);
        
        await new Promise<void>((resolve, reject) => {
          if (!this.db) {
            reject(new Error('Database connection lost during seeding'));
            return;
          }
          
          const transaction = this.db.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(new Error('Transaction aborted'));

          for (const word of chunk) {
            const cleanWord = word.trim().toLowerCase();
            if (cleanWord.length >= 4) {
              try {
                store.put(true, cleanWord);
              } catch (e) {
                console.error('Error putting word into store:', e);
              }
            }
          }
        });

        // Yield to the main thread every chunk to keep UI responsive
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      this.isLoaded = true;
      console.log('Dictionary seeded successfully');
    } catch (error) {
      console.error('Failed to download dictionary:', error);
      throw error;
    }
  }

  async isValidWord(word: string): Promise<boolean> {
    if (!this.isLoaded || !this.db) return false;
    const cleanWord = word.trim().toLowerCase();
    if (cleanWord.length < 4) return false;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(cleanWord);
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => resolve(false);
    });
  }
}

export const dictionaryService = new DictionaryService();
