import { NextResponse } from 'next/server';
import { groq } from '@/lib/ai';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = groq;
    if (!client) {
        return NextResponse.json({ response: "AI servisi şu anda aktif değil. (API Key eksik - GROQ)" });
    }

    try {
        const { message, history } = await req.json();

        // 1. Basic User Context
        const user = await prisma.user.findUnique({
            where: { id: session.id as string },
            include: {
                tasksReceived: { where: { status: { not: 'COMPLETED' } } },
                workSchedules: true,
                attendance: { orderBy: { timestamp: 'desc' }, take: 1 },
                leaves: { where: { status: 'APPROVED', endDate: { gte: new Date() } } },
                lmsCompletions: { include: { module: true } }
            }
        }) as any;

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const today = new Date();
        const dateStr = format(today, 'd MMMM yyyy', { locale: tr });
        const dayName = format(today, 'EEEE', { locale: tr });

        // --- SHARED DATA (Available to AI regardless of role if relevant) ---
        // Fetch Knowledge Docs for RAG
        const knowledgeDocs = await (prisma as any).knowledgeBaseDoc.findMany();
        const knowledgeStr = knowledgeDocs.map((d: any) =>
            `--- DOKÜMAN: ${d.title} (${d.type}) ---\n${d.content}`
        ).join('\n\n') || "Kayıtlı şirket bilgisi yok.";

        let systemPrompt = "";

        if (session.role === 'ADMIN' || session.role === 'EXECUTIVE') {
            // --- ADMIN / EXECUTIVE GOD MODE ---
            const [
                allStaff, recentMessages, pendingLeaves, pendingExpenses, jobPostings,
                upcomingEvents, activeSurveys, companySettings, assets, advanceRequests,
                upcomingShifts, fieldTasks, departments, checklists, lmsModules
            ] = await Promise.all([
                (prisma.user as any).findMany({
                    select: {
                        name: true, role: true, hourlyRate: true, points: true, annualLeaveDays: true,
                        attendance: { take: 5, orderBy: { timestamp: 'desc' }, select: { type: true, timestamp: true, isLate: true } },
                        tasksReceived: { select: { status: true, priority: true } },
                        reviewsReceived: { take: 1, orderBy: { createdAt: 'desc' }, select: { score: true } }
                    }
                }),
                prisma.message.findMany({ take: 30, orderBy: { createdAt: 'desc' }, include: { sender: { select: { name: true } } } }),
                prisma.leaveRequest.findMany({ where: { status: 'PENDING' }, include: { user: { select: { name: true } } } }),
                prisma.expense.findMany({ where: { status: 'PENDING' }, include: { user: { select: { name: true } } } }),
                prisma.jobPosting.findMany({ where: { status: 'ACTIVE' }, include: { _count: { select: { candidates: true } } } }),
                prisma.event.findMany({ where: { date: { gte: today } }, take: 5, orderBy: { date: 'asc' } }),
                prisma.survey.findMany({ where: { isActive: true }, select: { title: true } }),
                (prisma as any).companySettings.findFirst(),
                (prisma as any).asset.findMany({ include: { assignedTo: { select: { name: true } } } }),
                (prisma as any).advanceRequest.findMany({ where: { status: 'PENDING' }, include: { user: { select: { name: true } } } }),
                (prisma as any).shift.findMany({ where: { start: { gte: today } }, take: 10, include: { user: { select: { name: true } } } }),
                (prisma as any).fieldTask.findMany({ where: { status: { not: 'COMPLETED' } }, include: { user: { select: { name: true } } } }),
                (prisma as any).department.findMany({ include: { _count: { select: { users: true } } } }),
                (prisma as any).checklistAssignment.findMany({
                    where: { status: { not: 'COMPLETED' } },
                    include: { user: { select: { name: true } }, checklist: { select: { title: true, items: true } } }
                }),
                (prisma as any).lmsModule.findMany()
            ]);

            const staffSummary = allStaff.map((s: any) => {
                const lastSeen = s.attendance[0] ? `${format(s.attendance[0].timestamp, 'HH:mm')} (${s.attendance[0].type})` : 'Yok';
                return `- ${s.name} (${s.role}): Puan:${s.points}, Maaş:${s.hourlyRate}, İzin:${s.annualLeaveDays}. Son:${lastSeen}`;
            }).join('\n');

            const fieldStr = (fieldTasks as any[]).map((f: any) => `- ${f.user?.name}: ${f.title}`).join('\n') || "Yok";

            systemPrompt = `
Sen Şirket "Executive AI" Asistanısın. GOD MODE yetkisine sahipsin.
TARİH: ${dateStr}, ${dayName}

=== ŞİRKET VERİLERİ ===
Şirket Merkezi: ${companySettings ? `[${companySettings.officeLat}, ${companySettings.officeLng}] (Osmaniye Korkut Ata Üniversitesi)` : 'Ayarlanmamış'}
Bütçe Harcaması: ${departments.map((d: any) => `${d.name}: ${d.budgetUsed}/${d.budgetLimit}`).join(', ')}
Bekleyen İzinler: ${pendingLeaves.length} | Bekleyen Harcamalar: ${pendingExpenses.length} | Bekleyen Avanslar: ${advanceRequests.length}
Saha Görevleri:
${fieldStr}

=== PERSONEL ÖZETİ ===
${staffSummary}

=== ŞİRKET HAFIZASI (RAG) ===
${knowledgeStr}

GÖREVLERİN:
1. Yöneticinin sorduğu HER ŞEYİ detaylıca cevapla. Karar destek sun.
2. Şirket hafızasını kullanarak politika ve kuralları açıkla.
3. Veri odaklı ve profesyonel ol.
`;
        } else {
            // --- STAFF RESTRICTED MODE ---
            systemPrompt = `
Sen "Personel AI" asistanısın. Sadece kullanıcının (${user.name}) verilerine ve Şirket Hafızasına erişebilirsin.
TARİH: ${dateStr}, ${dayName}

KULLANICI VERİLERİ:
Puan: ${user.points} | Aktif Görevler: ${user.tasksReceived.length}
Tamamlanan Eğitimler: ${user.lmsCompletions.map((c: any) => c.module.title).join(', ')}

=== ŞİRKET HAFIZASI (BİLGİ BANKASI) ===
${knowledgeStr}

TALİMATLAR:
1. Şirket kuralları veya yönetmelikleri sorulduğunda Şirket Hafızasını kullan.
2. Başka personelin verilerini paylaşma.
3. Yardımsever ve motive edici ol.
`;
        }

        const completion = await client.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...(history || []).map((h: any) => ({
                    role: h.role === 'model' ? 'assistant' : 'user',
                    content: h.parts?.[0]?.text || h.content || ""
                })),
                { role: "user", content: message }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_tokens: 1500,
        });

        return NextResponse.json({ response: completion.choices[0]?.message?.content || "Cevap üretilemedi." });

    } catch (e: any) {
        console.error("AI Error:", e);
        return NextResponse.json({ response: `Hata: ${e.message}` });
    }
}
