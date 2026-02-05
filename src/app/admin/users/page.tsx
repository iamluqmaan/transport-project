import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User, { Role } from "@/models/User";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await auth();
  
  // Only Super Admins can view all users
  if (!session?.user || session.user.role !== Role.SUPER_ADMIN) {
      redirect('/admin');
  }

  await connectDB();
  
  const users = await User.find({})
    .select('-password') // Exclude password
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users & Admins</h1>
      </div>

       <div className="bg-white rounded-md border shadow overflow-hidden">
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="min-w-[150px]">Name</TableHead>
                        <TableHead className="min-w-[200px]">Email</TableHead>
                        <TableHead className="min-w-[100px]">Role</TableHead>
                        <TableHead className="min-w-[150px]">Joined</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user: any) => (
                        <TableRow key={user._id.toString()}>
                            <TableCell className="font-medium whitespace-nowrap">{user.name}</TableCell>
                            <TableCell>
                                <a href={`mailto:${user.email}`} className="hover:text-blue-600 hover:underline">
                                    {user.email}
                                </a>
                            </TableCell>
                            <TableCell>
                                <Badge variant={
                                    user.role === Role.SUPER_ADMIN ? "destructive" : 
                                    user.role === Role.COMPANY_ADMIN ? "default" : "secondary"
                                }>
                                    {user.role.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
