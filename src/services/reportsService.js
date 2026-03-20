import { supabase } from "./supabase";

export async function getCompanyLedger(companyId, filters = {}) {
  const { startDate, endDate, presetDays } = filters;
  
  const [companyRes, txRes, pyRes, grRes] = await Promise.all([
    supabase.from("companies").select("*").eq("id", companyId).single(),
    supabase.from("transactions").select("*").eq("company_id", companyId),
    supabase.from("payments").select("*").eq("company_id", companyId),
    supabase.from("goods_received").select("*").eq("company_id", companyId)
  ]);

  if (companyRes.error) throw companyRes.error;
  
  const company = companyRes.data;
  const transactions = txRes.data || [];
  const payments = pyRes.data || [];
  const goodsReceived = grRes.data || [];

  let allEntries = [
    ...transactions.map(t => ({ ...t, type: 'SALE', sortDate: new Date(t.created_at).getTime() })),
    ...payments.map(p => ({ ...p, type: 'PAYMENT', sortDate: new Date(p.created_at).getTime() })),
    ...goodsReceived.map(g => ({ ...g, type: 'GOODS_RECEIVED', sortDate: new Date(g.created_at).getTime() }))
  ];

  // Sort extremely strictly chronologically
  allEntries.sort((a, b) => a.sortDate - b.sortDate);
  
  let openingBalance = Number(company.opening_balance || 0);
  let filteredEntries = [];

  const now = Date.now();
  const presetCutoff = presetDays ? now - (presetDays * 24 * 60 * 60 * 1000) : null;

  for (const entry of allEntries) {
    let include = true;
    let isBeforeStart = false;

    if (presetDays) {
      if (entry.sortDate < presetCutoff) {
        include = false;
        isBeforeStart = true;
      }
    } else {
      // Date string comparison (e.g. "2081-05-15" >= "2081-05-10")
      if (startDate && entry.nepal_date < startDate) {
        include = false;
        isBeforeStart = true;
      }
      if (endDate && entry.nepal_date > endDate) {
        include = false;
      }
    }

    if (isBeforeStart) {
      if (entry.type === 'SALE') openingBalance += Number(entry.amount);
      if (entry.type === 'PAYMENT') openingBalance -= Number(entry.amount);
      if (entry.type === 'GOODS_RECEIVED') openingBalance -= Number(entry.amount);
    }

    if (include) {
      filteredEntries.push(entry);
    }
  }

  return {
    company,
    openingBalance,
    entries: filteredEntries
  };
}
