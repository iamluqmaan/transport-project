"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { processWithdrawal } from "@/app/actions/finance";
import { useToast } from "@/hooks/use-toast"; // Changed import
import { Check, X, Loader2 } from "lucide-react";

interface WithdrawalRequestsTableProps {
  requests: any[];
}

export default function WithdrawalRequestsTable({ requests }: WithdrawalRequestsTableProps) {
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast(); // Use hook

  const handleProcess = async (transactionId: string, action: "APPROVE" | "REJECT") => {
    setProcessing(transactionId);
    try {
      const result = await processWithdrawal(transactionId, action);
      if (result.success) {
        toast({
            title: action === "APPROVE" ? "Approved" : "Rejected",
            description: `Withdrawal ${action === "APPROVE" ? "Approved" : "Rejected"} successfully.`,
            variant: "default",
            className: action === "APPROVE" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        });
      } else {
         toast({
            title: "Error",
            description: result.error || "Failed to process request.",
            variant: "destructive",
        });
      }
    } catch (error) {
         toast({
            title: "Error",
            description: "An error occurred.",
            variant: "destructive",
        });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">Company</TableHead>
            <TableHead className="min-w-[180px]">Requested Date</TableHead>
            <TableHead className="min-w-[200px]">Details</TableHead>
            <TableHead className="text-right min-w-[120px]">Amount</TableHead>
            <TableHead className="text-right min-w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No pending withdrawal requests.
              </TableCell>
            </TableRow>
          ) : (
            requests.map((req) => (
              <TableRow key={req._id}>
                <TableCell className="font-medium whitespace-nowrap">{req.companyName || "Unknown"}</TableCell>
                <TableCell className="whitespace-nowrap">{new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString()}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={req.description}>
                  {req.description}
                </TableCell>
                <TableCell className="text-right font-bold text-amber-600 whitespace-nowrap">
                  ₦{req.amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      disabled={!!processing}
                      onClick={() => handleProcess(req._id, "APPROVE")}
                    >
                      {processing === req._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span className="sr-only">Approve</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      disabled={!!processing}
                      onClick={() => handleProcess(req._id, "REJECT")}
                    >
                      {processing === req._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      <span className="sr-only">Reject</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
