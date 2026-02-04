import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Route from "@/models/Route";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin, Calendar, Users, RefreshCw, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function CompanyRoutesPage() {
  const session = await auth();
  await connectDB();
  
  const routes = await Route.find({ companyId: session?.user?.companyId })
    .sort({ departureTime: -1 })
    .populate('vehicleId')
    .lean();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Route Management</h1>
        <Link href="/company/routes/new">
          <Button>+ Create New Trip</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-4">Route</th>
              <th className="px-6 py-4">Departure</th>
              <th className="px-6 py-4">Vehicle</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {routes.length === 0 ? (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <MapPin className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        No routes created yet.
                    </td>
                </tr>
            ) : (
                routes.map((route: any) => (
                    <tr key={route._id.toString()} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                            <div className="font-bold flex items-center gap-2">
                                {route.originCity} <span className="text-gray-400">→</span> {route.destinationCity}
                            </div>
                            <div className="text-xs text-gray-500">{route.originState} to {route.destinationState}</div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{format(new Date(route.departureTime), "MMM d, yyyy")}</span>
                            </div>
                            <div className="text-xs text-gray-500 pl-6">{format(new Date(route.departureTime), "h:mm a")}</div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="font-medium">{route.vehicleId?.type}</div>
                            <div className="text-xs text-gray-500">{route.vehicleId?.plateNumber}</div>
                        </td>
                        <td className="px-6 py-4 font-bold">
                            ₦{route.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2">
                               <Link href={`/company/routes/new?sourceId=${route._id.toString()}`}>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <RefreshCw className="h-3 w-3" />
                                        Reschedule
                                    </Button>
                               </Link>
                           </div>
                        </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
