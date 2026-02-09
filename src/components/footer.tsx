"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Mail, MessageSquare } from "lucide-react";

export function Footer() {
    const pathname = usePathname();

    // Hide Footer on admin pages
    if (pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand & Description */}
                    <div className="space-y-4">
                        <Link href="/" className="font-bold text-2xl text-white">
                            TransportNG
                        </Link>
                        <p className="text-sm text-gray-400">
                            Nigeria's leading marketplace for interstate and intrastate travel tickets. Safe, reliable, and convenient booking.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            </li>
                            <li>
                                <Link href="/routes" className="hover:text-white transition-colors">Browse Routes</Link>
                            </li>
                            <li>
                                <Link href="/login" className="hover:text-white transition-colors">Login</Link>
                            </li>
                            <li>
                                <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact & Customer Service */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Customer Service</h3>
                        <p className="text-sm text-gray-400">
                            Need help? Our support team is available to assist you with complaints and enquiries.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-primary" />
                                <a href="tel:+2347037434688" className="hover:text-white transition-colors">
                                    +234 703 743 4688
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <MessageSquare className="h-5 w-5 text-green-500" />
                                <a 
                                    href="https://wa.me/2347037434688" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:text-white transition-colors"
                                >
                                    Chat on WhatsApp
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-blue-400" />
                                <a href="mailto:support@transportng.com" className="hover:text-white transition-colors">
                                    support@transportng.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} TransportNG. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
