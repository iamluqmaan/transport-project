import { Loader2 } from "lucide-react";
import { Skeleton } from "../../components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-6 bg-white shadow-sm flex flex-col md:flex-row gap-4">
                    <Skeleton className="h-16 w-16 rounded-md" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
