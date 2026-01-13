import { NextResponse } from "next/server";
import { generateSchedule } from "@/utils/scheduler";
import { logInfo, logError } from "@/lib/log-utils";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { startDate, endDate, minStaff } = body;

        await logInfo(`Otomatik planlama başlatıldı (${startDate} - ${endDate})`, { minStaff });

        const result = await generateSchedule({
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            minStaffPerShift: minStaff || 3,
            operatingHoursStart: 9,
            operatingHoursEnd: 18
        });

        await logInfo(`Otomatik planlama tamamlandı. ${result.created} vardiya oluşturuldu.`);

        return NextResponse.json({ success: true, count: result.created });
    } catch (error) {
        await logError("Vardiya planlama hatası", error);
        return NextResponse.json({ error: "Scheduling failed" }, { status: 500 });
    }
}
