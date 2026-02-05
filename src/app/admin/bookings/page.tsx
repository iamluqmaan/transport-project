import connectDB from "@/lib/db";
import Booking, { BookingStatus } from "@/models/Booking";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, FileText } from "lucide-react";
import { approveBooking, rejectBooking } from "@/app/actions/booking";
import Image from "next/image";
import { BookingActions } from "@/components/booking-actions";

// Force dynamic since we are managing live data
export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  await connectDB();

  // Fetch all bookings, sorted by newest first
  const bookings = await Booking.find({})
    .sort({ createdAt: -1 })
    .populate('userId')
    .populate({
        path: 'routeId',
        populate: { path: 'companyId' }
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Booking Management</h1>
        <div className="bg-white px-4 py-2 rounded-lg border shadow-sm w-full md:w-auto flex justify-between md:block">
            <span className="text-sm font-medium text-gray-500 mr-2">Total Bookings:</span>
            <span className="font-bold text-lg">{bookings.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap"> 
            <thead className="bg-gray-50 border-b">
                <tr>
                <th className="p-4 font-medium text-gray-500">Date</th>
                <th className="p-4 font-medium text-gray-500">Passenger</th>
                <th className="p-4 font-medium text-gray-500">Route</th>
                <th className="p-4 font-medium text-gray-500">Amount</th>
                <th className="p-4 font-medium text-gray-500">Payment</th>
                <th className="p-4 font-medium text-gray-500">Proof</th>
                <th className="p-4 font-medium text-gray-500">Status</th>
                <th className="p-4 font-medium text-gray-500 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {bookings.length === 0 ? (
                    <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">No bookings found.</td>
                    </tr>
                ) : bookings.map((booking: any) => (
                <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm">
                    {format(new Date(booking.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="p-4">
                    {booking.bookingType === "MANUAL" || !booking.userId ? (
                        <div className="space-y-1">
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                                {booking.customerName || "Unknown"}
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">Manual</Badge>
                            </div>
                            <div className="text-xs text-gray-500 flex flex-col gap-1">
                                {booking.customerPhone && (
                                    <a href={`tel:${booking.customerPhone}`} className="hover:text-blue-600 hover:underline">
                                        {booking.customerPhone}
                                    </a>
                                )}
                                {booking.emergencyContact && (
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                        <span>Kin:</span>
                                        <a href={`tel:${booking.emergencyContact}`} className="hover:text-blue-600 hover:underline">
                                           {booking.emergencyContact}
                                        </a>
                                    </div>
                                )}
                                {booking.customerEmail && (
                                    <a href={`mailto:${booking.customerEmail}`} className="text-[10px] text-gray-400 hover:text-blue-600 hover:underline truncate max-w-[150px]">
                                        {booking.customerEmail}
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="font-medium text-gray-900">{booking.userId.name}</div>
                            <div className="text-xs text-gray-500">
                                <a href={`mailto:${booking.userId.email}`} className="hover:text-blue-600 hover:underline">
                                    {booking.userId.email}
                                </a>
                            </div>
                        </>
                    )}
                    </td>
                    <td className="p-4">
                    {booking.routeId ? (
                        <>
                            <div className="text-sm font-medium">
                                {booking.routeId.originCity} → {booking.routeId.destinationCity}
                            </div>
                            <div className="text-xs text-gray-500">
                                {booking.routeId.companyId?.name}
                            </div>
                        </>
                    ) : <span className="text-red-500 text-xs">Deleted Route</span>}
                    </td>
                    <td className="p-4 font-medium">₦{booking.totalAmount.toLocaleString()}</td>
                    <td className="p-4">
                        <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-700">
                            {booking.paymentMethod?.replace('_', ' ')}
                        </span>
                        {booking.paymentRef && (
                            <div className="text-xs text-gray-400 font-mono mt-1" title={booking.paymentRef}>
                                {booking.paymentRef.substring(0, 8)}...
                            </div>
                        )}
                    </td>
                    <td className="p-4">
                        {booking.proofOfPayment ? (
                            booking.proofOfPayment === "MANUAL_ENTRY" ? (
                                <Badge variant="outline" className="text-xs bg-gray-50">
                                    <FileText className="w-3 h-3 mr-1" /> Manual
                                </Badge>
                            ) : (
                            <div className="flex items-center gap-2">
                                {/* Simple thumbnail link for now - could be enhanced with a Dialog/Modal */}
                                <a href={booking.proofOfPayment} download={`proof-${booking._id.toString().slice(-6)}.png`} className="block w-16 h-16 relative rounded overflow-hidden border hover:opacity-80 transition-opacity flex-shrink-0">
                                    <Image 
                                        src={booking.proofOfPayment} 
                                        alt="Payment Proof" 
                                        className="object-cover"
                                        fill
                                    />
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
                    <td className="p-4 text-right">
                    <div className="flex justify-end">
                        <BookingActions 
                            bookingId={booking._id.toString()} 
                            status={booking.status} 
                            proofUrl={booking.proofOfPayment}
                        />
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
