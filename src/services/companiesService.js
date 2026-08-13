import { supabase, fetchAllRows } from "./supabase";

/**
 * Totals up every row of a table, bucketed by company_id.
 * Doing this once beats re-scanning the whole list for each company.
 */
function totalsByCompany(rows) {
  const totals = new Map();
  for (const row of rows) {
    const key = String(row.company_id);
    const prev = totals.get(key);
    const amount = Number(row.amount || 0);
    if (prev) {
      prev.total += amount;
      prev.count += 1;
    } else {
      totals.set(key, { total: amount, count: 1 });
    }
  }
  return totals;
}

const NO_TOTALS = { total: 0, count: 0 };

/**
 * Fetches all companies along with their transactions and payments,
 * computing the total balance and invoice count.
 */
export async function getCompaniesWithStats() {
  // These feed every company's due, so each query is paged in full — a plain
  // select would stop at the 1000-row cap and quietly ignore newer entries.
  const [companiesData, txData, pyData, grData] = await Promise.all([
    fetchAllRows(() =>
      supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
    ),
    fetchAllRows(() =>
      supabase.from("transactions").select("company_id, amount").order("id", { ascending: true })
    ),
    fetchAllRows(() =>
      supabase.from("payments").select("company_id, amount").order("id", { ascending: true })
    ),
    fetchAllRows(() =>
      supabase.from("goods_received").select("company_id, amount").order("id", { ascending: true })
    ),
  ]);

  const salesByCompany = totalsByCompany(txData);
  const paymentsByCompany = totalsByCompany(pyData);
  const goodsByCompany = totalsByCompany(grData);

  // Process and combine the data
  const processedCompanies = companiesData.map((company) => {
    const key = String(company.id);
    const sales = salesByCompany.get(key) || NO_TOTALS;
    const payments = paymentsByCompany.get(key) || NO_TOTALS;
    const goods = goodsByCompany.get(key) || NO_TOTALS;
    const openingBal = Number(company.opening_balance || 0);

    return {
      ...company,
      invoices: sales.count,
      totalSales: sales.total,
      totalPayments: payments.total,
      totalGoodsReceived: goods.total, // Consistent naming
      balance: sales.total - payments.total - goods.total + openingBal,
    };
  });

  return processedCompanies;
}

/**
 * Inserts a new company into the database.
 */
export async function addCompany(companyData) {
  const { data, error } = await supabase
    .from("companies")
    .insert([companyData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Updates an existing company's data.
 */
export async function updateCompany(id, updatedData) {
  const { data, error } = await supabase
    .from("companies")
    .update(updatedData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deletes a company by its ID after cleaning up all dependent records.
 */
export async function deleteCompany(id) {
  // 1. Delete dependent records first to avoid foreign key violations
  await Promise.all([
    supabase.from("transactions").delete().eq("company_id", id),
    supabase.from("payments").delete().eq("company_id", id),
    supabase.from("goods_received").delete().eq("company_id", id)
  ]);

  // 2. Finally delete the company
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
  return true;
}
