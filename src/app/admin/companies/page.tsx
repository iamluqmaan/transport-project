
import { Button } from "@/components/ui/button";
import { Plus, Shield, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import connectDB from "@/lib/db";
import TransportCompany from "@/models/TransportCompany";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CompanyEditDialog } from "@/components/admin/company-edit-dialog";
import { DeleteCompanyButton } from "@/components/admin/delete-company-button";

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  await connectDB();
  const companies = await TransportCompany.find().sort({ createdAt: -1 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Transport Companies</h1>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Link href="/admin/companies/new-admin" className="flex-1 md:flex-none">
              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Admin
              </Button>
            </Link>
            <Link href="/admin/companies/new" className="flex-1 md:flex-none">
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Company
              </Button>
            </Link>
        </div>
      </div>

      <div className="bg-white rounded-md border shadow overflow-hidden">
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="min-w-[150px]">Name</TableHead>
                        <TableHead className="min-w-[200px]">Contact Info</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead className="min-w-[150px]">Created At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {companies.map((company) => (
                        <TableRow key={`${company._id.toString()}-${company.isVerified}-${company.isActive}`}>
                            <TableCell className="font-medium whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    {company.name}
                                    {company.isVerified && <Shield className="w-3 h-3 text-green-600" />}
                                </div>
                            </TableCell>
                            <TableCell>{company.contactInfo}</TableCell>
                             <TableCell>
                                 {company.isActive ? (
                                    <Badge className="bg-green-600">Active</Badge>
                                 ) : (
                                    <Badge variant="secondary">Inactive</Badge>
                                 )}
                             </TableCell>
                             <TableCell>
                                 {company.isVerified ? (
                                    <Badge variant="outline" className="text-green-600 border-green-600">Verified</Badge>
                                 ) : (
                                    <Badge variant="outline" className="text-gray-400">Unverified</Badge>
                                 )}
                             </TableCell>
                            <TableCell className="whitespace-nowrap">{format(new Date(company.createdAt), 'PPP')}</TableCell>
                             <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                     <CompanyEditDialog company={JSON.parse(JSON.stringify(company))} />
                                     <DeleteCompanyButton companyId={company._id.toString()} companyName={company.name} />
                                </div>
                             </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
