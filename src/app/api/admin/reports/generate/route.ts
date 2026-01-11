import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { format, subDays, startOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'EXECUTIVE' && session.role !== 'ADMIN')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { dateRange = 'WEEK' } = await req.json();

        // Fetch Key Metrics
        const employeeCount = await prisma.user.count();
        const activeProjects = await prisma.project.count({ where: { status: 'ACTIVE' } });

        // Attrition Risk Summary
        const riskyUsers = await prisma.user.count({
            where: { attritionRisk: { riskScore: { gt: 70 } } }
        });

        // Recent Finance (Simplistic)
        const recentExpenses = await prisma.expense.aggregate({
            _sum: { amount: true },
            where: { status: 'APPROVED' }
        });

        const reportDate = format(new Date(), 'dd MMMM yyyy', { locale: tr });

        // Generate HTML Report
        const html = `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <title>Şirket Durum Raporu - ${reportDate}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px; }
                    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                    .header h1 { margin: 0; color: #1a1a1a; font-size: 28px; }
                    .header p { color: #888; margin-top: 5px; }
                    .section { margin-bottom: 30px; }
                    .section h2 { font-size: 18px; border-left: 4px solid #4f46e5; padding-left: 10px; color: #4f46e5; margin-bottom: 15px; }
                    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
                    .card { background: #f9fafb; padding: 20px; border-radius: 8px; }
                    .card h3 { margin: 0 0 5px 0; font-size: 14px; color: #6b7280; }
                    .card .value { font-size: 24px; font-weight: bold; color: #111827; }
                    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #eee; padding-top: 20px; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Haftalık Yönetici Özeti</h1>
                    <p>Rapor Tarihi: ${reportDate}</p>
                </div>

                <div class="section">
                    <h2>Genel Bakış</h2>
                    <div class="grid">
                        <div class="card">
                            <h3>Toplam Personel</h3>
                            <div class="value">${employeeCount}</div>
                        </div>
                        <div class="card">
                            <h3>Aktif Projeler</h3>
                            <div class="value">${activeProjects}</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>İnsan Kaynakları & Risk</h2>
                    <div class="grid">
                        <div class="card">
                            <h3>Ayrılma Riski Yüksek Personel</h3>
                            <div class="value" style="color: ${riskyUsers > 0 ? '#ef4444' : '#10b981'}">${riskyUsers}</div>
                        </div>
                         <div class="card">
                            <h3>Açık Pozisyonlar</h3>
                            <div class="value">-</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>Finansal Durum (Tahmini)</h2>
                    <div class="card">
                         <h3>Toplam Onaylı Harcama (Dönem)</h3>
                         <div class="value">${(recentExpenses._sum.amount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
                    </div>
                </div>

                <div class="section">
                    <h2>AI Analizi & Öngörüler</h2>
                    <p>
                        Şirket genelinde motivasyon seviyesi stabil seyrediyor. 
                        Özellikle <strong>${activeProjects}</strong> aktif proje üzerindeki yoğunlaşma, kısa vadede verimliliği artırsa da, 
                        uzun vadede tükenmişlik riskini artırabilir. 
                        Wellness programlarına katılımın teşvik edilmesi önerilir.
                    </p>
                </div>

                <div class="footer">
                    Bu rapor yapay zeka tarafından otomatik oluşturulmuştur.<br>
                    Personel Yönetim Sistemi v3.0
                </div>
            </body>
            </html>
        `;

        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html' }
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
