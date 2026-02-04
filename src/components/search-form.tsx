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
    <div className="bg-white p-4 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input 
                placeholder="Traveling From (e.g. Lagos)" 
                className="pl-10 h-12 text-lg" 
                value={from}
                onChange={(e) => setFrom(e.target.value)}
            />
        </div>
        <div className="hidden md:block text-gray-400">
            <ArrowRight className="h-6 w-6" />
        </div>
            <div className="flex-1 w-full relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input 
                placeholder="Traveling To (e.g. Abuja)" 
                className="pl-10 h-12 text-lg"
                value={to}
                onChange={(e) => setTo(e.target.value)}
            />
        </div>
            <div className="flex-1 w-full relative">
            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input 
                type="date" 
                className="pl-10 h-12 text-lg" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
            />
        </div>
        <Button 
            size="lg" 
            className="w-full md:w-auto h-12 px-8 text-lg"
            onClick={handleSearch}
            disabled={isSearching}
        >
            {isSearching ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                </>
            ) : (
                "Search"
            )}
        </Button>
    </div>
  );
}
