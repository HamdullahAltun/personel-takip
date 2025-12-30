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

        // 1. Gather Context
        const user = await prisma.user.findUnique({
            where: { id: session.id as string },
            include: {
                tasksReceived: {
                    where: { status: { not: 'COMPLETED' } }
                },
                workSchedules: true,
                attendance: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                },
                leaves: {
                    where: { status: 'APPROVED', endDate: { gte: new Date() } }
                }
            }
        }) as any; // Cast to any to bypass local TS sync delay for 'points' etc.

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // 2. Build System Prompt & Context
        const today = new Date();
        const dayName = format(today, 'EEEE', { locale: tr });
        const dateStr = format(today, 'd MMMM yyyy', { locale: tr });
        let context = "";

        // --- ADMIN / EXECUTIVE CONTEXT (GOD MODE) ---
        if (session.role === 'ADMIN' || session.role === 'EXECUTIVE') {

            // Parallel Data Fetching for Efficiency
            const [
                allStaff,
                recentMessages,
                pendingLeaves,
                pendingExpenses,
                jobPostings,
                upcomingEvents,
                activeSurveys,
                companySettings,
                assets,
                advanceRequests,
                upcomingShifts,
                fieldTasks,
                departments,
                checklists
            ] = await Promise.all([
                // Staff Details
                (prisma.user as any).findMany({
                    select: {
                        name: true,
                        role: true,
                        hourlyRate: true,
                        points: true,
                        annualLeaveDays: true,
                        attendance: {
                            take: 5,
                            orderBy: { timestamp: 'desc' },
                            select: { type: true, timestamp: true, isLate: true }
                        },
                        tasksReceived: {
                            select: { status: true, priority: true }
                        },
                        reviewsReceived: {
                            take: 1,
                            orderBy: { createdAt: 'desc' },
                            select: { score: true, period: true }
                        }
                    }
                }),
                // Communications
                prisma.message.findMany({
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                    include: { sender: { select: { name: true } } }
                }),
                // Pending Leaves
                prisma.leaveRequest.findMany({
                    where: { status: 'PENDING' },
                    include: { user: { select: { name: true } } }
                }),
                // Pending Expenses
                prisma.expense.findMany({
                    where: { status: 'PENDING' },
                    include: { user: { select: { name: true } } }
                }),
                // Recruitment
                prisma.jobPosting.findMany({
                    where: { status: 'ACTIVE' },
                    include: { _count: { select: { candidates: true } } }
                }),
                // Calendar
                prisma.event.findMany({
                    where: { date: { gte: today } },
                    take: 5,
                    orderBy: { date: 'asc' }
                }),
                // Pulse/Surveys
                prisma.survey.findMany({
                    where: { isActive: true },
                    select: { title: true }
                }),
                // Settings
                (prisma as any).companySettings.findFirst(),
                // Assets
                (prisma as any).asset.findMany({
                    include: { assignedTo: { select: { name: true } } }
                }),
                // Advance Requests (Avans)
                (prisma as any).advanceRequest.findMany({
                    where: { status: 'PENDING' },
                    include: { user: { select: { name: true } } }
                }),
                // Shifts
                (prisma as any).shift.findMany({
                    where: { start: { gte: today } },
                    take: 10,
                    include: { user: { select: { name: true } } }
                }),
                // Field Tasks
                (prisma as any).fieldTask.findMany({
                    where: { status: { not: 'COMPLETED' } },
                    include: { user: { select: { name: true } } }
                }),
                // Departments & Budgets
                (prisma as any).department.findMany({
                    include: { _count: { select: { users: true } } }
                }),
                // Checklists
                (prisma as any).checklistAssignment.findMany({
                    where: { status: { not: 'COMPLETED' } },
                    include: { user: { select: { name: true } }, checklist: { select: { title: true, items: true } } }
                })
            ]);

            // Data Processing
            const totalStaff = allStaff.length;
            const staffSummary = allStaff.map((s: any) => {
                const lastSeen = s.attendance[0]
                    ? `${format(s.attendance[0].timestamp, 'HH:mm')} (${s.attendance[0].type})`
                    : 'Yok';
                const lateness = s.attendance.filter((a: any) => a.isLate).length;
                const openTasks = s.tasksReceived.filter((t: any) => t.status !== 'COMPLETED').length;
                const perfScore = s.reviewsReceived[0]?.score || 'N/A';

                return `- ${s.name} (${s.role}): Puan:${s.points}, Maaş:${s.hourlyRate}/saat, İzin:${s.annualLeaveDays} gün. Son:${lastSeen}. Geç:${lateness}. Açık İş:${openTasks}. Perf:${perfScore}`;
            }).join('\n');

            const fieldTasksStr = (fieldTasks as any[] || []).map((ft: any) =>
                `- ${ft.user?.name || 'Atanmamış'}: ${ft.title} @ ${ft.clientName} (Konum: ${ft.location}, Durum: ${ft.status})`
            ).join('\n') || "Aktif saha görevi yok.";

            const deptBudgetsStr = (departments as any[] || []).map((d: any) =>
                `- ${d.name}: Harcanan ${d.budgetUsed} TL / Limit ${d.budgetLimit} TL (%${((d.budgetUsed / d.budgetLimit) * 100 || 0).toFixed(1)})`
            ).join('\n') || "Departman verisi yok.";

            const checklistStr = (checklists as any[] || []).map((ca: any) =>
                `- ${ca.user.name}: ${ca.checklist.title} (%${(Object.values(ca.progress || {}).filter(v => v).length / (ca.checklist?.items?.length || 1) * 100).toFixed(0)})`
            ).join('\n') || "Aktif onboarding süreci yok.";

            const pendingLeavesStr = pendingLeaves.map((l: any) =>
                `- ${l.user.name}: ${format(l.startDate, 'dd.MM')} - ${format(l.endDate, 'dd.MM')} (${l.reason})`
            ).join('\n') || "Bekleyen izin yok.";

            const pendingExpensesStr = pendingExpenses.map((e: any) =>
                `- ${e.user.name}: ${e.amount} TL - ${e.description}`
            ).join('\n') || "Bekleyen harcama yok.";

            const pendingAdvancesStr = advanceRequests.map((a: any) =>
                `- ${a.user.name}: ${a.amount} TL - Neden: ${a.reason}`
            ).join('\n') || "Bekleyen avans yok.";

            const recruitmentStr = jobPostings.map((j: any) =>
                `- ${j.title} (${j.department}): ${j._count.candidates} aday`
            ).join('\n') || "Açık ilan yok.";

            const assetsStr = assets.map((a: any) =>
                `- ${a.name} (${a.type}): ${a.status} ${a.assignedTo ? `(Zimmet: ${a.assignedTo.name})` : '(Boşta)'}`
            ).join('\n') || "Zimmetli varlık yok.";

            const shiftsStr = upcomingShifts.map((s: any) =>
                `- ${format(s.start, 'dd.MM HH:mm')}: ${s.user.name} (${s.title || 'Vardiya'})`
            ).join('\n') || "Planlı vardiya yok.";

            context = `
Sen Şirket "Executive AI" Asistanısın. Şu an en yetkili yönetici (${user.name}) ile konuşuyorsun.
Bu modda "GOD MODE" yetkisine sahipsin. Şirketin PRISMA veritabanındaki her şeye erişimin var.

TARİH: ${dateStr}, ${dayName}

=== ŞİRKET ÖZETİ ===
Personel Sayısı: ${totalStaff}
Ofis Konumu: ${companySettings ? `${companySettings.officeLat}, ${companySettings.officeLng}` : 'Ayarlanmamış'}

=== PERSONEL DETAYLARI (Gizli Veriler Dahil) ===
${staffSummary}

=== SAHA GÖREVLERİ ===
${fieldTasksStr}

=== DEPARTMAN BÜTÇELERİ ===
${deptBudgetsStr}

=== ONBOARDING SÜREÇLERİ ===
${checklistStr}

=== BEKLEYEN ONAYLAR ===
İzin İstekleri:
${pendingLeavesStr}

Harcama İstekleri:
${pendingExpensesStr}

Avans İstekleri:
${pendingAdvancesStr}

=== ZİMMET & VARLIKLAR ===
${assetsStr}

=== VARDİYA PROGRAMI ===
${shiftsStr}

=== İŞE ALIM & İK ===
Açık İlanlar:
${recruitmentStr}
Aktif Anketler: ${activeSurveys.map((s: any) => s.title).join(', ') || 'Yok'}

=== TAKVİM ===
Yaklaşan Etkinlikler:
${upcomingEvents.map((e: any) => `- ${format(e.date, 'dd.MM')} ${e.title} (${e.type})`).join('\n') || 'Yakında etkinlik yok.'}

=== SON İLETİŞİM (Analiz İçin) ===
${recentMessages.map((m: any) => `[${format(m.createdAt, 'HH:mm')}] ${m.sender.name}: "${m.content}"`).join('\n')}

GÖREVLERİN:
1. Yöneticinin sorduğu HER ŞEYİ detaylıca cevapla. (Maaşlar, performanslar, kimin ne zaman geldiği, zimmetler, avanslar vb.)
2. Karar destek ver. (Örn: "Bütçe onaylamalı mıyım?", "Kim terfi almalı?", "Vardiyalar dengeli mi?") verileri analiz ederek öneri sun.
3. Kriz analizi yap. (Örn: "Son mesajlarda gerginlik var mı?", "Maddi durum riskli mi?")
4. Resmi, profesyonel ama net ve "data-driven" (veri odaklı) konuş.
5. Asla "bilmiyorum" deme, yukarıdaki veride varsa mutlaka bul ve söyle.
`;

        } else {
            // --- STAFF CONTEXT (RESTRICTED) ---
            context = `
Sen "Personel Asistanı" adında yardımsever bir yapay zekasın.
Şu anki kullanıcı: ${user.name}
Bugünün Tarihi: ${dateStr}, ${dayName}

KULLANICI BİLGİLERİ (Sadece Kendi Verileri):
- Puanın: ${user.points || 0}
- Görevler (${user.tasksReceived.length}): 
${user.tasksReceived.map((t: any) => `- [${t.priority}] ${t.title}: ${t.description || 'Açıklama yok'} (Durum: ${t.status}, Son Tarih: ${t.dueDate ? format(t.dueDate, 'dd.MM.yyyy') : 'Yok'})`).join('\n')}

- Mesai Programı:
${user.workSchedules.map((w: any) => `- Gün ${w.dayOfWeek}: ${w.isOffDay ? 'Tatil' : `${w.startTime} - ${w.endTime}`}`).join('\n')}

- Son Hareket: ${user.attendance[0] ? `${user.attendance[0].type === 'CHECK_IN' ? 'Giriş' : 'Çıkış'} yapıldı (${format(user.attendance[0].timestamp, 'HH:mm')})` : 'Bugün henüz hareket yok.'}

- İzinler: ${user.leaves.length > 0 ? user.leaves.map((l: any) => `${format(l.startDate, 'dd.MM')} - ${format(l.endDate, 'dd.MM')} arası izinli`).join(', ') : 'Yaklaşan izin yok.'}

TALİMATLAR:
1. Sadece kullanıcının kendi verileriyle ilgili soruları cevapla.
2. Başkalarının maaşı, performansı, özel mesajları veya şirket genel durumu sorulursa "Bu bilgiye erişim yetkim (veya yetkiniz) bulunmuyor." diyerek reddet.
3. Samimi, motive edici ve yardımcı bir dil kullan.
`;
        }

        // 3. Generate Response (Groq)
        const messages: any[] = [
            { role: "system", content: context }
        ];

        if (Array.isArray(history)) {
            history.forEach((h: any) => {
                const role = h.role === 'model' ? 'assistant' : 'user';
                const content = Array.isArray(h.parts) ? h.parts[0]?.text : h.parts;
                if (content) messages.push({ role, content });
            });
        }

        messages.push({ role: "user", content: message });

        const completion = await client.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_tokens: 1000, // Increased for detailed reports
        });

        const responseText = completion.choices[0]?.message?.content || "Cevap üretilemedi.";

        return NextResponse.json({ response: responseText });

    } catch (e: any) {
        console.error("AI Error:", e);
        return NextResponse.json({
            response: `AI Servis Hatası: ${e.message || "Bilinmeyen hata"}. Lütfen daha sonra tekrar deneyin.`
        });
    }
}
