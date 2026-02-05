"use client";

import * as React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, LogOut, Settings, Menu, X } from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();
  const [pendingCount, setPendingCount] = React.useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    // Reset mobile menu on path change
    setIsMobileMenuOpen(false);

    // Check if user is admin
    if (session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'COMPANY_ADMIN') {
        
        // 1. Fetch current pending count from server
        fetch('/api/admin/pending-count')
            .then(res => res.json())
            .then(data => {
                const serverCount = data.count || 0;
                const lastSeenCount = parseInt(localStorage.getItem('adminLastSeenCount') || '0', 10);
                
                if (pathname.startsWith('/admin')) {
                    localStorage.setItem('adminLastSeenCount', serverCount.toString());
                    setPendingCount(0); 
                } else {
                    const unread = Math.max(0, serverCount - lastSeenCount);
                    setPendingCount(unread);
                    if (serverCount < lastSeenCount) {
                        localStorage.setItem('adminLastSeenCount', serverCount.toString());
                    }
                }
            })
            .catch(err => console.error("Failed to fetch pending count", err));
    }
  }, [session, pathname]);

  // Hide Navbar on admin pages
  if (pathname.startsWith('/admin')) {
      return null;
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const NavContent = () => (
      <>
        <Link href="/routes" className="text-sm font-medium hover:underline py-2 md:py-0">
            Routes
        </Link>
        
        {(session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'COMPANY_ADMIN') && (
            <Link href="/admin" className="text-sm font-medium hover:underline flex items-center gap-1 relative py-2 md:py-0">
                Dashboard
                {pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full -mt-2 -ml-1">
                        {pendingCount}
                    </span>
                )}
            </Link>
        )}

        {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
        ) : session?.user ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer py-2 md:py-0">
                     <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                            <AvatarFallback>{session.user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                     </Button>
                     <span className="md:hidden text-sm font-medium">Account</span>
                 </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </Link>
                </DropdownMenuItem>
                {(session.user.role === 'SUPER_ADMIN' || session.user.role === 'COMPANY_ADMIN') && (
                     <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        ) : (
            <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
              <Link href="/login" className="w-full md:w-auto">
                <Button variant="ghost" className="w-full md:w-auto">Log in</Button>
              </Link>
              <Link href="/signup" className="w-full md:w-auto">
                <Button className="w-full md:w-auto">Sign Up</Button>
              </Link>
            </div>
        )}
      </>
  );

  return (
    <header className="border-b bg-white top-0 sticky z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-2xl text-primary z-50">
          TransportNG
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-4">
            <NavContent />
        </nav>

        {/* Mobile Toggle */}
        <div className="md:hidden z-50">
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
        </div>

        {/* Mobile Overlay Menu */}
        {isMobileMenuOpen && (
             <div className="fixed inset-0 top-16 bg-white z-40 p-4 border-t flex flex-col gap-4 animate-in slide-in-from-top-2 md:hidden">
                <NavContent />
             </div>
        )}
      </div>
    </header>
  );
}
