import { NextResponse } from "next/server";
import { generateSchedule } from "@/utils/scheduler";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { startDate, endDate, minStaff } = body;

        const result = await generateSchedule({
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            minStaffPerShift: minStaff || 3,
            operatingHoursStart: 9,
            operatingHoursEnd: 18
        });

        return NextResponse.json({ success: true, count: result.created });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Scheduling failed" }, { status: 500 });
    }
}
