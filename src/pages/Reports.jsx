import React, { useState, useRef } from "react";
import Calendar from "@sbmdkl/nepali-datepicker-reactjs";
import "@sbmdkl/nepali-datepicker-reactjs/dist/index.css";
import { useCompanies } from "../contexts/CompaniesContext";
import { useReports } from "../contexts/ReportsContext";
import { useToast } from "../contexts/ToastContext";
import { useSettings } from "../contexts/SettingsContext";
import { getCompanyLedger } from "../services/reportsService";
import { IoDownloadOutline, IoFileTrayOutline, IoImageOutline, IoSearchOutline, IoPrintOutline } from "react-icons/io5";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getTodayBS } from "../utils/nepaliDate";

function Reports() {
  const { companies } = useCompanies();
  const { addToast } = useToast();
  const { settings } = useSettings();
  const reportRef = useRef();
  
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

  const getExportCount = (companyName) => {
    const counts = JSON.parse(localStorage.getItem("export_counts") || "{}");
    const count = (counts[companyName] || 0) + 1;
    counts[companyName] = count;
    localStorage.setItem("export_counts", JSON.stringify(counts));
    return count;
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setLoading(true);
    try {
      const companyName = reportData.company.name;
      const count = getExportCount(companyName);
      const filename = `${companyName}(${count}).pdf`;

      const element = reportRef.current;
      // Use a slightly lower scale for 500kb target
      const canvas = await html2canvas(element, { scale: 1.5, useCORS: true });
      // Use JPEG with quality compression (0.7) for smaller file size
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(filename);
      addToast(`PDF optimized & exported as ${filename}`, "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to export PDF.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    setLoading(true);
    try {
      const companyName = reportData.company.name;
      const count = getExportCount(companyName);
      const filename = `${companyName}(${count}).png`;

      const element = reportRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
      addToast(`Image exported as ${filename}`, "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to export image.", "error");
    } finally {
      setLoading(false);
    }
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
                  value={startDate}
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
              value={endDate}
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
            <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleExportImage}
                  disabled={loading}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.borderColor = '#9ca3af'}
                  onMouseOut={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  <IoImageOutline fontSize="16px" /> Export PNG
                </button>
                <button 
                  onClick={handleExportPDF}
                  disabled={loading}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <IoFileTrayOutline fontSize="16px" /> Export PDF
                </button>
            </div>
          </div>

          <div ref={reportRef} style={{ background: '#fff', padding: '10px' }}>
            {/* User Company Header - Maximized clarity and compactness */}
            <div style={{ textAlign: 'center', padding: '10px 10px', borderBottom: '2.5px solid #000', marginBottom: '12px' }}>
               <h1 style={{ margin: '0 0 2px', fontSize: '34px', fontWeight: '1000', color: '#000', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{settings.companyName}</h1>
               <p style={{ margin: '1px 0', fontSize: '16px', color: '#000', fontWeight: '800' }}>{settings.address}</p>
               <p style={{ margin: '1px 0', fontSize: '16px', color: '#000', fontWeight: '700' }}>Ph: {settings.phone} | Email: {settings.email}</p>
               
               <div style={{ marginTop: '8px', display: 'inline-block', padding: '2px 10px', border: '2px solid #000', borderRadius: '4px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '950', color: '#000', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ledger Report</span>
               </div>
               
               <div style={{ marginTop: '10px' }}>
                  <p style={{ fontSize: '18px', fontWeight: '1000', color: '#000', margin: '0' }}>Customer: {reportData.company.name}</p>
                  <p style={{ fontSize: '14px', color: '#000', marginTop: '1px', fontWeight: '800' }}> Period: {startDate || 'Start'} to {endDate || 'End'} | Date: {getTodayBS()}</p>
               </div>
            </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'center', tableLayout: 'auto' }}>
              <thead>
                <tr style={{ background: '#e5e7eb', color: '#000', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2.5px solid #000' }}>
                  <th style={{ padding: '6px 4px', fontWeight: '950' }}>Date</th>
                  <th style={{ padding: '6px 4px', fontWeight: '950' }}>Type</th>
                  <th style={{ padding: '6px 4px', fontWeight: '950' }}>Item / Category</th>
                  <th style={{ padding: '6px 4px', fontWeight: '950' }}>Boxes</th>
                  <th style={{ padding: '6px 4px', fontWeight: '950' }}>Wt/Box</th>
                  <th style={{ padding: '6px 4px', fontWeight: '950' }}>Total Wt</th>
                  <th style={{ padding: '6px 4px', fontWeight: '950' }}>Rate</th>
                  <th style={{ padding: '6px 4px', fontWeight: '950', color: '#047857' }}>Debit (Rs)</th>
                  <th style={{ padding: '6px 4px', fontWeight: '950', color: '#1d4ed8' }}>Credit (Rs)</th>
                  <th style={{ padding: '6px 4px', fontWeight: '950' }}>Balance (Rs)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '2px solid #000', background: '#f8fafc' }}>
                  <td style={{ padding: '8px 4px', fontSize: '14px', color: '#000', fontWeight: '800' }}>---</td>
                  <td colSpan="8" style={{ padding: '8px 4px', fontSize: '16px', fontWeight: '1000', color: '#000', textAlign: 'left' }}>Opening Balance</td>
                  <td style={{ padding: '8px 4px', fontSize: '17px', fontWeight: '1000', textAlign: 'right', color: runningBalance >= 0 ? '#4338ca' : '#dc2626' }}>
                    {runningBalance.toLocaleString()}
                  </td>
                </tr>

                {reportData.entries.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No transactions found for the selected period.</td>
                  </tr>
                ) : (() => {
                  const renderedRows = [];
                  let dailyDebit = 0;
                  let dailyCredit = 0;
                  let currentDate = null;

                  reportData.entries.forEach((entry, index) => {
                    const isNewDate = currentDate !== null && entry.nepal_date !== currentDate;
                    
                    if (isNewDate) {
                      // Push Daily Subtotal for the PREVIOUS date
                      renderedRows.push(
                        <tr key={`subtotal-${currentDate}`} style={{ background: '#f3f4f6', borderBottom: '2px solid #000', borderTop: '1px solid #000' }}>
                          <td colSpan="8" style={{ padding: '6px 12px', fontSize: '14px', fontWeight: '900', textAlign: 'right', color: '#000', textTransform: 'uppercase' }}>Total for {currentDate}</td>
                          <td style={{ padding: '6px 12px', fontSize: '15px', fontWeight: '950', textAlign: 'right', color: '#047857' }}>{dailyDebit > 0 ? dailyDebit.toLocaleString() : '-'}</td>
                          <td style={{ padding: '6px 12px', fontSize: '15px', fontWeight: '950', textAlign: 'right', color: '#1d4ed8' }}>{dailyCredit > 0 ? dailyCredit.toLocaleString() : '-'}</td>
                          <td style={{ padding: '6px 12px', fontSize: '16px', fontWeight: '1000', textAlign: 'right', color: '#000' }}>{runningBalance.toLocaleString()}</td>
                        </tr>
                      );
                      // Visual Gap
                      renderedRows.push(<tr key={`gap-${currentDate}`} style={{ height: '8px', background: '#fff' }}><td colSpan="11"></td></tr>);
                      
                      dailyDebit = 0;
                      dailyCredit = 0;
                    }

                    currentDate = entry.nepal_date;
                    
                    let debit = 0;
                    let credit = 0;
                    let typeLabel = "---";
                    let itemDesc = "---";
                    let boxes = "---";
                    let wtBox = "---";
                    let totalWt = "---";
                    let rate = "---";
                    let remarks = "---";

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
                      if (isPenalty) debit = Math.abs(Number(entry.amount));
                      else credit = Number(entry.amount);
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
                    dailyDebit += debit;
                    dailyCredit += credit;
                    runningBalance = runningBalance + debit - credit;

                    renderedRows.push(
                      <tr key={entry.id} style={{ borderBottom: '1.5px solid #000' }}>
                        <td style={{ padding: '6px 4px', fontSize: '15px', color: '#000', fontWeight: '800' }}>{entry.nepal_date}</td>
                        <td style={{ padding: '6px 4px' }}>{typeLabel}</td>
                        <td style={{ padding: '6px 4px', fontSize: '16px', fontWeight: '1000', color: '#000' }}>{itemDesc}</td>
                        <td style={{ padding: '6px 4px', fontSize: '15px', color: '#000', fontWeight: '800' }}>{boxes}</td>
                        <td style={{ padding: '6px 4px', fontSize: '15px', color: '#000', fontWeight: '800' }}>{wtBox !== '---' ? wtBox : '-'}</td>
                        <td style={{ padding: '6px 4px', fontSize: '15.5px', color: '#000', fontWeight: '1000' }}>{totalWt !== '---' ? totalWt : '-'}</td>
                        <td style={{ padding: '6px 4px', fontSize: '15px', color: '#000', fontWeight: '800' }}>{rate !== '---' ? rate : '-'}</td>
                        <td style={{ padding: '6px 4px', fontSize: '16.5px', color: '#047857', textAlign: 'right', fontWeight: '1000' }}>{debit > 0 ? debit.toLocaleString() : '-'}</td>
                        <td style={{ padding: '6px 4px', fontSize: '16.5px', color: '#1d4ed8', textAlign: 'right', fontWeight: '1000' }}>{credit > 0 ? credit.toLocaleString() : '-'}</td>
                        <td style={{ padding: '6px 4px', fontSize: '17px', color: '#000', textAlign: 'right', fontWeight: '1000' }}>{runningBalance.toLocaleString()}</td>
                      </tr>
                    );

                    // If it's the last entry, push the final subtotal row
                    if (index === reportData.entries.length - 1) {
                      renderedRows.push(
                        <tr key={`subtotal-last-${currentDate}`} style={{ background: '#f3f4f6', borderBottom: '2px solid #000', borderTop: '1px solid #000' }}>
                           <td colSpan="8" style={{ padding: '6px 12px', fontSize: '14px', fontWeight: '900', textAlign: 'right', color: '#000', textTransform: 'uppercase' }}>Total for {currentDate}</td>
                           <td style={{ padding: '6px 12px', fontSize: '15px', fontWeight: '950', textAlign: 'right', color: '#047857' }}>{dailyDebit > 0 ? dailyDebit.toLocaleString() : '-'}</td>
                           <td style={{ padding: '6px 12px', fontSize: '15px', fontWeight: '950', textAlign: 'right', color: '#1d4ed8' }}>{dailyCredit > 0 ? dailyCredit.toLocaleString() : '-'}</td>
                           <td style={{ padding: '6px 12px', fontSize: '16px', fontWeight: '1000', textAlign: 'right', color: '#000' }}>{runningBalance.toLocaleString()}</td>
                        </tr>
                      );
                    }
                  });
                  return renderedRows;
                })()}

                <tr style={{ background: '#e5e7eb', borderTop: '2.5px solid #000' }}>
                  <td colSpan="8" style={{ padding: '10px 12px', fontSize: '16px', fontWeight: '950', textAlign: 'right', color: '#000' }}>Closing Totals</td>
                  <td style={{ padding: '10px 12px', fontSize: '16.5px', fontWeight: '950', textAlign: 'right', color: '#047857' }}>{totalDebit.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', fontSize: '16.5px', fontWeight: '950', textAlign: 'right', color: '#1d4ed8' }}>{totalCredit.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', fontSize: '18px', fontWeight: '1000', textAlign: 'right', color: runningBalance >= 0 ? '#4338ca' : '#dc2626' }}>
                    {runningBalance.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

export default Reports;