
import type { GeneratedCardInfo, UserDeck } from '../types';

const DB_NAME = 'MysticOrbDB';
const DB_VERSION = 1;
const CARDS_STORE_NAME = 'generatedCards';
const USER_DECKS_KEY = 'userTarotDecks';

let dbPromise: Promise<IDBDatabase> | null = null;

const getDb = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CARDS_STORE_NAME)) {
        db.createObjectStore(CARDS_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
  return dbPromise;
};


// --- Generated Cards using IndexedDB ---

export const getGeneratedCards = async (): Promise<GeneratedCardInfo[]> => {
  try {
    const db = await getDb();
    const transaction = db.transaction(CARDS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(CARDS_STORE_NAME);
    
    // The stored objects already contain the data URL, so we can return them directly.
    return await new Promise<GeneratedCardInfo[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

  } catch (error) {
    console.error("Error getting generated cards from IndexedDB", error);
    return [];
  }
};

export const saveGeneratedCard = async (newCard: GeneratedCardInfo): Promise<void> => {
  try {
      const db = await getDb();
      const transaction = db.transaction(CARDS_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CARDS_STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
          // Store the entire card object, which includes the 'imageUrl' as a base64 data URL.
          const request = store.put(newCard);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
      });
  } catch (error) {
     console.error("Error saving generated card to IndexedDB", error);
     throw new Error("Could not save card to the database.");
  }
};


// --- User Decks using localStorage (it's small data) ---

export const getUserDecks = (): UserDeck[] => {
  try {
    const decksJson = localStorage.getItem(USER_DECKS_KEY);
    return decksJson ? JSON.parse(decksJson) : [];
  } catch (error) {
    console.error("Error parsing user decks from localStorage", error);
    return [];
  }
};

export const saveUserDecks = (decks: UserDeck[]): void => {
  try {
    localStorage.setItem(USER_DECKS_KEY, JSON.stringify(decks));
  } catch (error) {
    console.error("Error saving user decks to localStorage", error);
  }
};
