import { supabase } from "./supabase";

export async function getDashboardData() {
  // Execute a single isolated network request batch.
  const [companiesRes, txRes, pyRes, grRes] = await Promise.all([
    supabase.from("companies").select("*"),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }),
    supabase.from("payments").select("*").order("created_at", { ascending: false }),
    supabase.from("goods_received").select("*").order("created_at", { ascending: false })
  ]);

  if (companiesRes.error) throw companiesRes.error;

  const companies = companiesRes.data || [];
  const transactions = txRes.data || [];
  const payments = pyRes.data || [];
  const goodsReceived = grRes.data || [];

  let totalSales = 0;
  transactions.forEach(t => totalSales += Number(t.amount || 0));
  // Include opening balances from all companies in total sales
  companies.forEach(c => totalSales += Number(c.opening_balance || 0));

  let totalPayments = 0;
  let totalPenalties = 0;
  payments.forEach(p => {
    if (Number(p.amount) < 0) totalPenalties += Math.abs(Number(p.amount));
    else totalPayments += Number(p.amount);
  });

  let totalGoodsReceived = 0;
  goodsReceived.forEach(g => totalGoodsReceived += Number(g.amount || 0));

  let pendingReceivables = 0;
  // Calculate directly here using strict string comparison to avoid extra DB hits
  companies.forEach(company => {
    let bal = Number(company.opening_balance || 0);

    transactions.forEach(sale => {
      if (String(sale.company_id) === String(company.id)) bal += Number(sale.amount || 0);
    });

    payments.forEach(payment => {
      if (String(payment.company_id) === String(company.id)) {
        if (Number(payment.amount) < 0) bal += Math.abs(Number(payment.amount));
        else bal -= Number(payment.amount || 0);
      }
    });

    goodsReceived.forEach(goods => {
      if (String(goods.company_id) === String(company.id)) bal -= Number(goods.amount || 0);
    });

    pendingReceivables += (bal > 0 ? bal : 0);
  });

  let allEntries = [
    ...transactions.map(t => ({ ...t, type: 'SALE', sortDate: new Date(t.created_at).getTime() })),
    ...payments.map(p => ({ ...p, type: 'PAYMENT', sortDate: new Date(p.created_at).getTime() })),
    ...goodsReceived.map(g => ({ ...g, type: 'GOODS_RECEIVED', sortDate: new Date(g.created_at).getTime() }))
  ];
  allEntries.sort((a, b) => b.sortDate - a.sortDate); 

  allEntries = allEntries.map(entry => {
     const comp = companies.find(c => String(c.id) === String(entry.company_id));
     return { ...entry, companyName: comp ? comp.name : 'Unknown' };
  });

  const salesByDate = {};
  const dateToDayName = {};
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  transactions.forEach(t => {
     if (!salesByDate[t.nepal_date]) {
         salesByDate[t.nepal_date] = 0;
         const d = new Date(t.created_at);
         if (!isNaN(d.getTime())) {
            dateToDayName[t.nepal_date] = dayNames[d.getDay()];
         }
     }
     salesByDate[t.nepal_date] += Number(t.amount);
  });

  return {
    totals: {
       sales: totalSales + totalPenalties,
       payments: totalPayments,
       due: pendingReceivables,
       goods: totalGoodsReceived,
       clients: companies.length
    },
    activities: allEntries.slice(0, 30),
    salesByDate,
    dateToDayName
  };
}
