import React, { useState, useEffect, useMemo } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as AreaTooltip,
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as PieTooltip 
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition, { staggerContainer, staggerItem, hoverEffect } from "../components/PageTransition";
import VectorLoader from "../components/VectorLoader";
import "../styles/dashboard.css";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { FiShoppingBag, FiDollarSign, FiTrendingUp, FiBox, FiCreditCard } from "react-icons/fi";
import { useToast } from "../contexts/ToastContext";
import { getDashboardData } from "../services/dashboardService";

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  
  const [chartFilter, setChartFilter] = useState("month");
  const [searchQuery, setSearchQuery] = useState("");

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
      { name: "Received", value: data.totals.payments },
      { name: "Settled (Goods)", value: data.totals.goods },
      { name: "Pending Due", value: due },
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

  const filteredActivities = useMemo(() => {
    if (!data || !data.activities) return [];
    if (!searchQuery) return data.activities;
    const q = searchQuery.toLowerCase();
    return data.activities.filter(a => 
      (a.companyName || "").toLowerCase().includes(q) || 
      (a.goods_name || "").toLowerCase().includes(q) || 
      (a.category || "").toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 bg-gray-50">
         <VectorLoader />
         <div className="text-gray-500 text-sm font-bold tracking-wider">Compiling Analytics...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="dashboard-container">
        
        {/* Header & Minimalist Stats */}
        <div className="dashboard-header">
          <h2 className="dashboard-title">Overview</h2>
        </div>

        <div className="stats-grid">
          <motion.div 
            variants={staggerItem}
            whileHover={{ scale: 1.02 }}
            className="glass-card"
          >
            <div className="stat-icon-wrapper" style={{ background: '#eef2ff', color: '#4f46e5' }}><FiShoppingBag size={22}/></div>
            <div className="stat-info">
              <div className="stat-label">Total Sales</div>
              <div className="stat-value">Rs. {data.totals.sales.toLocaleString()}</div>
            </div>
          </motion.div>
          
          <motion.div 
            variants={staggerItem}
            whileHover={{ scale: 1.02 }}
            className="glass-card"
          >
            <div className="stat-icon-wrapper" style={{ background: '#dcfce7', color: '#10b981' }}><FiDollarSign size={22}/></div>
            <div className="stat-info">
              <div className="stat-label">Received</div>
              <div className="stat-value">Rs. {data.totals.payments.toLocaleString()}</div>
            </div>
          </motion.div>

          <motion.div 
            variants={staggerItem}
            whileHover={{ scale: 1.02 }}
            className="glass-card"
          >
            <div className="stat-icon-wrapper" style={{ background: '#fff7ed', color: '#f97316' }}><FiCreditCard size={22}/></div>
            <div className="stat-info">
              <div className="stat-label">Pending Due</div>
              <div className="stat-value">Rs. {data.totals.due.toLocaleString()}</div>
            </div>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="dashboard-charts-row" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', minWidth: 0 }}>
          {/* Revenue Trend Area Chart */}
          <div className="chart-card" style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', minHeight: '400px', minWidth: 0 }}>
            <div className="chart-header">
              <h3 className="chart-title">Revenue Dynamics</h3>
              <div className="filter-pills">
                {['week', 'month', 'year'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setChartFilter(f)}
                    className={`pill-btn ${chartFilter === f ? 'active' : ''}`}
                  >
                    This {f}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: '300px', width: '100%', minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
                    tickFormatter={(val) => `Rs.${val > 1000 ? (val/1000)+'k' : val}`} 
                  />
                  <AreaTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: '700', fontSize: '12px', padding: '12px' }}
                    formatter={(value) => [`Rs. ${value.toLocaleString()}`, "Sales"]}
                    cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown Donut Chart */}
          <div className="chart-card" style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', minHeight: '400px', minWidth: 0 }}>
            <h3 className="chart-title" style={{ marginBottom: '24px' }}>Receivables Overview</h3>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
              <div style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} innerRadius="65%" outerRadius="90%" dataKey="value" stroke="none" paddingAngle={4}>
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <PieTooltip 
                      formatter={(value) => `Rs. ${value.toLocaleString()}`}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: '700' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 {donutData.map((entry, index) => (
                   <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>{entry.name}</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Rs. {entry.value.toLocaleString()}</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Activities Section */}
        <div className="activity-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 className="chart-title">Ledger Pulse</h3>
              <span style={{ padding: '3px 10px', background: '#fef2f2', color: '#ef4444', borderRadius: '20px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em' }}>LIVE FEED</span>
            </div>
            
            <div className="search-bar-wrapper">
              <HiMagnifyingGlass className="search-icon-float" size={18} />
              <input 
                type="text" 
                className="activity-search"
                placeholder="Find in activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="activity-list">
             {filteredActivities.length === 0 ? (
               <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>
                 {searchQuery ? "No activities match your search." : "Your ledger will beat here soon."}
               </div>
             ) : (
               <AnimatePresence mode="popLayout">
                 {filteredActivities.map((act, index) => {
                    let icon, color, bg, title, desc, amtStr, tagClass;
                    let isPenalty = false;
    
                    if (act.type === 'SALE') {
                      icon = <FiShoppingBag />; color = '#10b981'; bg = '#dcfce7';
                      title = "Sales Outflow";
                      desc = act.goods_name;
                      amtStr = `+ Rs.${act.amount.toLocaleString()}`;
                      tagClass = "tag-sale";
                    } else if (act.type === 'PAYMENT') {
                      isPenalty = Number(act.amount) < 0;
                      if (isPenalty) {
                         icon = <FiTrendingUp />; color = '#ef4444'; bg = '#fee2e2';
                         title = "Fee/Penalty Adjustment";
                         // If category is Custom and remarks exist, use remarks as the description
                         if (act.category === 'Custom' && act.remarks) {
                           desc = act.remarks;
                         } else {
                           desc = (
                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                               <span>{act.category}</span>
                               {act.remarks && <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>({act.remarks})</span>}
                             </div>
                           );
                         }
                         amtStr = `+ Rs.${Math.abs(act.amount).toLocaleString()}`;
                         tagClass = "tag-penalty";
                      } else {
                         icon = <FiDollarSign />; color = '#3b82f6'; bg = '#dbeafe';
                         title = "Revenue Inflow";
                         // If category is Custom and remarks exist, use remarks as the description
                         if (act.category === 'Custom' && act.remarks) {
                           desc = act.remarks;
                         } else {
                           desc = (
                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                               <span>{act.category}</span>
                               {act.remarks && <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>({act.remarks})</span>}
                             </div>
                           );
                         }
                         amtStr = `- Rs.${act.amount.toLocaleString()}`;
                         tagClass = "tag-payment";
                      }
                    } else if (act.type === 'GOODS_RECEIVED') {
                      icon = <FiBox />; color = '#8b5cf6'; bg = '#f3e8ff';
                      title = "Inventory Inflow";
                      desc = act.goods_name;
                      amtStr = `- Rs.${act.amount.toLocaleString()}`;
                      tagClass = "tag-goods";
                    }
    
                    return (
                      <motion.div 
                        key={`${act.type}-${act.id || index}`} 
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="activity-item"
                      >
                        <div className="activity-avatar" style={{ background: bg, color: color }}>
                          {icon}
                        </div>
                        <div className="activity-details">
                          <div className="activity-main-info">
                            <span className="activity-desc">{act.companyName}</span>
                            <div className="activity-meta">
                              <span className={`tag ${tagClass}`}>{act.type.replace('_', ' ')}</span>
                              <span className="dot-separator">&bull;</span>
                              <span>{desc}</span>
                              <span className="dot-separator">&bull;</span>
                              <span>{act.nepal_date}</span>
                            </div>
                          </div>
                          <span className="activity-amount" style={{ color: color }}>{amtStr}</span>
                        </div>
                      </motion.div>
                    );
                 })}
               </AnimatePresence>
             )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default Dashboard;