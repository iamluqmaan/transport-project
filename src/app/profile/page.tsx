"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBanksList, updateProfile } from "@/app/actions/user";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Define Bank Interface locally or import if possible. 
// Importing interface from lib/paystack is safe in client components.
import { Bank } from "@/lib/paystack";

const BankAccountSchema = z.object({
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().min(10, "Account number must be at least 10 digits"),
  accountName: z.string().min(2, "Account name is required"),
  bankCode: z.string().optional(),
});

const ProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().optional(),
  bankAccounts: z.array(BankAccountSchema).optional(),
});

type ProfileFormValues = z.infer<typeof ProfileSchema>;

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  // Initialize form with default values from session
  // We might need to fetch fresh user data if session is stale, but let's start with session
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      phoneNumber: session?.user?.phoneNumber || "",
      // @ts-ignore - session types might not fully express company details yet without casting
      bankAccounts: session?.user?.company?.bankAccounts || [], 
    },
  });

  // Watch bank accounts for dynamic field rendering
  const bankAccounts = form.watch("bankAccounts") || [];

  useEffect(() => {
    if (session?.user) {
        form.reset({
            name: session.user.name || "",
            phoneNumber: session.user.phoneNumber || "",
            // @ts-ignore
            bankAccounts: session.user.company?.bankAccounts || []
        });
    }
  }, [session, form]);

  useEffect(() => {
      const fetchBanks = async () => {
          setLoadingBanks(true);
          try {
              const bankList = await getBanksList();
              setBanks(bankList || []);
          } catch (error) {
              console.error("Failed to fetch banks", error);
              toast.error("Failed to load bank list");
          } finally {
              setLoadingBanks(false);
          }
      };
      
      if (session?.user?.role === 'COMPANY_ADMIN') {
          fetchBanks();
      }
  }, [session?.user?.role]);


  const onSubmit = async (data: ProfileFormValues) => {
    setLoading(true);
    try {
      const result = await updateProfile(data);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile updated successfully!");
        
        // Update session
        await update();
        
        // If we got updated bank accounts from server, update form state ensuring it's in sync
        // @ts-ignore
        if (result.bankAccounts) {
             // @ts-ignore
             form.setValue("bankAccounts", result.bankAccounts);
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const addBankAccount = () => {
      const currentAccounts = form.getValues("bankAccounts") || [];
      form.setValue("bankAccounts", [
          ...currentAccounts, 
          { bankName: "", accountNumber: "", accountName: "", bankCode: "" }
      ]);
  };

  const removeBankAccount = (index: number) => {
      const currentAccounts = form.getValues("bankAccounts") || [];
      const newAccounts = currentAccounts.filter((_, i) => i !== index);
      form.setValue("bankAccounts", newAccounts);
  };

  const handleBankSelect = (index: number, bankCode: string) => {
      const bank = banks.find(b => b.code === bankCode);
      if (bank) {
          form.setValue(`bankAccounts.${index}.bankName`, bank.name);
          form.setValue(`bankAccounts.${index}.bankCode`, bank.code);
          // Optional: triggering account resolution could happen here
      }
  };

  if (!session) {
      return <div className="p-8 text-center">Please log in to view your profile.</div>;
  }

  const isCompanyAdmin = session.user.role === 'COMPANY_ADMIN';

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...form.register("name")} placeholder="Your Name" />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" {...form.register("phoneNumber")} placeholder="08012345678" />
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={session.user.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
              </div>
              
               <div className="space-y-2">
                <Label>Role</Label>
                <Input value={session.user.role || "USER"} disabled className="bg-muted" />
              </div>
            </div>

            {isCompanyAdmin && (
                <div className="border-t pt-6 mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Company Bank Accounts</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addBankAccount}>
                            <Plus className="h-4 w-4 mr-2" /> Add Account
                        </Button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                        These accounts will be used for payouts. The first account is your primary settlement account.
                        <br/>
                        <span className="text-orange-600 font-medium">Important: Saving will update your Paystack Subaccount configuration.</span>
                    </p>

                    <div className="space-y-4">
                        {bankAccounts.map((account, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-gray-50 relative">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                    onClick={() => removeBankAccount(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                
                                <div className="grid gap-4 md:grid-cols-2 pr-8">
                                    <div className="space-y-2">
                                        <Label>Bank</Label>
                                        <Select 
                                            onValueChange={(val) => handleBankSelect(index, val)}
                                            value={account.bankCode || ""} 
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={account.bankName || "Select Bank"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {loadingBanks ? (
                                                    <SelectItem value="loading" disabled>Loading banks...</SelectItem>
                                                ) : (
                                                    // Deduplicate banks by code to prevent key collision
                                                    Array.from(new Map(banks.map(item => [item.code, item])).values()).map((bank) => (
                                                        <SelectItem key={bank.code} value={bank.code}>
                                                            {bank.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {form.formState.errors.bankAccounts?.[index]?.bankName && (
                                            <p className="text-xs text-red-500">{form.formState.errors.bankAccounts[index]?.bankName?.message}</p>
                                        )}
                                        {/* Hidden inputs to store name if needed explicitly, but we invoke setValue in handler */}
                                        <Input type="hidden" {...form.register(`bankAccounts.${index}.bankName`)} />
                                        <Input type="hidden" {...form.register(`bankAccounts.${index}.bankCode`)} />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Account Number</Label>
                                        <Input 
                                            {...form.register(`bankAccounts.${index}.accountNumber`)} 
                                            placeholder="1234567890" 
                                            maxLength={10}
                                        />
                                        {form.formState.errors.bankAccounts?.[index]?.accountNumber && (
                                            <p className="text-xs text-red-500">{form.formState.errors.bankAccounts[index]?.accountNumber?.message}</p>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Account Name</Label>
                                        <Input 
                                            {...form.register(`bankAccounts.${index}.accountName`)} 
                                            placeholder="Account Holder Name" 
                                        />
                                        {form.formState.errors.bankAccounts?.[index]?.accountName && (
                                            <p className="text-xs text-red-500">{form.formState.errors.bankAccounts[index]?.accountName?.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {bankAccounts.length === 0 && (
                            <p className="text-sm text-gray-500 italic">No bank accounts added yet.</p>
                        )}
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
