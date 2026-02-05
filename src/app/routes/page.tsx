import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Search, Filter, Clock, Bus, Wallet, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import connectDB from "@/lib/db";
import Route from "@/models/Route";
import TransportCompany from "@/models/TransportCompany";
import "@/models/Vehicle";
import Booking from "@/models/Booking";
import { format } from "date-fns";
import { RouteFilters } from "./route-filters";
import { RouteSorter } from "./route-sorter";

export const dynamic = 'force-dynamic';

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; date?: string; price?: string; companyId?: string; sort?: string }>;
}) {
  const { from, to, date, price, companyId, sort } = await searchParams;

  const whereClause: any = {};
  
  // Search Filters
  if (from) {
    whereClause.$or = [
      { originCity: { $regex: from, $options: 'i' } },
      { originState: { $regex: from, $options: 'i' } }
    ];
  }
  if (to) {
    whereClause.$and = whereClause.$and || [];
    whereClause.$and.push({
      $or: [
        { destinationCity: { $regex: to, $options: 'i' } },
        { destinationState: { $regex: to, $options: 'i' } }
      ]
    });
  }
  
  if (date) {
    const searchDate = new Date(date);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    whereClause.departureTime = {
      $gte: searchDate,
      $lt: nextDay,
    };
  }

  // Sidebar Filters
  if (companyId) {
    const companyIds = companyId.split(",");
    if (companyIds.length > 0) {
      whereClause.companyId = { $in: companyIds };
    }
  }

  if (price) {
    const priceRanges = price.split(",");
    const priceQueries = priceRanges.map(range => {
      if (range === "0-5000") return { price: { $gte: 0, $lte: 5000 } };
      if (range === "5000-15000") return { price: { $gt: 5000, $lte: 15000 } };
      if (range === "15000-40000") return { price: { $gt: 15000, $lte: 40000 } };
      if (range === "40000-plus") return { price: { $gt: 40000 } };
      return null;
    }).filter(q => q !== null);

    if (priceQueries.length > 0) {
      if (whereClause.$or) {
         whereClause.$and = whereClause.$and || [];
         whereClause.$and.push({ $or: priceQueries });
      } else {
        whereClause.$or = priceQueries;
      }
    }
  }

  // Sorting Logic
  const sortOption: any = {};
  if (sort === "price_asc") {
    sortOption.price = 1;
  } else if (sort === "duration_asc") {
    sortOption.estimatedDuration = 1;
  } else if (sort === "departure_asc") {
    sortOption.departureTime = 1; 
  } else {
    // Default
    sortOption.price = 1;
  }


  await connectDB();
  
  // Fetch Companies for Sidebar
  const companies = await TransportCompany.find({ isActive: true }).select('name _id').lean();
  const serializedCompanies = companies.map((c: any) => ({
      ...c,
      _id: c._id.toString()
  }));

  const rawRoutes = await Route.find(whereClause)
    .populate('companyId')
    .populate('vehicleId')
    .sort(sortOption)
    .lean();

  const routes = await Promise.all(rawRoutes.map(async (r: any) => {
    // Calculate available seats
    const bookedSeats = await Booking.countDocuments({
        routeId: r._id,
        status: { $in: ["CONFIRMED"] } // Only confirmed bookings take up seats
    });
    
    // Default cap if vehicle missing (shouldn't happen with proper relations)
    const capacity = r.vehicleId?.capacity || 14; 
    const availableSeats = Math.max(0, capacity - bookedSeats);

    return {
        ...r,
        id: r._id.toString(),
        company: { ...r.companyId, id: r.companyId._id.toString() },
        vehicle: { ...r.vehicleId, id: r.vehicleId._id.toString() },
        availableSeats
    };
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <RouteFilters companies={serializedCompanies} />

        {/* Results Area */}
        <main className="flex-1">
          <div className="mb-6 bg-white p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <h1 className="text-xl font-bold">Available Routes <span className="text-gray-500 font-normal text-sm ml-2">{routes.length} results found</span></h1>
             <RouteSorter />
          </div>

          <div className="space-y-4">
            {/* Route Cards */}
            {routes.map((route) => {
              const isFullyBooked = route.availableSeats === 0;
              const isPast = new Date(route.departureTime) < new Date();
              const isDisabled = isFullyBooked || isPast;

              return (
              <div key={route.id} className={`bg-white p-4 rounded-lg border shadow-sm transition-shadow flex flex-col md:flex-row justify-between items-center gap-4 ${isDisabled ? 'opacity-75 grayscale bg-gray-50' : 'hover:shadow-md'}`}>
                <div className="flex items-start gap-4 flex-1">
                   <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs text-center p-1 break-words">
                      {route.company.name}
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                         <h3 className="font-bold text-lg">{format(new Date(route.departureTime), 'hh:mm a')}</h3>
                         <span className="text-gray-400 text-sm">→</span>
                         <h3 className="font-bold text-lg text-gray-500">
                            {format(new Date(new Date(route.departureTime).getTime() + (route.estimatedDuration || 0) * 60000), 'hh:mm a')}
                         </h3>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{route.originCity} ({route.originState})</span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{route.destinationCity} ({route.destinationState})</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {Math.floor((route.estimatedDuration || 0) / 60)}h {(route.estimatedDuration || 0) % 60}m • Direct • {route.vehicle.type}
                      </p>
                       <div className="flex items-center gap-2">
                         <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{route.vehicle.plateNumber}</span>
                         <span className="text-xs bg-green-100 px-2 py-1 rounded text-green-600">AC</span>
                         {isPast ? (
                             <span className="text-xs px-2 py-1 rounded font-medium bg-amber-100 text-amber-700">
                                Departed
                             </span>
                         ) : isFullyBooked ? (
                            <span className="text-xs px-2 py-1 rounded font-medium bg-gray-200 text-gray-600">
                                Fully Booked
                            </span>
                         ) : (
                            <span className={`text-xs px-2 py-1 rounded font-medium ${route.availableSeats < 5 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                {route.availableSeats} seats left
                            </span>
                         )}
                       </div>
                   </div>
                </div>
                
                <div className="text-right flex flex-col items-end gap-2 min-w-[120px]">
                   <span className="text-2xl font-bold text-primary">₦{route.price.toLocaleString()}</span>
                   <p className="text-xs text-gray-500">per seat</p>
                   {isDisabled ? (
                       <Button disabled variant="secondary" className="w-full">
                           {isPast ? "Departed" : "Sold Out"}
                       </Button>
                   ) : (
                       <Link href={`/routes/${route.id}/booking`}>
                           <Button className="w-full">Book Trip</Button>
                       </Link>
                   )}
                </div>
              </div>
            );
            })}
            
            {routes.length === 0 && (
                <div className="flex flex-col items-center justify-center bg-white p-12 rounded-lg border border-dashed shadow-sm text-center">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No routes found</h3>
                    <p className="text-gray-500 max-w-sm mb-6">
                        We couldn't find any trips matching your search criteria. Try adjusting your filters or search for a different date.
                    </p>
                    <Link href="/">
                        <Button variant="outline">Back to Home</Button>
                    </Link>
                </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
