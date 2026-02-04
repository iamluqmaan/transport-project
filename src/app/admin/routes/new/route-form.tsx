"use client";

import { useFormStatus } from "react-dom";
import { createRoute } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create Route
    </Button>
  );
}

interface RouteFormProps {
    companies: { id: string; name: string }[];
}

export function RouteForm({ companies }: RouteFormProps) {
    const [error, setError] = useState<string | null>(null);

    async function clientAction(formData: FormData) {
        const result = await createRoute(formData);
        if (result?.error) {
            setError(result.error);
        }
    }

    return (
        <form action={clientAction} className="space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Trip Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="originCity">Origin City</Label>
                    <Input id="originCity" name="originCity" required placeholder="Lagos" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="originState">Origin State</Label>
                    <Input id="originState" name="originState" required placeholder="Lagos" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="destinationCity">Destination City</Label>
                    <Input id="destinationCity" name="destinationCity" required placeholder="Abuja" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="destinationState">Destination State</Label>
                    <Input id="destinationState" name="destinationState" required placeholder="FCT" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">Price (₦)</Label>
                    <Input id="price" name="price" type="number" min="0" required placeholder="15000" />
                </div>
                <div className="space-y-2">
                     <Label htmlFor="departureTime">Departure Date & Time</Label>
                     <Input id="departureTime" name="departureTime" type="datetime-local" required />
                </div>
                 <div className="space-y-2">
                     <Label htmlFor="estimatedDuration">Duration (Minutes)</Label>
                     <Input id="estimatedDuration" name="estimatedDuration" type="number" min="0" placeholder="e.g. 600" />
                </div>
            </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-lg font-semibold border-b pb-2">Operator & Vehicle</h3>
             <div className="space-y-2">
                <Label htmlFor="companyId">Transport Company</Label>
                <select 
                    id="companyId" 
                    name="companyId" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                    defaultValue={companies.length === 1 ? companies[0].id : ""}
                >
                    <option value="">Select a company...</option>
                    {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="vehicleType">Vehicle Type</Label>
                    <select 
                        id="vehicleType" 
                        name="vehicleType"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                    >
                         <option value="BUS">Bus</option>
                         <option value="MINI_BUS">Mini Bus</option>
                         <option value="LUXURY_COACH">Luxury Coach</option>
                         <option value="SIENNA">Sienna</option>
                         <option value="HUMMER_BUS">Hummer Bus</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehiclePlate">Plate Number</Label>
                    <Input id="vehiclePlate" name="vehiclePlate" required placeholder="ABC-123DE" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicleCapacity">Capacity</Label>
                    <Input id="vehicleCapacity" name="vehicleCapacity" type="number" min="1" required placeholder="14" />
                </div>
             </div>
          </div>

          {error && <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded border border-red-200">{error}</p>}

          <div className="flex justify-end gap-4 pt-4">
            <Link href="/admin/routes">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <SubmitButton />
          </div>
        </form>
    );
}
