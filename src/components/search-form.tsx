"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Calendar, ArrowRight, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchForm() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!from && !to && !date) {
        alert("Please enter at least one search criteria (From, To, or Date)");
        return;
    }
    
    setIsSearching(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (date) params.set("date", date);
    
    router.push(`/routes?${params.toString()}`);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col lg:flex-row gap-4 items-center relative z-20">
        <div className="flex-1 w-full relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input 
                placeholder="Traveling From (e.g. Lagos)" 
                className="pl-12 h-14 text-lg border-gray-200 focus:border-primary focus:ring-primary rounded-xl" 
                value={from}
                onChange={(e) => setFrom(e.target.value)}
            />
        </div>
        
        <div className="hidden lg:block text-gray-300">
            <ArrowRight className="h-6 w-6" />
        </div>
        <div className="lg:hidden text-gray-300 transform rotate-90">
            <ArrowRight className="h-6 w-6" />
        </div>

        <div className="flex-1 w-full relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input 
                placeholder="Traveling To (e.g. Abuja)" 
                className="pl-12 h-14 text-lg border-gray-200 focus:border-primary focus:ring-primary rounded-xl"
                value={to}
                onChange={(e) => setTo(e.target.value)}
            />
        </div>
        
        <div className="flex-1 w-full relative group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input 
                type="date" 
                className="pl-12 h-14 text-lg border-gray-200 focus:border-primary focus:ring-primary rounded-xl w-full block" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
            />
        </div>

        <Button 
            size="lg" 
            className="w-full lg:w-auto h-14 px-8 text-lg rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            onClick={handleSearch}
            disabled={isSearching}
        >
            {isSearching ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Searching...
                </>
            ) : (
                <>
                    <Search className="mr-2 h-5 w-5" />
                    Search
                </>
            )}
        </Button>
    </div>
  );
}
