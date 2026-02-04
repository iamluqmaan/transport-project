import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  await connectDB();
  const companies = await TransportCompany.find().sort({ createdAt: -1 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transport Companies</h1>
        <div className="flex gap-2">
            <Link href="/admin/companies/new-admin">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Add Admin
              </Button>
            </Link>
            <Link href="/admin/companies/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Company
              </Button>
            </Link>
        </div>
      </div>

      <div className="bg-white rounded-md border shadow">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {companies.map((company) => (
                    <TableRow key={company._id.toString()}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.contactInfo}</TableCell>
                         <TableCell>
                             {company.isActive ? (
                                <Badge className="bg-green-600">Active</Badge>
                             ) : (
                                <Badge variant="secondary">Inactive</Badge>
                             )}
                         </TableCell>
                        <TableCell>{format(new Date(company.createdAt), 'PPP')}</TableCell>
                         <TableCell className="text-right">
                             <Button variant="ghost" size="sm">Edit</Button>
                         </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}
