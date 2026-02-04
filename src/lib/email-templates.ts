import { format } from "date-fns";

interface BookingEmailData {
    customerName: string;
    originCity: string;
    destinationCity: string;
    companyName: string;
    departureTime: Date;
    ticketId: string;
    amount: number;
    seatNumber?: string;
    status: string;
    qrCodeUrl?: string; // Optional future enhancement
}

export function generateBookingEmail(data: BookingEmailData, notificationType: 'CONFIRMATION' | 'PENDING' | 'REJECTION' | 'ADMIN_ALERT' | 'WITHDRAWAL_REQUEST' | 'WITHDRAWAL_APPROVED' | 'WITHDRAWAL_REJECTED'): string {
    const { 
        customerName, originCity, destinationCity, companyName, 
        departureTime, ticketId, amount, seatNumber, status 
    } = data;

    const formattedDate = departureTime ? format(new Date(departureTime), "EEEE, MMM d, yyyy") : "";
    const formattedTime = departureTime ? format(new Date(departureTime), "h:mm a") : "";
    
    // Colors based on status
    let headerColor = "#2563eb"; // Blue
    let statusColor = "#dbeafe"; // Light Blue
    let statusTextColor = "#1e40af"; 
    let headerText = "Booking Confirmation";
    let messageText = "Your trip is confirmed. Please present this ticket at the station.";

    if (notificationType === 'PENDING') {
        headerColor = "#d97706"; // Amber
        statusColor = "#fef3c7";
        statusTextColor = "#92400e";
        headerText = "Booking Received";
        messageText = "Your payment is being verified. You will receive a confirmation shortly.";
    } else if (notificationType === 'REJECTION') {
        headerColor = "#dc2626"; // Red
        statusColor = "#fee2e2";
        statusTextColor = "#991b1b";
        headerText = "Booking Cancelled";
        messageText = "We could not verify your payment. Your booking has been cancelled.";
    } else if (notificationType === 'ADMIN_ALERT') {
        headerColor = "#4b5563"; // Gray
        statusColor = "#f3f4f6";
        statusTextColor = "#1f2937";
        headerText = "New Booking Alert";
        messageText = "A new booking requires your attention.";
    } else if (notificationType === 'WITHDRAWAL_REQUEST') {
        headerColor = "#d97706"; // Amber
        statusColor = "#fef3c7";
        statusTextColor = "#92400e";
        headerText = "Withdrawal Request";
        messageText = `New withdrawal request from ${companyName}.`;
    } else if (notificationType === 'WITHDRAWAL_APPROVED') {
        headerColor = "#16a34a"; // Green
        statusColor = "#dcfce7";
        statusTextColor = "#15803d";
        headerText = "Withdrawal Approved";
        messageText = "Your withdrawal request has been approved and processed.";
    } else if (notificationType === 'WITHDRAWAL_REJECTED') {
        headerColor = "#dc2626"; // Red
        statusColor = "#fee2e2";
        statusTextColor = "#991b1b";
        headerText = "Withdrawal Rejected";
        messageText = "Your withdrawal request was rejected. The funds have been returned to your wallet.";
    }

    const isWithdrawal = notificationType.includes('WITHDRAWAL');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headerText}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: ${headerColor}; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px; }
        .content { padding: 32px; }
        .message { margin-bottom: 24px; color: #374151; font-size: 16px; line-height: 1.5; text-align: center; }
        
        /* Ticket Style */
        .ticket { border: 2px dashed #d1d5db; border-radius: 8px; background-color: #fafafa; padding: 20px; position: relative; }
        .route-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 15px; }
        .city { font-size: 20px; font-weight: bold; color: #111827; }
        .arrow { color: #9ca3af; font-size: 18px; padding: 0 10px; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: left; }
        .detail-item label { display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
        .detail-item span { font-size: 14px; font-weight: 600; color: #1f2937; }
        
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
        .status-badge { display: inline-block; padding: 6px 12px; background-color: ${statusColor}; color: ${statusTextColor}; border-radius: 9999px; font-size: 14px; font-weight: bold; margin-bottom: 20px; }
        
        /* Branding */
        .brand { font-weight: bold; color: ${headerColor}; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TransportNG</h1>
        </div>
        <div class="content">
            <div style="text-align: center;">
                <h2 style="margin-top: 0; color: #111827;">${headerText}</h2>
                <div class="status-badge">${status}</div>
                <p class="message">
                    ${isWithdrawal ? `Dear ${companyName},` : `Dear ${customerName},`}<br>
                    ${messageText}
                </p>
            </div>

            ${!isWithdrawal ? `
            <div class="ticket">
                <div class="route-row">
                    <div class="city">${originCity}</div>
                    <div class="arrow">→</div>
                    <div class="city">${destinationCity}</div>
                </div>
                
                <div class="details-grid">
                    <div class="detail-item">
                        <label>Date</label>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="detail-item">
                        <label>Estimated Trip Time</label>
                        <span>${formattedTime}</span>
                        <div style="font-size: 10px; color: #ef4444; margin-top: 4px;">* Please arrive 30 minutes before departure</div>
                    </div>
                    <div class="detail-item">
                        <label>Company</label>
                        <span>${companyName}</span>
                    </div>
                    <div class="detail-item">
                        <label>Seat</label>
                        <span>${seatNumber || "Assigned at Station"}</span>
                    </div>
                    <div class="detail-item">
                        <label>Ticket ID</label>
                        <span style="font-family: monospace;">${ticketId.substring(0, 8).toUpperCase()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Amount</label>
                        <span>₦${amount.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            ` : `
            <div class="ticket">
                 <div class="details-grid" style="grid-template-columns: 1fr;">
                    <div class="detail-item">
                        <label>Amount</label>
                        <span style="font-size: 24px;">₦${amount.toLocaleString()}</span>
                    </div>
                     <div class="detail-item">
                        <label>Details</label>
                        <span>${ticketId}</span> 
                    </div>
                     <div class="detail-item">
                        <label>Date</label>
                         <span>${format(new Date(), "EEEE, MMM d, yyyy")}</span>
                    </div>
                 </div>
            </div>
            `}
        </div>
        <div class="footer">
            <p>Travel safely with TransportNG • Nigeria's Transport Marketplace</p>
            <p>© ${new Date().getFullYear()} TransportNG. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
}
