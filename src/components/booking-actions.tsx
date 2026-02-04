"use client";

import { Button } from "@/components/ui/button";
import { Check, X, FileText, MoreHorizontal, Loader2 } from "lucide-react";
import { approveBooking, rejectBooking } from "@/app/actions/booking";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import Image from "next/image";

interface BookingActionsProps {
  bookingId: string;
  status: string;
  proofUrl?: string;
}

export function BookingActions({ bookingId, status, proofUrl }: BookingActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showProof, setShowProof] = useState(false);

  const handleAction = async (actionFn: (id: string, formData: FormData) => Promise<void>) => {
    setLoading(true);
    try {
        const formData = new FormData();
        await actionFn(bookingId, formData);
    } catch (error) {
        console.error("Action failed", error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            
            {proofUrl && (
                <DropdownMenuItem onClick={() => setShowProof(true)} className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" /> 
                    {proofUrl === "MANUAL_ENTRY" ? "View Payment Details" : "View Payment Proof"}
                </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />

            {status === "PENDING" && (
                <>
                    <DropdownMenuItem 
                        onClick={() => handleAction(approveBooking)} 
                        disabled={loading}
                        className="text-green-600 focus:text-green-700 focus:bg-green-50 cursor-pointer"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Approve Booking
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => handleAction(rejectBooking)} 
                        disabled={loading}
                        className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                    >
                         {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                        Reject Booking
                    </DropdownMenuItem>
                </>
            )}
             {status !== "PENDING" && (
                <DropdownMenuItem disabled className="text-gray-400">
                    No actions available
                </DropdownMenuItem>
            )}
        </DropdownMenuContent>
        </DropdownMenu>

        {/* Proof of Payment Dialog */}
        <Dialog open={showProof} onOpenChange={setShowProof}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Proof of Payment</DialogTitle>
                </DialogHeader>
                <div className="relative aspect-video w-full overflow-hidden rounded-md bg-gray-100">
                    {proofUrl ? (
                        proofUrl === "MANUAL_ENTRY" ? (
                             <div className="flex flex-col h-full items-center justify-center text-gray-500 bg-gray-50">
                                <FileText className="h-12 w-12 mb-2 opacity-20" />
                                <p className="font-medium">Manual Booking</p>
                                <p className="text-xs">Payment collected securely via Cash/POS</p>
                            </div>
                        ) : (
                        <Image 
                            src={proofUrl} 
                            alt="Payment Proof" 
                            fill 
                            className="object-contain" 
                        />
                        )
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-500">
                            No Item to display
                        </div>
                    )}
                </div>
                <div className="flex justify-end mt-4">
                     {proofUrl && proofUrl !== "MANUAL_ENTRY" && (
                         <Button variant="outline" asChild>
                            <a href={proofUrl} download={`proof-${bookingId.slice(-6)}.png`} target="_blank" rel="noopener noreferrer">Download Proof</a>
                         </Button>
                     )}
                </div>
            </DialogContent>
        </Dialog>
    </>
  );
}
