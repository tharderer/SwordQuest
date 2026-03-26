
import { JeopardyCategory, JeopardyDifficulty, JeopardyMode } from './bibleJeopardyService';

const DB_NAME = 'BibleJeopardyDB';
const DB_VERSION = 1;
const BOARDS_STORE = 'boards';

export interface Team {
  name: string;
  score: number;
  color: string;
}

export interface JeopardyGameState {
  answeredIds: string[];
  answeredMetadata: Record<string, { teamIndex: number, points: number }>;
  teams: Team[];
  lastUpdated: number;
}

export interface JeopardyBoard {
  id: string;
  createdAt: number;
  categories: JeopardyCategory[];
  difficulty: JeopardyDifficulty;
  mode: JeopardyMode;
  gameState?: JeopardyGameState;
}

export const initJeopardyDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Bible Hero Jeopardy DB open timed out (10s). This can happen if another tab is blocking the database.'));
    }, 10000);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(BOARDS_STORE)) {
        db.createObjectStore(BOARDS_STORE, { keyPath: 'id' });
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
      console.warn('Bible Hero Jeopardy DB open blocked by another tab');
    };
  });
};

export const saveJeopardyBoard = async (board: JeopardyBoard): Promise<void> => {
  const db = await initJeopardyDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOARDS_STORE, 'readwrite');
    const store = transaction.objectStore(BOARDS_STORE);
    store.put(board);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getAllJeopardyBoards = async (): Promise<JeopardyBoard[]> => {
  const db = await initJeopardyDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOARDS_STORE, 'readonly');
    const store = transaction.objectStore(BOARDS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const boards = request.result as JeopardyBoard[];
      // Sort by newest first
      resolve(boards.sort((a, b) => b.createdAt - a.createdAt));
    };
    request.onerror = () => reject(request.error);
  });
};

export const getJeopardyBoard = async (id: string): Promise<JeopardyBoard | null> => {
  const db = await initJeopardyDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOARDS_STORE, 'readonly');
    const store = transaction.objectStore(BOARDS_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const saveJeopardyGameState = async (boardId: string, state: JeopardyGameState): Promise<void> => {
  const board = await getJeopardyBoard(boardId);
  if (board) {
    board.gameState = state;
    await saveJeopardyBoard(board);
  }
};

export const deleteJeopardyBoard = async (id: string): Promise<void> => {
  const db = await initJeopardyDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOARDS_STORE, 'readwrite');
    const store = transaction.objectStore(BOARDS_STORE);
    store.delete(id);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};
