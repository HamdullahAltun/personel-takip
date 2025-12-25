import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import EmployeeTable from "@/components/admin/EmployeeTable";

export default async function EmployeesPage() {
    const employees = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Personeller</h1>
                    <p className="text-slate-500">Çalışanları yönetin ve düzenleyin</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <EmployeeTable initialEmployees={employees} />
            </div>
        </div>
    );
}
