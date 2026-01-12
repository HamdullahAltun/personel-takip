import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { toast } from 'sonner';

export function useSync() {
    const pendingTasks = useLiveQuery(() => db.fieldTasks.where('status').equals('pending').toArray());

    useEffect(() => {
        const handleOnline = async () => {
            if (!pendingTasks || pendingTasks.length === 0) return;

            toast.info('Online olundu. Veriler senkronize ediliyor...');

            for (const task of pendingTasks) {
                try {
                    const res = await fetch('/api/field-tasks', {
                        method: 'POST',
                        body: JSON.stringify({
                            title: task.title,
                            description: task.description,
                            location: task.location,
                            lat: task.lat,
                            lng: task.lng,
                            // Map other fields
                        }),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (res.ok) {
                        await db.fieldTasks.update(task.id!, { status: 'synced' });
                        // Optionally delete: await db.fieldTasks.delete(task.id!);
                    }
                } catch (err) {
                    console.error('Sync failed for task', task.id, err);
                }
            }
            toast.success('Senkronizasyon tamamlandı.');
        };

        window.addEventListener('online', handleOnline);

        // Attempt sync immediately if online
        if (navigator.onLine) {
            handleOnline();
        }

        return () => window.removeEventListener('online', handleOnline);
    }, [pendingTasks]);

    return { pendingTasks };
}
