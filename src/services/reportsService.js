import { supabase } from "./supabase";
import { getTodayBS, subtractDays } from "../utils/nepaliDate";

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

  // Filter out any entries missing a date to prevent sorting/comparison issues
  allEntries = allEntries.filter(e => e.nepal_date);

  // Sort by Nepal Date string first, then by timestamp for sub-day ordering
  allEntries.sort((a, b) => a.nepal_date.localeCompare(b.nepal_date) || a.sortDate - b.sortDate);
  
  let openingBalance = Number(company.opening_balance || 0);
  let filteredEntries = [];

  let effectiveStartDate = startDate;
  
  if (presetDays) {
     const today = getTodayBS();
     effectiveStartDate = subtractDays(today, Number(presetDays) - 1);
  }

  for (const entry of allEntries) {
    let include = true;
    let isBeforeStart = false;

    if (presetDays || startDate) {
      if (effectiveStartDate && entry.nepal_date < effectiveStartDate) {
        include = false;
        isBeforeStart = true;
      }
    }
    
    if (include && endDate && entry.nepal_date > endDate) {
      include = false;
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
