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

// Helper to convert base64 data URL to a Blob
const dataUrlToBlob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    if (!mimeMatch) {
      throw new Error("Invalid data URL");
    }
    const mimeType = mimeMatch[1];
    const b64 = atob(parts[1]);
    let n = b64.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = b64.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mimeType });
};


// --- Generated Cards using IndexedDB ---

export const getGeneratedCards = async (): Promise<GeneratedCardInfo[]> => {
  try {
    const db = await getDb();
    const transaction = db.transaction(CARDS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(CARDS_STORE_NAME);
    const storedObjects = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    
    // Convert blob to object URL for display
    return storedObjects.map(card => ({
        ...card,
        imageUrl: URL.createObjectURL(card.imageBlob)
    }));

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
      
      const imageBlob = dataUrlToBlob(newCard.imageUrl);
      
      const cardToStore = {
          id: newCard.id,
          name: newCard.name,
          prompt: newCard.prompt,
          imageBlob: imageBlob
      };

      await new Promise<void>((resolve, reject) => {
          const request = store.put(cardToStore);
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