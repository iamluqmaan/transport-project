"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteTransportCompany } from "@/app/actions/company";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";

export function DeleteCompanyButton({ companyId, companyName }: { companyId: string, companyName: string }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    async function handleDelete() {
        setLoading(true);
        try {
            const result = await deleteTransportCompany(companyId);
            if (result.error) {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "Success", description: "Company and all associated data deleted." });
                router.refresh();
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Company?
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="text-sm text-muted-foreground">
                            Are you sure you want to delete <strong>{companyName}</strong>? 
                            <br /><br />
                            <span className="font-bold text-red-600">WARNING: This action cannot be undone.</span> 
                            <br />
                            This will permanently delete:
                            <ul className="list-disc pl-5 mt-2 text-red-600 font-medium">
                                <li>The Company profile</li>
                                <li>All Routes</li>
                                <li>All Vehicles</li>
                                <li>All Bookings</li>
                                <li>All Company Admin accounts</li>
                            </ul>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Permanently
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
