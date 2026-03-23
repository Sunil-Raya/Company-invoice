import { supabase } from "./supabase";

/**
 * Fetches all companies along with their transactions and payments,
 * computing the total balance and invoice count.
 */
export async function getCompaniesWithStats() {
  // Fetch companies
  const { data: companiesData, error: companiesError } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  if (companiesError) throw companiesError;

  // Fetch transactions
  const { data: txData, error: txError } = await supabase
    .from("transactions")
    .select("company_id, amount");

  if (txError) throw txError;

  // Fetch payments
  const { data: pyData, error: pyError } = await supabase
    .from("payments")
    .select("company_id, amount");

  if (pyError) throw pyError;

  // Fetch goods received
  const { data: grData, error: grError } = await supabase
    .from("goods_received")
    .select("company_id, amount");

  if (grError) throw grError;

  // Process and combine the data
  const processedCompanies = (companiesData || []).map((company) => {
    const companyTxs = txData?.filter((tx) => tx.company_id === company.id) || [];
    const companyPys = pyData?.filter((py) => py.company_id === company.id) || [];
    const companyGrs = grData?.filter((gr) => gr.company_id === company.id) || [];

    const totalSales = companyTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const totalPayments = companyPys.reduce((sum, py) => sum + Number(py.amount || 0), 0);
    const totalGoodsRecieved = companyGrs.reduce((sum, gr) => sum + Number(gr.amount || 0), 0);
    const openingBal = Number(company.opening_balance || 0);

    return {
      ...company,
      invoices: companyTxs.length,
      balance: totalSales - totalPayments - totalGoodsRecieved + openingBal,
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
