import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getPredictiveAnalyticsData } from '@/actions/analytics/predictive';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'ATTRITION';

    // Fetch deep analytics data
    const analytics = await getPredictiveAnalyticsData();
    const { profiles } = analytics;

    let results = [];

    if (type === 'ATTRITION') {
        results = profiles
            .filter(p => p.flightRiskScore > 30) // Only show relevant risks
            .map(p => ({
                name: p.name,
                riskLevel: p.flightRiskScore,
                reason: p.factors[0] || "Genel Risk Artışı",
                retentionPlan: p.flightRiskScore > 70
                    ? "Acil 1:1 görüşme planlanmalı"
                    : "İş yükü dengelenmeli"
            }))
            .slice(0, 5); // Take top 5
    } else {
        // PERORMANCE Mode
        results = profiles
            .map(p => ({
                name: p.name,
                score: p.lastReviewScore || 50,
                keyStrength: p.attendanceRate > 90 ? "Yüksek Devamlılık" : "Gelişime Açık",
                reason: p.lastReviewScore ? `Son Değerlendirme: ${p.lastReviewScore}/100` : "Henüz değerlendirme yapılmadı"
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }

    return NextResponse.json({ results });
}
