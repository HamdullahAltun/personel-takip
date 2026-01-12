import { startOfMonth, subMonths } from "date-fns";
import { User, Department, AttendanceRecord, Shift, PerformanceReview, LeaveRequest, Post } from "@prisma/client";

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

export type UserWithRelations = User & {
    department: Department | null;
    attendance: AttendanceRecord[];
    shifts: Shift[];
    reviewsReceived: PerformanceReview[];
    leaves: LeaveRequest[];
    posts: Post[];
};

// 🧠 The "AI" Logic
export function calculateRiskProfile(user: UserWithRelations): RiskProfile {
    let flightRiskScore = 0;
    let burnoutScore = 0;
    const factors: string[] = [];

    // 1. Attendance Analysis
    // Simple heuristic: If late > 20% of the time in last 3 months
    const totalAttendance = user.attendance.length;
    const lateCount = user.attendance.filter((a) => a.isLate).length;
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
        (s) => s.type === "OVERTIME"
    ).length;
    if (overtimeShifts > 3) {
        burnoutScore += 40;
        flightRiskScore += 15;
        factors.push("High Overtime Load");
    }

    // No Leaves
    const recentLeaves = user.leaves.filter((l) =>
        l.startDate > subMonths(new Date(), 6)
    ).length;

    if (recentLeaves === 0 && user.createdAt < subMonths(new Date(), 6)) {
        // Working > 6 months without leave
        burnoutScore += 30;
        factors.push("No Recent Time Off");
    }

    // 5. Frustration (Rejected Leaves)
    const rejectedLeaves = user.leaves.filter(l => l.status === "REJECTED" && l.createdAt > subMonths(new Date(), 3)).length;
    if (rejectedLeaves > 0) {
        flightRiskScore += 10 * rejectedLeaves;
        factors.push(`${rejectedLeaves} Rejected Leave Request(s)`);
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
