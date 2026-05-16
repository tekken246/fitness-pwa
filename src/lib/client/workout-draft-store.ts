import type { WorkoutDraft } from '@/lib/types';

const DATABASE_NAME = 'fit-track-drafts';
const DATABASE_VERSION = 1;
const STORE_NAME = 'workout-drafts';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'sessionId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open draft database.'));
  });
}

function runTransaction<T>(mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = callback(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Draft database request failed.'));
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => {
          database.close();
          reject(transaction.error ?? new Error('Draft transaction failed.'));
        };
      }),
  );
}

/** Saves the active workout draft to IndexedDB. */
export function saveWorkoutDraft(draft: WorkoutDraft): Promise<IDBValidKey> {
  return runTransaction('readwrite', (store) => store.put(draft));
}

/** Loads an active workout draft from IndexedDB. */
export function loadWorkoutDraft(sessionId: string): Promise<WorkoutDraft | null> {
  return runTransaction<WorkoutDraft | undefined>('readonly', (store) => store.get(sessionId)).then(
    (draft) => draft ?? null,
  );
}

/** Deletes a synced workout draft from IndexedDB. */
export function clearWorkoutDraft(sessionId: string): Promise<undefined> {
  return runTransaction('readwrite', (store) => store.delete(sessionId));
}

/** Returns true when IndexedDB can be used in the current browser. */
export function canUseDraftStore(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}
