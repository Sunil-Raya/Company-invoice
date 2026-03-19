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

  // Process and combine the data
  const processedCompanies = (companiesData || []).map((company) => {
    const companyTxs = txData?.filter((tx) => tx.company_id === company.id) || [];
    const companyPys = pyData?.filter((py) => py.company_id === company.id) || [];

    const totalSales = companyTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const totalPayments = companyPys.reduce((sum, py) => sum + Number(py.amount || 0), 0);

    return {
      ...company,
      invoices: companyTxs.length,
      balance: totalSales - totalPayments,
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
 * Deletes a company by its ID.
 */
export async function deleteCompany(id) {
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
  return true;
}
