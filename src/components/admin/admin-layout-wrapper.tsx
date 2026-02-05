"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Building2, 
  Map, 
  LogOut,
  Users,
  Ticket,
  Banknote,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
  userRole: string;
}

export function AdminLayoutWrapper({ children, userRole }: AdminLayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const navItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["SUPER_ADMIN", "COMPANY_ADMIN"],
    },
    {
      href: "/admin/companies",
      label: "Transport Companies",
      icon: Building2,
      roles: ["SUPER_ADMIN"],
    },
    {
      href: "/admin/routes",
      label: "Routes Management",
      icon: Map,
      roles: ["SUPER_ADMIN", "COMPANY_ADMIN"],
    },
    {
      href: "/admin/users",
      label: "Users & Admins",
      icon: Users,
      roles: ["SUPER_ADMIN"],
    },
    {
      href: "/admin/finance",
      label: "Finance & Commission",
      icon: Banknote,
      roles: ["SUPER_ADMIN"],
    },
    {
      href: "/admin/bookings",
      label: "Booking Management",
      icon: Ticket,
      roles: ["SUPER_ADMIN", "COMPANY_ADMIN"],
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-30 flex items-center justify-between px-4 shadow-sm">
        <div className="font-bold text-lg text-primary">Admin Panel</div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white shadow-md fixed h-full z-30 w-64 transition-transform duration-300 ease-in-out md:translate-x-0 pt-16 md:pt-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="hidden md:block p-6 border-b">
          <Link href="/admin" className="text-xl font-bold text-primary flex items-center gap-2">
            Admin Panel
          </Link>
          <p className="text-xs text-gray-500 mt-1">
            {userRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Company Admin'}
          </p>
        </div>
        
        <div className="md:hidden p-4 border-b bg-gray-50">
             <p className="text-sm font-medium text-gray-500">
                Logged in as: {userRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Company Admin'}
            </p>
        </div>
        
        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => {
             if (!item.roles.includes(userRole)) return null;
             
             const isActive = pathname === item.href;
             
             return (
               <Link 
                 key={item.href}
                 href={item.href} 
                 onClick={closeSidebar}
                 className={cn(
                   "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                   isActive 
                     ? "bg-primary text-white" 
                     : "text-gray-700 hover:bg-gray-100"
                 )}
               >
                 <item.icon className="h-5 w-5" />
                 {item.label}
               </Link>
             );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t bg-white">
           <Link href="/" className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="h-5 w-5" />
            Exit to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 md:ml-64 w-full transition-all">
        {children}
      </main>
    </div>
  );
}
