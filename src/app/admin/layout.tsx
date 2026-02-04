import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  LayoutDashboard, 
  Building2, 
  Map, 
  LogOut,
  Users,
  Ticket,
  Banknote
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Role verification
  if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'COMPANY_ADMIN')) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md fixed h-full z-10">
        <div className="p-6 border-b">
          <Link href="/admin" className="text-xl font-bold text-primary flex items-center gap-2">
            Admin Panel
          </Link>
          <p className="text-xs text-gray-500 mt-1">
            {session.user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Company Admin'}
          </p>
        </div>
        
        <nav className="p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          
          {session.user.role === 'SUPER_ADMIN' && (
            <Link href="/admin/companies" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Building2 className="h-5 w-5" />
                Transport Companies
            </Link>
          )}

          <Link href="/admin/routes" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Map className="h-5 w-5" />
            Routes Management
          </Link>
          
          {session.user.role === 'SUPER_ADMIN' && (
             <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Users className="h-5 w-5" />
                Users & Admins
            </Link>
          )}
          
          {session.user.role === 'SUPER_ADMIN' && (
             <Link href="/admin/finance" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Banknote className="h-5 w-5" />
                Finance & Commission
            </Link>
          )}

          <Link href="/admin/bookings" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Ticket className="h-5 w-5" />
            Booking Management
          </Link>
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t">
           <Link href="/" className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="h-5 w-5" />
            Exit to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
