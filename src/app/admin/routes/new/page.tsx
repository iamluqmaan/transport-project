import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import connectDB from "@/lib/db";
import TransportCompany from "@/models/TransportCompany";
import { createRoute } from "@/app/actions/admin";
import { RouteForm } from "@/app/admin/routes/new/route-form";

import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export default async function NewRoutePage() {
  const session = await auth();
  await connectDB();
  
  let companies;
  if (session?.user.role === 'COMPANY_ADMIN' && session.user.companyId) {
      companies = await TransportCompany.find({ _id: session.user.companyId }).select('name _id');
  } else {
      companies = await TransportCompany.find({ isActive: true }).select('name _id').sort({ name: 1 });
  }

  // Serialize for client component
  const serializedCompanies = companies.map(c => ({
      id: c._id.toString(),
      name: c.name
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Add New Route</h1>
        <p className="text-gray-500">Schedule a new trip and assign a vehicle.</p>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow">
         <RouteForm companies={serializedCompanies} />
      </div>
    </div>
  );
}
