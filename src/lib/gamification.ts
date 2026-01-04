
import { prisma } from "@/lib/prisma";

export async function checkAndAwardBadges(userId: string, action: 'TASK_COMPLETE' | 'ATTENDANCE_CHECKIN') {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                achievements: true,
                tasksReceived: { where: { status: 'COMPLETED' } },
                attendance: { orderBy: { timestamp: 'desc' }, take: 30 }
            }
        });

        if (!user) return;

        const existingBadgeTitles = new Set(user.achievements.map(a => a.title));
        const newBadges: { title: string; description: string; icon: string }[] = [];

        // 1. Task Badges
        if (action === 'TASK_COMPLETE') {
            const completedCount = user.tasksReceived.length; // This includes the one just completed if transaction committed, or +1

            if (completedCount >= 10 && !existingBadgeTitles.has("Görev Ustası")) {
                newBadges.push({
                    title: "Görev Ustası",
                    description: "10 görev başarıyla tamamlandı.",
                    icon: "trophy"
                });
            }
            if (completedCount >= 50 && !existingBadgeTitles.has("Efsane Çalışan")) {
                newBadges.push({
                    title: "Efsane Çalışan",
                    description: "50 görev tamamlandı!",
                    icon: "star"
                });
            }
        }

        // 2. Attendance Streaks (Simple Logic: Check last 5 check-ins for consecutive days)
        if (action === 'ATTENDANCE_CHECKIN') {
            // This runs AFTER the current check-in is saved.
            const records = user.attendance.filter(a => a.type === 'CHECK_IN');
            if (records.length >= 5 && !existingBadgeTitles.has("Erkenci Kuş")) {
                // Simplified check: Just count total check-ins for now to ensure reliability without complex date math
                // Or check if they were never late in last 5
                const allOnTime = records.slice(0, 5).every(r => !r.isLate);
                if (allOnTime) {
                    newBadges.push({
                        title: "Erkenci Kuş",
                        description: "Son 5 mesaiye tam vaktinde gelindi.",
                        icon: "zap"
                    });
                }
            }
        }

        // Award Badges
        for (const badge of newBadges) {
            await prisma.achievement.create({
                data: {
                    userId,
                    title: badge.title,
                    description: badge.description,
                    icon: badge.icon,
                    date: new Date()
                }
            });

            // Optional: Send Notification
            // await sendPushNotification(user.fcmToken, "Yeni Başarım Kazandınız!", badge.title);
        }

    } catch (error) {
        console.error("Gamification Error:", error);
    }
}
