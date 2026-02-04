import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import connectDB from "@/lib/db";
import Route from "@/models/Route";
import Booking, { BookingStatus } from "@/models/Booking"; // Import Booking
import "@/models/TransportCompany"; // Ensure schema is registered
import "@/models/Vehicle"; // Ensure schema is registered
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { RouteActions } from "@/components/route-actions";
import { Badge } from "@/components/ui/badge"; // Add Badge

import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export default async function AdminRoutesPage() {
  const session = await auth();
  await connectDB();
  
  const query: any = {};
  if (session?.user.role === 'COMPANY_ADMIN' && session.user.companyId) {
      query.companyId = session.user.companyId;
  }

  const routesData = await Route.find(query)
    .populate('companyId', 'name')
    .populate('vehicleId', 'plateNumber capacity') // Populate capacity
    .sort({ departureTime: -1 });

  // Calculate availability for each route
  const routes = await Promise.all(routesData.map(async (route) => {
      const bookedCount = await Booking.countDocuments({
          routeId: route._id,
          status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] }
      });
      const capacity = route.vehicleId?.capacity || 0;
      const availableSeats = Math.max(0, capacity - bookedCount);
      
      return {
          ...route.toObject(),
          _id: route._id.toString(), // Ensure string ID
          availableSeats,
          capacity
      };
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Routes</h1>
        <Link href="/admin/routes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Route
          </Button>
        </Link>
      </div>

       <div className="bg-white rounded-md border shadow">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Availability</TableHead> 
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {routes.map((route: any) => (
                    <TableRow key={route._id}>
                        <TableCell className="font-medium">{route.companyId?.name || 'N/A'}</TableCell>
                        <TableCell>{route.originCity}</TableCell>
                        <TableCell>{route.destinationCity}</TableCell>
                        <TableCell>{format(new Date(route.departureTime), 'MMM d, h:mm a')}</TableCell>
                        <TableCell>
                            <Badge variant={route.availableSeats === 0 ? "destructive" : "secondary"}>
                                {route.availableSeats} / {route.capacity} seats
                            </Badge>
                        </TableCell>
                        <TableCell>₦{route.price.toLocaleString()}</TableCell>
                         <TableCell className="text-right">
                             <RouteActions 
                                routeId={route._id} 
                                price={route.price}
                                availableSeats={route.availableSeats}
                             />
                         </TableCell>
                    </TableRow>
                ))}
                 {routes.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center h-24 text-gray-500">
                             No routes found. Create one above.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}
