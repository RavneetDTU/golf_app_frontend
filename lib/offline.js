import { openDB } from 'idb'

const DB_NAME = 'golf-offline'
const DB_VERSION = 1
const STORE_NAME = 'pending-scores'

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    },
  })
}

export async function savePendingScore(scoreData) {
  const db = await getDB()
  return db.add(STORE_NAME, {
    ...scoreData,
    saved_at: new Date().toISOString()
  })
}

export async function getPendingScores() {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function deletePendingScore(id) {
  const db = await getDB()
  return db.delete(STORE_NAME, id)
}

export async function clearAllPending() {
  const db = await getDB()
  return db.clear(STORE_NAME)
}
