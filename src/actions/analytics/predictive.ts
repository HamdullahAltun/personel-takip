"use server";

import { prisma } from "@/lib/prisma"; // Assuming this checks out, if not I'll check where prisma is exported
import { startOfMonth, subMonths } from "date-fns";

export type RiskProfile = {
    userId: string;
    name: string;
    department: string;
    role: string;
    flightRiskScore: number; // 0-100
    burnoutScore: number; // 0-100
    factors: string[];
    lastReviewScore: number | null;
    attendanceRate: number; // Percentage
};

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

// 🧠 The "AI" Logic
function calculateRiskProfile(user: any): RiskProfile {
    let flightRiskScore = 0;
    let burnoutScore = 0;
    const factors: string[] = [];

    // 1. Attendance Analysis
    // Simple heuristic: If late > 20% of the time in last 3 months
    const totalAttendance = user.attendance.length;
    const lateCount = user.attendance.filter((a: any) => a.isLate).length;
    const lateRate = totalAttendance > 0 ? lateCount / totalAttendance : 0;

    if (lateRate > 0.2) {
        flightRiskScore += 20;
        factors.push("Frequent Lateness");
    }

    // 2. Performance & Satisfaction
    const lastReview = user.reviewsReceived[0];
    if (lastReview) {
        if (lastReview.score < 60) {
            flightRiskScore += 30; // Low performance often precedes exit
            factors.push("Low Performance Review");
        }
    } else {
        // No review might mean neglect
        flightRiskScore += 5;
    }

    // 3. Social Engagement (Isolation)
    if (user.posts.length === 0) {
        flightRiskScore += 10;
        factors.push("Low Social Engagement");
    }

    // 4. Burnout Calculation
    // High Overtime
    const overtimeShifts = user.shifts.filter(
        (s: any) => s.type === "OVERTIME"
    ).length;
    if (overtimeShifts > 3) {
        burnoutScore += 40;
        flightRiskScore += 15;
        factors.push("High Overtime Load");
    }

    // No Leaves
    const recentLeaves = user.leaves.filter((l: any) =>
        l.startDate > subMonths(new Date(), 6)
    ).length;

    if (recentLeaves === 0 && user.createdAt < subMonths(new Date(), 6)) {
        // Working > 6 months without leave
        burnoutScore += 30;
        factors.push("No Recent Time Off");
    }

    // Cap scores
    flightRiskScore = Math.min(100, flightRiskScore);
    burnoutScore = Math.min(100, burnoutScore);

    return {
        userId: user.id,
        name: user.name,
        department: user.department?.name || "Unassigned",
        role: user.role,
        flightRiskScore,
        burnoutScore,
        factors,
        lastReviewScore: lastReview ? lastReview.score : null,
        attendanceRate: Math.round((1 - lateRate) * 100),
    };
}
