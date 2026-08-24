import { Project } from "./types";

const DB_NAME = "tubepad";
const DB_VERSION = 1;
const PROJECTS_STORE = "projects";
const ASSETS_STORE = "assets"; // audio blobs for builtin/upload pads

// Private browsing (notably Safari) can throw synchronously on
// indexedDB.open, or the global can simply be absent. Every export below
// degrades to a safe no-op in that case instead of crashing the app —
// isStorageAvailable() lets the UI tell the user their work won't persist.
let unavailable = typeof indexedDB === "undefined";

export function isStorageAvailable(): boolean {
  return !unavailable;
}

function openDb(): Promise<IDBDatabase> {
  if (unavailable) return Promise.reject(new Error("IndexedDB unavailable"));
  return new Promise((resolve, reject) => {
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      unavailable = true;
      reject(err);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(ASSETS_STORE)) {
        db.createObjectStore(ASSETS_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (store: IDBObjectStore) => IDBRequest<any>,
  fallback: T
): Promise<T> {
  if (unavailable) return fallback;
  try {
    const db = await openDb();
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(store, mode);
      const req = fn(transaction.objectStore(store));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  } catch {
    unavailable = true;
    return fallback;
  }
}

export async function saveProject(project: Project): Promise<void> {
  await tx(PROJECTS_STORE, "readwrite", (s) => s.put(project), undefined);
}

export async function loadProject(id: string): Promise<Project | undefined> {
  return tx(PROJECTS_STORE, "readonly", (s) => s.get(id), undefined);
}

export async function listProjects(): Promise<Project[]> {
  return tx(PROJECTS_STORE, "readonly", (s) => s.getAll(), []);
}

export async function deleteProject(id: string): Promise<void> {
  await tx(PROJECTS_STORE, "readwrite", (s) => s.delete(id), undefined);
}

export async function saveAsset(id: string, blob: Blob): Promise<void> {
  await tx(ASSETS_STORE, "readwrite", (s) => s.put(blob, id), undefined);
}

export async function loadAsset(id: string): Promise<Blob | undefined> {
  return tx(ASSETS_STORE, "readonly", (s) => s.get(id), undefined);
}

export const LAST_PROJECT_KEY = "tubepad:lastProjectId";
