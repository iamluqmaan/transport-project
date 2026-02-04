'use server'

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import TransportCompany from "@/models/TransportCompany";
import Route from "@/models/Route";
import Vehicle from "@/models/Vehicle";
import User, { Role } from "@/models/User";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// --- Schema Definitions ---

const CompanySchema = z.object({
  name: z.string().min(2),
  contactInfo: z.string().min(5),
  description: z.string().optional(),
});

const RouteSchema = z.object({
  originCity: z.string().min(2),
  originState: z.string().min(2),
  destinationCity: z.string().min(2),
  destinationState: z.string().min(2),
  price: z.coerce.number().min(0),
  departureTime: z.string().datetime({ offset: true }).or(z.string()), // Accept ISO string from input
  estimatedDuration: z.coerce.number().min(0).optional(),
  companyId: z.string().min(1),
  // Vehicle details (simplified creation for now)
  vehicleType: z.enum(["BUS", "MINI_BUS", "LUXURY_COACH", "SIENNA", "HUMMER_BUS"]),
  vehiclePlate: z.string().min(2),
  vehicleCapacity: z.coerce.number().min(1),
});

const CompanyAdminSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  companyId: z.string().min(1),
});

// --- Actions ---

export async function createCompany(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== 'SUPER_ADMIN') {
    return { error: "Unauthorized" };
  }

  const rawData = {
    name: formData.get("name"),
    contactInfo: formData.get("contactInfo"),
    description: formData.get("description"),
  };

  const validatedFields = CompanySchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  try {
    await connectDB();
    await TransportCompany.create({
      ...validatedFields.data,
      isActive: true,
    });
  } catch (error) {
    console.error("Create Company Error:", error);
    return { error: "Failed to create company" };
  }

  revalidatePath("/admin/companies");
  redirect("/admin/companies");
}

export async function createRoute(formData: FormData) {
  const session = await auth();
  // Allow Company Admin to create routes too if needed, for now SUPER_ADMIN or COMPANY_ADMIN
  if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'COMPANY_ADMIN')) {
      return { error: "Unauthorized" };
  }

  const rawData = {
    originCity: formData.get("originCity"),
    originState: formData.get("originState"),
    destinationCity: formData.get("destinationCity"),
    destinationState: formData.get("destinationState"),
    price: formData.get("price"),
    departureTime: formData.get("departureTime"),
    estimatedDuration: formData.get("estimatedDuration"),
    companyId: formData.get("companyId"),
    vehicleType: formData.get("vehicleType"),
    vehiclePlate: formData.get("vehiclePlate"),
    vehicleCapacity: formData.get("vehicleCapacity"),
  };

  const validatedFields = RouteSchema.safeParse(rawData);

  if (!validatedFields.success) {
      console.log(validatedFields.error);
    return { error: "Invalid fields: " + JSON.stringify(validatedFields.error.flatten()) };
  }

  const data = validatedFields.data;

  // Enforce companyId for Company Admins
  if (session.user.role === 'COMPANY_ADMIN') {
      if (!session.user.companyId) {
          return { error: "User is not linked to any company" };
      }
      data.companyId = session.user.companyId;
  }

  try {
    await connectDB();

    // 1. Create or Find Vehicle (Simplified: Always create new for this demo to avoid complex UI)
    // In real app, we would select existing vehicle.
    const vehicle = await Vehicle.create({
        type: data.vehicleType,
        plateNumber: data.vehiclePlate,
        capacity: data.vehicleCapacity,
        companyId: data.companyId,
    });

    // 2. Create Route
    await Route.create({
        originState: data.originState,
        originCity: data.originCity,
        destinationState: data.destinationState,
        destinationCity: data.destinationCity,
        price: data.price,
        departureTime: new Date(data.departureTime),
        estimatedDuration: data.estimatedDuration,
        companyId: data.companyId,
        vehicleId: vehicle._id,
    });

  } catch (error) {
    console.error("Create Route Error:", error);
    return { error: "Failed to create route" };
  }

  revalidatePath("/admin/routes");
  redirect("/admin/routes");
}

export async function createCompanyAdmin(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== 'SUPER_ADMIN') {
      return { error: "Unauthorized" };
  }

  const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      companyId: formData.get("companyId"),
  };

  const validatedFields = CompanyAdminSchema.safeParse(rawData);

  if (!validatedFields.success) {
      return { error: "Invalid fields: " + JSON.stringify(validatedFields.error.flatten()) };
  }

  const data = validatedFields.data;

  try {
      await connectDB();
      
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
          return { error: "User with this email already exists" };
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      await User.create({
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: Role.COMPANY_ADMIN,
          companyId: data.companyId,
      });

  } catch (error) {
      console.error("Create Company Admin Error:", error);
      return { error: "Failed to create company admin" };
  }

  revalidatePath("/admin/companies");
  redirect("/admin/companies");
}
