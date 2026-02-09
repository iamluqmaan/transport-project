import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCompanyAdmins, removeCompanyAdmin } from "@/app/actions/company";
import { NewAdminDialog } from "@/components/admin/new-admin-dialog";
import { EditAdminDialog } from "@/components/admin/edit-admin-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Shield, User } from "lucide-react";
import { format } from "date-fns";
import { RemoveAdminButton } from "@/components/admin/remove-admin-button";

export default async function TeamPage() {
  const session = await auth();
  
  if (session?.user.role !== 'COMPANY_ADMIN') {
      redirect("/admin");
  }

  const admins = await getCompanyAdmins();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-gray-500">Manage administrators for your company</p>
        </div>
        <NewAdminDialog />
      </div>

      <div className="bg-white rounded-md border shadow overflow-hidden">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {admins.map((admin: any) => (
                    <TableRow key={admin._id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                {admin.name}
                                {session.user.id === admin._id && (
                                    <Badge variant="secondary" className="text-xs">You</Badge>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className="flex w-fit items-center gap-1 border-blue-200 bg-blue-50 text-blue-700">
                                <Shield className="h-3 w-3" />
                                Company Admin
                            </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(admin.createdAt), 'PPP')}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                <EditAdminDialog admin={admin} />
                                {session.user.id !== admin._id && (
                                    <RemoveAdminButton adminId={admin._id} adminName={admin.name} />
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
                {admins.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            No team members found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}
