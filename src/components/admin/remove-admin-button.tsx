"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { removeCompanyAdmin } from "@/app/actions/company";
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

export function RemoveAdminButton({ adminId, adminName }: { adminId: string, adminName: string }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    async function handleRemove() {
        setLoading(true);
        try {
            const result = await removeCompanyAdmin(adminId);
            if (result.error) {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "Success", description: "Admin removed successfully." });
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
                    <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to remove <strong>{adminName}</strong>? They will no longer be able to access the admin panel.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemove} className="bg-red-600 hover:bg-red-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Remove
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
