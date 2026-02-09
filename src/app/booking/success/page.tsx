import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home } from "lucide-react";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { BookingReceipt } from "@/components/booking-receipt";
import SystemSetting from "@/models/SystemSetting"; // ensure imported if needed, though not used here directly

interface PageProps {
  searchParams: Promise<{ bookingId?: string }>;
}

export default async function BookingSuccessPage({ searchParams }: PageProps) {
  const { bookingId } = await searchParams;
  let booking = null;

  if (bookingId) {
    await connectDB();
    // Deep populate for receipt details
    booking = await Booking.findById(bookingId)
      .populate('userId')
      .populate({
        path: 'routeId',
        populate: [
          { path: 'companyId' },
          { path: 'vehicleId' }
        ]
      })
      .lean(); 
      // Use lean for plain JS object, helpful for client components, 
      // but need to serialize _id and dates.
  }
  
  // Serialize the Mongoose document to a plain object
  const bookingData = booking ? JSON.parse(JSON.stringify(booking)) : null;

  return (
    <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Booking Confirmed!</h1>
            <p className="text-gray-600 max-w-md">
                Your ticket has been reserved successfully. A confirmation email and WhatsApp message has been sent to you.
            </p>
        </div>

        {bookingData ? (
            <BookingReceipt booking={bookingData} />
        ) : (
             <div className="text-center text-red-500">
                <p>Could not load booking details. Please check your email for confirmation.</p>
            </div>
        )}

      <div className="flex justify-center mt-12">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="w-4 h-4" />
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
