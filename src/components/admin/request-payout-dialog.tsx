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
import { Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RequestPayoutDialog({ companyId, balance }: { companyId: string, balance: number }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRequest = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount greater than 0.", variant: "destructive" });
      return;
    }
    
    if (Number(amount) > balance) {
        toast({ title: "Insufficient Balance", description: `You can only withdraw up to ₦${balance.toLocaleString()}`, variant: "destructive" });
        return;
    }

    setLoading(true);
    const result = await requestPayout(companyId, Number(amount), bankDetails);
    
    if (result.success) {
      toast({ title: "Success", description: "Payout request submitted successfully." });
      setOpen(false);
      setAmount("");
    } else {
      toast({ title: "Error", description: result.error || "Failed to submit request.", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
         <Button size="sm" variant="outline" className="gap-2 text-blue-700 border-blue-200 hover:bg-blue-100">
            <Wallet className="h-4 w-4" /> Withdraw
         </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>
            Withdraw funds from your wallet to your bank account.
            Available Balance: <strong>₦{balance.toLocaleString()}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bank" className="text-right">
              Bank Details
            </Label>
            <Input
              id="bank"
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              className="col-span-3"
              placeholder="Bank Name - Account Number"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleRequest} disabled={loading}>
            {loading ? "Submitting..." : "Request Payout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
