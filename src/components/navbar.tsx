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
import { Loader2, User, LogOut, Settings } from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();
  const [pendingCount, setPendingCount] = React.useState(0);
  const pathname = usePathname();

  React.useEffect(() => {
    // Check if user is admin
    if (session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'COMPANY_ADMIN') {
        
        // 1. Fetch current pending count from server
        fetch('/api/admin/pending-count')
            .then(res => res.json())
            .then(data => {
                const serverCount = data.count || 0;
                
                // 2. Get last seen count from local storage
                const lastSeenCount = parseInt(localStorage.getItem('adminLastSeenCount') || '0', 10);
                
                // 3. Logic:
                // If on dashboard, update last seen to match server (read all)
                // Else, show difference (newly arrived)
                
                if (pathname.startsWith('/admin')) {
                    // We are reading them now
                    localStorage.setItem('adminLastSeenCount', serverCount.toString());
                    setPendingCount(0); 
                } else {
                    // Calculate unread
                    // If serverCount < lastSeenCount (maybe some were approved), reset baseline? 
                    // Actually simple approach: 
                    // If serverCount > lastSeenCount, show (serverCount - lastSeenCount)
                    // If serverCount <= lastSeenCount, show 0 (all read)
                    const unread = Math.max(0, serverCount - lastSeenCount);
                    setPendingCount(unread);
                    
                    // Edge case: If bookings were processed elsewhere (or reset), 
                    // and serverCount dropped below lastSeen, we should probably sync down slightly?
                    // But for now, just hiding badge is correct behavior (0 unread).
                    // However, if we don't update lastSeen, next time a booking comes (serverCount + 1), 
                    // it might still be less than old lastSeen? 
                    // Better: If serverCount < lastSeenCount, it means we processed items. 
                    // Sync lastSeen to serverCount automatically to reset the baseline.
                    if (serverCount < lastSeenCount) {
                        localStorage.setItem('adminLastSeenCount', serverCount.toString());
                    }
                }
            })
            .catch(err => console.error("Failed to fetch pending count", err));
    }
  }, [session, pathname]); // Re-run on path change logic is handled by re-rendering component or explicit listener? 
  // Navbar re-renders on route change in Next.js? Not necessarily if it's in Layout. 
  // We need to listen to pathname changes. But usePathname hook is better.

  // NOTE: In Next.js App Router client components, we should use usePathname from navigation
  // But I am using window.location above which is not reactive. I need to import usePathname.
  
  // Hide Navbar on admin pages to avoid double header
  if (pathname.startsWith('/admin')) {
      return null;
  }

  return (
    <header className="border-b bg-white top-0 sticky z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-2xl text-primary">
          TransportNG
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/routes" className="text-sm font-medium hover:underline">
            Routes
          </Link>
          
          {(session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'COMPANY_ADMIN') && (
            <Link href="/admin" className="text-sm font-medium hover:underline flex items-center gap-1 relative">
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
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                    <AvatarFallback>{session.user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
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
                {/* Show Admin Link if user is admin */}
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
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
