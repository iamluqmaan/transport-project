import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Booking, { BookingStatus } from "@/models/Booking";
import Route from "@/models/Route";
import User from "@/models/User"; // Import to ensure model registration
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

// Force dynamic since we are managing live data
export const dynamic = 'force-dynamic';

export default async function CompanyBookingsPage() {
  const session = await auth();
  
  if (!session?.user?.companyId) {
      redirect("/company");
  }

  await connectDB();
  const companyId = session.user.companyId;

  // 1. Get all route IDs for this company
  const companyRoutes = await Route.find({ companyId }).select('_id');
  const routeIds = companyRoutes.map(r => r._id);

  // 2. Fetch bookings for these routes
  const bookings = await Booking.find({ routeId: { $in: routeIds } })
    .sort({ createdAt: -1 })
    .populate('userId')
    .populate('routeId');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Booking History</h1>
        <div className="bg-white px-4 py-2 rounded-lg border shadow-sm">
            <span className="text-sm font-medium text-gray-500 mr-2">Total Bookings:</span>
            <span className="font-bold text-lg">{bookings.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-500">Date/Time</th>
              <th className="p-4 font-medium text-gray-500">Passenger</th>
              <th className="p-4 font-medium text-gray-500">Route</th>
              <th className="p-4 font-medium text-gray-500">Amount</th>
              <th className="p-4 font-medium text-gray-500">Default Payment</th> {/* Changed header */}
              <th className="p-4 font-medium text-gray-500">Proof</th>
              <th className="p-4 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {bookings.length === 0 ? (
                <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">No bookings found.</td>
                </tr>
            ) : bookings.map((booking: any) => (
              <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-sm whitespace-nowrap">
                  {format(new Date(booking.createdAt), 'MMM dd, yyyy HH:mm')}
                </td>
                <td className="p-4">
                  {booking.bookingType === "MANUAL" || !booking.userId ? (
                      <div className="space-y-1">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                              {booking.customerName || "Unknown"}
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">Manual</Badge>
                          </div>
                          <div className="text-xs text-gray-500 flex flex-col">
                              <span>{booking.customerPhone || "N/A"}</span>
                          </div>
                      </div>
                  ) : (
                      <>
                        <div className="font-medium text-gray-900">{booking.userId?.name}</div>
                        <div className="text-xs text-gray-500">{booking.userId?.email}</div>
                      </>
                  )}
                </td>
                <td className="p-4">
                  {booking.routeId ? (
                      <div className="text-sm font-medium">
                          {booking.routeId.originCity} → {booking.routeId.destinationCity}
                      </div>
                  ) : <span className="text-red-500 text-xs">Deleted Route</span>}
                </td>
                <td className="p-4 font-medium">₦{booking.totalAmount.toLocaleString()}</td>
                <td className="p-4">
                    <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {booking.paymentMethod?.replace('_', ' ')}
                    </span>
                </td>
                <td className="p-4">
                    {booking.proofOfPayment ? (
                        booking.proofOfPayment === "MANUAL_ENTRY" ? (
                            <Badge variant="outline" className="text-xs bg-gray-50">
                                <FileText className="w-3 h-3 mr-1" /> Manual
                            </Badge>
                        ) : (
                        <div className="flex items-center gap-2">
                             <a href={booking.proofOfPayment} download={`proof-${booking._id.toString().slice(-6)}.png`} className="text-xs text-blue-600 hover:underline flex items-center gap-1" target="_blank">
                                 <FileText className="w-3 h-3" /> View/Download
                             </a>
                        </div>
                        )
                    ) : (
                        <span className="text-gray-400 text-xs">-</span>
                    )}
                </td>
                <td className="p-4">
                  <Badge className={`${
                    booking.status === BookingStatus.CONFIRMED ? "bg-green-100 text-green-700 hover:bg-green-100" :
                    booking.status === BookingStatus.PENDING ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" :
                    "bg-red-100 text-red-700 hover:bg-red-100"
                  }`}>
                    {booking.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
