import { auth } from "@/auth";
import connectDB from "@/lib/db";
import RouteForm from "@/components/company/RouteForm";
import { getRouteTemplates } from "@/app/actions/company";
import Route from "@/models/Route";

export const dynamic = 'force-dynamic';

export default async function NewRoutePage({
    searchParams,
  }: {
    searchParams: Promise<{ sourceId?: string }>;
  }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'COMPANY_ADMIN') {
      return <div>Unauthorized</div>;
  }

  const { sourceId } = await searchParams;
  const templates = await getRouteTemplates();
  
  let initialValues = null;

  if (sourceId) {
      await connectDB();
      // Fetch the source route to duplicate/reschedule
      const sourceRoute = await Route.findOne({ 
          _id: sourceId, 
          companyId: session.user.companyId 
      }).populate('vehicleId');

      if (sourceRoute) {
          initialValues = {
              originCity: sourceRoute.originCity,
              originState: sourceRoute.originState,
              destinationCity: sourceRoute.destinationCity,
              destinationState: sourceRoute.destinationState,
              price: sourceRoute.price,
              vehicleType: sourceRoute.vehicleId?.type || "BUS",
              vehiclePlate: sourceRoute.vehicleId?.plateNumber || "",
              vehicleCapacity: sourceRoute.vehicleId?.capacity || 14,
          };
      }
  }

  return <RouteForm templates={templates} initialValues={initialValues} />;
}
