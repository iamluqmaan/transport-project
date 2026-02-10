
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
// @ts-ignore
import { usePaystackPayment } from "react-paystack";

interface RouteData {
  id: string;
  originCity: string;
  destinationCity: string;
  departureTime: Date | string; // Dates passed from server might be string if not serialized
  price: number;
  company: {
    name: string;
    paystackSubaccountCode?: string; // Added
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
  userEmail?: string; 
  availableSeats: number; 
  commissionRate?: number; // Added
}

export function BookingForm({ route, userId, userEmail, availableSeats, commissionRate = 5 }: BookingFormProps) {
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

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmergencyContact, setGuestEmergencyContact] = useState("");
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
  
  // Paystack Config
  // Calculate Commission (Transaction Charge)
  // Use commissionRate passed from props (calculated as percentage)
  
  // NOTE: Paystack 'transaction_charge' is a flat fee in kobo.
  // commissionRate is numeric (e.g. 5 for 5%)
  const commissionPercentage = commissionRate / 100; 
  const commissionAmount = Math.ceil(totalAmount * commissionPercentage); // Commission in Naira
  
  const paystackConfig: any = {
    reference: (new Date()).getTime().toString(),
    email: userId ? (userEmail || "user@transportng.com") : guestEmail,
    amount: totalAmount * 100, // Amount in Kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "", 
    metadata: {
        custom_fields: [
            {
                display_name: "User ID",
                variable_name: "user_id",
                value: userId || guestPhone || guestEmail
            },
            {
                display_name: "Customer Name",
                variable_name: "customer_name",
                value: userId ? "Registered User" : guestName
            },
            {
                display_name: "Customer Phone",
                variable_name: "customer_phone",
                value: guestPhone 
            }
        ]
    },
  };

  // Add Split Payment Config if subaccount exists
  if (route.company.paystackSubaccountCode) {
      paystackConfig.subaccount = route.company.paystackSubaccountCode;
      
      // 'bearer': 'subaccount' means the subaccount (Company) pays the Paystack fees.
      // 'transaction_charge': The FLAT amount (in kobo) that goes to the MAIN account (Platform).
      
      // If commission is 0, we explicitly set transaction_charge to 0 to override any default percentage.
      // We keep bearer as 'subaccount' so the company pays the processing fee from their share.
      paystackConfig.transaction_charge = Math.max(0, commissionAmount * 100); 
      paystackConfig.bearer = 'subaccount'; 
  }
  
  const handlePaystackSuccess = (reference: any) => {
      // Logic to run after payment success
      processBooking(reference);
  };

  const handlePaystackClose = () => {
      console.log('Payment closed');
      setLoading(false);
  }

  // Use hook instead of Component for better control
  // @ts-ignore
  const initializePayment = usePaystackPayment(paystackConfig);


  const processBooking = async (paystackReference?: any) => {
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
          userId: userId || null, // Allow null for guest
          guestName: !userId ? guestName : undefined,
          guestEmail: !userId ? guestEmail : undefined,
          guestPhone: !userId ? guestPhone : undefined,
          guestEmergencyContact: !userId ? guestEmergencyContact : undefined,
          amount: totalAmount,
          seats: seats,
          paymentMethod: paymentMethod, 
          proofOfPayment: proofOfPayment,
          paymentReference: paystackReference ? paystackReference.reference : undefined // Send Paystack ref
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment failed");
      }

      router.push(`/booking/success?bookingId=${data.bookingId}`);
      // Keep loading true while redirecting
    } catch (err: any) {
      setError(err.message || "Booking failed. Please try again.");
      setLoading(false);
    } 
    // finally block removed to prevent setting loading to false on success
  };

  const handleBookingSubmit = async () => {
      if (!userId) {
        if (!guestName || !guestEmail || !guestPhone || !guestEmergencyContact) {
            setError("Please fill in all guest details.");
            return;
        }
      }

      if (paymentMethod === "BANK_TRANSFER") {
          if (!proofOfPayment) {
              setError("Please upload proof of payment.");
              return;
          }
          await processBooking();
      } else {
          // Validation for card payment guest details before showing button?
          // The button is effectively the submit.
          // If fields are empty, Paystack button creates issue if email is missing.
          if (!userId && !guestEmail) {
               setError("Email is required for card payment.");
               return;
          }
          // The rendering logic below handles the button switch.
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

      {!userId && (
        <div className="mb-6 border-b pb-6">
            <h4 className="font-semibold mb-3">Customer Detail</h4>
            <div className="space-y-3">
                <Input 
                    placeholder="Full Name" 
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                />
                 <Input 
                    placeholder="Email Address" 
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                />
                 <Input 
                    placeholder="Phone Number" 
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                />
                 <Input 
                    placeholder="Next of Kin / Emergency Contact" 
                    type="tel"
                    value={guestEmergencyContact}
                    onChange={(e) => setGuestEmergencyContact(e.target.value)}
                />
            </div>
        </div>
      )}

      <div className="border-t pt-4 mb-6">
          <div className="flex justify-between mb-2">
            <label className="block text-sm font-medium">Number of Seats</label>
            <span className="text-sm text-gray-500">{availableSeats} seats available</span>
          </div>
          <Input 
            type="number" 
            min={1} 
            max={availableSeats} 
            value={seats} 
            onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                // Cap value at availableSeats
                if (val > availableSeats) setSeats(availableSeats);
                else setSeats(val);
            }}
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
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3 text-xs text-yellow-800">
                  <strong>IMPORTANT:</strong> Please verify the account details below carefully before making any transfer.
              </div>
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

      {loading ? (
        <Button 
            className="w-full h-12 text-lg" 
            disabled
        >
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Payment Receipt - Please Wait...
        </Button>
      ) : (
        <>
        {paymentMethod === "CARD" ? (
            (!userId && !guestEmail) ? (
                 <Button onClick={() => setError("Please enter your email address to proceed with card payment.")} className="w-full h-12 text-lg">
                     Enter Email to Pay
                 </Button>
            ) : (
              <div className="text-center">
                  <Button 
                      className="w-full h-12 text-lg bg-primary text-white rounded-md font-medium hover:bg-primary/90 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none" 
                      onClick={() => {
                          // @ts-ignore
                          initializePayment(handlePaystackSuccess, handlePaystackClose);
                      }}
                  >
                        Pay ₦{totalAmount.toLocaleString()}
                  </Button>
                  <p className="text-[10px] text-gray-400 mt-2 flex items-center justify-center gap-1">
                      <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      Payment secured using Paystack
                  </p>
              </div>
            )
        ) : (
          <Button 
              onClick={handleBookingSubmit} 
              className="w-full h-12 text-lg" 
              disabled={loading}
          >
              "I have sent the money"
          </Button>
        )}
        </>
      )}
      
      {!userId && <p className="text-xs text-center mt-2 text-gray-500">You will be asked to log in first.</p>}
    </div>
  );
}

