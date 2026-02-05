"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { signup } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phoneNumber: z.string().optional(),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  isCompany: z.boolean().default(false).optional(),
  // Make company fields optional in base schema to allow client-side hydration
  companyName: z.string().optional(),
  bankAccounts: z.array(z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountName: z.string().optional(),
  })).optional(),
}).superRefine((data, ctx) => {
  if (data.isCompany) {
    if (!data.companyName || data.companyName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyName"],
        message: "Company name is required.",
      });
    }

    if (data.bankAccounts) {
      data.bankAccounts.forEach((account, index) => {
        if (!account.bankName || account.bankName.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["bankAccounts", index, "bankName"],
            message: "Bank name required.",
          });
        }
        if (!account.accountNumber || account.accountNumber.length < 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["bankAccounts", index, "accountNumber"],
            message: "Account number required (min 10 digits).",
          });
        }
        if (!account.accountName || account.accountName.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["bankAccounts", index, "accountName"],
            message: "Account name required.",
          });
        }
      });
    }
  }
});

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      isCompany: false,
      bankAccounts: [{ bankName: "", accountNumber: "", accountName: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bankAccounts",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...values,
        phoneNumber: values.phoneNumber || undefined,
        role: values.isCompany ? "COMPANY_ADMIN" : "CUSTOMER",
        bankAccounts: values.isCompany ? values.bankAccounts : undefined,
        companyName: values.isCompany ? values.companyName : undefined,
      };
      // @ts-ignore - The action expects specific types but we are constructing it here.
      const result = await signup(payload);
      if (result.error) {
        setError(result.error as string);
      } else {
        setSuccess("Account created successfully! Logging you in...");
        
        // Auto-login
        const signInResult = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        });

        if (signInResult?.error) {
           setError("Account created, but failed to auto-login. Please login manually.");
           setTimeout(() => {
             router.push("/login");
           }, 1500);
        } else {
           router.push("/");
           router.refresh(); // Ensure the layout updates with the new session
        }
      }
    } catch (e) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/90"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="text-green-600 border-green-600 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+234..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isCompany"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Sign up as a Transport Company
                    </FormLabel>
                    <p className="text-sm text-gray-500">
                      Create an account to list routes and manage bookings.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("isCompany") && (
              <div className="space-y-4 border-l-2 border-primary/20 pl-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your transport company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <FormLabel className="text-base font-semibold">Bank Accounts</FormLabel>
                     <Button type="button" variant="outline" size="sm" onClick={() => append({ bankName: "", accountNumber: "", accountName: "" })}>
                        <Plus className="h-4 w-4 mr-1" /> Add Account
                     </Button>
                  </div>
                  
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-3 bg-gray-50 rounded-md space-y-3 relative group">
                        {index > 0 && (
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        <FormField
                            control={form.control}
                            name={`bankAccounts.${index}.bankName`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Bank Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. GTBank" {...field} className="h-8" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-2">
                             <FormField
                                control={form.control}
                                name={`bankAccounts.${index}.accountNumber`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Account Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0123456789" {...field} className="h-8" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`bankAccounts.${index}.accountName`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Account Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Account Name" {...field} className="h-8" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign up
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
