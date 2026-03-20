import { supabase } from "./supabase";

/**
 * Inserts a new transaction (sale) into the database.
 */
export async function addTransaction(transactionData) {
  const { data, error } = await supabase
    .from("transactions")
    .insert([transactionData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Gets the last transaction's due for a specific company.
 */
export async function getLastTransactionDue(companyId) {
  // Fetch the most recent transaction (by created_at desc)
  const { data, error } = await supabase
    .from("transactions")
    .select("due")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle(); // maybeSingle returns null if 0 rows, single throws PGRST116

  if (error) throw error;
  return data ? Number(data.due || 0) : 0;
}
