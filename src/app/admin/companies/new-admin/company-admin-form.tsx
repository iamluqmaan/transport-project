"use client";

import { useFormStatus } from "react-dom";
import { createCompanyAdmin } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import connectDB from "@/lib/db";
import TransportCompany from "@/models/TransportCompany";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create Admin
    </Button>
  );
}

interface CompanyAdminFormProps {
    companies: { id: string; name: string }[];
}

export function CompanyAdminForm({ companies }: CompanyAdminFormProps) {
    const [error, setError] = useState<string | null>(null);

    async function clientAction(formData: FormData) {
        const result = await createCompanyAdmin(formData);
        if (result?.error) {
            setError(result.error);
        }
    }

    return (
        <form action={clientAction} className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Admin User Details</h3>
            
            <div className="space-y-2">
                <Label htmlFor="companyId">Transport Company</Label>
                <select 
                    id="companyId" 
                    name="companyId" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                >
                    <option value="">Select a company...</option>
                    {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required placeholder="John Doe" />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="admin@example.com" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded border border-red-200">{error}</p>}

          <div className="flex justify-end gap-4 pt-4">
            <Link href="/admin/companies">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <SubmitButton />
          </div>
        </form>
    );
}
