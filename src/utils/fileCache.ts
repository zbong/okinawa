/**
 * IndexedDB를 이용한 파일(PDF/이미지) Blob 오프라인 캐싱 유틸리티
 * audioCache.ts와 동일한 패턴으로 PDF, 이미지 파일을 저장
 */

const DB_NAME = 'OkinawaFileCache';
const STORE_NAME = 'file_blobs';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export async function initFileCacheDB(): Promise<IDBDatabase> {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * URL에서 파일을 Blob으로 다운로드하여 IndexedDB에 저장
 * @param id 파일 식별자 (file.id 또는 url)
 * @param url Supabase Storage URL 또는 data URI
 */
export async function cacheFileFromUrl(id: string, url: string): Promise<void> {
    if (!url || url.startsWith('data:')) {
        // data URI인 경우 그대로 저장 (Blob 변환)
        if (url?.startsWith('data:')) {
            const blob = dataUriToBlob(url);
            if (blob) await saveFileBlob(id, blob);
        }
        return;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch file: ${url}`);
    const blob = await response.blob();
    await saveFileBlob(id, blob);
}

/** Blob을 IndexedDB에 저장 */
export async function saveFileBlob(id: string, blob: Blob): Promise<void> {
    const db = await initFileCacheDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(blob, id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/** IndexedDB에서 Blob 꺼내기 */
export async function getFileBlob(id: string): Promise<Blob | null> {
    try {
        const db = await initFileCacheDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch {
        return null;
    }
}

/** Blob → Object URL 반환 (window.open에 사용) */
export async function getFileBlobUrl(id: string): Promise<string | null> {
    const blob = await getFileBlob(id);
    if (!blob) return null;
    return URL.createObjectURL(blob);
}

/** IndexedDB에서 파일 삭제 */
export async function deleteFileCache(id: string): Promise<void> {
    try {
        const db = await initFileCacheDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.warn('[FileCache] deleteFileCache failed:', e);
    }
}

/** 캐시된 파일인지 확인 */
export async function isFileCached(id: string): Promise<boolean> {
    const blob = await getFileBlob(id);
    return blob !== null;
}

/** data URI → Blob 변환 */
function dataUriToBlob(dataUri: string): Blob | null {
    try {
        const [header, base64] = dataUri.split(',');
        const mimeMatch = header.match(/:(.*?);/);
        if (!mimeMatch) return null;
        const mime = mimeMatch[1];
        const binary = atob(base64);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
        }
        return new Blob([array], { type: mime });
    } catch {
        return null;
    }
}
