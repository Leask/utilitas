import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

if (typeof globalThis.indexedDB === 'undefined') {
    globalThis.indexedDB = indexedDB;
    globalThis.IDBKeyRange = IDBKeyRange;
}
