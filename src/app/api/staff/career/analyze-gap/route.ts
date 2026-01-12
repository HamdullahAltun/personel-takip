import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { groq } from '@/lib/ai';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { targetCareerPathId } = await req.json();

        // 1. Fetch User data
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { name: true, skills: true }
        });

        // 2. Fetch Career Path data
        const path = await prisma.careerPath.findUnique({
            where: { id: targetCareerPathId }
        });

        if (!user || !path) return NextResponse.json({ error: "Data not found" }, { status: 404 });

        // 3. Fetch all LMS modules to recommend
        const modules = await prisma.lmsModule.findMany({
            select: { id: true, title: true, category: true }
        });

        // 4. Use AI to analyze gap
        const prompt = `
            Act as a Career Development Coach. 
            User: ${user.name}
            Current Skills: ${user.skills.join(', ')}
            Target Role: ${path.title} (Required: ${path.requiredSkills.join(', ')})
            
            Available Training Modules:
            ${JSON.stringify(modules)}

            Tasks:
            1. Identify which required skills the user is missing or needs to improve.
            2. Recommend specific training modules from the provided list for each gap.
            3. Provide a short motivation/summary.

            Output strictly JSON:
            {
              "gaps": [
                { "skill": "...", "currentLevel": 1-5, "targetLevel": 1-5, "recommendedModules": ["moduleId1", "moduleId2"] }
              ],
              "summary": "..."
            }
        `;

        if (!groq) return NextResponse.json({ error: "AI Service Unavailable" }, { status: 503 });

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

        // 5. Save results to SkillGap model
        for (const gap of (result.gaps || [])) {
            await (prisma.skillGap as any).upsert({
                where: { userId_skill: { userId: session.id, skill: gap.skill } },
                update: {
                    currentLevel: gap.currentLevel,
                    targetLevel: gap.targetLevel,
                    recommendedModules: gap.recommendedModules
                },
                create: {
                    userId: session.id as string,
                    skill: gap.skill,
                    currentLevel: gap.currentLevel,
                    targetLevel: gap.targetLevel,
                    recommendedModules: gap.recommendedModules
                }
            });
        }

        return NextResponse.json({ success: true, analysis: result });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
