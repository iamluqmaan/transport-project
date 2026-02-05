import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFinancialSummary, getCommissionRate, updateCommissionRate } from "@/app/actions/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import CommissionParamsForm from "@/components/admin/CommissionParamsForm";
import WithdrawalRequestsTable from "@/components/admin/WithdrawalRequestsTable";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AdminFinancePage() {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') {
        redirect('/admin');
    }

    const summary = await getFinancialSummary();
    const currentRate = await getCommissionRate();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Financial Overview</h1>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦{summary.totalBookingsValue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Gross Transaction Volume</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-600">Total Platform Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₦{summary.totalPlatformRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Service Fees Collected</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600">Total Payable to Companies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">₦{summary.totalCompanyRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Net Revenue for Companies</p>
                    </CardContent>
                </Card>
            </div>

            {/* Withdrawal Requests */}
            <div className="mb-8">
                <Card>
                     <CardHeader>
                        <CardTitle>Pending Withdrawal Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <WithdrawalRequestsTable requests={summary.pendingWithdrawals || []} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Commission Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Commission Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CommissionParamsForm currentRate={currentRate} />
                    </CardContent>
                </Card>

                {/* Company Ledger */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Company Ledger (Payouts)</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[200px]">Company Name</TableHead>
                                    <TableHead className="text-right min-w-[150px]">Net Balance</TableHead>
                                    <TableHead className="text-right min-w-[100px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summary.companyLedger.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-gray-500">No data available.</TableCell>
                                    </TableRow>
                                ) : (
                                    summary.companyLedger.map((company: any, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium whitespace-nowrap">{company.name}</TableCell>
                                            <TableCell className={`text-right font-bold ${company.balanceDue >= 0 ? 'text-green-600' : 'text-red-600'} whitespace-nowrap`}>
                                                {company.balanceDue >= 0 ? '+' : ''}₦{company.balanceDue.toLocaleString()}
                                                <div className="text-xs font-normal text-muted-foreground">
                                                    {company.balanceDue >= 0 ? "You owe them" : "They owe you"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <a href={`/admin/finance/${company.id}`}>
                                                    <Button variant="outline" size="sm">History</Button>
                                                </a>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
