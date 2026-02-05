import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminLayoutWrapper } from "@/components/admin/admin-layout-wrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Role verification
  if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'COMPANY_ADMIN')) {
    redirect('/');
  }

  const role = session.user.role || 'COMPANY_ADMIN';

  return (
    <AdminLayoutWrapper userRole={role}>
      {children}
    </AdminLayoutWrapper>
  );
}
