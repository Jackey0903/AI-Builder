/**
 * IndexedDB 录音暂存模块
 *
 * 将用户录制的音频 Blob 及检测元数据持久化到本地 IndexedDB，
 * 页面刷新后可自动恢复，避免录音因定时或意外丢失。
 */

import type { AutoDetectResult } from './audioEngine';

const DB_NAME    = 'sprite-console';
const STORE_NAME = 'recorded-sample';
const DB_VERSION = 1;
const SAMPLE_KEY = 'latest';

export interface StoredSample {
  blob: Blob;
  savedAt: number;
  /** 检测到的音高元数据（可能为空，表示检测失败） */
  detectResult: AutoDetectResult | null;
}

/** 打开（或创建）数据库 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/** 保存录音到 IndexedDB（覆盖上一次） */
export async function saveSample(blob: Blob, detectResult: AutoDetectResult | null): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record: StoredSample = { blob, savedAt: Date.now(), detectResult };
    const req = store.put(record, SAMPLE_KEY);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

/** 读取上次保存的录音，不存在则返回 null */
export async function loadSample(): Promise<StoredSample | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.get(SAMPLE_KEY);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as StoredSample) ?? null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

/** 清除已保存的录音 */
export async function clearSample(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.delete(SAMPLE_KEY);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
