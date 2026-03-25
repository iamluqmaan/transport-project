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
import { getBanksList, updateProfile, getUserProfile } from "@/app/actions/user";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<ProfileFormValues | null>(null);

  const [editingBanks, setEditingBanks] = useState<Set<number>>(new Set());
  const [bankToDelete, setBankToDelete] = useState<number | null>(null);

  // ... (keeping existing hooks)
  // Initialize form with default values from session
  // We might need to fetch fresh user data if session is stale, but let's start with session
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      phoneNumber: session?.user?.phoneNumber || "",
      bankAccounts: [], 
    },
  });

  // Watch bank accounts for dynamic field rendering
  const bankAccounts = form.watch("bankAccounts") || [];

  useEffect(() => {
    if (session?.user) {
        getUserProfile().then((data) => {
            if (data) {
                form.reset({
                    name: data.name || "",
                    phoneNumber: data.phoneNumber || "",
                    // @ts-ignore
                    bankAccounts: data.bankAccounts || []
                });
                setEditingBanks(new Set()); // Reset editing state when session updates
            }
        }).catch(err => console.error("Failed to load profile", err));
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


  const isCompanyAdmin = session?.user?.role === 'COMPANY_ADMIN';

  const handlePreSubmit = (data: ProfileFormValues) => {
      // If they are admin and actively editing/adding a bank, prompt for confirmation
      if (isCompanyAdmin && editingBanks.size > 0) {
          setPendingData(data);
          setShowConfirmDialog(true);
      } else {
          onSubmit(data);
      }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setLoading(true);
    setShowConfirmDialog(false);
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
             setEditingBanks(new Set()); // Clear all edit states because they are saved
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
      const newIndex = currentAccounts.length;
      form.setValue("bankAccounts", [
          ...currentAccounts, 
          { bankName: "", accountNumber: "", accountName: "", bankCode: "" }
      ]);
      setEditingBanks(prev => new Set(prev).add(newIndex));
  };

  const handleRemoveClick = (index: number) => {
      setBankToDelete(index);
  };

  const confirmRemoveBankAccount = () => {
      if (bankToDelete === null) return;
      const index = bankToDelete;
      const currentAccounts = form.getValues("bankAccounts") || [];
      const newAccounts = currentAccounts.filter((_, i) => i !== index);
      form.setValue("bankAccounts", newAccounts);
      
      // Update editing banks map
      setEditingBanks(prev => {
          const next = new Set<number>();
          prev.forEach(i => {
              if (i < index) next.add(i);
              if (i > index) next.add(i - 1);
          });
          return next;
      });
      setBankToDelete(null);
  };

  const toggleEditBank = (index: number) => {
      setEditingBanks(prev => {
          const next = new Set(prev);
          if (next.has(index)) {
              next.delete(index);
          } else {
              next.add(index);
          }
          return next;
      });
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

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handlePreSubmit)} className="space-y-6">
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
                     
                     <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md mb-4 text-sm">
                         <strong>Attention:</strong> Please triple-check your bank details before saving! 
                         These exact accounts will be used automatically to receive your trip payouts. 
                         Incorrect details will result in failed transfers.
                     </div>

                     <div className="space-y-4">
                         {bankAccounts.map((account, index) => {
                             const isEditing = editingBanks.has(index);

                             return (
                             <div key={index} className="p-4 border rounded-lg relative overflow-hidden transition-all duration-200" style={{ backgroundColor: isEditing ? '#f9fafb' : '#ffffff', borderColor: isEditing ? '#e5e7eb' : '#d1d5db' }}>
                                 <div className="absolute top-2 right-2 flex gap-2">
                                     {!isEditing && (
                                         <Button 
                                             type="button" 
                                             variant="ghost" 
                                             size="sm"
                                             className="h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                             onClick={() => toggleEditBank(index)}
                                         >
                                             Edit
                                         </Button>
                                     )}
                                     <Button 
                                         type="button" 
                                         variant="ghost" 
                                         size="icon" 
                                         className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                         onClick={() => handleRemoveClick(index)}
                                     >
                                         <Trash2 className="h-4 w-4" />
                                     </Button>
                                 </div>
                                 
                                 {!isEditing ? (
                                     <div className="pr-16 text-sm">
                                         <div className="flex items-center gap-2 mb-2">
                                             <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold tracking-wide">ADDED</div>
                                             {index === 0 && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold">PRIMARY</span>}
                                         </div>
                                         <div className="grid grid-cols-2 gap-y-2 mt-3 text-sm">
                                             <div>
                                                 <span className="text-gray-500 block text-xs uppercase tracking-wider font-semibold mb-0.5">Bank Name</span>
                                                 <span className="font-medium text-gray-900">{account.bankName || "Unknown Bank"}</span>
                                             </div>
                                             <div>
                                                 <span className="text-gray-500 block text-xs uppercase tracking-wider font-semibold mb-0.5">Account Number</span>
                                                 <span className="font-medium text-gray-900">{account.accountNumber || "N/A"}</span>
                                             </div>
                                             <div className="col-span-2">
                                                 <span className="text-gray-500 block text-xs uppercase tracking-wider font-semibold mb-0.5">Account Name</span>
                                                 <span className="font-medium text-gray-900">{account.accountName || "N/A"}</span>
                                             </div>
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="grid gap-4 md:grid-cols-2 mt-4 pr-10">
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
                                         
                                         <div className="col-span-2 flex justify-end">
                                             <span className="text-xs text-orange-500 italic mt-2">Click "Save Changes" below to apply updates.</span>
                                         </div>
                                     </div>
                                 )}
                             </div>
                         )})}
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
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payout Account Details</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure the bank account details you provided are accurate? 
              These accounts will be automatically used to receive your payouts. 
              Incorrect details may cause payouts to fail or be routed to the wrong account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Again</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                if (pendingData) onSubmit(pendingData);
            }}>
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bankToDelete !== null} onOpenChange={(open) => !open && setBankToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Bank Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this bank account? 
              {bankToDelete === 0 && " This is currently your Primary payout account. If you remove it, please ensure you add a new primary account."}
              <br/><br/>
              <span className="text-red-600 font-medium">Remember to click "Save Changes" at the bottom of the page to finalize this deletion.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveBankAccount} className="bg-red-600 hover:bg-red-700">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
