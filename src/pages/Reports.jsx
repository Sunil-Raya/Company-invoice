import React, { useState } from "react";
import Calendar from "@sbmdkl/nepali-datepicker-reactjs";
import "@sbmdkl/nepali-datepicker-reactjs/dist/index.css";
import { useCompanies } from "../contexts/CompaniesContext";
import { useToast } from "../contexts/ToastContext";
import { getCompanyLedger } from "../services/reportsService";

function Reports() {
  const { companies } = useCompanies();
  const { addToast } = useToast();
  
  const [companyId, setCompanyId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [presetDays, setPresetDays] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const handleGenerate = async () => {
    if (!companyId) {
      addToast("Please select a company to view the report.", "error");
      return;
    }
    
    setLoading(true);
    try {
      const data = await getCompanyLedger(companyId, { startDate, endDate, presetDays });
      setReportData(data);
    } catch (err) {
      console.error(err);
      addToast("Failed to generate report.", "error");
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (days) => {
    setPresetDays(days);
    setStartDate("");
    setEndDate("");
  };

  const handleDateChange = (isStart, bsDate) => {
    setPresetDays(null);
    if (isStart) setStartDate(bsDate);
    else setEndDate(bsDate);
  };

  let runningBalance = reportData ? reportData.openingBalance : 0;
  let totalDebit = 0;
  let totalCredit = 0;

  return (
    <div className="reports-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>Company Ledger Report</h2>

      {/* Filters Section */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '20px', alignItems: 'end' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Select Company</label>
            <select 
              value={companyId} 
              onChange={(e) => setCompanyId(e.target.value)}
              style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', height: '42.5px' }}
            >
              <option value="">-- Select Company --</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Quick Presets</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[ {label: 'All Time', val: null}, {label: 'Last 3 Days', val: 3}, {label: 'Last 7 Days', val: 7}, {label: 'Last 15 Days', val: 15}, {label: 'Last 30 Days', val: 30} ].map(preset => (
                <button
                  key={preset.label}
                  onClick={() => setPreset(preset.val)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: presetDays === preset.val ? '#4f46e5' : '#f3f4f6',
                    color: presetDays === preset.val ? '#fff' : '#374151',
                    border: '1px solid',
                    borderColor: presetDays === preset.val ? '#4f46e5' : '#e5e7eb',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: presetDays === preset.val ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '20px', alignItems: 'end', marginTop: '4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'flex', justifyContent: 'space-between' }}>
              <span>Start Date (BS)</span>
              {startDate && <span style={{ color: '#ef4444', cursor: 'pointer', fontSize: '11px' }} onClick={() => setStartDate("")}>Clear</span>}
            </label>
            <div style={{ position: 'relative' }}>
               <Calendar 
                  key={`start-${startDate}`}
                  onChange={({ bsDate }) => handleDateChange(true, bsDate)} 
                  theme="default" 
                  language="en"
                  hideDefaultValue={true}
                  placeholder="Select Start Date"
                  className="custom-calendar-input"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', height: '42.5px' }}
                />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'flex', justifyContent: 'space-between' }}>
              <span>End Date (BS)</span>
              {endDate && <span style={{ color: '#ef4444', cursor: 'pointer', fontSize: '11px' }} onClick={() => setEndDate("")}>Clear</span>}
            </label>
            <Calendar 
              key={`end-${endDate}`}
              onChange={({ bsDate }) => handleDateChange(false, bsDate)} 
              theme="default" 
              language="en"
              hideDefaultValue={true}
              placeholder="Select End Date"
              className="custom-calendar-input"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', height: '42.5px' }}
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: '#111', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '14px', 
              fontWeight: '600', 
              cursor: loading ? 'not-allowed' : 'pointer',
              height: '42.5px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Ledger View */}
      {reportData && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: '0 0 4px' }}>Statement of Account</h3>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{reportData.company.name}</p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', color: '#374151', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 16px', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600' }}>Item / Category</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Boxes</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Wt/Box</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Total Wt</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600' }}>Remarks</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right', color: '#10b981' }}>Debit (Rs)</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right', color: '#3b82f6' }}>Credit (Rs)</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Balance (Rs)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>---</td>
                  <td colSpan="9" style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: '600', color: '#334155' }}>Opening Balance</td>
                  <td style={{ padding: '14px 16px', fontSize: '14.5px', fontWeight: '700', textAlign: 'right', color: runningBalance >= 0 ? '#4f46e5' : '#ef4444' }}>
                    {runningBalance.toLocaleString()}
                  </td>
                </tr>

                {reportData.entries.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No transactions found for the selected period.</td>
                  </tr>
                ) : (
                  reportData.entries.map(entry => {
                    let typeLabel = "---";
                    let itemDesc = "---";
                    let boxes = "---";
                    let wtBox = "---";
                    let totalWt = "---";
                    let rate = "---";
                    let remarks = "---";
                    
                    let debit = 0;
                    let credit = 0;

                    if (entry.type === 'SALE') {
                      typeLabel = <span style={{ padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>Sale</span>;
                      itemDesc = entry.goods_name;
                      boxes = entry.num_boxes || "---";
                      wtBox = entry.weight_per_box ? `${entry.weight_per_box} kg` : "---";
                      totalWt = `${entry.total_weight} kg`;
                      rate = `Rs. ${entry.amount_per_kg}`;
                      debit = Number(entry.amount);
                    } else if (entry.type === 'PAYMENT') {
                      let isPenalty = Number(entry.amount) < 0;
                      typeLabel = <span style={{ padding: '4px 10px', background: isPenalty ? '#fee2e2' : '#dbeafe', color: isPenalty ? '#991b1b' : '#1e40af', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{isPenalty ? 'Penalty' : 'Payment'}</span>;
                      itemDesc = entry.category;
                      remarks = entry.remarks || "---";
                      if (isPenalty) {
                        debit = Math.abs(Number(entry.amount));
                      } else {
                        credit = Number(entry.amount);
                      }
                    } else if (entry.type === 'GOODS_RECEIVED') {
                      typeLabel = <span style={{ padding: '4px 10px', background: '#f3e8ff', color: '#6b21a8', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>Goods Recv</span>;
                      itemDesc = entry.goods_name;
                      boxes = entry.num_boxes || "---";
                      wtBox = entry.weight_per_box ? `${entry.weight_per_box} kg` : "---";
                      totalWt = `${entry.total_weight} kg`;
                      rate = `Rs. ${entry.amount_per_kg}`;
                      remarks = entry.remarks || "---";
                      credit = Number(entry.amount);
                    }

                    totalDebit += debit;
                    totalCredit += credit;
                    runningBalance = runningBalance + debit - credit;

                    return (
                      <tr key={entry.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background='#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background='transparent'}>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151', whiteSpace: 'nowrap' }}>{entry.nepal_date}</td>
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>{typeLabel}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: '#111', whiteSpace: 'nowrap' }}>{itemDesc}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#4b5563', textAlign: 'right' }}>{boxes}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#4b5563', textAlign: 'right', whiteSpace: 'nowrap' }}>{wtBox}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#111', fontWeight: '600', textAlign: 'right', whiteSpace: 'nowrap' }}>{totalWt}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#111', textAlign: 'right', whiteSpace: 'nowrap' }}>{rate}</td>
                        <td style={{ padding: '14px 16px', fontSize: '12.5px', color: '#6b7280', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={remarks !== "---" ? remarks : ""}>{remarks}</td>
                        
                        <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#10b981', textAlign: 'right', fontWeight: '600' }}>
                          {debit > 0 ? debit.toLocaleString() : '-'}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#3b82f6', textAlign: 'right', fontWeight: '600' }}>
                          {credit > 0 ? credit.toLocaleString() : '-'}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', color: '#111', textAlign: 'right', fontWeight: '700' }}>
                          {runningBalance.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}

                <tr style={{ background: '#f3f4f6', borderTop: '2px solid #e5e7eb' }}>
                  <td colSpan="8" style={{ padding: '16px 16px', fontSize: '14px', fontWeight: '700', textAlign: 'right', color: '#111' }}>Closing Totals</td>
                  <td style={{ padding: '16px 16px', fontSize: '14.5px', fontWeight: '700', textAlign: 'right', color: '#10b981' }}>{totalDebit.toLocaleString()}</td>
                  <td style={{ padding: '16px 16px', fontSize: '14.5px', fontWeight: '700', textAlign: 'right', color: '#3b82f6' }}>{totalCredit.toLocaleString()}</td>
                  <td style={{ padding: '16px 16px', fontSize: '15.5px', fontWeight: '800', textAlign: 'right', color: runningBalance >= 0 ? '#4f46e5' : '#ef4444' }}>
                    {runningBalance.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;