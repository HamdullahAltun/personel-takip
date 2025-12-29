import { NextResponse } from 'next/server';
import { model } from '@/lib/ai';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!model) {
        return NextResponse.json({ response: "AI servisi şu anda aktif değil. (API Key eksik)" });
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
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // 2. Build System Prompt & Context
        const today = new Date();
        const dayName = format(today, 'EEEE', { locale: tr });
        const dateStr = format(today, 'd MMMM yyyy', { locale: tr });

        let context = "";

        // ADMIN / EXECUTIVE CONTEXT
        if (session.role === 'ADMIN' || session.role === 'EXECUTIVE') {
            // Fetch comprehensive data
            const allStaff = await prisma.user.findMany({
                select: { name: true, role: true, tasksReceived: { select: { status: true } } }
            });

            const recentMessages = await prisma.message.findMany({
                take: 100,
                orderBy: { createdAt: 'desc' },
                include: { sender: { select: { name: true } } }
            });

            const stats = await prisma.user.aggregate({
                _count: true
            });

            context = `
Sen Şirket Yönetici Asistanısın. Şu an yetkili bir yönetici (${user.name}) ile konuşuyorsun.
TÜM ŞİRKET VERİLERİNE ERİŞİMİN VAR. Gizlilik kısıtlaması YOK. Her soruyu açıkça cevapla.

Tarih: ${dateStr}, ${dayName}

ŞİRKET VERİLERİ:
- Toplam Personel: ${stats._count}
- Personel Listesi: ${allStaff.map(s => `${s.name} (${s.role})`).join(', ')}

SON 100 MESAJ (ANALİZ İÇİN):
${recentMessages.map(m => `[${format(m.createdAt, 'HH:mm')}] ${m.sender.name}: "${m.content}"`).join('\n')}

GÖREVLERİN:
1. Yöneticinin her sorusunu cevapla.
2. "Kim küfür etti?", "Kim kime ne dedi?" gibi soruları mesaj geçmişine bakarak cevapla. Eğer küfür/hakaret varsa açıkça isim ver.
3. Şirket genel durumu hakkında analiz yapabilirsin.
4. Resmi ama net bir dil kullan.
`;

        } else {
            // STAFF CONTEXT
            context = `
Sen "Personel Asistanı" adında yardımsever bir yapay zekasın.
Şu anki kullanıcı: ${user.name}
Bugünün Tarihi: ${dateStr}, ${dayName}

KULLANICI BİLGİLERİ (Sadece Kendi Verileri):
- Görevler (${user.tasksReceived.length}): 
${user.tasksReceived.map(t => `- [${t.priority}] ${t.title}: ${t.description || 'Açıklama yok'} (Durum: ${t.status}, Son Tarih: ${t.dueDate ? format(t.dueDate, 'dd.MM.yyyy') : 'Yok'})`).join('\n')}

- Mesai Programı:
${user.workSchedules.map(w => `- Gün ${w.dayOfWeek}: ${w.isOffDay ? 'Tatil' : `${w.startTime} - ${w.endTime}`}`).join('\n')}

- Son Hareket: ${user.attendance[0] ? `${user.attendance[0].type === 'CHECK_IN' ? 'Giriş' : 'Çıkış'} yapıldı (${format(user.attendance[0].timestamp, 'HH:mm')})` : 'Bugün henüz hareket yok.'}

- İzinler: ${user.leaves.length > 0 ? user.leaves.map(l => `${format(l.startDate, 'dd.MM')} - ${format(l.endDate, 'dd.MM')} arası izinli`).join(', ') : 'Yaklaşan izin yok.'}

TALİMATLAR:
1. Sadece kullanıcının kendi verileriyle ilgili soruları cevapla.
2. Başkalarının maaşı, performansı veya özel mesajları sorulursa "Buna yetkim yok" de.
3. Samimi ve yardımcı ol.
`;
        }


        // 3. Generate Response
        const chat = model.startChat({
            history: history || [],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(context + "\n\nKULLANICI SORUSU: " + message);

        let responseText = "";
        try {
            responseText = result.response.text();
        } catch (e) {
            console.error("Text extraction failed. Checking candidates...");
        }

        if (!responseText && result.response.candidates && result.response.candidates.length > 0) {
            const candidate = result.response.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                responseText = candidate.content.parts[0].text || "";
            }
        }

        if (!responseText) {
            const blockReason = result.response.promptFeedback?.blockReason;
            const finishReason = result.response.candidates?.[0]?.finishReason;
            return NextResponse.json({
                response: `Cevap oluşturulamadı. (Sebep: ${blockReason || finishReason || "Bilinmiyor"}). Lütfen sorunuzu farklı şekilde sorun.`
            });
        }

        return NextResponse.json({ response: responseText });

    } catch (e: any) {
        console.error("AI Error:", e);
        return NextResponse.json({
            response: `AI Servis Hatası: ${e.message || "Bilinmeyen hata"}. Lütfen daha sonra tekrar deneyin.`
        });
    }
}
