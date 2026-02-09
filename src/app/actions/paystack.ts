"use server";

import { getBanks as fetchBanks, resolveAccountNumber as resolveAccount } from "@/lib/paystack";

export async function getBanksAction() {
  return await fetchBanks();
}

export async function resolveAccountAction(accountNumber: string, bankCode: string) {
  try {
      const result = await resolveAccount(accountNumber, bankCode);
      return { success: true, data: result };
  } catch (error: any) {
      return { success: false, error: error.message };
  }
}
