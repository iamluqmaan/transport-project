import Link from "next/link";
import connectDB from "@/lib/db";
import TransportCompany from "@/models/TransportCompany";
import { CompanyAdminForm } from "./company-admin-form";

export const dynamic = 'force-dynamic';

export default async function NewCompanyPage() {
  await connectDB();
  const companies = await TransportCompany.find().select('name _id').sort({ name: 1 });
  
  const serializedCompanies = companies.map(c => ({
      id: c._id.toString(),
      name: c.name
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Add Company Admin</h1>
        <p className="text-gray-500">Create a new administrator for a transport company.</p>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow">
         <CompanyAdminForm companies={serializedCompanies} />
      </div>
    </div>
  );
}
