"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
interface RouteData {
  id: string;
  originCity: string;
  destinationCity: string;
  departureTime: Date | string; // Dates passed from server might be string if not serialized
  price: number;
  company: {
    name: string;
    bankAccounts: Array<{
      bankName: string;
      accountNumber: string;
      accountName: string;
    }>;
  };
  vehicle: {
    capacity: number;
    type: string;
    plateNumber: string;
  };
}

interface BookingFormProps {
  route: RouteData;
  userId?: string; 
}

export function BookingForm({ route, userId }: BookingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [seats, setSeats] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // If user is not logged in, we might want to ask for details or redirect.
  // For this flow, let's assume we capture details if not provided, or rely on auth.
  // But the requirement says "allow login if user exists", implying we might be booking as guest or needing login.
  // The prompt says "proceed and allow login if user exists".
  // Let's assume the user is logged in for simplicity, or we show a login prompt.
  // Actually, I'll redirect to login if no userId is passed.

  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "BANK_TRANSFER">("CARD");
  const [proofOfPayment, setProofOfPayment] = useState<string | null>(null);

  const totalAmount = route.price * seats;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofOfPayment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBooking = async () => {
    if (!userId) {
      router.push(`/login?callbackUrl=/routes/${route.id}/booking`);
      return;
    }

    if (paymentMethod === "BANK_TRANSFER" && !proofOfPayment) {
        setError("Please upload proof of payment.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          routeId: route.id,
          userId: userId,
          amount: totalAmount,
          seats: seats,
          paymentMethod: paymentMethod, 
          proofOfPayment: proofOfPayment
        }),
      });

      if (!response.ok) {
        throw new Error("Payment failed");
      }

      router.push("/booking/success");
    } catch (err) {
      setError("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border">
      <h3 className="text-xl font-bold mb-4">Trip Summary</h3>
      
      <div className="space-y-4 mb-6">
        <div className="flex justify-between">
            <span className="text-gray-500">Route</span>
            <span className="font-medium">{route.originCity} to {route.destinationCity}</span>
        </div>
         <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-medium">{format(new Date(route.departureTime), 'PPP')}</span>
        </div>
         <div className="flex justify-between">
            <span className="text-gray-500">Time</span>
            <span className="font-medium">{format(new Date(route.departureTime), 'hh:mm a')}</span>
        </div>
         <div className="flex justify-between">
            <span className="text-gray-500">Company</span>
            <span className="font-medium">{route.company.name}</span>
        </div>
         <div className="flex justify-between">
            <span className="text-gray-500">Price per seat</span>
            <span className="font-medium">₦{route.price.toLocaleString()}</span>
        </div>
      </div>

      <div className="border-t pt-4 mb-6">
          <label className="block text-sm font-medium mb-2">Number of Seats</label>
          <Input 
            type="number" 
            min={1} 
            max={route.vehicle.capacity} 
            value={seats} 
            onChange={(e) => setSeats(parseInt(e.target.value) || 1)}
            className="mb-4"
          />
          
          <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">₦{totalAmount.toLocaleString()}</span>
          </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Payment Method</label>
        <div className="grid grid-cols-2 gap-2">
            <button
                onClick={() => setPaymentMethod("CARD")}
                className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    paymentMethod === "CARD" 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
            >
                Card Payment
            </button>
            <button
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    paymentMethod === "BANK_TRANSFER" 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
            >
                Bank Transfer
            </button>
        </div>
      </div>

      {/* Bank Details logic */}
      {paymentMethod === "BANK_TRANSFER" && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
              <h4 className="font-semibold mb-2 text-sm">Bank Details</h4>
              {route.company.bankAccounts && route.company.bankAccounts.length > 0 ? (
                <div className="space-y-4">
                  {route.company.bankAccounts.map((account, index) => (
                    <div key={index} className="space-y-1 text-sm text-gray-600 border-b pb-2 last:border-0 last:pb-0">
                      <div className="flex justify-between">
                          <span>Bank Name:</span>
                          <span className="font-medium text-gray-900">{account.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                          <span>Account Number:</span>
                          <span className="font-medium text-gray-900">{account.accountNumber}</span>
                      </div>
                       <div className="flex justify-between">
                          <span>Account Name:</span>
                          <span className="font-medium text-gray-900">{account.accountName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-red-500">No bank account details available. Please contact support.</p>
              )}
              <div className="space-y-1 text-sm text-gray-600">
              </div>
              <p className="text-xs text-yellow-600 mt-3">
                  ⚠️ Please make the transfer and upload your receipt below.
              </p>
              
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Upload Receipt</label>
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
          </div>
      )}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <Button 
        onClick={handleBooking} 
        className="w-full h-12 text-lg" 
        disabled={loading}
      >
        {loading ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
            </>
        ) : (
            paymentMethod === "CARD" 
            ? `Pay ₦${totalAmount.toLocaleString()}` 
            : "I have sent the money"
        )}
      </Button>
      {!userId && <p className="text-xs text-center mt-2 text-gray-500">You will be asked to log in first.</p>}
    </div>
  );
}
