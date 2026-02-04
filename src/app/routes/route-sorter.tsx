"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function RouteSorter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "price_asc";

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sortValue = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sortValue);
    router.push(`/routes?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Sort by:</span>
      <select 
        className="border rounded p-2 text-sm"
        value={currentSort}
        onChange={handleSortChange}
      >
        <option value="price_asc">Cheapest Price</option>
        <option value="duration_asc">Fastest Duration</option>
        <option value="departure_asc">Earliest Departure</option>
      </select>
    </div>
  );
}
