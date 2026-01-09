import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { calculateMatchScore, extractTagsFromText } from '@/lib/ai';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { title, description, tags: manualTags } = await req.json();

        // 1. Determine tags (skills) needed
        let tags = manualTags || [];
        if (tags.length === 0 && (title || description)) {
            tags = await extractTagsFromText(`${title} ${description}`);
        }

        // 2. Fetch all STAFF users
        const staff = await prisma.user.findMany({
            where: { role: 'STAFF' },
            select: {
                id: true,
                name: true,
                profilePicture: true,
                skills: true,
                tasksReceived: {
                    where: { status: 'IN_PROGRESS' },
                    select: { id: true }
                },
                fieldTasks: {
                    where: { status: 'IN_PROGRESS' },
                    select: { id: true }
                }
            }
        });

        // 3. Mock task object for scoring
        const mockTask = {
            title,
            description,
            tags,
            priority: 'MEDIUM'
        };

        // 4. Calculate scores
        const candidates = staff.map(user => {
            const score = calculateMatchScore(user as any, mockTask as any);

            // Generate basic explanation
            const workload = user.tasksReceived.length + user.fieldTasks.length;
            const matchedSkills = tags.filter((t: string) =>
                user.skills.some((s: string) => s.toLowerCase().includes(t.toLowerCase()))
            );

            let explanation = [];
            if (matchedSkills.length > 0) explanation.push(`Skills matched: ${matchedSkills.join(', ')}`);
            if (workload > 3) explanation.push("High workload penalty");
            else if (workload === 0) explanation.push("Available (Low workload)");

            return {
                user: {
                    id: user.id,
                    name: user.name,
                    profilePicture: user.profilePicture,
                    skills: user.skills,
                    workload
                },
                score,
                explanation: explanation.join('. ')
            };
        });

        // 5. Sort & Return Top 5
        candidates.sort((a, b) => b.score - a.score);

        return NextResponse.json({
            candidates: candidates.slice(0, 5),
            detectedTags: tags
        });

    } catch (e) {
        console.error("AI Candidate Suggestion Error:", e);
        return NextResponse.json({ error: "Failed to suggest candidates" }, { status: 500 });
    }
}
