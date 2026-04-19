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

/**
 * Updates an existing goods received record.
 */
export async function updateGoodsReceived(id, updateData) {
  const { data, error } = await supabase
    .from("goods_received")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
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
