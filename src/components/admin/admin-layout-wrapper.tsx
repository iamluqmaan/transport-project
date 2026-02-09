"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Building2, 
  Map, 
  Home,
  Users,
  Ticket,
  Banknote,
  Menu,
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
  userRole: string;
}

export function AdminLayoutWrapper({ children, userRole }: AdminLayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleCollapse = () => {
      setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["SUPER_ADMIN", "COMPANY_ADMIN"],
    },
    {
      href: "/admin/team",
      label: "Team",
      icon: Users,
      roles: ["COMPANY_ADMIN"],
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
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
                <Home className="h-5 w-5" />
                Admin Panel
            </Link>
        </div>
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
          "bg-white shadow-md fixed h-full z-30 transition-all duration-300 ease-in-out pt-16 md:pt-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "w-64 md:w-20" : "w-64"
        )}
      >
        <div className={cn("hidden md:flex items-center border-b h-16 px-4", isCollapsed ? "justify-center" : "justify-between")}>
          <Link href="/" className={cn("text-xl font-bold text-primary flex items-center gap-2 whitespace-nowrap overflow-hidden transition-all duration-300", isCollapsed ? "md:w-0 md:opacity-0" : "md:w-auto md:opacity-100")}>
            <Home className="h-5 w-5 flex-shrink-0" />
            Admin Panel
          </Link>
         
          <Button variant="ghost" size="icon" onClick={toggleCollapse} className="hidden md:flex flex-shrink-0 ml-auto">
                {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
        
        <div className="md:hidden p-4 border-b bg-gray-50">
             <p className="text-sm font-medium text-gray-500">
                Logged in as: {userRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Company Admin'}
            </p>
        </div>
        
        <nav className="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)] mt-4">
          {navItems.map((item) => {
             if (!item.roles.includes(userRole)) return null;
             
             const isActive = pathname === item.href;
             
             return (
               <Link 
                 key={item.href}
                 href={item.href} 
                 onClick={closeSidebar}
                 className={cn(
                   "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                   isActive 
                     ? "bg-primary text-white" 
                     : "text-gray-700 hover:bg-gray-100",
                    isCollapsed ? "md:justify-center" : ""
                 )}
                 title={isCollapsed ? item.label : undefined}
               >
                 <item.icon className="h-5 w-5 flex-shrink-0" />
                 <span className={cn("whitespace-nowrap overflow-hidden transition-all duration-100", isCollapsed ? "md:hidden" : "block")}>{item.label}</span>
               </Link>
             );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t bg-white">
          <Link 
            href="/" 
            className={cn(
                "flex items-center gap-3 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap overflow-hidden",
                isCollapsed ? "md:justify-center md:px-2" : ""
            )}
            title="Return to Homepage"
          >
            <Home className="h-5 w-5 flex-shrink-0" />
            <span className={cn("transition-all duration-100", isCollapsed ? "md:hidden" : "block")}>Return to Homepage</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
          "flex-1 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300 overflow-x-hidden",
          isCollapsed ? "md:pl-20" : "md:pl-64"
      )}>
        {pathname !== '/admin' && (
            <Button 
                variant="ghost" 
                className="mb-4 pl-0 hover:bg-transparent hover:text-primary gap-2" 
                onClick={() => router.back()}
            >
                <ArrowLeft className="h-4 w-4" /> Back
            </Button>
        )}
        {children}
      </main>
    </div>
  );
}
