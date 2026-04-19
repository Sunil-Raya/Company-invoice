import { supabase } from "./supabase";

/**
 * Inserts a new transaction (sale) into the database.
 */
export async function addTransaction(transactionData) {
  const isArray = Array.isArray(transactionData);
  const { data, error } = await supabase
    .from("transactions")
    .insert(isArray ? transactionData : [transactionData])
    .select();

  if (error) throw error;
  return isArray ? data : data[0];
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

export async function updateTransaction(id, updateData) {
  if (!id) throw new Error("Transaction ID is required for update.");
  const { data, error } = await supabase
    .from("transactions")
    .update(updateData)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Transaction not found or could not be updated.");
  return data;
}

/**
 * Deletes a transaction.
 */
export async function deleteTransaction(id) {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}
