"use client"
// manual-booking-modal

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createManualBooking } from "@/app/actions/manual-booking"

const formSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: z.string().min(10, "Phone number is required"),
  emergencyContact: z.string().min(10, "Emergency contact is required"),
  seats: z.number().min(1, "Must book at least 1 seat"),
  paymentMethod: z.enum(["CASH", "POS", "BANK_TRANSFER"]),
  amountPaid: z.number().min(0, "Amount cannot be negative"),
})

interface ManualBookingModalProps {
  routeId: string
  price: number
  availableSeats: number // Passed from parent for validation feedback
  trigger?: React.ReactNode
}

export function ManualBookingModal({ routeId, price, availableSeats, trigger }: ManualBookingModalProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      emergencyContact: "",
      seats: 1,
      paymentMethod: "CASH",
      amountPaid: price,
    },
  })

  // Update amount when seats change
  const watchSeats = form.watch("seats")
  if (watchSeats && typeof watchSeats === 'number') {
     // This is a simple effect-like logic in render, beneficial for immediate feedback but 
     // usually better in useEffect if complex. Here it's just sync.
     // However, setting state/value during render is bad practice if not careful.
     // Let's use useEffect or just rely on user knowing math, OR auto-calc.
     // Better yet, let's auto-calc amountPaid if the user hasn't manually overridden it?
     // For simplicity, let's just default it and let them edit.
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (values.seats > availableSeats) {
        form.setError("seats", {
          type: "manual",
          message: `Only ${availableSeats} seats available.`,
        })
        return
      }

      const result = await createManualBooking({
        routeId,
        ...values,
      })

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Booking Failed",
          description: result.error,
        })
      } else {
        toast({
          title: "Booking Successful",
          description: `Successfully booked ${values.seats} seats.`,
        })
        setOpen(false)
        form.reset()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
            <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Manual Booking
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manual Booking</DialogTitle>
          <DialogDescription>
            Record a booking made offline (at the park/office).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="080..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergencyContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next of Kin / Emergency Contact</FormLabel>
                  <FormControl>
                    <Input placeholder="080..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="seats"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Seats <span className="text-muted-foreground text-xs font-normal">(Available: {availableSeats})</span></FormLabel>
                    <FormControl>
                        <Input 
                            type="number" 
                            {...field} 
                            value={field.value || ""} 
                            onChange={e => {
                                const val = parseFloat(e.target.value);
                                const cleanVal = isNaN(val) ? 0 : val;
                                field.onChange(cleanVal);
                                
                                if (cleanVal > 0) {
                                  form.setValue("amountPaid", cleanVal * price);
                                }
                            }}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="amountPaid"
                render={({ field }) => (
                    <FormItem>
                  <FormLabel>Total Amount</FormLabel>
                    <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value ?? ""} 
                          onChange={(e) => {
                            const val = e.target.valueAsNumber;
                             // If empty/NaN, treat as 0 for integer safety in schema, but typical UX might prefer allowing empty.
                             // Given schema expects number, 0 is safe fallback.
                            const cleanVal = isNaN(val) ? 0 : val;
                            field.onChange(cleanVal)
                          }}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="POS">POS Terminal</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Booking
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
