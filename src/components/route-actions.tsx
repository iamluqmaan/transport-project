"use client"

import { ManualBookingModal } from "@/components/admin/manual-booking-modal";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Loader2, MoreHorizontal, UserCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteCompanyRoute } from "@/app/actions/company";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RouteActionsProps {
  routeId: string;
  price: number;
  availableSeats: number;
}

export function RouteActions({ routeId, price, availableSeats }: RouteActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this route?")) return;
    
    setLoading(true);
    try {
      await deleteCompanyRoute(routeId);
    } catch (error) {
      console.error(error);
      alert("Failed to delete route");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
       <ManualBookingModal 
          routeId={routeId} 
          price={price} 
          availableSeats={availableSeats}
          trigger={
             <Button variant="outline" size="sm" className="h-8">
                 <UserCheck className="h-4 w-4 mr-2" />
                 <span>Book Manual</span>
             </Button>
          }
       />

      <Link href={`/admin/routes/${routeId}/edit`}>
        <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
        </Button>
      </Link>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleDelete} 
        disabled={loading}
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
