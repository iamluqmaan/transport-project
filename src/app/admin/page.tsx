import connectDB from "@/lib/db";
import User from "@/models/User";
import Route from "@/models/Route";
import TransportCompany from "@/models/TransportCompany";
import Booking from "@/models/Booking";
import { getCompanyFinancials } from "@/app/actions/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Map, Ticket, TrendingUp, Wallet, Gift, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RequestPayoutDialog } from "@/components/admin/request-payout-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await auth();
  await connectDB();
  
  const resolvedSearchParams = await searchParams;
  const isSuperAdmin = session?.user.role === 'SUPER_ADMIN';
  const companyId = session?.user?.companyId;

  let financials = null;
  /* filtered bookings for this company */
  let companyBookingsCount = 0;
  let companyPendingBookingsCount = 0;
  let filteredTransactions = [];
  const filterType = typeof resolvedSearchParams?.type === 'string' ? resolvedSearchParams.type : null;

  if (!isSuperAdmin && companyId) {
      // Fetch company specific data
      financials = await getCompanyFinancials(companyId);

      // Filter bookings for this company routes
      const companyRoutes = await Route.find({ companyId: companyId }).select('_id');
      const routeIds = companyRoutes.map(r => r._id);
      
      const [total, pending] = await Promise.all([
          Booking.countDocuments({ routeId: { $in: routeIds } }),
          Booking.countDocuments({ routeId: { $in: routeIds }, status: 'PENDING' })
      ]);
      
      companyBookingsCount = total;
      companyPendingBookingsCount = pending;
      
      // Filter transactions
      filteredTransactions = financials.transactions || [];
      if (filterType) {
          filteredTransactions = filteredTransactions.filter((tx: any) => tx.type === filterType);
      }
  }

  const queries = {
      users: isSuperAdmin ? User.countDocuments() : Promise.resolve(0),
      companies: isSuperAdmin ? TransportCompany.countDocuments() : Promise.resolve(0),
      routes: isSuperAdmin 
        ? Route.countDocuments({ departureTime: { $gt: new Date() } }) 
        : Route.countDocuments({ companyId: companyId, departureTime: { $gt: new Date() } }),
      bookings: isSuperAdmin ? Booking.countDocuments() : Promise.resolve(companyBookingsCount),
      pendingBookings: isSuperAdmin ? Booking.countDocuments({ status: 'PENDING' }) : Promise.resolve(companyPendingBookingsCount)
  };

  const [usersCount, companiesCount, routesCount, bookingsCount, pendingBookings] = await Promise.all([
      queries.users,
      queries.companies,
      queries.routes,
      queries.bookings,
      queries.pendingBookings
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         {isSuperAdmin ? (
            <>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{usersCount}</div>
                        <p className="text-xs text-muted-foreground">Registered users</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Companies</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{companiesCount}</div>
                        <p className="text-xs text-muted-foreground">Active transport companies</p>
                    </CardContent>
                </Card>
            </>
         ) : (
             <>
                {/* Company Specific Stats */}
                <Alert className="bg-blue-50 border-blue-200 mb-6 col-span-2 lg:col-span-4">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Financial Overview</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        Your <strong>Wallet Balance</strong> is your <strong>Net Earnings</strong> (Total Revenue - Commission Debts). 
                        This is the amount available for withdrawal. Outstanding debt is automatically deducted from your balance.
                        Click on <strong>Earnings</strong> or <strong>Debt</strong> cards to view detailed transaction history below.
                    </AlertDescription>
                </Alert>
                    <Link href="/admin?type=CREDIT" className="block hover:opacity-90 transition-opacity">
                        <Card className={`cursor-pointer hover:shadow-md transition-shadow h-full ${filterType === 'CREDIT' ? 'ring-2 ring-green-500' : 'bg-green-50 border-green-100'}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-green-700">Total Earnings</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-700">₦{financials?.totalRevenue.toLocaleString() || 0}</div>
                                <p className="text-xs text-green-600">Total revenue generated</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card className="bg-blue-50 border-blue-100 h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700">Wallet Balance</CardTitle>
                            <Wallet className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700">
                                ₦{Math.max(0, financials?.balance || 0).toLocaleString()}
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-blue-600">Available for payout</p>
                                {companyId && (financials?.balance ?? 0) > 0 && (
                                    <RequestPayoutDialog companyId={companyId} balance={financials?.balance || 0} />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Link href="/admin?type=DEBIT" className="block hover:opacity-90 transition-opacity">
                        <Card className={`cursor-pointer hover:shadow-md transition-shadow h-full ${filterType === 'DEBIT' ? 'ring-2 ring-red-500' : 'bg-red-50 border-red-100'}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-red-700">Outstanding Debt</CardTitle>
                                <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-700">
                                    ₦{((financials?.balance ?? 0) < 0 ? Math.abs(financials?.balance || 0) : 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-red-600">Total commission debt owed</p>
                            </CardContent>
                        </Card>
                    </Link>

                <Card className="bg-gray-50 border-gray-100 h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700">Total Withdrawn</CardTitle>
                        <Wallet className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-700">
                            ₦{financials?.totalWithdrawn?.toLocaleString() || 0}
                        </div>
                        <p className="text-xs text-gray-600">Processed funds</p>
                    </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-100 h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700">Bonuses</CardTitle>
                        <Gift className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700">₦{financials?.totalBonus.toLocaleString() || 0}</div>
                        <p className="text-xs text-purple-600">Total bonuses received</p>
                    </CardContent>
                </Card>
             </>
         )}

         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
                <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{routesCount}</div>
                <p className="text-xs text-muted-foreground">Routes currently scheduled</p>
            </CardContent>
        </Card>

        <Link href="/admin/bookings" className="block hover:opacity-90 transition-opacity">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{bookingsCount}</div>
                    <p className="text-xs text-muted-foreground">Reservations made</p>
                </CardContent>
            </Card>
        </Link>

        {pendingBookings > 0 && (
            <Link href="/admin/bookings?status=PENDING" className="block hover:opacity-90 transition-opacity">
                <Card className="cursor-pointer hover:shadow-md transition-shadow bg-orange-50 border-orange-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-700">Pending Bookings</CardTitle>
                        <Ticket className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-700">{pendingBookings}</div>
                        <p className="text-xs text-orange-600">Waiting for confirmation</p>
                    </CardContent>
                </Card>
            </Link>
        )}
      </div>

      {/* Transaction History Section for Companies */}
      {!isSuperAdmin && companyId && (
        <Card className="mt-8">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                    {filterType ? (filterType === 'CREDIT' ? 'Earnings History' : 'Debt History') : 'Recent Transactions'}
                </CardTitle>
                {filterType && (
                    <Link href="/admin">
                        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                            Clear Filter
                        </Badge>
                    </Link>
                )}
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[150px]">Date</TableHead>
                                <TableHead className="min-w-[200px]">Description</TableHead>
                                <TableHead className="min-w-[100px]">Type</TableHead>
                                <TableHead className="text-right min-w-[120px]">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No {filterType ? filterType.toLowerCase() : ''} transactions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTransactions.map((tx: any) => (
                                    <TableRow key={tx._id}>
                                        <TableCell className="whitespace-nowrap">{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}</TableCell>
                                        <TableCell className="min-w-[200px]">{tx.description}</TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={tx.type === 'CREDIT' ? 'default' : tx.type === 'INFO' ? 'secondary' : 'destructive'}
                                                className={tx.type === 'CREDIT' ? 'bg-green-600' : tx.type === 'INFO' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 'bg-red-600'}
                                            >
                                                {tx.type === 'INFO' ? 'DIRECT' : tx.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${tx.type === 'CREDIT' ? 'text-green-600' : tx.type === 'INFO' ? 'text-blue-600' : 'text-red-600'} whitespace-nowrap`}>
                                            {tx.type === 'CREDIT' ? '+₦' : tx.type === 'INFO' ? '₦' : '-₦'}{tx.amount.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
