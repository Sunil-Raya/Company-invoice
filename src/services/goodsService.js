import { supabase } from "./supabase";

export async function getAllGoodsNames() {
  const { data, error } = await supabase
    .from("transactions")
    .select("goods_name")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const names = data.map(t => t.goods_name).filter(Boolean);
  const uniqueNames = [...new Set(names)];
  
  // Also check goods_received for more suggestions
  const { data: grData, error: grError } = await supabase
    .from("goods_received")
    .select("goods_name");
  
  if (!grError && grData) {
    grData.forEach(g => {
        if (g.goods_name) uniqueNames.push(g.goods_name);
    });
  }

  return [...new Set(uniqueNames)].sort();
}
