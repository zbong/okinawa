/**
 * IndexedDB를 이용한 여행 데이터 로컬 캐싱 유틸리티
 * - 온라인: Supabase 로드 후 자동 저장
 * - 오프라인: IndexedDB에서 읽기 (fallback)
 */

const DB_NAME = 'OkinawaTripCache';
const TRIPS_STORE = 'trips';
const META_STORE = 'meta';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export async function initTripCacheDB(): Promise<IDBDatabase> {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(TRIPS_STORE)) {
                db.createObjectStore(TRIPS_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(META_STORE)) {
                db.createObjectStore(META_STORE);
            }
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onerror = () => reject(request.error);
    });
}

/** 여행 목록 전체를 IndexedDB에 저장 */
export async function saveTripsToDB(trips: any[]): Promise<void> {
    try {
        const db = await initTripCacheDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([TRIPS_STORE, META_STORE], 'readwrite');
            const store = tx.objectStore(TRIPS_STORE);
            const metaStore = tx.objectStore(META_STORE);

            // 기존 데이터 전체 삭제 후 재저장
            store.clear();
            for (const trip of trips) {
                store.put(trip);
            }

            // 마지막 저장 시간 기록
            metaStore.put(new Date().toISOString(), 'last_synced');

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.warn('[TripCache] saveTripsToDB failed:', e);
    }
}

/** IndexedDB에서 여행 목록 전체 읽기 */
export async function getTripsFromDB(): Promise<any[]> {
    try {
        const db = await initTripCacheDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(TRIPS_STORE, 'readonly');
            const store = tx.objectStore(TRIPS_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn('[TripCache] getTripsFromDB failed:', e);
        return [];
    }
}

/** 마지막 동기화 시간 가져오기 */
export async function getLastSyncedTime(): Promise<string | null> {
    try {
        const db = await initTripCacheDB();
        return new Promise((resolve) => {
            const tx = db.transaction(META_STORE, 'readonly');
            const store = tx.objectStore(META_STORE);
            const request = store.get('last_synced');
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
}

/** 특정 여행 1개를 IndexedDB에 저장/업데이트 */
export async function saveSingleTripToDB(trip: any): Promise<void> {
    try {
        const db = await initTripCacheDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(TRIPS_STORE, 'readwrite');
            const store = tx.objectStore(TRIPS_STORE);
            store.put(trip);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.warn('[TripCache] saveSingleTripToDB failed:', e);
    }
}

/** 특정 여행 1개를 IndexedDB에서 삭제 */
export async function deleteTripFromDB(id: string): Promise<void> {
    try {
        const db = await initTripCacheDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(TRIPS_STORE, 'readwrite');
            const store = tx.objectStore(TRIPS_STORE);
            store.delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.warn('[TripCache] deleteTripFromDB failed:', e);
    }
}
