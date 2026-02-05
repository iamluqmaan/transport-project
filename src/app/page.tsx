import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchForm } from "@/components/search-form";
import { Search, MapPin, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
// Import models to ensure they are registered with Mongoose
import Booking from "@/models/Booking";
import TransportCompany from "@/models/TransportCompany";
import Vehicle from "@/models/Vehicle";
import Route from "@/models/Route";

export const dynamic = 'force-dynamic';

// Fallback routes if no bookings exist
const FALLBACK_ROUTES = [
    { originCity: "Lagos", destinationCity: "Abuja" },
    { originCity: "Lagos", destinationCity: "Port Harcourt" },
    { originCity: "Abuja", destinationCity: "Jos" },
    { originCity: "Ibadan", destinationCity: "Lagos" },
    { originCity: "Enugu", destinationCity: "Onitsha" },
    { originCity: "Lagos", destinationCity: "Benin" },
];

async function getPopularRoutes() {
    await connectDB();
    const session = await auth();
    let routePairs: { originCity: string, destinationCity: string }[] = [];

    // 1. Personalized: Get recent routes for logged-in user
    if (session?.user?.id) {
        const recentBookings = await Booking.find({ userId: session.user.id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('routeId');
        
        const recentPairs = recentBookings
            .map((b: any) => b.routeId)
            .filter((r: any) => r && r.originCity && r.destinationCity) // Ensure route data exists
            .map((r: any) => ({
                originCity: r.originCity,
                destinationCity: r.destinationCity
            }));
        
        // Deduplicate
        const uniqueRecent = recentPairs.filter((route, index, self) =>
            index === self.findIndex((t) => (
                t.originCity === route.originCity && t.destinationCity === route.destinationCity
            ))
        );
        
        routePairs = [...uniqueRecent];
    }

    // 2. Global: Top booked routes (if we need more to fill up to 6)
    if (routePairs.length < 6) {
        // Aggregate bookings to find most frequent routeId
        const topRoutes = await Booking.aggregate([
            { $group: { _id: "$routeId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $lookup: { from: "routes", localField: "_id", foreignField: "_id", as: "routeInfo" } },
            { $unwind: "$routeInfo" }
        ]);

        const globalPairs = topRoutes.map((item: any) => ({
            originCity: item.routeInfo.originCity,
            destinationCity: item.routeInfo.destinationCity
        }));

        // Merge and deduplicate
        for (const pair of globalPairs) {
            if (routePairs.length >= 6) break;
            const exists = routePairs.some(r => r.originCity === pair.originCity && r.destinationCity === pair.destinationCity);
            if (!exists) {
                routePairs.push(pair);
            }
        }
    }

    // 3. Fallback: Fill identifying gaps
    for (const pair of FALLBACK_ROUTES) {
        if (routePairs.length >= 6) break;
        const exists = routePairs.some(r => r.originCity === pair.originCity && r.destinationCity === pair.destinationCity);
        if (!exists) {
            routePairs.push(pair);
        }
    }

    // 4. Enrich: Fetch cheapest upcoming route for each pair
    const enrichedRoutes = [];
    const now = new Date();

    for (const pair of routePairs) {
        const cheapestRoutes = await Route.find({
            originCity: pair.originCity,
            destinationCity: pair.destinationCity,
            departureTime: { $gt: now }
        })
        .sort({ price: 1 }) // Cheapest first
        .limit(1)
        .populate('companyId')
        .populate('vehicleId')
        .lean();

        const cheapestRoute: any = cheapestRoutes[0];

        if (cheapestRoute) {
            // Calculate available seats
            const bookedSeats = await Booking.countDocuments({
                routeId: cheapestRoute._id,
                status: { $in: ["CONFIRMED"] }
            });
            const capacity = cheapestRoute.vehicleId?.capacity || 14;
            const availableSeats = Math.max(0, capacity - bookedSeats);

            enrichedRoutes.push({
                from: cheapestRoute.originCity,
                to: cheapestRoute.destinationCity,
                price: cheapestRoute.price.toLocaleString(),
                company: (cheapestRoute.companyId as any)?.name || "Transport Company",
                vehicle: (cheapestRoute.vehicleId as any)?.type || "Bus",
                id: cheapestRoute._id.toString(),
                availableSeats: availableSeats,
                departureTime: cheapestRoute.departureTime // Add departure time
            });
        }
    }

    return enrichedRoutes;
}

export default async function Home() {
  const routes = await getPopularRoutes();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-primary py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-700 to-indigo-900 opacity-90" />
        <div className="container relative z-10 mx-auto px-4 md:px-6 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
            Travel Across Nigeria <br className="hidden md:block" />
            <span className="text-yellow-400">With Ease & Comfort</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mb-10">
            Book interstate bus tickets, luxury coaches, and private shuttles from top transport companies. Reliable, safe, and fast.
          </p>

          {/* Search Box Component */}
          <SearchForm />
        </div>
      </section>

      {/* Popular Routes Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Popular Routes</h2>
            <Link href="/routes" className="text-primary font-medium hover:underline">
              View all routes
            </Link>
          </div>

          {routes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {routes.map((route, idx) => {
                  const isFullyBooked = (route as any).availableSeats === 0;
                  // For popular routes, we might not have exact date object if it was serialized?
                  // route.departureTime is not in the enriched object currently! 
                  // I need to check `getPopularRoutes` return type.
                  // It returns { from, to, price, company, vehicle, id, availableSeats }. 
                  // It DOES NOT return departureTime. 
                  // I need to add departureTime to `getPopularRoutes` return first if I want to check it here.
                  // But `getPopularRoutes` filters `departureTime: { $gt: now }`. So they are ALWAYS future.
                  // So I don't need to check "Past" for popular routes on homepage.
                  // Just "Fully Booked".
                  // However, if I want to be safe, I should add departureTime to the return object.
                  
                  const CardContent = (
                    <div className={`group bg-white rounded-lg border shadow-sm transition-all overflow-hidden h-full ${isFullyBooked ? 'opacity-75 grayscale' : 'hover:shadow-md cursor-pointer'}`}>
                        {/* ... (existing card content) */}
                        <div className="h-32 bg-gray-200 relative">
                        {/* Placeholder for Map/Image */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-300">
                            <MapPin className="h-12 w-12 opacity-20" />
                        </div>
                        <div className="absolute bottom-3 left-4 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-gray-700">
                            {route.company}
                        </div>
                        </div>
                        <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                            <p className="text-sm text-gray-500">From</p>
                            <p className="font-bold text-lg">{route.from}</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-300" />
                            <div className="text-right">
                            <p className="text-sm text-gray-500">To</p>
                            <p className="font-bold text-lg">{route.to}</p>
                            </div>
                        </div>
                        <div className="border-t pt-4 flex items-center justify-between">
                            <div className="flex gap-2">
                                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{route.vehicle}</span>
                                {isFullyBooked ? (
                                    <span className="text-sm px-2 py-1 rounded font-medium bg-gray-200 text-gray-600">
                                        Fully Booked
                                    </span>
                                ) : (
                                    <span className={`text-sm px-2 py-1 rounded font-medium ${(route as any).availableSeats < 5 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {(route as any).availableSeats} seats left
                                    </span>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 mb-1">Starts from</p>
                                <p className="font-bold text-primary text-xl">₦{route.price}</p>
                            </div>
                        </div>
                        
                        {/* Departure Time Display */}
                        <div className="mt-4 pt-3 border-t text-sm text-gray-600 flex items-center gap-2">
                             <Calendar className="h-4 w-4 text-primary" />
                             <span>
                                {(route as any).departureTime ? 
                                    (
                                        <>
                                            <span className="font-medium">{format(new Date((route as any).departureTime), 'MMM d, yyyy')}</span> at <span className="font-medium">{format(new Date((route as any).departureTime), 'h:mm a')}</span>
                                        </>
                                    ) : (
                                        "Multiple Schedules"
                                    )
                                }
                             </span>
                        </div>
                        </div>
                    </div>
                  );

                  return isFullyBooked ? (
                      <div key={idx} className="h-full cursor-not-allowed hidden md:block">
                          {CardContent}
                      </div>
                  ) : (
                    <Link href={`/routes?from=${route.from}&to=${route.to}`} key={idx} className="h-full block">
                        {CardContent}
                    </Link>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-lg border">
                <p className="text-gray-500">No popular routes found currently available.</p>
                <Link href="/routes">
                    <Button variant="link">Browse all routes</Button>
                </Link>
            </div>
          )}
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-12">Why Book with TransportNG?</h2>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="p-6">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Compare & Save</h3>
                    <p className="text-gray-600">Compare prices and schedules from all major transport companies in one place.</p>
                </div>
                 <div className="p-6">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-8 w-8" />
                    </div>
                     <h3 className="text-xl font-bold mb-2">Instant Booking</h3>
                    <p className="text-gray-600">Secure your seat in advance. No more waiting at the park for hours.</p>
                </div>
                 <div className="p-6">
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="h-8 w-8" />
                    </div>
                     <h3 className="text-xl font-bold mb-2">Nationwide Coverage</h3>
                    <p className="text-gray-600">From Lagos to Borno, we connect you to every state in Nigeria.</p>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
}
