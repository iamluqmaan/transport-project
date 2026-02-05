import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

import { auth } from "@/auth";

export default async function BookingSuccessPage() {
  const session = await auth();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Booking Confirmed!</h1>
      <p className="text-gray-600 max-w-md mb-8">
        Your ticket has been reserved successfully. A confirmation email has been sent to your inbox.
      </p>
      
      <div className="flex gap-4 mb-12">
        <Link href="/routes">
          <Button variant="outline">Book Another Trip</Button>
        </Link>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>

      {!session && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold text-blue-900 mb-2">Enjoy Faster Bookings Next Time!</h3>
            <p className="text-blue-700 mb-4">
                Create an account to save your details, track your booking history, and unlock exclusive travel bonuses.
            </p>
            <Link href="/register">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Create My Account</Button>
            </Link>
        </div>
      )}
    </div>
  );
}
