import Link from "next/link"
import { Button } from "./ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2 font-bold text-xl">
            <span className="text-primary">TransportNG</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Home
            </Link>
            <Link href="/routes" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Routes
            </Link>
            <Link href="/companies" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Companies
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
             <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Sign up</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
