import { supabase } from "./supabase";

/**
 * Inserts a new payment into the database.
 */
export async function addPayment(paymentData) {
  const { data, error } = await supabase
    .from("payments")
    .insert([paymentData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Updates an existing payment.
 */
export async function updatePayment(id, updateData) {
  const { data, error } = await supabase
    .from("payments")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deletes a payment.
 */
export async function deletePayment(id) {
  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}
