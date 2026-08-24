import { Project } from "./types";

const DB_NAME = "tubepad";
const DB_VERSION = 1;
const PROJECTS_STORE = "projects";
const ASSETS_STORE = "assets"; // audio blobs for builtin/upload pads

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
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
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const req = fn(transaction.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveProject(project: Project): Promise<void> {
  await tx(PROJECTS_STORE, "readwrite", (s) => s.put(project));
}

export async function loadProject(id: string): Promise<Project | undefined> {
  return tx(PROJECTS_STORE, "readonly", (s) => s.get(id));
}

export async function listProjects(): Promise<Project[]> {
  return tx(PROJECTS_STORE, "readonly", (s) => s.getAll());
}

export async function deleteProject(id: string): Promise<void> {
  await tx(PROJECTS_STORE, "readwrite", (s) => s.delete(id));
}

export async function saveAsset(id: string, blob: Blob): Promise<void> {
  await tx(ASSETS_STORE, "readwrite", (s) => s.put(blob, id));
}

export async function loadAsset(id: string): Promise<Blob | undefined> {
  return tx(ASSETS_STORE, "readonly", (s) => s.get(id));
}

export const LAST_PROJECT_KEY = "tubepad:lastProjectId";
