import Link from "next/link";
import { LayoutDashboard, Bus, MapPin, Calendar, Settings, LogOut } from "lucide-react";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="h-14 flex items-center px-6 border-b">
           <span className="font-bold text-lg text-primary">GIG Motors</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           <Link href="/company" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
           </Link>
           <Link href="/company/routes" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
              <MapPin className="h-4 w-4" /> Routes & Pricing
           </Link>
           <Link href="/company/vehicles" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
              <Bus className="h-4 w-4" /> Fleet / Vehicles
           </Link>
           <Link href="/company/bookings" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
              <Calendar className="h-4 w-4" /> Bookings
           </Link>
           <Link href="/company/settings" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
              <Settings className="h-4 w-4" /> Company Profile
           </Link>
        </nav>
        <div className="p-4 border-t">
           <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 w-full hover:bg-red-50 rounded-md">
              <LogOut className="h-4 w-4" /> Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
         {children}
      </main>
    </div>
  );
}
