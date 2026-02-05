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
    const { routeId, userId, amount, seats, paymentMethod = "CARD", proofOfPayment, guestName, guestEmail, guestPhone, guestEmergencyContact } = body;

    // 1. Validate inputs (basic)
    if (!routeId || !amount) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Require either userId or guest details
    if (!userId && (!guestName || !guestEmail || !guestPhone || !guestEmergencyContact)) {
         return NextResponse.json({ error: "User ID or Guest Details required" }, { status: 400 });
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
        userId: userId || undefined, // undefined if guest
        customerName: guestName,
        customerEmail: guestEmail,
        customerPhone: guestPhone,
        emergencyContact: guestEmergencyContact,
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
    
    // A. Notification to Customer
    const finalCustomerName = booking.userId?.name || guestName || "Customer";
    const finalCustomerEmail = booking.userId?.email || guestEmail;
    const finalCustomerPhone = booking.userId?.phoneNumber || guestPhone;
    const companyName = company?.name || "Transport Company";

    const emailHtml = generateBookingEmail({
        customerName: finalCustomerName,
        originCity: routeData.originCity,
        destinationCity: routeData.destinationCity,
        companyName: companyName,
        departureTime: routeData.departureTime,
        ticketId: booking._id.toString(),
        amount: booking.totalAmount,
        seatNumber: booking.seatNumber,
        status: bookingStatus === BookingStatus.CONFIRMED ? 'CONFIRMED' : 'PENDING'
    }, bookingStatus === BookingStatus.CONFIRMED ? 'CONFIRMATION' : 'PENDING');

    const { sendSMS } = await import("@/lib/sms");

    // Send Email & SMS to Customer
    if (finalCustomerEmail) {
        const subject = bookingStatus === BookingStatus.CONFIRMED 
            ? "Booking Confirmed - Ticket Enclosed - TransportNG" 
            : "Booking Received - Verification Pending - TransportNG";
        
        await sendEmail(finalCustomerEmail, subject, emailHtml);
    }
    
    if (finalCustomerPhone) {
        const smsMessage = bookingStatus === BookingStatus.CONFIRMED
            ? `Booking Confirmed! ${routeData.originCity} to ${routeData.destinationCity} on ${new Date(routeData.departureTime).toDateString()}. Seat: ${booking.seatNumber}. Ref: ${booking._id.toString().slice(-6)}`
            : `Booking Received! Trip: ${routeData.originCity} to ${routeData.destinationCity}. Status: Pending Verification. Ref: ${booking._id.toString().slice(-6)}`;
        
        await sendSMS(finalCustomerPhone, smsMessage);
    }

    // B. Notification to Company
    if (company && company.contactInfo) {
        const companyEmail = company.contactInfo.includes("@") ? company.contactInfo : `admin+${company.name.replace(/\s/g, '').toLowerCase()}@transportng.com`;
        
        const notificationSubject = bookingStatus === BookingStatus.CONFIRMED 
            ? "New Booking Alert" 
            : "New Pending Booking Request";

        const companyEmailBody = `
        Hello ${company.name},

        ${notificationSubject}!

        Passenger: ${finalCustomerName}
        Route: ${routeData.originCity} to ${routeData.destinationCity}
        Date: ${routeData.departureTime}
        Seats: ${seats}
        Amount: ₦${booking.totalAmount.toLocaleString()}
        Payment: ${paymentMethod}
        Status: ${bookingStatus}
        `;
        
        // Find Company Owner Phone Number if possible (Complex, requires query)
        // For now, if we have contact info that looks like a phone, or just rely on Admin Panel check
        // But let's check for Company Admin User using companyId logic if needed.
        // Simplified: If company contactInfo is phone, use it.
        const likelyPhone = !company.contactInfo.includes("@") ? company.contactInfo : null;
        if (likelyPhone) {
            await sendSMS(likelyPhone, `New Booking: ${finalCustomerName} paid ${booking.totalAmount} for ${seats} seat(s). Route: ${routeData.originCity}-${routeData.destinationCity}.`);
        }


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
