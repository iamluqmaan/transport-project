import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCompanyFinancials } from "@/app/actions/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PayoutRequestButton from "@/components/company/PayoutRequestButton"; // New Client Component

export default async function CompanyFinancePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const session = await auth();
    
    if (!session || session.user.role !== 'COMPANY_ADMIN') {
        // Fallback or redirect if needed
    }

    const User = (await import("@/models/User")).default;
    const user = await User.findById(session?.user?.id).populate('companyId');
    
    if (!user || !user.companyId) {
        return <div className="p-8">Company account not found.</div>;
    }

    const companyId = user.companyId._id.toString();
    const companyName = user.companyId.name;
    const data = await getCompanyFinancials(companyId);

    // Filter transactions if type param exists
    const filterType = typeof searchParams?.type === 'string' ? searchParams.type : null;
    let displayedTransactions = data.transactions;

    if (filterType) {
        displayedTransactions = data.transactions.filter((tx: any) => tx.type === filterType);
    }

    const pendingWithdrawals = data.transactions.filter((tx: any) => tx.type === 'WITHDRAWAL' && tx.status === 'PENDING').reduce((sum: number, tx: any) => sum + tx.amount, 0);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Link href="/admin">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
            </div>

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">
                    {companyName}: Financials
                </h1>
                <PayoutRequestButton companyId={companyId} maxAmount={data.balance} />
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card className="bg-primary/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Wallet Balance (Available)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-4xl font-bold ${data.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {data.balance >= 0 ? "+" : ""}
                            ₦{Math.abs(data.balance).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Available for Payout
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Pending Withdrawals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                             ₦{pendingWithdrawals.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Funds currently locked in processing
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                        {filterType ? (filterType === 'CREDIT' ? 'Earnings History' : 'Debt History') : 'Transaction History'}
                    </CardTitle>
                    {filterType && (
                        <Link href="/company/finance">
                            <Button variant="outline" size="sm">View All</Button>
                        </Link>
                    )}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayedTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                displayedTransactions.map((tx: any) => (
                                    <TableRow key={tx._id}>
                                        <TableCell>{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={tx.description}>{tx.description}</TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={tx.type === 'CREDIT' ? 'default' : 'destructive'}
                                                className={tx.type === 'CREDIT' ? 'bg-green-600' : tx.type === 'WITHDRAWAL' ? 'bg-amber-600' : 'bg-red-600'}
                                            >
                                                {tx.type}
                                            </Badge>
                                        </TableCell>
                                         <TableCell>
                                            <Badge variant="outline" className={
                                                tx.status === 'COMPLETED' ? 'text-green-600 border-green-200 bg-green-50' :
                                                tx.status === 'PENDING' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                                                'text-red-600 border-red-200 bg-red-50'
                                            }>
                                                {tx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'CREDIT' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
