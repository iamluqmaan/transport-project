import connectDB from "@/lib/db";
import Route from "@/models/Route";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/booking-form";
import Link from "next/link";
import "@/models/TransportCompany";
import "@/models/Vehicle";
import { auth } from "@/auth";

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  await connectDB();
  const rawRoute = await Route.findOne({ _id: id })
    .populate('companyId')
    .populate('vehicleId')
    .lean() as any;
    
  // Transform to plain object with explicit fields to avoid serialization errors
  // Transform to plain object to avoid serialization errors
  // We use detailed null checks because populate can sometimes return null/undefined if the reference is missing
  const route = rawRoute ? {
      id: rawRoute._id?.toString() || '',
      originCity: rawRoute.originCity || '',
      destinationCity: rawRoute.destinationCity || '',
      departureTime: rawRoute.departureTime ? new Date(rawRoute.departureTime).toISOString() : '',
      price: typeof rawRoute.price === 'number' ? rawRoute.price : 0,
      company: {
          name: rawRoute.companyId?.name || 'Unknown Company',
          bankAccounts: rawRoute.companyId?.bankAccounts?.map((acc: any) => ({
            ...acc,
            _id: acc._id?.toString(),
          })) || [],
      },
      vehicle: {
          capacity: rawRoute.vehicleId?.capacity || 0,
          type: rawRoute.vehicleId?.type || 'Unknown',
          plateNumber: rawRoute.vehicleId?.plateNumber || 'N/A'
      }
  } : null;

  if (!route) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Booking</h1>
        <div className="max-w-xl mx-auto">
            <BookingForm route={route} userId={session?.user?.id} />
        </div>
    </div>
  );
}
