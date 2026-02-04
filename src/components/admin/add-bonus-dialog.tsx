"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addBonusTransaction } from "@/app/actions/finance";
import { Loader2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddBonusDialogProps {
  companyId: string;
}

export function AddBonusDialog({ companyId }: AddBonusDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("Performance Bonus");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddBonus = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
       toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" });
       return;
    }
    if (!description.trim()) {
        toast({ title: "Error", description: "Description is required", variant: "destructive" });
        return;
    }

    setLoading(true);
    try {
        const res = await addBonusTransaction(companyId, val, description);
        if (res.success) {
            toast({ title: "Bonus Added", description: `₦${val.toLocaleString()} added to wallet.` });
            setOpen(false);
            setAmount("");
            setDescription("Performance Bonus");
        } else {
            toast({ title: "Failed", description: "Could not add bonus.", variant: "destructive" });
        }
    } catch (error) {
        toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
            <PlusCircle className="h-4 w-4" /> Add Bonus
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Bonus to Wallet</DialogTitle>
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
              placeholder="e.g. 5000"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="desc" className="text-right">
              Reason
            </Label>
            <Input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end">
            <Button onClick={handleAddBonus} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Bonus
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
