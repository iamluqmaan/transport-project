'use server'

import connectDB from "@/lib/db"
import User from "@/models/User"
import { z } from "zod"
import { auth } from "@/auth"

const BankAccountSchema = z.object({
  bankName: z.string().min(2),
  accountNumber: z.string().min(10),
  accountName: z.string().min(2),
  bankCode: z.string().optional(), // Added
});

const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phoneNumber: z.string().optional(),
  bankAccounts: z.array(BankAccountSchema).optional(),
});

export async function updateProfile(data: z.input<typeof UpdateProfileSchema>) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    const result = UpdateProfileSchema.safeParse(data);

    if (!result.success) {
        return { error: "Invalid input data" };
    }

    const { name, phoneNumber, bankAccounts } = result.data;

    try {
        await connectDB();
        
        // 1. Update User Details
        const user = await User.findById(session.user.id);
        if (!user) {
            return { error: "User not found" };
        }

        if (name) user.name = name;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        
        await user.save();

        // 2. If Company Admin, Update Company Details
        if (user.role === 'COMPANY_ADMIN' && user.companyId) {
            if (bankAccounts) {
                 const TransportCompany = (await import("@/models/TransportCompany")).default;
                 const company = await TransportCompany.findById(user.companyId);
                 
                 // Check if we need to create/update subaccount
                 // We only do this if bank accounts are provided and at least one exists
                 let subaccountCode = company.paystackSubaccountCode;
                 
                 const primaryBank = bankAccounts[0]; // Use first account as primary for subaccount
                 
                 // If we have a primary bank with a code, try to create subaccount
                 // We do this if subaccount doesn't exist OR if we want to update it (Paystack allows update, but create is easier logic for now - creating new one)
                 // Actually, best practice is to check if details changed. 
                 
                 if (primaryBank && primaryBank.bankCode && primaryBank.accountNumber) {
                      const { createSubaccount, updateSubaccount } = await import("@/lib/paystack");
                      
                      try {
                          // Allow update even if it exists, Paystack handles multiple subaccounts. 
                          // We just overwrite the ID we use.
                          
                          // If we already have a subaccount code, TRY to update its percentage to 0 first
                          let subaccountUpdated = false;
                          if (subaccountCode) {
                              try {
                                  const updated = await updateSubaccount(subaccountCode, 0);
                                  if (updated) {
                                      subaccountUpdated = true;
                                  } else {
                                      // It returned null because it didn't exist (e.g. old test code)
                                      console.log("Subaccount not found, proceeding to create newly.");
                                  }
                              } catch (e: any) {
                                  console.warn("Failed to update existing subaccount percentage.", e);
                                  return { error: e.message || "Failed to sync subaccount with Paystack." };
                              }
                          }

                          // If no subaccount code OR update failed (maybe invalid code), create/re-create
                          if (!subaccountCode || !subaccountUpdated) {
                              try {
                                  const subaccount = await createSubaccount(
                                      company.name,
                                      primaryBank.bankCode,
                                      primaryBank.accountNumber,
                                      0 // Force 0%
                                  );

                                  if (subaccount && subaccount.subaccount_code) {
                                      subaccountCode = subaccount.subaccount_code;
                                  } else {
                                      return { error: "Paystack returned an invalid subaccount response." };
                                  }
                              } catch (err: any) {
                                  console.error("Failed to create/update Paystack subaccount:", err);
                                  return { error: err.message || "Failed to verify bank account with Paystack. Please check Account Number and Bank." };
                              }
                          }
                      } catch (globalErr: any) {
                          console.error("Unexpected error in Paystack subaccount flow:", globalErr);
                          return { error: "An unexpected error occurred while setting up payment." };
                      }
                 }

                 await TransportCompany.findByIdAndUpdate(user.companyId, {
                     $set: { 
                         bankAccounts: bankAccounts,
                         paystackSubaccountCode: subaccountCode
                     }
                 });
            }
        }

        return { success: true, bankAccounts: bankAccounts };

    } catch (error) {
        console.error("Profile update error:", error);
        return { error: "Failed to update profile" };
    }
}

// Helper to determine if bank details changed
function hasBankDetailsChanged(oldBanks: any[], newBanks: any[]) {
    if (oldBanks.length !== newBanks.length) return true;
    for (let i = 0; i < oldBanks.length; i++) {
        if (oldBanks[i].accountNumber !== newBanks[i].accountNumber || 
            oldBanks[i].bankCode !== newBanks[i].bankCode) {
            return true;
        }
    }
    return false;
}

export async function getBanksList() {
    const { getBanks } = await import("@/lib/paystack");
    return await getBanks();
}

export async function getUserProfile() {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        await connectDB();
        const User = (await import("@/models/User")).default;
        const user = await User.findById(session.user.id).lean() as any;
        if (!user) return null;

        let bankAccounts = [];
        if (user.role === 'COMPANY_ADMIN' && user.companyId) {
            const TransportCompany = (await import("@/models/TransportCompany")).default;
            const company = await TransportCompany.findById(user.companyId).lean() as any;
            if (company && company.bankAccounts) {
                bankAccounts = company.bankAccounts;
            }
        } else {
             bankAccounts = user.bankAccounts || [];
        }

        const serializedBankAccounts = bankAccounts.map((acc: any) => ({
             bankName: acc.bankName,
             accountNumber: acc.accountNumber,
             accountName: acc.accountName,
             bankCode: acc.bankCode
        }));

        return {
            name: user.name,
            phoneNumber: user.phoneNumber,
            role: user.role,
            bankAccounts: serializedBankAccounts
        };
    } catch (error) {
        console.error("Failed to fetch user profile", error);
        return null;
    }
}
