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
