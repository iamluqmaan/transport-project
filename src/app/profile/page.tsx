'use client';

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redirect } from "next/navigation";
import { User as UserIcon, Mail, Shield, Phone, Plus, Trash2, Edit2, Loader2, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateProfile } from "../actions/user";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BankAccountSchema = z.object({
  bankName: z.string().min(2, "Bank Name required"),
  accountNumber: z.string().min(10, "Account Number required"),
  accountName: z.string().min(2, "Account Name required"),
});

const ProfileSchema = z.object({
  name: z.string().min(2),
  phoneNumber: z.string().optional(),
  bankAccounts: z.array(BankAccountSchema).optional(),
});

type ProfileFormValues = z.infer<typeof ProfileSchema>;

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      bankAccounts: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "bankAccounts",
  });

  // Load initial data
  useEffect(() => {
    if (session?.user) {
      form.reset({
        name: session.user.name || "",
        phoneNumber: session.user.phoneNumber || "",
        bankAccounts: session.user.bankAccounts || [], 
      });
      // Try to fetch extended data if company admin? 
      // Current session might not have bank accounts if not refreshed.
      // For now assume session has it or we might need a fetch.
      // Actually, session update is tricky. Let's rely on what we have or consider a separate fetch if critical.
      // For this implementation, let's assume session is the source of truth or we reload.
    }
  }, [session, form]);

  if (!session?.user) {
    // Handling redirection in client component effectively
    // But ideally middleware handles this.
    return <div className="p-8 text-center">Please log in to view your profile.</div>;
  }

  const isCompanyAdmin = session.user.role === 'COMPANY_ADMIN';

  async function onSubmit(data: ProfileFormValues) {
    setLoading(true);
    setError(null);
    try {
      const result = await updateProfile(data);
      if (result.error) {
        setError(result.error);
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        await update(); // Update session
        setIsEditing(false);
        toast({ title: "Success", description: "Profile updated successfully" });
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <Card>
        <CardHeader className="text-center relative">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <UserIcon className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">My Profile</CardTitle>
          <CardDescription>View and manage your account information</CardDescription>
          
          <div className="absolute top-6 right-6">
            {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
            ) : (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={loading}>
                    <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
             <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
             </Alert>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input 
                            id="name" 
                            {...form.register("name")} 
                            disabled={!isEditing} 
                            className="pl-10" 
                        />
                    </div>
                     {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input value={session.user.email || ''} disabled className="pl-10 bg-gray-50" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input 
                            id="phoneNumber" 
                            {...form.register("phoneNumber")} 
                            placeholder="+234..."
                            disabled={!isEditing} 
                            className="pl-10" 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Account Role</Label>
                    <div className="flex items-center gap-2 p-2.5 border rounded-md bg-gray-50 h-10">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="font-medium capitalize text-sm">{session.user.role?.replace('_', ' ').toLowerCase()}</span>
                        <Badge variant="outline" className="ml-auto text-xs">Active</Badge>
                    </div>
                </div>
            </div>

            {isCompanyAdmin && (
                <div className="mt-8 pt-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Company Bank Accounts</h3>
                        {isEditing && (
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ bankName: "", accountNumber: "", accountName: "" })}>
                                <Plus className="h-4 w-4 mr-1" /> Add Account
                            </Button>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 bg-gray-50 rounded-lg border relative group">
                                {isEditing && (
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                                <div className="grid gap-4 md:grid-cols-3 pr-8">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">Bank Name</Label>
                                        <Input 
                                            {...form.register(`bankAccounts.${index}.bankName`)} 
                                            disabled={!isEditing} 
                                            placeholder="Bank Name" 
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">Account Number</Label>
                                        <Input 
                                            {...form.register(`bankAccounts.${index}.accountNumber`)} 
                                            disabled={!isEditing} 
                                            placeholder="Account Number" 
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">Account Name</Label>
                                        <Input 
                                            {...form.register(`bankAccounts.${index}.accountName`)} 
                                            disabled={!isEditing} 
                                            placeholder="Account Name" 
                                            className="bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {fields.length === 0 && (
                            <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-md border border-dashed">
                                No bank accounts added yet.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="flex justify-end gap-4 pt-4">
                     <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
