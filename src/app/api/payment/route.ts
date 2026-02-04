import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking, { BookingStatus } from "@/models/Booking";
import TransportCompany from "@/models/TransportCompany";
import { sendEmail } from "@/lib/email";
import { generateBookingEmail } from "@/lib/email-templates";
import { revalidatePath } from "next/cache";
import { distributeBookingRevenue } from "@/lib/workflow-utils";

// Mock Email Service Removed - using @/lib/email

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { routeId, userId, amount, seats, paymentMethod = "CARD", proofOfPayment } = body;

    // 1. Validate inputs (basic)
    if (!routeId || !userId || !amount) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();
    const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 2. Handle Payment Logic
    // Fetch dynamic rate
    const SystemSetting = (await import("@/models/SystemSetting")).default;
    const setting = await SystemSetting.findOne({ key: "commission_percentage" });
    const serviceFeePercentage = setting?.value ? Number(setting.value) : 5; // Default 5%

    const serviceFee = (amount * serviceFeePercentage) / 100;
    const companyRevenue = amount - serviceFee;

    let bookingStatus = BookingStatus.PENDING;
    
    if (paymentMethod === "BANK_TRANSFER") {
        bookingStatus = BookingStatus.PENDING; // Requires Admin Verification
    } else {
        // Card (Simulated success)
        bookingStatus = BookingStatus.CONFIRMED;
    }

    // 3. Assign Sequential Seat Number(s)
    // Count existing bookings for this route (Confirmed/Pending/Completed)
    const existingBookingsCount = await Booking.countDocuments({
        routeId: routeId,
        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING, BookingStatus.COMPLETED] }
    });
    
    // If user booked 1 seat, seat is X + 1
    // If user booked 2 seats, seats are X+1, X+2
    let seatAssignment = "";
    if (seats === 1) {
        seatAssignment = (existingBookingsCount + 1).toString();
    } else {
        const startSeat = existingBookingsCount + 1;
        const endSeat = existingBookingsCount + seats;
        seatAssignment = `${startSeat}-${endSeat}`;
    }

    const newBooking = await Booking.create({
        userId,
        routeId,
        totalAmount: amount,
        serviceFee,
        companyRevenue,
        status: bookingStatus,
        paymentRef: paymentReference,
        paymentMethod: paymentMethod, 
        proofOfPayment: proofOfPayment, // Save proof if provided
        seatNumber: seatAssignment
    });
    
    // Fetch with populates for email
    const booking = await Booking.findById(newBooking._id)
        .populate('userId')
        .populate({
            path: 'routeId',
            populate: { path: 'companyId' } 
        });
    
    if (!booking) {
        throw new Error("Booking creation failed");
    }

    if (bookingStatus === BookingStatus.CONFIRMED) {
        await distributeBookingRevenue(newBooking._id);
    }

    const routeData = booking.routeId;
    const company = routeData.companyId;

    // 3. Send Notifications
    
    // 3. Send Notifications
    
    // A. Email to Customer
    const customerName = booking.userId?.name || "Customer";
    const customerEmail = booking.userId?.email;
    const companyName = company?.name || "Transport Company";

    const emailHtml = generateBookingEmail({
        customerName,
        originCity: routeData.originCity,
        destinationCity: routeData.destinationCity,
        companyName: companyName,
        departureTime: routeData.departureTime,
        ticketId: booking._id.toString(),
        amount: booking.totalAmount,
        seatNumber: booking.seatNumber,
        status: bookingStatus === BookingStatus.CONFIRMED ? 'CONFIRMED' : 'PENDING'
    }, bookingStatus === BookingStatus.CONFIRMED ? 'CONFIRMATION' : 'PENDING');

    if (customerEmail) {
        const subject = bookingStatus === BookingStatus.CONFIRMED 
            ? "Booking Confirmed - Ticket Enclosed - TransportNG" 
            : "Booking Received - Verification Pending - TransportNG";
        
        await sendEmail(customerEmail, subject, emailHtml);
    }

    // B. Email to Company (Notification)
    if (company && company.contactInfo) {
        const companyEmail = company.contactInfo.includes("@") ? company.contactInfo : `admin+${company.name.replace(/\s/g, '').toLowerCase()}@transportng.com`;
        
        const notificationSubject = bookingStatus === BookingStatus.CONFIRMED 
            ? "New Booking Alert" 
            : "New Pending Booking Request";

        const companyEmailBody = `
        Hello ${company.name},

        ${notificationSubject}!

        Passenger: ${customerName}
        Route: ${routeData.originCity} to ${routeData.destinationCity}
        Date: ${routeData.departureTime}
        Seats: ${seats}
        Amount: ₦${booking.totalAmount.toLocaleString()}
        Payment: ${paymentMethod}
        Status: ${bookingStatus}

        ${bookingStatus === BookingStatus.CONFIRMED ? "Please make arrangements for this passenger." : "Payment verification is in progress by Admin."}
        `;

        await sendEmail(companyEmail, notificationSubject, companyEmailBody);
    }

    // C. Email to Admins (Notification for Pending Bookings)
    if (bookingStatus === BookingStatus.PENDING) {
        // Find all admins
        const User = (await import("@/models/User")).default; // Dynamic import
        const admins = await User.find({ role: 'SUPER_ADMIN' });
        
        const adminEmailHtml = generateBookingEmail({
            customerName: "Admin",
            originCity: routeData.originCity,
            destinationCity: routeData.destinationCity,
            companyName: companyName, // Now available in scope
            departureTime: routeData.departureTime,
            ticketId: booking._id.toString(),
            amount: booking.totalAmount,
            status: 'PENDING CHECK'
        }, 'ADMIN_ALERT');

        // Send to all admins
        if (admins && admins.length > 0) {
            await Promise.all(admins.map((admin: any) => 
                admin.email ? sendEmail(admin.email, "Action Required: New Pending Booking", adminEmailHtml) : Promise.resolve()
            ));
        }
    }

    revalidatePath("/admin/routes");
    revalidatePath("/admin/bookings");

    return NextResponse.json({ success: true, bookingId: booking._id });

  } catch (error) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}
