"use client";

import { Button } from "@/components/ui/button";
import { Filter, Wallet, Bus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface TransportCompany {
  _id: string;
  name: string;
}

interface RouteFiltersProps {
  companies: TransportCompany[];
}

export function RouteFilters({ companies }: RouteFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  // Initialize from URL
  useEffect(() => {
    const priceParam = searchParams.get("price");
    if (priceParam) {
      setSelectedPrices(priceParam.split(","));
    } else {
      setSelectedPrices([]);
    }

    const companyParam = searchParams.get("companyId");
    if (companyParam) {
      setSelectedCompanies(companyParam.split(","));
    } else {
      setSelectedCompanies([]);
    }
  }, [searchParams]);

  const handlePriceChange = (range: string) => {
    let newPrices = [...selectedPrices];
    if (newPrices.includes(range)) {
      newPrices = newPrices.filter(p => p !== range);
    } else {
      newPrices.push(range);
    }
    setSelectedPrices(newPrices);
    updateUrl(newPrices, selectedCompanies);
  };

  const handleCompanyChange = (companyId: string) => {
    let newCompanies = [...selectedCompanies];
    if (newCompanies.includes(companyId)) {
      newCompanies = newCompanies.filter(c => c !== companyId);
    } else {
      newCompanies.push(companyId);
    }
    setSelectedCompanies(newCompanies);
    updateUrl(selectedPrices, newCompanies);
  };

  const updateUrl = (prices: string[], companies: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (prices.length > 0) {
      params.set("price", prices.join(","));
    } else {
      params.delete("price");
    }

    if (companies.length > 0) {
      params.set("companyId", companies.join(","));
    } else {
      params.delete("companyId");
    }
    
    // Reset pages or other conflicting params if needed? 
    // For now just push
    router.push(`/routes?${params.toString()}`);
  };

  const resetFilters = () => {
    setSelectedPrices([]);
    setSelectedCompanies([]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("price");
    params.delete("companyId");
    router.push(`/routes?${params.toString()}`);
  };

  return (
    <aside className="w-full md:w-64 space-y-8">
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Filters</h3>
          <Filter className="h-4 w-4 text-gray-500" />
        </div>
        
        {/* Price Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Price Range
          </h4>
          <div className="space-y-2">
             <label className="flex items-center space-x-2 cursor-pointer">
               <input 
                  type="checkbox" 
                  className="rounded border-gray-300" 
                  checked={selectedPrices.includes("0-5000")}
                  onChange={() => handlePriceChange("0-5000")}
               />
               <span className="text-sm">₦0 - ₦5,000</span>
             </label>
             <label className="flex items-center space-x-2 cursor-pointer">
               <input 
                  type="checkbox" 
                  className="rounded border-gray-300"
                  checked={selectedPrices.includes("5000-15000")}
                  onChange={() => handlePriceChange("5000-15000")}
               />
               <span className="text-sm">₦5,000 - ₦15,000</span>
             </label>
             <label className="flex items-center space-x-2 cursor-pointer">
               <input 
                  type="checkbox" 
                  className="rounded border-gray-300"
                  checked={selectedPrices.includes("15000-40000")}
                  onChange={() => handlePriceChange("15000-40000")}
               />
               <span className="text-sm">₦15,000 - ₦40,000</span>
             </label>
              <label className="flex items-center space-x-2 cursor-pointer">
               <input 
                  type="checkbox" 
                  className="rounded border-gray-300"
                  checked={selectedPrices.includes("40000-plus")}
                  onChange={() => handlePriceChange("40000-plus")}
               />
               <span className="text-sm">₦40,000+</span>
             </label>
          </div>
        </div>

         {/* Company Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Bus className="h-4 w-4" /> Transport Company
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
             {companies.map((company) => (
                <label key={company._id} className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300" 
                    checked={selectedCompanies.includes(company._id.toString())}
                    onChange={() => handleCompanyChange(company._id.toString())}
                  />
                  <span className="text-sm">{company.name}</span>
                </label>
             ))}
             {companies.length === 0 && (
                <p className="text-xs text-gray-500">No companies available</p>
             )}
          </div>
        </div>

        <Button onClick={resetFilters} className="w-full" variant="outline">Reset Filters</Button>
      </div>
    </aside>
  );
}
