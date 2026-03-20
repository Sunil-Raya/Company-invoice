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
