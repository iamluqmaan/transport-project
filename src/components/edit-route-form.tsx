"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateCompanyRoute } from "@/app/actions/company";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";

const formSchema = z.object({
  originCity: z.string().min(2),
  originState: z.string().min(2),
  destinationCity: z.string().min(2),
  destinationState: z.string().min(2),
  price: z.coerce.number().min(0),
  departureTime: z.string(),
  vehicleType: z.enum(["BUS", "MINI_BUS", "LUXURY_COACH", "SIENNA", "HUMMER_BUS"]),
  vehiclePlate: z.string().min(2),
  vehicleCapacity: z.coerce.number().min(1),
});

interface EditRouteFormProps {
  routeId: string;
  initialData: any;
}

export function EditRouteForm({ routeId, initialData }: EditRouteFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Format date for datetime-local input
  const defaultDate = initialData.departureTime ? new Date(initialData.departureTime).toISOString().slice(0, 16) : "";

  const form = useForm({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      originCity: initialData.originCity,
      originState: initialData.originState,
      destinationCity: initialData.destinationCity,
      destinationState: initialData.destinationState,
      price: initialData.price,
      departureTime: defaultDate,
      vehicleType: initialData.vehicle.type,
      vehiclePlate: initialData.vehicle.plateNumber,
      vehicleCapacity: initialData.vehicle.capacity,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    const result = await updateCompanyRoute(routeId, formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
       // Success, redirect happens in action, but we can also push here if needed
       // router.push("/admin/routes"); 
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
            <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="originState"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origin State</FormLabel>
                <FormControl>
                  <Input placeholder="Lagos" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="originCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origin City</FormLabel>
                <FormControl>
                  <Input placeholder="Ikeja" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="destinationState"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination State</FormLabel>
                <FormControl>
                  <Input placeholder="Abuja" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="destinationCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination City</FormLabel>
                <FormControl>
                  <Input placeholder="Garki" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₦)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="departureTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departure Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-6 mt-6">
          <h3 className="font-semibold mb-4">Vehicle Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                       <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                       >
                          <option value="BUS">Bus</option>
                          <option value="MINI_BUS">Mini Bus</option>
                          <option value="LUXURY_COACH">Luxury Coach</option>
                          <option value="SIENNA">Sienna</option>
                          <option value="HUMMER_BUS">Hummer Bus</option>
                       </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vehiclePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plate Number</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-123DE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="vehicleCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Trip
        </Button>
      </form>
    </Form>
  );
}
