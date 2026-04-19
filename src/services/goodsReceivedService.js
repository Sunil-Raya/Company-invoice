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

export async function updateGoodsReceived(id, updateData) {
  if (!id) throw new Error("Goods Received ID is required for update.");
  const { data, error } = await supabase
    .from("goods_received")
    .update(updateData)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Entry not found or could not be updated.");
  return data;
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
