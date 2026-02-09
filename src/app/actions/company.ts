'use server'

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import TransportCompany from "@/models/TransportCompany";
import Route from "@/models/Route";
import Vehicle from "@/models/Vehicle";
import Booking from "@/models/Booking";
import RouteTemplate from "@/models/RouteTemplate";
import { isSameDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import User, { Role } from "@/models/User";
import bcrypt from "bcryptjs";

const RouteSchema = z.object({
  originCity: z.string().min(2),
  originState: z.string().min(2),
  destinationCity: z.string().min(2),
  destinationState: z.string().min(2),
  price: z.coerce.number().min(0),
  departureTime: z.string().datetime({ offset: true }).or(z.string()),
  estimatedDuration: z.coerce.number().min(0).optional(),
  // Vehicle details (creating new vehicle for each route for simplicity as per current pattern)
  vehicleType: z.enum(["BUS", "MINI_BUS", "LUXURY_COACH", "SIENNA", "HUMMER_BUS"]),
  vehiclePlate: z.string().min(2),
  vehicleCapacity: z.coerce.number().min(1),
  saveAsPopular: z.boolean().optional(),
});

export async function createCompanyRoute(formData: FormData) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'COMPANY_ADMIN') {
      return { error: "Unauthorized" };
  }

  if (!session.user.companyId) {
      return { error: "Your account is not linked to any company profile." };
  }

  const rawData = {
    originCity: formData.get("originCity"),
    originState: formData.get("originState"),
    destinationCity: formData.get("destinationCity"),
    destinationState: formData.get("destinationState"),
    price: formData.get("price"),
    departureTime: formData.get("departureTime"),
    estimatedDuration: formData.get("estimatedDuration"),
    vehicleType: formData.get("vehicleType"),
    vehiclePlate: formData.get("vehiclePlate"),
    vehicleCapacity: formData.get("vehicleCapacity"),
    saveAsPopular: formData.get("saveAsPopular") === "true",
  };

  const validatedFields = RouteSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: "Invalid fields: " + JSON.stringify(validatedFields.error.flatten()) };
  }

  const data = validatedFields.data;
  const companyId = session.user.companyId;

  try {
    await connectDB();

    // 1. Create Vehicle
    const vehicle = await Vehicle.create({
        type: data.vehicleType,
        plateNumber: data.vehiclePlate,
        capacity: data.vehicleCapacity,
        companyId: companyId,
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
        companyId: companyId,
        vehicleId: vehicle._id,
    });

    // 3. Create Template if requested
    if (data.saveAsPopular) {
        const templateName = `${data.originCity} to ${data.destinationCity} (${data.vehicleType})`;
        // Check if exists to avoid duplicates (optional, but good UX)
        const existing = await RouteTemplate.findOne({ 
            companyId, 
            originCity: data.originCity, 
            destinationCity: data.destinationCity,
            vehicleType: data.vehicleType 
        });

        if (!existing) {
            await RouteTemplate.create({
                name: templateName,
                originState: data.originState,
                originCity: data.originCity,
                destinationState: data.destinationState,
                destinationCity: data.destinationCity,
                price: data.price,
                vehicleType: data.vehicleType,
                vehicleCapacity: data.vehicleCapacity,
                companyId: companyId,
            });
        }
    }

  } catch (error) {
    console.error("Create Route Error:", error);
    return { error: "Failed to create route" };
  }

  revalidatePath("/company");
  redirect("/company");
}

export async function deleteCompanyRoute(routeId: string) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'COMPANY_ADMIN') {
        return { error: "Unauthorized" };
    }

    try {
        await connectDB();
        const route = await Route.findOne({ _id: routeId, companyId: session.user.companyId });
        
        if (!route) {
            return { error: "Route not found or unauthorized" };
        }

        // Optional: Delete associated vehicle if it was created just for this route
        // await Vehicle.findByIdAndDelete(route.vehicleId);

        await Route.findByIdAndDelete(routeId);
        revalidatePath("/admin/routes");
        revalidatePath("/company");
        return { success: true };
    } catch (error) {
        console.error("Delete Route Error:", error);
        return { error: "Failed to delete route" };
    }
}

export async function updateCompanyRoute(routeId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'COMPANY_ADMIN') {
        return { error: "Unauthorized" };
    }

    const rawData = {
        originCity: formData.get("originCity"),
        originState: formData.get("originState"),
        destinationCity: formData.get("destinationCity"),
        destinationState: formData.get("destinationState"),
        price: formData.get("price"),
        departureTime: formData.get("departureTime"),
        vehicleCapacity: formData.get("vehicleCapacity"),
        vehiclePlate: formData.get("vehiclePlate"),
        vehicleType: formData.get("vehicleType"),
    };

    // simplified validation for update
    const data = rawData; 

    try {
        await connectDB();
        const route = await Route.findOne({ _id: routeId, companyId: session.user.companyId });
        
        if (!route) {
            return { error: "Route not found or unauthorized" };
        }

        const newDepartureTime = new Date(data.departureTime as string);
        const oldDepartureTime = new Date(route.departureTime);

        // Check if the DAY has changed. If the day changes, we assume it's a new trip (recycling)
        // and we reset the bookings. If it's the same day (even if time changed), we keep bookings.
        if (!isSameDay(newDepartureTime, oldDepartureTime)) {
             // If we are moving a route to a new date, we assume old bookings are for the *old* trip.
             // We mark them as COMPLETED to free up seats for the new trip date.
             // We only touch pending/confirmed bookings.
             await Booking.updateMany(
                { 
                    routeId: route._id, 
                    status: { $in: ['PENDING', 'CONFIRMED'] } 
                },
                { status: 'COMPLETED' }
             );
        } else {
            // Logic: If date is NOT changing, we must ensure new capacity >= existing active bookings
            const activeBookingsCount = await Booking.countDocuments({
                routeId: route._id,
                status: { $in: ['CONFIRMED'] } 
            });

            if (Number(data.vehicleCapacity) < activeBookingsCount) {
                return { 
                    error: `Cannot reduce capacity to ${data.vehicleCapacity}. There are already ${activeBookingsCount} active bookings.` 
                };
            }
        }

        await Route.findByIdAndUpdate(routeId, {
            originCity: data.originCity,
            originState: data.originState,
            destinationCity: data.destinationCity,
            destinationState: data.destinationState,
            price: Number(data.price),
            departureTime: newDepartureTime,
        });

        // Update vehicle as well
        if (route.vehicleId) {
            await Vehicle.findByIdAndUpdate(route.vehicleId, {
                plateNumber: data.vehiclePlate,
                capacity: Number(data.vehicleCapacity),
                type: data.vehicleType,
            });
        }

        revalidatePath("/admin/routes");
        revalidatePath("/company");
        return { success: true };
    } catch (error) {
        console.error("Update Route Error:", error);
        return { error: "Failed to update route" };
    }
}

export async function getRouteTemplates() {
    const session = await auth();
    if (!session?.user?.companyId) return [];

    try {
        await connectDB();
        const templates = await RouteTemplate.find({ companyId: session.user.companyId }).sort({ createdAt: -1 });
        // Serialize for client component
        return JSON.parse(JSON.stringify(templates));
    } catch (error) {
        console.error("Fetch Templates Error:", error);
        return [];
    }
}

// --- Company Management Actions ---

export async function toggleCompanyVerification(companyId: string, isVerified: boolean) {
    const session = await auth();
    console.log(`[toggleCompanyVerification] User ${session?.user?.email} (Role: ${session?.user?.role}) attempting to set company ${companyId} to verified=${isVerified}`);

    if (session?.user?.role !== 'SUPER_ADMIN') {
        console.error("[toggleCompanyVerification] Unauthorized access attempt");
        return { error: "Unauthorized" };
    }

    try {
        await connectDB();
        const result = await TransportCompany.findByIdAndUpdate(
            companyId, 
            { $set: { isVerified: isVerified } },
            { new: true }
        );
        console.log(`[toggleCompanyVerification] Update result for ${companyId}: isVerified=${result?.isVerified}`);
        
        revalidatePath("/admin/companies");
        return { success: true };
    } catch (error) {
        console.error("Toggle Verification Error:", error);
        return { error: "Failed to update verification status" };
    }
}

export async function toggleCompanyActivation(companyId: string, isActive: boolean) {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') {
        return { error: "Unauthorized" };
    }

    try {
        await connectDB();
        await TransportCompany.findByIdAndUpdate(companyId, { isActive });
        revalidatePath("/admin/companies");
        return { success: true };
    } catch (error) {
        console.error("Toggle Activation Error:", error);
        return { error: "Failed to update activation status" };
    }
}

const CompanyUpdateSchema = z.object({
    name: z.string().min(2),
    contactInfo: z.string().min(5),
    description: z.string().optional(),
    logo: z.string().optional(),
});

export async function updateCompany(companyId: string, data: z.infer<typeof CompanyUpdateSchema>) {
    const session = await auth();
    
    // Authorization Check
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
    const isOwner = session?.user?.role === 'COMPANY_ADMIN' && session.user.companyId === companyId;

    if (!isSuperAdmin && !isOwner) {
        return { error: "Unauthorized" };
    }

    const validated = CompanyUpdateSchema.safeParse(data);
    if (!validated.success) {
        return { error: "Invalid data" };
    }

    try {
        await connectDB();
        const existingCompany = await TransportCompany.findById(companyId);

        // Logic check: If bank details are being updated (which are not in CompanyUpdateSchema yet, but should be managed)
        // Wait, CompanyUpdateSchema in this file only has name, contact, description, logo.
        // Bank details are in a separate schema or handled differently?
        // In `profile/page.tsx`, bank accounts are passed to `updateProfile` (User) then `updateCompany` (Company).
        // `updateProfile` calls `TransportCompany.findByIdAndUpdate` directly for bank accounts.
        // I need to intercept that logic in `actions/user.ts` OR update `updateCompany` to handle bank accounts too.
        
        // Let's modify `actions/user.ts` as that's where the profile page sends bank accounts for now.
        // AND/OR update `actions/company.ts` to expose a dedicated `updateCompanyBankDetails` action.
        
        // For this task step, I'll update the standard updateCompany fields.
        
        await TransportCompany.findByIdAndUpdate(companyId, {
            name: validated.data.name,
            contactInfo: validated.data.contactInfo,
            description: validated.data.description,
            logo: validated.data.logo,
        });

        revalidatePath("/admin/companies");
        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error("Update Company Error:", error);
        return { error: "Failed to update company details" };
    }
}

// --- Team Management Actions ---

const AddAdminSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

export async function getCompanyAdmins() {
    const session = await auth();
    if (!session?.user?.companyId) return [];
    
    if (session.user.role !== 'COMPANY_ADMIN') {
         return [];
    }

    try {
        await connectDB();
        const admins = await User.find({ 
            companyId: session.user.companyId,
            role: 'COMPANY_ADMIN' 
        }).sort({ createdAt: -1 });
        
        return JSON.parse(JSON.stringify(admins));
    } catch (error) {
        console.error("Fetch Company Admins Error:", error);
        return [];
    }
}

export async function addCompanyAdmin(formData: FormData) {
    const session = await auth();
    if (session?.user.role !== 'COMPANY_ADMIN' || !session.user.companyId) {
        return { error: "Unauthorized" };
    }

    const rawData = {
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
    };

    const validated = AddAdminSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: "Invalid fields" };
    }

    try {
        await connectDB();
        
        const existing = await User.findOne({ email: validated.data.email });
        if (existing) {
            return { error: "User with this email already exists" };
        }

        const hashedPassword = await bcrypt.hash(validated.data.password, 10);

        await User.create({
            name: validated.data.name,
            email: validated.data.email,
            password: hashedPassword,
            role: 'COMPANY_ADMIN',
            companyId: session.user.companyId,
        });

        revalidatePath("/admin/team");
        return { success: true };
    } catch (error) {
        console.error("Add Company Admin Error:", error);
        return { error: "Failed to add admin" };
    }
}

// Update Company Admin
const UpdateAdminSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().optional(),
});

export async function updateCompanyAdmin(adminId: string, formData: FormData) {
    const session = await auth();
    if (session?.user.role !== 'COMPANY_ADMIN' || !session.user.companyId) {
        return { error: "Unauthorized" };
    }

    const rawData = {
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password") || undefined, // undefined if empty string
    };

    const validated = UpdateAdminSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: "Invalid fields" };
    }

    try {
        await connectDB();
        
        // Ensure the admin belongs to the same company
        const adminToUpdate = await User.findOne({ 
            _id: adminId, 
            companyId: session.user.companyId,
            role: 'COMPANY_ADMIN'
        });

        if (!adminToUpdate) {
            return { error: "Admin not found or unauthorized" };
        }

        // Check if email is being changed and if it's already taken
        if (validated.data.email !== adminToUpdate.email) {
            const existing = await User.findOne({ email: validated.data.email });
            if (existing) {
                return { error: "Email already in use" };
            }
        }

        const updateData: any = {
            name: validated.data.name,
            email: validated.data.email,
        };

        if (validated.data.password && validated.data.password.length >= 6) {
            updateData.password = await bcrypt.hash(validated.data.password, 10);
        } else if (validated.data.password && validated.data.password.length > 0) {
            return { error: "Password must be at least 6 characters" };
        }

        await User.findByIdAndUpdate(adminId, updateData);
        revalidatePath("/admin/team");
        return { success: true };
    } catch (error) {
        console.error("Update Company Admin Error:", error);
        return { error: "Failed to update admin" };
    }
}

export async function removeCompanyAdmin(adminId: string) {
    const session = await auth();
    if (session?.user.role !== 'COMPANY_ADMIN' || !session.user.companyId) {
        return { error: "Unauthorized" };
    }

    if (adminId === session.user.id) {
        return { error: "You cannot remove yourself." };
    }

    try {
        await connectDB();
        const adminToDelete = await User.findOne({ 
            _id: adminId, 
            companyId: session.user.companyId,
            role: 'COMPANY_ADMIN'
        });

        if (!adminToDelete) {
            return { error: "Admin not found or unauthorized" };
        }

        await User.findByIdAndDelete(adminId);
        revalidatePath("/admin/team");
        return { success: true };
    } catch (error) {
        console.error("Remove Company Admin Error:", error);
        return { error: "Failed to remove admin" };
    }
}

// --- Super Admin Actions ---

export async function deleteTransportCompany(companyId: string) {
    const session = await auth();
    if (session?.user.role !== 'SUPER_ADMIN') {
        return { error: "Unauthorized" };
    }

    try {
        await connectDB();
        
        // 1. Find the company to ensure it exists
        const company = await TransportCompany.findById(companyId);
        if (!company) {
            return { error: "Company not found" };
        }

        // 2. Find all routes associated with this company
        const routes = await Route.find({ companyId });
        const routeIds = routes.map(r => r._id);

        // 3. Delete Bookings associated with these routes
        // (Bookings are linked to Route, not Company directly)
        if (routeIds.length > 0) {
            await Booking.deleteMany({ routeId: { $in: routeIds } });
        }

        // 4. Delete Routes
        await Route.deleteMany({ companyId });

        // 5. Delete Vehicles
        await Vehicle.deleteMany({ companyId });

        // 6. Delete Route Templates
        await RouteTemplate.deleteMany({ companyId });

        // 7. Delete Users (Company Admins) associated with this company
        await User.deleteMany({ companyId, role: 'COMPANY_ADMIN' });

        // 8. Delete the Company itself
        await TransportCompany.findByIdAndDelete(companyId);

        revalidatePath("/admin/companies");
        return { success: true };

    } catch (error) {
        console.error("Delete Company Error:", error);
        return { error: "Failed to delete company and related data" };
    }
}
