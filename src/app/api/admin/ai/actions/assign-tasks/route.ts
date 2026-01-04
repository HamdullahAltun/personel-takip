import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const config = await prisma.aiAutomationConfig.findFirst();
    if (!config || !config.autoTaskAssignment) {
        return NextResponse.json({ message: 'Otomatik görev dağıtımı devre dışı.' });
    }

    try {
        // Find unassigned pending tasks
        const pendingTasks = await prisma.task.findMany({
            where: {
                status: 'PENDING',
                // Find tasks assigned to admin but not yet re-assigned
                assignedToId: session.id
            }
        });

        if (pendingTasks.length === 0) {
            return NextResponse.json({ message: 'Dağıtılacak uygun görev bulunamadı (Kendinize atanmış PENDING görevlere bakıldı).' });
        }

        const staff = await prisma.user.findMany({
            where: { role: 'STAFF' },
            include: {
                tasksReceived: {
                    where: { status: 'IN_PROGRESS' }
                }
            }
        });

        let assignedCount = 0;

        for (const task of pendingTasks) {
            // Logic: Find staff with LEAST "IN_PROGRESS" tasks
            // Better logic: Skills matching (future)

            // Sort staff by workload (ascending)
            staff.sort((a, b) => a.tasksReceived.length - b.tasksReceived.length);

            const bestCandidate = staff[0];

            if (bestCandidate) {
                await prisma.task.update({
                    where: { id: task.id },
                    data: { assignedToId: bestCandidate.id }
                });

                await prisma.systemLog.create({
                    data: {
                        level: 'AI_ACTION',
                        message: `Görev Otomasyonu: "${task.title}" görevi ${bestCandidate.name} personeline atandı (Mevcut yükü: ${bestCandidate.tasksReceived.length}).`,
                    }
                });

                // Update local counting to reflect assignment in this batch
                bestCandidate.tasksReceived.push({} as any);
                assignedCount++;
            }
        }

        return NextResponse.json({ message: `${assignedCount} görev otomatik dağıtıldı.` });

    } catch (e) {
        console.error(e);
        await prisma.systemLog.create({
            data: {
                level: 'ERROR',
                message: 'Görev dağıtıcı hatası: ' + (e as Error).message,
            }
        });
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
