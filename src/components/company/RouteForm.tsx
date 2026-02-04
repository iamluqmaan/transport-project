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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createCompanyRoute } from "@/app/actions/company";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  saveAsPopular: z.boolean().default(false),
});

type RouteFormValues = z.infer<typeof formSchema>;

interface RouteFormProps {
    templates: any[];
    initialValues?: any; // Added prop for rescheduling
}

export default function RouteForm({ templates, initialValues }: RouteFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const form = useForm<RouteFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      originCity: initialValues?.originCity || "",
      originState: initialValues?.originState || "",
      destinationCity: initialValues?.destinationCity || "",
      destinationState: initialValues?.destinationState || "",
      price: initialValues?.price || 0,
      departureTime: "", // Always reset time for reschedule
      vehicleType: initialValues?.vehicleType || "BUS",
      vehiclePlate: initialValues?.vehiclePlate || "",
      vehicleCapacity: initialValues?.vehicleCapacity || 14,
      saveAsPopular: false,
    },
  });

  // Effect to update form if initialValues load late or change
  useEffect(() => {
      if (initialValues) {
          form.reset({
              originCity: initialValues.originCity,
              originState: initialValues.originState,
              destinationCity: initialValues.destinationCity,
              destinationState: initialValues.destinationState,
              price: initialValues.price,
              departureTime: "",
              vehicleType: initialValues.vehicleType || "BUS",
              vehiclePlate: initialValues.vehiclePlate || "",
              vehicleCapacity: initialValues.vehicleCapacity || 14,
              saveAsPopular: false
          });
      }
  }, [initialValues, form]);

  const onTemplateChange = (value: string) => {
      const template = templates.find(t => t._id === value);
      if (template) {
          form.setValue("originState", template.originState);
          form.setValue("originCity", template.originCity);
          form.setValue("destinationState", template.destinationState);
          form.setValue("destinationCity", template.destinationCity);
          form.setValue("price", template.price);
          form.setValue("vehicleType", template.vehicleType);
          form.setValue("vehicleCapacity", template.vehicleCapacity);
          // Don't set Date/Time or Plate as those likely change
      }
  };

  async function onSubmit(values: RouteFormValues) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    const result = await createCompanyRoute(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Success is handled by redirect in action
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Create New Trip</h1>
      
      {templates.length > 0 && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
              <label className="text-sm font-medium mb-2 block text-gray-700">Load from Popular Route</label>
              <Select onValueChange={onTemplateChange}>
                  <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a popular route template..." />
                  </SelectTrigger>
                  <SelectContent>
                      {templates.map(t => (
                          <SelectItem key={t._id} value={t._id}>
                              {t.name} (₦{t.price})
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value as any)}
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

          <FormField
              control={form.control}
              name="saveAsPopular"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Save as Popular (Recurring) Route
                    </FormLabel>
                    <FormDescription>
                      Checking this will save these route details (Origin, Destination, Price, Vehicle Type) as a template for future use.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Trip
          </Button>
        </form>
      </Form>
    </div>
  );
}
