import { getOpenMarketplaceShifts, getUserSwapRequests, claimSwapRequest } from "@/actions/shifts/marketplace";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { RefreshCcw, ArrowRight, Calendar, Clock, User } from "lucide-react";
import MarketplaceClient from "./client";

export const dynamic = 'force-dynamic';

export default async function ShiftMarketplacePage() {
    const openShifts = await getOpenMarketplaceShifts();
    const myRequests = await getUserSwapRequests();

    return (
        <div className="space-y-6 pb-20">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <RefreshCcw className="w-6 h-6 text-indigo-100" />
                    Vardiya Pazarı
                </h1>
                <p className="text-indigo-100 mt-1 text-sm opacity-90">Uygun vardiyaları devralın veya kendi vardiyanızı devredin.</p>
            </div>

            <MarketplaceClient openShifts={openShifts} myRequests={myRequests} />
        </div>
    );
}
