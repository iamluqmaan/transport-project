
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toggleCompanyVerification, toggleCompanyActivation, updateCompany } from "@/app/actions/company";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";

interface CompanyEditDialogProps {
  company: {
    _id: string;
    name: string;
    contactInfo: string;
    description?: string;
    logo?: string;
    isVerified: boolean;
    isActive: boolean;
  };
  trigger?: React.ReactNode;
}

export function CompanyEditDialog({ company, trigger }: CompanyEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: company.name,
    contactInfo: company.contactInfo,
    description: company.description || "",
    logo: company.logo || "",
  });

  const [isVerified, setIsVerified] = useState(company.isVerified);
  const [isActive, setIsActive] = useState(company.isActive);

  async function handleUpdateDetails() {
    setLoading(true);
    try {
      const result = await updateCompany(company._id, formData);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Company details updated." });
        setOpen(false);
        router.refresh(); // Refresh data
      }
    } catch (error) {
       toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleVerification() {
    setLoading(true);
    try {
        const newStatus = !isVerified;
        const result = await toggleCompanyVerification(company._id, newStatus);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            setIsVerified(newStatus);
            toast({ title: "Success", description: `Company is now ${newStatus ? "Verified" : "Unverified"}` });
            router.refresh(); // Refresh data
        }
    } catch (e) {
        toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }

  async function handleToggleActivation() {
    setLoading(true);
    try {
        const newStatus = !isActive;
        const result = await toggleCompanyActivation(company._id, newStatus);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            setIsActive(newStatus);
            toast({ title: "Success", description: `Company is now ${newStatus ? "Active" : "Inactive"}` });
            router.refresh(); // Refresh data
        }
    } catch (e) {
        toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="ghost" size="sm">Edit</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>
            Manage company details, verification, and activation status.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
            {/* Status Toggles */}
            <div className="flex items-center justify-between gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                    <Label htmlFor="verification-mode" className="flex items-center gap-2">
                        <Shield className={`w-4 h-4 ${isVerified ? "text-green-600" : "text-gray-400"}`} />
                        <span>Verified</span>
                    </Label>
                    <Switch 
                        id="verification-mode" 
                        checked={isVerified}
                        onCheckedChange={handleToggleVerification}
                        disabled={loading}
                    />
                </div>

                 <div className="flex items-center space-x-2">
                    <Label htmlFor="activation-mode" className="flex items-center gap-2">
                         {isActive ? <CheckCircle2 className="w-4 h-4 text-green-600"/> : <XCircle className="w-4 h-4 text-red-500"/>}
                        <span>Active</span>
                    </Label>
                    <Switch 
                        id="activation-mode" 
                        checked={isActive}
                        onCheckedChange={handleToggleActivation}
                         disabled={loading}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="contact">Contact Info</Label>
                <Input 
                    id="contact" 
                    value={formData.contactInfo} 
                    onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
                />
            </div>

             <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                    id="description" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description of the company..."
                />
            </div>
             
             <div className="space-y-2">
                <Label htmlFor="logo">Logo URL (Optional)</Label>
                 <Input 
                    id="logo" 
                    value={formData.logo} 
                     onChange={(e) => setFormData({...formData, logo: e.target.value})}
                    placeholder="https://..."
                />
            </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
            Close
          </Button>
          <Button type="button" onClick={handleUpdateDetails} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
