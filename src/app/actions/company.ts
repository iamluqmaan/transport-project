'use server'

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Route from "@/models/Route";
import Vehicle from "@/models/Vehicle";
import RouteTemplate from "@/models/RouteTemplate";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

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

        await Route.findByIdAndUpdate(routeId, {
            originCity: data.originCity,
            originState: data.originState,
            destinationCity: data.destinationCity,
            destinationState: data.destinationState,
            price: Number(data.price),
            departureTime: new Date(data.departureTime as string),
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
