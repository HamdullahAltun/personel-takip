import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { logInfo, logError } from '@/lib/log-utils';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const config = await prisma.aiAutomationConfig.findFirst();
    if (!config || !config.autoTaskAssignment) {
        return NextResponse.json({ message: 'Otomatik görev dağıtımı devre dışı.' });
    }

    try {
        await logInfo('Otomatik görev dağıtım robotu başlatıldı.', null, 'AI_ACTION');
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
                },
                fieldTasks: {
                    where: { status: 'IN_PROGRESS' }
                }
            }
        });

        let assignedCount = 0;

        // Import helper only if needed, or define here if importing fails due to path issues in some envs
        const { calculateMatchScore } = await import('@/lib/ai');

        for (const task of pendingTasks) {
            // Calculate scores for all staff
            const candidates = staff.map(u => ({
                user: u,
                score: calculateMatchScore(u as any, task as any)
            }));

            // Sort by score desc
            candidates.sort((a, b) => b.score - a.score);

            const bestCandidate = candidates[0];

            // Threshold: If score is too low (e.g. 0), maybe don't assign? 
            // For now, always assign if score > 0 logic, or just best one.
            if (bestCandidate && bestCandidate.score >= 0) {
                await prisma.task.update({
                    where: { id: task.id },
                    data: { assignedToId: bestCandidate.user.id }
                });

                await logInfo(`Görev Dağıtımı: "${task.title}" -> ${bestCandidate.user.name} (Skor: ${bestCandidate.score}, Etiketler: ${task.tags.join(',')})`, null, 'AI_ACTION');

                // Update local counting
                bestCandidate.user.tasksReceived.push({} as any);
                assignedCount++;
            }
        }

        return NextResponse.json({ message: `${assignedCount} görev otomatik dağıtıldı.` });

    } catch (e) {
        logError('Görev dağıtıcı hatası', e);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
