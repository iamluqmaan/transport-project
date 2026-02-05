"use server";

import connectDB from "@/lib/db";
import Booking, { BookingStatus } from "@/models/Booking";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import TransportCompany from "@/models/TransportCompany";
import Route from "@/models/Route"; // Needed for populate
import User from "@/models/User"; // Needed for populate

import { generateBookingEmail } from "@/lib/email-templates";
import { distributeBookingRevenue } from "@/lib/workflow-utils";

export async function approveBooking(bookingId: string, _formData: FormData) {
    try {
        await connectDB();
        
        // Find and update
        const booking = await Booking.findByIdAndUpdate(
            bookingId, 
            { status: BookingStatus.CONFIRMED },
            { new: true }
        )
        .populate('userId')
        .populate({
            path: 'routeId',
            populate: { path: 'companyId' }
        });

        if (!booking) return;

        // Send Confirmation Email
        const customerName = booking.userId?.name || booking.customerName || "Valued Customer";
        const email = booking.userId?.email || booking.customerEmail;
        const phone = booking.userId?.phoneNumber || booking.customerPhone;
        const routeData = booking.routeId;
        const companyName = routeData.companyId?.name || "Transport Company";

        const emailHtml = generateBookingEmail({
            customerName,
            originCity: routeData.originCity,
            destinationCity: routeData.destinationCity,
            companyName,
            departureTime: routeData.departureTime,
            ticketId: booking._id.toString(),
            amount: booking.totalAmount,
            seatNumber: booking.seatNumber,
            status: 'CONFIRMED'
        }, 'CONFIRMATION');
        
        const { sendSMS } = await import("@/lib/sms");

        if (email) {
            await sendEmail(email, "Booking Approved - Ticket Enclosed - TransportNG", emailHtml);
        }
        
        if (phone) {
             const smsMessage = `Booking Approved! Your trip from ${routeData.originCity} to ${routeData.destinationCity} is confirmed. Seat: ${booking.seatNumber}. Ticket: ${booking._id.toString().slice(-6)}`;
             await sendSMS(phone, smsMessage);
        }

        // Distribute Revenue for the now confirmed booking
        await distributeBookingRevenue(booking._id);

        revalidatePath("/admin/bookings");
        revalidatePath("/admin/routes");
    } catch (error) {
        console.error("Approval Error:", error);
    }
}

export async function rejectBooking(bookingId: string, _formData: FormData) {
    try {
        await connectDB();
        
        const booking = await Booking.findByIdAndUpdate(
            bookingId, 
            { status: BookingStatus.CANCELLED },
            { new: true }
        ).populate('userId').populate({ path: 'routeId', populate: { path: 'companyId' } });

        if (!booking) return;
        
        // Notify Rejection
        const email = booking.userId?.email || booking.customerEmail;
        const phone = booking.userId?.phoneNumber || booking.customerPhone;
        const routeData = booking.routeId;
        const companyName = routeData?.companyId?.name || "Transport Company";
        
        const { sendSMS } = await import("@/lib/sms");

        if (email && routeData) {
            const emailHtml = generateBookingEmail({
                customerName: booking.userId?.name || booking.customerName || "Customer",
                originCity: routeData.originCity,
                destinationCity: routeData.destinationCity,
                companyName: companyName,
                departureTime: routeData.departureTime,
                ticketId: booking._id.toString(),
                amount: booking.totalAmount,
                status: 'CANCELLED'
            }, 'REJECTION');

            await sendEmail(email, "Booking Update - TransportNG", emailHtml);
        }
        
        if (phone && routeData) {
            const smsMessage = `Booking Rejected. Your trip from ${routeData.originCity} to ${routeData.destinationCity} could not be confirmed. Please contact support.`;
            await sendSMS(phone, smsMessage);
        }

        revalidatePath("/admin/bookings");
        revalidatePath("/admin/routes");
    } catch (error) {
        console.error("Rejection Error:", error);
    }
}
