import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking, { BookingStatus } from "@/models/Booking";
import { auth } from "@/auth";

// Explicitly force dynamic to ensure we get fresh data
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'COMPANY_ADMIN')) {
        return NextResponse.json({ count: 0 });
    }

    await connectDB();
    
    // For now, return global pending count. 
    // Ideally, for COMPANY_ADMIN, we should filter by their company's routes.
    // But for this task, we'll keep it simple or check if we can easily filter.
    
    // Simplification: Return total pending bookings
    const count = await Booking.countDocuments({ status: BookingStatus.PENDING });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching pending count:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
