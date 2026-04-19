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

export async function updatePayment(id, updateData) {
  if (!id) throw new Error("Payment ID is required for update.");
  const { data, error } = await supabase
    .from("payments")
    .update(updateData)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Payment not found or could not be updated.");
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
