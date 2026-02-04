import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { getCompanyFinancials } from "@/app/actions/finance";
import Booking, { BookingStatus } from "@/models/Booking";
import Route from "@/models/Route";
import Vehicle from "@/models/Vehicle";
import User from "@/models/User"; // Import User to resolve company
import { Bus, MapPin, TrendingUp, Wallet, CreditCard, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function CompanyDashboard() {
  const session = await auth();
  
  await connectDB();
  const user = await User.findById(session?.user?.id).populate('companyId');
  
  if (!user || !user.companyId) {
      return <div className="p-8">Company account not found. Please contact support.</div>;
  }

  const companyId = user.companyId._id.toString();

  // Fetch all stats in parallel
  const [financials, vehiclesCount, routes, activeRoutesCount] = await Promise.all([
    getCompanyFinancials(companyId),
    Vehicle.countDocuments({ companyId }),
    Route.find({ companyId }).select('_id'),
    Route.countDocuments({ companyId, departureTime: { $gte: new Date() } }), // Assuming active means future routes? Or just all routes? Let's use all for now as 'Active Routes' implies defined routes.
  ]);

  const routeIds = routes.map(r => r._id);
  
  const [totalBookings, recentBookings] = await Promise.all([
      Booking.countDocuments({ routeId: { $in: routeIds }, status: { $ne: BookingStatus.CANCELLED } }),
      Booking.find({ routeId: { $in: routeIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('routeId')
        .lean()
  ]);

  const stats = [
    { 
        title: "Total Earnings", 
        value: `₦${financials.totalRevenue.toLocaleString()}`, 
        icon: TrendingUp, 
        color: "text-green-600", 
        bg: "bg-green-100" 
    },
    { 
        title: "Wallet Balance", 
        value: `₦${financials.balance.toLocaleString()}`, 
        icon: Wallet, 
        color: financials.balance >= 0 ? "text-blue-600" : "text-red-600", 
        bg: "bg-blue-100" 
    },
    { 
        title: "Bonuses Received", 
        value: `₦${financials.totalBonus.toLocaleString()}`, 
        icon: Gift, 
        color: "text-purple-600", 
        bg: "bg-purple-100" 
    },
    { 
        title: "Active Routes", 
        value: activeRoutesCount.toString(), 
        icon: MapPin, 
        color: "text-orange-600", 
        bg: "bg-orange-100" 
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
           <p className="text-gray-500">Welcome back, {user.companyId.name}.</p>
        </div>
        <Link href="/company/routes/new">
          <Button>+ Add New Trip</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
             <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
             </div>
             <div className={`p-4 rounded-full ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
             </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
         <div className="p-6 border-b flex justify-between items-center">
            <h3 className="font-bold text-lg">Recent Bookings</h3>
            <Link href="/company/bookings">
                <Button variant="outline" size="sm">View All</Button>
            </Link>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                     <th className="px-6 py-4">Passenger</th>
                     <th className="px-6 py-4">Route</th>
                     <th className="px-6 py-4">Date</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4">Amount</th>
                  </tr>
               </thead>
               <tbody className="divide-y">
                  {recentBookings.length === 0 ? (
                      <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No bookings found yet.</td>
                      </tr>
                  ) : (
                    recentBookings.map((booking: any) => (
                        <tr key={booking._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">
                                {booking.bookingType === 'MANUAL' ? booking.customerName : 'Online User'}
                                {booking.customerPhone && <div className="text-xs text-gray-500">{booking.customerPhone}</div>}
                            </td>
                            <td className="px-6 py-4">
                                {booking.routeId ? `${booking.routeId.originCity} → ${booking.routeId.destinationCity}` : 'Unknown Route'}
                            </td>
                            <td className="px-6 py-4">{new Date(booking.createdAt).toLocaleDateString()} {new Date(booking.createdAt).toLocaleTimeString()}</td>
                            <td className="px-6 py-4">
                            <Badge variant={booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                {booking.status}
                            </Badge>
                            </td>
                            <td className="px-6 py-4 font-bold">₦{booking.totalAmount.toLocaleString()}</td>
                        </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
