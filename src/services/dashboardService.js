import { supabase, fetchAllRows } from "./supabase";

/** Buckets rows by company_id so the balance loop below scans each row once. */
function groupByCompany(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = String(row.company_id);
    const existing = groups.get(key);
    if (existing) existing.push(row);
    else groups.set(key, [row]);
  }
  return groups;
}

const NO_ROWS = [];

export async function getDashboardData() {
  // Execute a single isolated network request batch. Each table is paged in
  // full — a plain select stops at the 1000-row cap and the totals drift.
  // The created_at ordering is the original one and drives the Recent Activities
  // list; id is only a tiebreaker so paging can't repeat or skip rows.
  const [companies, transactions, payments, goodsReceived] = await Promise.all([
    fetchAllRows(() => supabase.from("companies").select("*").order("id", { ascending: true })),
    fetchAllRows(() =>
      supabase.from("transactions").select("*")
        .order("created_at", { ascending: false }).order("id", { ascending: true })
    ),
    fetchAllRows(() =>
      supabase.from("payments").select("*")
        .order("created_at", { ascending: false }).order("id", { ascending: true })
    ),
    fetchAllRows(() =>
      supabase.from("goods_received").select("*")
        .order("created_at", { ascending: false }).order("id", { ascending: true })
    )
  ]);

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
  // Calculate directly here to avoid extra DB hits, using per-company buckets
  // so this stays fast as the transaction history grows.
  const salesByCompany = groupByCompany(transactions);
  const paymentsByCompany = groupByCompany(payments);
  const goodsByCompany = groupByCompany(goodsReceived);

  companies.forEach(company => {
    const key = String(company.id);
    let bal = Number(company.opening_balance || 0);

    (salesByCompany.get(key) || NO_ROWS).forEach(sale => {
      bal += Number(sale.amount || 0);
    });

    (paymentsByCompany.get(key) || NO_ROWS).forEach(payment => {
      if (Number(payment.amount) < 0) bal += Math.abs(Number(payment.amount));
      else bal -= Number(payment.amount || 0);
    });

    (goodsByCompany.get(key) || NO_ROWS).forEach(goods => {
      bal -= Number(goods.amount || 0);
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
