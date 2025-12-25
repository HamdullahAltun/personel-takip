import { prisma } from "@/lib/prisma";
import { Users, UserCheck, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    // 1. Total Employees (Staff)
    const totalEmployees = await prisma.user.count({ where: { role: 'STAFF' } });

    // 2. Active Now: Users who have a CHECK_IN but no CHECK_OUT for today?
    // Simplified logic: Users who have checked in today and their last record is CHECK_IN
    // This is complex in SQL/Mongo without aggregation, so let's do a meaningful approximation:
    // Get all records from today. Group by user. Key is logic.
    // Simpler approach for dashboard: Count distinct users who checked in today.
    // Or just count CHECK_INs today.

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaysRecords = await prisma.attendanceRecord.findMany({
        where: { timestamp: { gte: startOfDay } },
        orderBy: { timestamp: 'desc' },
        include: { user: true }
    });

    // Calculate Active Users: 
    // For each user found in today's records, find their *latest* record. If type is CHECK_IN, they are active.
    const userLatestRecord = new Map();
    todaysRecords.forEach(record => {
        if (!userLatestRecord.has(record.userId)) {
            userLatestRecord.set(record.userId, record);
        }
    });

    let activeCount = 0;
    userLatestRecord.forEach(record => {
        if (record.type === 'CHECK_IN') activeCount++;
    });

    // 3. Late Arrivals using startOfDay (assuming 9 AM is start?)
    // Hardcoded logic for demo: Checked in after 09:00 -> Late
    let lateCount = 0;
    const nineAM = new Date(startOfDay);
    nineAM.setHours(9, 0, 0, 0);

    todaysRecords.forEach(record => {
        if (record.type === 'CHECK_IN' && record.timestamp > nineAM) {
            // Avoid double counting if multiple checkins?
            // Just count instances of late check-ins
            lateCount++;
        }
    });

    // 4. Recent Activity (Already fetched decent amount, take top 5)
    // todaysRecords is already ordered desc.
    const recentActivity = await prisma.attendanceRecord.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: { user: true }
    });


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Genel Bakış</h1>
                <p className="text-slate-500">Bugünün personel durumu ve istatistikleri</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Toplam Personel"
                    value={totalEmployees.toString()}
                    icon={Users}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Aktif Çalışan"
                    value={activeCount.toString()}
                    icon={UserCheck}
                    color="bg-green-500"
                />
                <StatCard
                    title="Geç Kalanlar"
                    value={lateCount.toString()}
                    icon={AlertCircle}
                    color="bg-amber-500"
                />
                <StatCard
                    title="Ortalama Çalışma"
                    value="--:--"
                    icon={Clock}
                    color="bg-purple-500"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">Son Hareketler</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {recentActivity.length > 0 ? (
                        recentActivity.map((record) => (
                            <div key={record.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${record.type === 'CHECK_IN' ? 'bg-green-500' : 'bg-red-500'
                                        }`}>
                                        {record.user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{record.user.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {record.type === 'CHECK_IN' ? 'Giriş Yaptı' : 'Çıkış Yaptı'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-slate-900">
                                        {record.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {formatDistanceToNow(record.timestamp, { addSuffix: true, locale: tr })}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-slate-500 py-8">
                            Henüz hareket yok.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            </div>
            <div className={`${color} p-3 rounded-lg text-white`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    );
}
