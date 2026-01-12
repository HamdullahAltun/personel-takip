"use server";

import { prisma } from "@/lib/prisma";
import { startOfMonth, subMonths } from "date-fns";
import { RiskProfile, calculateRiskProfile } from "@/lib/analytics-utils";

export async function getPredictiveAnalyticsData() {
    // Fetch all staff users with relevant relations
    const users = await prisma.user.findMany({
        where: {
            role: "STAFF",
        },
        include: {
            department: true,
            attendance: {
                where: {
                    timestamp: {
                        gte: subMonths(new Date(), 3), // Last 3 months
                    },
                },
            },
            shifts: {
                where: {
                    startTime: {
                        gte: startOfMonth(new Date()), // This month's shifts
                    },
                },
            },
            reviewsReceived: {
                orderBy: {
                    createdAt: "desc",
                },
                take: 1,
            },
            leaves: {
                where: {
                    status: "APPROVED",
                },
            },
            posts: {
                where: {
                    createdAt: {
                        gte: subMonths(new Date(), 1),
                    },
                },
            },
        },
    });

    const profiles: RiskProfile[] = users.map((user) => {
        return calculateRiskProfile(user);
    });

    // Sort by highest risk
    profiles.sort((a, b) => b.flightRiskScore - a.flightRiskScore);

    const highRiskCount = profiles.filter((p) => p.flightRiskScore > 70).length;
    const avgBurnout =
        profiles.reduce((acc, curr) => acc + curr.burnoutScore, 0) /
        (profiles.length || 1);

    return {
        profiles,
        summary: {
            totalEmployees: users.length,
            highRiskCount,
            avgBurnout: Math.round(avgBurnout),
        },
    };
}
