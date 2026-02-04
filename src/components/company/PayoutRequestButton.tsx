"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPayout } from "@/app/actions/finance";
import { useToast } from "@/hooks/use-toast"; // Changed import
import { Banknote } from "lucide-react";

interface PayoutRequestButtonProps {
  companyId: string;
  maxAmount: number;
}

export default function PayoutRequestButton({ companyId, maxAmount }: PayoutRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [bankDetails, setBankDetails] = useState<string>("");
  const { toast } = useToast(); // Use hook

  const handleRequest = async () => {
    const numAmount = Number(amount);
    
    if (numAmount <= 0) {
      toast({
          title: "Error",
          description: "Please enter a valid amount.",
          variant: "destructive",
      });
      return;
    }

    if (numAmount > maxAmount) {
        toast({
            title: "Error",
            description: "Insufficient balance.",
            variant: "destructive",
        });
        return;
    }

    if (!bankDetails.trim()) {
        toast({
            title: "Error",
            description: "Please provide bank details.",
            variant: "destructive",
        });
        return;
    }

    setLoading(true);
    try {
      const result = await requestPayout(companyId, numAmount, bankDetails);
      if (result.success) {
        toast({
            title: "Success",
            description: "Withdrawal request submitted successfully!",
            variant: "default", // or just omit for default
            className: "bg-green-600 text-white border-green-700"
        });
        setOpen(false);
        setAmount("");
        setBankDetails("");
      } else {
        toast({
            title: "Error",
            description: result.error || "Failed to submit request.",
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
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
            <Banknote className="h-4 w-4" />
            Request Payout
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>
            Enter the amount you wish to withdraw and your bank details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount (₦)
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              max={maxAmount}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bank" className="text-right">
              Bank Details
            </Label>
            <Input
              id="bank"
              placeholder="Bank Name, Account Number, Account Name"
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              className="col-span-3"
            />
          </div>
           <div className="text-xs text-muted-foreground text-center">
                Available Balance: ₦{maxAmount.toLocaleString()}
            </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleRequest} disabled={loading || maxAmount <= 0}>
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
