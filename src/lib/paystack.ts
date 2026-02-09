import axios from "axios";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_URL = "https://api.paystack.co";

if (!PAYSTACK_SECRET_KEY) {
  console.warn("PAYSTACK_SECRET_KEY is not defined in environment variables.");
}

const paystackClient = axios.create({
  baseURL: PAYSTACK_API_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export interface Bank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string;
  pay_with_bank: boolean;
  active: boolean;
  is_deleted: boolean;
  country: string;
  currency: string;
  type: string;
}

export async function getBanks(): Promise<Bank[]> {
  try {
    const response = await paystackClient.get("/bank", {
      params: { country: "nigeria" }, // Default to Nigeria for now
    });
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching banks:", error.response?.data || error.message);
    return [];
  }
}

export async function resolveAccountNumber(accountNumber: string, bankCode: string) {
  try {
    const response = await paystackClient.get("/bank/resolve", {
      params: { account_number: accountNumber, bank_code: bankCode },
    });
    return response.data.data;
  } catch (error: any) {
    console.error("Error resolving account:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Could not resolve account details");
  }
}

export async function createSubaccount(
  businessName: string,
  bankCode: string,
  accountNumber: string,
  percentageCharge: number = 0 // Default to 0 so we can control it dynamically via transaction_charge
) {
  try {
    // Check if subaccount already exists? Paystack doesn't have a direct "find by account" endpoint easily accessible 
    // without listing all. For now, we try to create. 
    // If it exists, Paystack might return the existing one or error.
    
    // Note: Paystack allows creating multiple subaccounts for same account.
    // Ideally we list and check, but for MVP let's create and store ID.
    
    const response = await paystackClient.post("/subaccount", {
      business_name: businessName,
      settlement_bank: bankCode,
      account_number: accountNumber,
      percentage_charge: percentageCharge, // Verification: Does this auto-deduct? 
      // If we use 'subaccount' bearer in transaction, this percentage might override or be ignored if we pass specific values.
      // Actually, if we pass `transaction_charge` in the initialize call on frontend, that overrides the percentage.
      // So this value here acts as a default.
    });
    
    return response.data.data;
  } catch (error: any) {
    console.error("Error creating subaccount:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to create Paystack subaccount");
  }
}

export async function fetchSubaccount(subaccountCode: string) {
    try {
        const response = await paystackClient.get(`/subaccount/${subaccountCode}`);
        return response.data.data;
    } catch (error: any) {
        console.error("Error fetching subaccount:", error.response?.data || error.message);
        return null;
    }
}
export async function updateSubaccount(subaccountCode: string, percentageCharge: number) {
    try {
        const response = await paystackClient.put(`/subaccount/${subaccountCode}`, {
             percentage_charge: percentageCharge
        });
        return response.data.data;
    } catch (error: any) {
        console.error("Error updating subaccount:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to update Paystack subaccount");
    }
}
