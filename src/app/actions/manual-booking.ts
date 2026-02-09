"use server";

import connectDB from "@/lib/db";
import Booking, { BookingStatus } from "@/models/Booking";
import Route from "@/models/Route";
import { distributeBookingRevenue } from "@/lib/workflow-utils";
import { revalidatePath } from "next/cache";

interface ManualBookingData {
  routeId: string;
  customerName: string;
  customerPhone: string; // Made required
  emergencyContact: string; // New field
  seats: number;
  paymentMethod: "CASH" | "POS" | "BANK_TRANSFER";
  amountPaid: number;
}

export async function createManualBooking(data: ManualBookingData) {
  try {
    await connectDB();

    const { routeId, seats, customerName, customerPhone, emergencyContact, paymentMethod, amountPaid } = data;

    // 1. Check Route Availability
    const route = await Route.findById(routeId);
    if (!route) {
        return { error: "Route not found" };
    }

    // Check capacity
    // We need to count current confirmed bookings for this route
    const currentBookingsCount = await Booking.countDocuments({
        routeId: routeId,
        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] } 
        // Pending bookings also take up slots until rejected? 
        // For manual bookings, we definitely want to block. 
        // Let's assume confirmed and pending block seats.
    });

    // We need the vehicle capacity.
    // Ideally Route should be looking up Vehicle, but for now let's assume 
    // we need to populate or fetch vehicle. 
    // Route model has vehicleId ref.
    await route.populate('vehicleId');
    
    if (!route.vehicleId) {
        return { error: "Vehicle information missing for this route" };
    }

    const capacity = route.vehicleId.capacity;
    const availableSeats = capacity - currentBookingsCount;

    if (seats > availableSeats) {
        return { error: `Not enough seats. Only ${availableSeats} available.` };
    }

    // 2. Create Bookings (One per seat or one group booking?)
    // The current schema implies one booking per seat usually if seatNumber is unique?
    // But schema says seatNumber is string (can be "3" or "3,4"?). 
    // Let's create one booking record for the group/individual and note the seats.
    // If we want individual seat tracking, we might loop. 
    // For simplicity in this manual flow, let's create one record.
    // Wait, if we book 2 seats, does it count as 1 document?
    // The countDocuments above counts *documents*. 
    // If one document represents multiple seats, our counting logic is flawed.
    // Let's check Booking Schema. It doesn't have "numberOfSeats".
    // It has "seatNumber" (String). usually implies single seat.
    // So we should create N booking documents for N seats to keep logic consistent?
    // Or we update Booking schema to have "quantity".
    // "seatNumber" implies one seat. 
    // For manual booking, let's loop and create N records to ensure accurate counting.
    // Or we just create one record and if we switch to quantity later we adjust.
    // Given the request: "filled up vehicles or seat will not be booked"
    // To be safe and consistent with typical seat booking apps, we create 1 booking per seat.
    // But manual input often just says "2 seats". 
    // Let's create `seats` amount of documents.

    // 2. Create Bookings
    const bookingDocs = [];
    const amountPerSeat = amountPaid / seats;

    // Determine Commission
    const { getCommissionRate } = await import("@/app/actions/finance");
    const commissionRate = await getCommissionRate();
    const serviceFeePerSeat = (amountPerSeat * commissionRate) / 100;
    const companyRevenuePerSeat = amountPerSeat - serviceFeePerSeat;

    // Calculate starting seat number
    let nextSeatNumber = currentBookingsCount + 1;

    for (let i = 0; i < seats; i++) {
        bookingDocs.push({
            routeId,
            status: BookingStatus.CONFIRMED, // Manual is usually confirmed immediately
            bookingType: "MANUAL",
            customerName,
            customerPhone,
            emergencyContact, 
            paymentMethod,
            totalAmount: amountPerSeat,
            serviceFee: serviceFeePerSeat,
            companyRevenue: companyRevenuePerSeat, 
            seatNumber: nextSeatNumber.toString(), // Assign sequential number
            proofOfPayment: "MANUAL_ENTRY",
        });
        nextSeatNumber++; // Increment for next seat
    }

    const createdBookings = await Booking.insertMany(bookingDocs);

    // Distribute Revenue (Calculate Commission Debt)
    for (const booking of createdBookings) {
        await distributeBookingRevenue(booking._id);
    }

    revalidatePath("/admin/routes");
    return { success: true, count: seats };

  } catch (error: any) {
    console.error("Manual Booking Error:", error);
    return { error: error.message || "Failed to create booking" };
  }
}
