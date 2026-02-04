import connectDB from "@/lib/db";
import Route from "@/models/Route";
import "@/models/Vehicle"; // Import to register schema
import { EditRouteForm } from "@/components/edit-route-form";
import { notFound } from "next/navigation";
import { Types } from "mongoose";

interface LeanRoute {
    _id: Types.ObjectId;
    vehicleId: {
        _id: Types.ObjectId;
        type: string;
        plateNumber: string;
        capacity: number;
        [key: string]: any;
    };
    departureTime: Date;
    originCity: string;
    originState: string;
    destinationCity: string;
    destinationState: string;
    price: number;
    createdAt: Date;
    updatedAt: Date;
    [key: string]: any;
}

export default async function EditRoutePage({ params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  
  try {
      const route = await Route.findById(id).populate("vehicleId").lean() as unknown as LeanRoute | null;

      if (!route) {
        notFound();
      }
      
      // Transform to plain object to pass to client component, specifically _id and dates.
      // We manually construct this to avoid passing non-serializable Mongoose internals (like buffers or complex objects)
      const initialData = {
          _id: route._id.toString(),
          originCity: route.originCity,
          originState: route.originState,
          destinationCity: route.destinationCity,
          destinationState: route.destinationState,
          price: route.price,
          departureTime: route.departureTime.toISOString(),
          vehicle: {
              _id: route.vehicleId._id.toString(),
              type: route.vehicleId.type,
              plateNumber: route.vehicleId.plateNumber,
              capacity: route.vehicleId.capacity,
          },
      };
      
      return (
        <div className="max-w-2xl mx-auto py-10 px-4">
          <h1 className="text-2xl font-bold mb-6">Edit Trip</h1>
          <EditRouteForm routeId={id} initialData={initialData as any} />
        </div>
      );
  } catch (error) {
      console.error("Error fetching route:", error);
      notFound();
  }
}
