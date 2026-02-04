"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { updateCommissionRate } from "@/app/actions/finance";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  rate: z.coerce.number().min(0, "Rate cannot be negative").max(100, "Rate cannot exceed 100%"),
});

interface CommissionParamsFormProps {
    currentRate: number;
}

export default function CommissionParamsForm({ currentRate }: CommissionParamsFormProps) {
  const { toast } = useToast();


  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rate: currentRate,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await updateCommissionRate(values.rate);
      if (result.error) {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: result.error
        });
      } else {
        toast({
            title: "Update Successful",
            description: `Commission rate updated to ${values.rate}%`
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong."
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Commission Percentage (%)</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                    <Input 
                        type="number" 
                        step="0.1" 
                        {...field} 
                        value={field.value as number}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        className="w-32" 
                    />
                    <span className="text-sm text-gray-500">%</span>
                </div>
              </FormControl>
              <FormDescription>
                The percentage of each booking amount that is collected as a platform fee.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Rate
        </Button>
      </form>
    </Form>
  );
}
