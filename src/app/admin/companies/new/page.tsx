"use client";

import { useFormStatus } from "react-dom";
import { createCompany } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create Company
    </Button>
  );
}

export default function NewCompanyPage() {
    const [error, setError] = useState<string | null>(null);

    async function clientAction(formData: FormData) {
        const result = await createCompany(formData);
        if (result?.error) {
            setError(result.error);
        }
    }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Add Transport Company</h1>
        <p className="text-gray-500">Register a new transport provider in the system.</p>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow">
        <form action={clientAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input id="name" name="name" required placeholder="e.g. GIG Motors" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInfo">Contact Information</Label>
            <Input id="contactInfo" name="contactInfo" required placeholder="Phone number or email" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <textarea 
                id="description" 
                name="description" 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Brief description of the company..."
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-4">
            <Link href="/admin/companies">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
