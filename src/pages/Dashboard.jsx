import React, { useState, useEffect, useMemo } from "react";
import { getDashboardData } from "../services/dashboardService";
import { useToast } from "../contexts/ToastContext";
import { 
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as AreaTooltip, ResponsiveContainer 
} from "recharts";
import { FiShoppingBag, FiTrendingUp, FiDollarSign, FiBox } from "react-icons/fi";
import VectorLoader from "../components/VectorLoader";

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  
  const [chartFilter, setChartFilter] = useState("month");

  useEffect(() => {
    async function load() {
      try {
        const res = await getDashboardData();
        setData(res);
      } catch (err) {
        addToast("Failed to load dashboard data.", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [addToast]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6'];

  const donutData = useMemo(() => {
    if (!data) return [];
    const due = Math.max(0, data.totals.due);
    return [
      { name: "Total Sold", value: data.totals.sales },
      { name: "Received", value: data.totals.payments },
      { name: "Pending Due", value: due },
      { name: "Goods Recv", value: data.totals.goods }
    ];
  }, [data]);

  const chartData = useMemo(() => {
    if (!data || !data.salesByDate) return [];
    const sales = data.salesByDate;
    const sortedDates = Object.keys(sales).sort();
    if (sortedDates.length === 0) return [];

    const latestDate = sortedDates[sortedDates.length - 1]; 
    const nepaliMonths = ["Baisakh", "Jestha", "Asar", "Shrawan", "Bhadra", "Asoj", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];
    
    if (chartFilter === "week") {
      const last7 = sortedDates.slice(-7);
      return last7.map(d => ({ 
        date: data.dateToDayName && data.dateToDayName[d] ? data.dateToDayName[d] : d.substring(5), 
        amount: sales[d], 
        fullDate: d 
      }));
    } 
    else if (chartFilter === "month") {
      const currentMonth = latestDate.substring(0, 7); 
      const result = [];
      for (let i = 1; i <= 31; i++) {
        const dayStr = i < 10 ? `0${i}` : `${i}`;
        const fullDate = `${currentMonth}-${dayStr}`;
        result.push({ date: dayStr, amount: sales[fullDate] || 0, fullDate });
      }
      return result;
    } 
    else if (chartFilter === "year") {
      const currentYear = latestDate.substring(0, 4);       
      const result = [];
      for (let i = 1; i <= 12; i++) {
        const monthStr = i < 10 ? `0${i}` : `${i}`;
        const prefix = `${currentYear}-${monthStr}`;
        let monthTotal = 0;
        Object.keys(sales).forEach(d => {
           if (d.startsWith(prefix)) monthTotal += sales[d];
        });
        result.push({ date: nepaliMonths[i-1], amount: monthTotal, fullDate: prefix });
      }
      return result;
    }
    return [];
  }, [data, chartFilter]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', background: '#f9fafb' }}>
         <VectorLoader />
         <div style={{ color: '#6b7280', fontSize: '15px', fontWeight: '700', letterSpacing: '0.5px' }}>Compiling Analytics...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '0', gap: '24px', boxSizing: 'border-box' }}>
      
      {/* Header & Minimalist Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, paddingRight: '12px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111', margin: 0 }}>Overview</h2>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ padding: '12px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '8px', background: '#eef2ff', borderRadius: '8px', color: '#4f46e5' }}><FiShoppingBag size={18}/></div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sales</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#111' }}>Rs. {data.totals.sales.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ padding: '12px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '8px', background: '#dcfce7', borderRadius: '8px', color: '#10b981' }}><FiDollarSign size={18}/></div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Received</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#111' }}>Rs. {data.totals.payments.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ padding: '12px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '8px', background: '#fef3c7', borderRadius: '8px', color: '#f59e0b' }}><FiTrendingUp size={18}/></div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Due</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#111' }}>Rs. {data.totals.due.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row - 50% 50% */}
      <div style={{ display: 'flex', gap: '20px', height: '28vh', minHeight: '220px', flexShrink: 0, paddingRight: '12px' }}>
        
        {/* Line Chart */}
        <div className="card" style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: 0 }}>Revenue Trend</h3>
            <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '4px', borderRadius: '6px' }}>
              {['week', 'month', 'year'].map(f => (
                <button 
                  key={f}
                  onClick={() => setChartFilter(f)}
                  style={{ 
                    padding: '4px 10px', 
                    fontSize: '11px', 
                    fontWeight: chartFilter === f ? '600' : '500',
                    color: chartFilter === f ? '#111' : '#6b7280',
                    background: chartFilter === f ? 'white' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    boxShadow: chartFilter === f ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  This {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={10} minTickGap={0} interval={0} angle={-45} textAnchor="end" height={45} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(val) => `Rs.${val}`} dx={-5} width={65} />
                <AreaTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontWeight: '600', fontSize: '12px', padding: '8px 12px' }}
                  formatter={(value) => [`Rs. ${value.toLocaleString()}`, "Sales"]}
                  labelStyle={{ color: '#6b7280', marginBottom: '2px' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="card" style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 16px', flexShrink: 0 }}>Financial Breakdown</h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 0, gap: '24px' }}>
            <div style={{ flex: '1 1 50%', height: '100%', minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} innerRadius="60%" outerRadius="90%" dataKey="value" stroke="none">
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <PieTooltip 
                    formatter={(value) => `Rs. ${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontWeight: '600', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
               {donutData.map((entry, index) => (
                 <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length], flexShrink: 0 }}></div>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#111', flexShrink: 0, paddingLeft: '8px' }}>Rs. {entry.value.toLocaleString()}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities - Bottom Part */}
      <div className="card" style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', minHeight: 0, marginRight: '12px', marginBottom: '12px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexShrink: 0 }}>
           <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: 0 }}>Live Activities</h3>
           <span style={{ padding: '2px 8px', background: '#eef2ff', color: '#4f46e5', borderRadius: '12px', fontSize: '10px', fontWeight: '600' }}>Live</span>
         </div>
         
         <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
           {data.activities.length === 0 ? (
             <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No activities logged yet.</div>
           ) : (
             <div style={{ display: 'flex', flexDirection: 'column' }}>
               {data.activities.map((act, index) => {
                 let icon, color, bg, title, desc, amtStr;
                 let isPenalty = false;

                 if (act.type === 'SALE') {
                   icon = <FiShoppingBag size={14} />; color = '#10b981'; bg = '#dcfce7';
                   title = "Sold Goods";
                   desc = act.goods_name;
                   amtStr = `+ Rs.${act.amount}`;
                 } else if (act.type === 'PAYMENT') {
                   isPenalty = Number(act.amount) < 0;
                   if (isPenalty) {
                      icon = <FiTrendingUp size={14} />; color = '#ef4444'; bg = '#fee2e2';
                      title = "Penalty/Fee";
                      desc = act.category;
                      amtStr = `+ Rs.${Math.abs(act.amount)}`;
                   } else {
                      icon = <FiDollarSign size={14} />; color = '#3b82f6'; bg = '#dbeafe';
                      title = "Payment";
                      desc = act.category;
                      amtStr = `- Rs.${act.amount}`;
                   }
                 } else if (act.type === 'GOODS_RECEIVED') {
                   icon = <FiBox size={14} />; color = '#8b5cf6'; bg = '#f3e8ff';
                   title = "Received";
                   desc = act.goods_name;
                   amtStr = `- Rs.${act.amount}`;
                 }

                 return (
                   <div key={`${act.id}-${act.type}-${index}`} style={{ padding: '12px 16px', borderBottom: '1px solid #f9fafb', display: 'flex', gap: '16px', alignItems: 'center', transition: 'background 0.2s', borderRadius: '8px' }} onMouseEnter={e => e.currentTarget.style.background='#f8fafc'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                     <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                       {icon}
                     </div>
                     <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                         <span style={{ fontSize: '14px', fontWeight: '700', color: '#111', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{act.companyName}</span>
                         <span style={{ fontSize: '12px', color: '#6b7280' }}>{title} &bull; {desc} &bull; <span style={{ color: '#9ca3af' }}>{act.nepal_date}</span></span>
                       </div>
                       <span style={{ fontSize: '14px', fontWeight: '700', color: color, flexShrink: 0 }}>{amtStr}</span>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
         </div>
      </div>

    </div>
  );
}

export default Dashboard;