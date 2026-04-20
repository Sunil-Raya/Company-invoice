import { supabase } from "./supabase";

/**
 * Inserts a new goods received record into the database.
 */
export async function addGoodsReceived(dataPayload) {
  const isArray = Array.isArray(dataPayload);
  const { data, error } = await supabase
    .from("goods_received")
    .insert(isArray ? dataPayload : [dataPayload])
    .select();

  if (error) throw error;
  return isArray ? data : data[0];
}

export async function updateGoodsReceived(id, updateData, companyId) {
  if (!id) throw new Error("Goods Received ID is required for update.");
  const queryId = isNaN(id) ? id : Number(id);
  console.log(`[goodsReceivedService] Attempting update. Table: goods_received, ID: ${queryId}, CompanyID: ${companyId}`, updateData);

  const { data, error, status, statusText } = await supabase
    .from("goods_received")
    .update(updateData)
    .match({ id: queryId, company_id: companyId })
    .select();

  console.log(`[goodsReceivedService] Response:`, { data, error, status, statusText });

  if (error) {
    console.error(`[goodsReceivedService] Postgres Error:`, error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.warn(`[goodsReceivedService] No rows affected by update query for ID ${queryId}.`);
    
    // Diagnostic: Try to select the row
    const { data: checkData, error: checkError } = await supabase
      .from("goods_received")
      .select("*")
      .eq("id", queryId)
      .maybeSingle();

    if (checkError) console.error("[goodsReceivedService] Diagnostic SELECT error:", checkError);
    if (!checkData) console.error(`[goodsReceivedService] Diagnostic: Record with ID ${queryId} is NOT visible to SELECT.`);
    else console.log(`[goodsReceivedService] Diagnostic: Record with ID ${queryId} IS visible to SELECT but UPDATE failed. (Likely RLS Update Policy issue)`, checkData);

    throw new Error(`Entry with ID ${id} not found or could not be updated.`);
  }

  return data[0];
}

/**
 * Deletes a goods received record.
 */
export async function deleteGoodsReceived(id) {
  const { error } = await supabase
    .from("goods_received")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}
