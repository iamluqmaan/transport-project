"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, CheckCircle, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";

interface BookingReceiptProps {
  booking: any; // Using any for flexibility with populated fields, ideally strict typed
}

export function BookingReceipt({ booking }: BookingReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TransportNG-Ticket-${booking._id.toString().slice(-6)}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      setDownloading(false);
    }
  };

  const route = booking.routeId;
  const company = route?.companyId;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Receipt Container Wrapper for Scanning/Scrolling */}
      <div className="w-full max-h-[65vh] overflow-y-auto rounded-xl shadow-lg border relative scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <div 
            ref={receiptRef} 
            className="bg-white p-8 w-full relative overflow-hidden min-h-[600px]"
        >
            {/* Header / Watermark styling */}
            <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
            
            <div className="flex justify-between items-start mb-8 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">TransportNG</h1>
                    <p className="text-sm text-gray-500">Electronic Ticket & Receipt</p>
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-bold text-gray-900">
                        {booking.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING'}
                    </h2>
                    <p className="text-xs text-gray-400">Ref: {booking._id.toString().slice(-6).toUpperCase()}</p>
                </div>
            </div>

            {/* Journey Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">From</p>
                    <h3 className="text-xl font-bold text-gray-900">{route.originCity}</h3>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">To</p>
                    <h3 className="text-xl font-bold text-gray-900">{route.destinationCity}</h3>
                </div>
            </div>

            {/* Trip Info */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-dashed border-gray-300">
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div>
                        <span className="text-gray-500 block mb-1">Passenger Name</span>
                        <span className="font-semibold">{booking.customerName || booking.userId?.name || "Guest"}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block mb-1">Departure Date</span>
                        <span className="font-semibold">{format(new Date(route.departureTime), 'PPP')}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block mb-1">Departure Time</span>
                        <span className="font-semibold">{format(new Date(route.departureTime), 'hh:mm a')}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block mb-1">Seat Number(s)</span>
                        <span className="font-semibold">{booking.seatNumber}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block mb-1">Transport Company</span>
                        <span className="font-semibold">{company?.name || "Transport Provider"}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block mb-1">Vehicle Plate</span>
                        <span className="font-semibold">{route.vehicleId?.plateNumber || "N/A"}</span>
                    </div>
                </div>
            </div>

            {/* Payment Info */}
            <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2">Payment Details</h4>
                <div className="flex justify-between items-center mb-2 text-sm">
                    <span className="text-gray-600">Ticket Price (x{booking.seats || 1})</span>
                    <span className="font-medium">₦{booking.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2 text-sm">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium">{booking.paymentMethod.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t text-lg font-bold">
                    <span>Total Paid</span>
                    <span className="text-primary">₦{booking.totalAmount.toLocaleString()}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-400 mt-auto pt-8">
                <p>Thank you for booking with TransportNG.</p>
                <p>Please arrive 30 minutes before departure.</p>
                <p className="mt-2 text-[10px]">Ticket ID: {booking._id}</p>
            </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8 no-print">
        <Button onClick={handleDownload} disabled={downloading} className="w-40">
            {downloading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                </>
            ) : (
                <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </>
            )}
        </Button>
      </div>
    </div>
  );
}
