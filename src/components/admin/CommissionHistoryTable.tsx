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

interface CommissionRecord {
    id: string;
    date: Date;
    companyName: string;
    route: string;
    commissionAmount: number;
    paymentMethod: string;
    bookingRef: string;
}

export default function CommissionHistoryTable({ transactions }: { transactions: CommissionRecord[] }) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Route / Ref</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                No commission records found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        transactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell className="whitespace-nowrap">
                                    {format(new Date(tx.date), "MMM d, yyyy")}
                                    <br />
                                    <span className="text-xs text-muted-foreground">{format(new Date(tx.date), "h:mm a")}</span>
                                </TableCell>
                                <TableCell className="font-medium">{tx.companyName}</TableCell>
                                <TableCell>
                                    <div className="text-sm">{tx.route}</div>
                                    <div className="text-xs text-muted-foreground">Ref: {tx.bookingRef}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                        {tx.paymentMethod.replace("_", " ")}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold text-green-600">
                                    +₦{tx.commissionAmount.toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
