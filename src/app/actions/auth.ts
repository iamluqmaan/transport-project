'use server'

import connectDB from "@/lib/db"
import User, { Role } from "@/models/User"
import { z } from "zod"
import bcrypt from "bcryptjs"

const BankAccountSchema = z.object({
  bankName: z.string().min(2),
  accountNumber: z.string().min(10),
  accountName: z.string().min(2),
});

const SignupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phoneNumber: z.string().optional(),
  role: z.nativeEnum(Role).default(Role.CUSTOMER),
  companyName: z.string().optional(),
  companyBrand: z.string().optional(),
  bankAccounts: z.array(BankAccountSchema).optional(),
});

export async function signup(data: z.input<typeof SignupSchema>) {
  const result = SignupSchema.safeParse(data);

  if (!result.success) {
    return { error: "Invalid input data" };
  }

  const { name, email, password, phoneNumber, role, companyName, companyBrand, bankAccounts } = result.data;

  try {
    await connectDB();
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return { error: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let companyId = null;

    if (role === Role.COMPANY_ADMIN) {
        if (!companyName) {
            return { error: "Company name is required for company accounts." };
        }
        
        // Import dynamically to avoid circular dependency issues if any, though likely not needed here but safe.
        const TransportCompany = (await import("@/models/TransportCompany")).default;

        const newCompany = await TransportCompany.create({
            name: companyName,
            contactInfo: email, // Default to user email for now
            bankAccounts: bankAccounts || [],
            isActive: true, // Auto-activate for now to ease testing
        });
        companyId = newCompany._id;
    }

    const user = await User.create({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      companyId, // Link if it's a company admin
    });

    return { success: true, userId: user._id.toString() };
  } catch (error) {
    console.error("Signup error details:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return { error: `Signup Failed: ${errorMessage}` };
  }
}
