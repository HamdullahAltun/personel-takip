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
            where: { id: session.id },
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

        // 2. Build System Prompt
        const today = new Date();
        const dayName = format(today, 'EEEE', { locale: tr });
        const dateStr = format(today, 'd MMMM yyyy', { locale: tr });

        const context = `
Sen "Personel Asistanı" adında yardımsever bir yapay zekasın.
Şu anki kullanıcı: ${user.name}
Bugünün Tarihi: ${dateStr}, ${dayName}

KULLANICI BİLGİLERİ:
- Görevler (${user.tasksReceived.length}): 
${user.tasksReceived.map(t => `- [${t.priority}] ${t.title}: ${t.description || 'Açıklama yok'} (Durum: ${t.status}, Son Tarih: ${t.dueDate ? format(t.dueDate, 'dd.MM.yyyy') : 'Yok'})`).join('\n')}

- Mesai Programı:
${user.workSchedules.map(w => `- Gün ${w.dayOfWeek}: ${w.isOffDay ? 'Tatil' : `${w.startTime} - ${w.endTime}`}`).join('\n')}

- Son Hareket: ${user.attendance[0] ? `${user.attendance[0].type === 'CHECK_IN' ? 'Giriş' : 'Çıkış'} yapıldı (${format(user.attendance[0].timestamp, 'HH:mm')})` : 'Bugün henüz hareket yok.'}

- İzinler: ${user.leaves.length > 0 ? user.leaves.map(l => `${format(l.startDate, 'dd.MM')} - ${format(l.endDate, 'dd.MM')} arası izinli`).join(', ') : 'Yaklaşan izin yok.'}

TALİMATLAR:
1. Kullanıcının sorularına elindeki bu verileri kullanarak cevap ver.
2. Eğer kullanıcı "Neler yapmalıyım?" derse görevlerini özetle.
3. Mesai saatlerini sorarsa programdan bakıp söyle.
4. Samimi, profesyonel ve kısa cevaplar ver.
5. Bilmediğin bir şey sorulursa (örn: şirketin cirosu) "Buna erişimim yok" de.
`;

        // 3. Generate Response
        const chat = model.startChat({
            history: history || [],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(context + "\n\nKULLANICI SORUSU: " + message);
        const responseText = result.response.text();

        return NextResponse.json({ response: responseText });

    } catch (e: any) {
        console.error("AI Error:", e);
        return NextResponse.json({ response: "Üzgünüm, şu an bağlantı kuramıyorum." });
    }
}
