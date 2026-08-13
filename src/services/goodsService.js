import { supabase, fetchAllRows } from "./supabase";

export async function getAllGoodsNames() {
  // Paged so suggestions keep including goods entered past the 1000-row cap.
  const [txRows, grRows] = await Promise.all([
    fetchAllRows(() =>
      supabase.from("transactions").select("goods_name")
        .order("created_at", { ascending: false }).order("id", { ascending: true })
    ),
    // Also check goods_received for more suggestions
    fetchAllRows(() =>
      supabase.from("goods_received").select("goods_name").order("id", { ascending: true })
    )
  ]);

  const names = [...txRows, ...grRows].map(r => r.goods_name).filter(Boolean);
  return [...new Set(names)].sort();
}
