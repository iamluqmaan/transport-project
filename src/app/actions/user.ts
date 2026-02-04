'use server'

import connectDB from "@/lib/db"
import User from "@/models/User"
import { z } from "zod"
import { auth } from "@/auth"

const BankAccountSchema = z.object({
  bankName: z.string().min(2),
  accountNumber: z.string().min(10),
  accountName: z.string().min(2),
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
                 await TransportCompany.findByIdAndUpdate(user.companyId, {
                     $set: { bankAccounts: bankAccounts }
                 });
            }
        }

        return { success: true };

    } catch (error) {
        console.error("Profile update error:", error);
        return { error: "Failed to update profile" };
    }
}
