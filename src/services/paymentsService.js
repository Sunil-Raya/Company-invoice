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

export async function updatePayment(id, updateData, companyId) {
  if (!id) throw new Error("Payment ID is required for update.");
  const queryId = isNaN(id) ? id : Number(id);
  console.log(`[paymentsService] Attempting update. Table: payments, ID: ${queryId}, CompanyID: ${companyId}`, updateData);
  
  const { data, error, status, statusText } = await supabase
    .from("payments")
    .update(updateData)
    .match({ id: queryId, company_id: companyId })
    .select();

  console.log(`[paymentsService] Response:`, { data, error, status, statusText });

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(`Payment with ID ${id} not found or could not be updated.`);
  }
  
  return data[0];
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
