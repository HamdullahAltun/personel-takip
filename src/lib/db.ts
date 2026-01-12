import Dexie, { type Table } from 'dexie';

export interface OfflineFieldTask {
    id?: number; // Auto-incremented ID for local items
    tempId: string; // UUID to track before syncing
    title: string;
    description: string;
    location: string;
    lat: number;
    lng: number;
    status: 'pending' | 'synced'; // pending sync, synced
    createdAt: Date;
}

export class MySubClassedDexie extends Dexie {
    fieldTasks!: Table<OfflineFieldTask>;

    constructor() {
        super('PersonelYonetimiDB');
        this.version(1).stores({
            fieldTasks: '++id, tempId, status, createdAt'
        });
    }
}

export const db = new MySubClassedDexie();
