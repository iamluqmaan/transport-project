import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCompanyFinancials } from "@/app/actions/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import connectDB from "@/lib/db";
import { AddBonusDialog } from "@/components/admin/add-bonus-dialog";

// Force dynamic
export const dynamic = 'force-dynamic';

export default async function CompanyFinanceHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') {
        redirect('/admin');
    }

    const { id: companyId } = await params;

    const data = await getCompanyFinancials(companyId);

    // Fetch company name for header
    await connectDB();
    const TransportCompany = (await import("@/models/TransportCompany")).default;
    const company = await TransportCompany.findById(companyId);

    if (!company) {
        return <div>Company not found</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Link href="/admin/finance">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Overview
                    </Button>
                </Link>
            </div>

            <h1 className="text-3xl font-bold mb-2">{company.name} - Financials</h1>
            <p className="text-muted-foreground mb-8">Transaction History & Wallet Details</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card className="bg-primary/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Current Net Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-4xl font-bold ${data.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {data.balance >= 0 ? "+" : ""}
                            ₦{Math.abs(data.balance).toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            {data.balance >= 0 
                                ? "We owe them." 
                                : "They owe us (Commission Debt)."}
                        </p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <AddBonusDialog companyId={companyId} />
                         <p className="text-xs text-muted-foreground mt-2">
                            Adding a bonus increases their payout balance.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction Ledger</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">No transactions found.</TableCell>
                                </TableRow>
                            ) : (
                                data.transactions.map((tx: any) => (
                                    <TableRow key={tx._id}>
                                        <TableCell>{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{tx.category}</div>
                                            <div className="text-xs text-muted-foreground">{tx.description}</div>
                                            {tx.bookingId && (
                                                <div className="text-xs text-blue-500">Ref: {tx.bookingId.toString().slice(-6)}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={tx.type === 'CREDIT' ? 'default' : 'destructive'}
                                                className={tx.type === 'CREDIT' ? 'bg-green-600' : tx.type === 'WITHDRAWAL' ? 'bg-amber-600' : 'bg-red-600'}
                                            >
                                                {tx.type}
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
