'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, User, CreditCard, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

import { useParams } from "next/navigation"

export default function BookingPage() {
  const params = useParams();
  const id = params.id as string;
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])

  // Mock seat layout (14 seater example)
  // 1 Driver (skipped), then seats
  const totalSeats = 14
  const pricePerSeat = 35500

  const toggleSeat = (seatNum: number) => {
    if (selectedSeats.includes(seatNum)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNum))
    } else {
      setSelectedSeats([...selectedSeats, seatNum])
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/routes" className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Search
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Trip Info & Seat Selection */}
        <div className="lg:col-span-2 space-y-8">
          {/* Trip Summary Card */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <h1 className="text-2xl font-bold">Lagos to Abuja</h1>
                  <p className="text-gray-500">Today, 24th Oct • 07:00 AM</p>
               </div>
               <div className="text-right">
                  <p className="font-bold text-lg">GIG Motors</p>
                  <p className="text-sm text-gray-500">Toyota Hiace (AC)</p>
               </div>
            </div>
          </div>

          {/* Seat Map */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
             <h2 className="text-xl font-bold mb-4">Select Your Seats</h2>
             <div className="bg-gray-50 p-8 rounded-lg flex justify-center">
                <div className="w-64 border-2 border-gray-300 rounded-xl p-4 bg-white relative">
                   {/* Driver Seat */}
                   <div className="flex justify-end mb-8">
                      <div className="w-10 h-10 border rounded flex items-center justify-center bg-gray-200">
                         <span className="text-xs text-gray-500">Driver</span>
                      </div>
                   </div>

                   {/* Passenger Seats Grid */}
                   <div className="grid grid-cols-3 gap-4">
                      {Array.from({ length: totalSeats }).map((_, i) => {
                         const seatNum = i + 1
                         const isSelected = selectedSeats.includes(seatNum)
                         const isBooked = [2, 5].includes(seatNum) // Mock booked seats

                         return (
                            <button
                               key={seatNum}
                               disabled={isBooked}
                               onClick={() => toggleSeat(seatNum)}
                               className={cn(
                                  "w-10 h-10 rounded-md flex items-center justify-center text-sm font-bold transition-all border",
                                  isBooked ? "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300" :
                                  isSelected ? "bg-primary text-white border-primary shadow-md transform scale-105" :
                                  "bg-white hover:border-primary hover:text-primary text-gray-700 border-gray-300"
                               )}
                            >
                               {seatNum}
                            </button>
                         )
                      })}
                   </div>
                </div>
             </div>
             
             <div className="flex gap-6 mt-6 justify-center">
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 border rounded bg-white"></div>
                   <span className="text-sm">Available</span>
                </div>
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 border rounded bg-gray-300"></div>
                   <span className="text-sm">Booked</span>
                </div>
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 border rounded bg-primary"></div>
                   <span className="text-sm">Selected</span>
                </div>
             </div>
          </div>

          {/* Passenger Info Form */}
          {selectedSeats.length > 0 && (
             <div className="bg-white p-6 rounded-lg border shadow-sm animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-bold mb-4">Passenger Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input placeholder="Enter full name" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input placeholder="Enter email" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <Input placeholder="Enter phone number" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-medium">Next of Kin Phone</label>
                      <Input placeholder="Emergency contact" />
                   </div>
                </div>
             </div>
          )}
        </div>

        {/* Right Column: Price Summary */}
        <div className="lg:col-span-1">
           <div className="bg-white p-6 rounded-lg border shadow-sm sticky top-24">
              <h3 className="font-bold text-lg mb-4 text-gray-900 border-b pb-2">Booking Summary</h3>
              <div className="space-y-2 mb-4 text-sm">
                 <div className="flex justify-between">
                    <span className="text-gray-500">Ticket Price</span>
                    <span>₦{pricePerSeat.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-500">Seats Selected</span>
                    <span>{selectedSeats.length}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-500">Service Fee</span>
                    <span>₦{selectedSeats.length * 500}</span>
                 </div>
              </div>
              
              <div className="border-t pt-4 mb-6">
                 <div className="flex justify-between font-bold text-xl">
                    <span>Total</span>
                    <span className="text-primary">₦{((pricePerSeat * selectedSeats.length) + (selectedSeats.length * 500)).toLocaleString()}</span>
                 </div>
              </div>

              <Button className="w-full h-12 text-lg" disabled={selectedSeats.length === 0}>
                 Proceed to Payment <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              
              <p className="text-xs text-center text-gray-500 mt-4 flex items-center justify-center gap-1">
                 <CreditCard className="h-3 w-3" /> Secured by Paystack
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
