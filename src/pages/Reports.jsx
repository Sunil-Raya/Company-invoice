import React, { useState, useRef } from "react";
import Calendar from "@sbmdkl/nepali-datepicker-reactjs";
import "@sbmdkl/nepali-datepicker-reactjs/dist/index.css";
import { useCompanies } from "../contexts/CompaniesContext";
import { useToast } from "../contexts/ToastContext";
import { useSettings } from "../contexts/SettingsContext";
import { getCompanyLedger } from "../services/reportsService";
import { IoFileTrayOutline, IoImageOutline, IoSearchOutline, IoPrintOutline, IoPencilOutline, IoTrashOutline } from "react-icons/io5";
import { getTodayBS, subtractDays } from "../utils/nepaliDate";
import { motion } from "framer-motion";
import PageTransition, { staggerContainer, staggerItem } from "../components/PageTransition";
import SearchableSelect from "../components/SearchableSelect";
import EditEntryModal from "../components/EditEntryModal";
import { updateTransaction, deleteTransaction } from "../services/transactionsService";
import { updatePayment, deletePayment } from "../services/paymentsService";
import { updateGoodsReceived, deleteGoodsReceived } from "../services/goodsReceivedService";

function Reports() {
  const { companies, fetchCompanies } = useCompanies();
  const { addToast } = useToast();
  const { settings } = useSettings();
  const reportRef = useRef();
  
  const [companyId, setCompanyId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [presetDays, setPresetDays] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showModernView, setShowModernView] = useState(false);
  
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [startKey, setStartKey] = useState(0);
  const [endKey, setEndKey] = useState(0);

  // Clear report data when company selection changes to prevent stale UI
  React.useEffect(() => {
    if (reportData) setReportData(null);
  }, [companyId]);

  React.useEffect(() => {
    document.title = "Reports | Maa Laxmi Fish Suppliers";
  }, []);

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
    setReportData(null); // Clear old report for fresh feedback
    if (days === null) {
      setStartDate(null);
      setEndDate(null);
    } else {
      const today = getTodayBS();
      const start = subtractDays(today, days - 1);
      setStartDate(start);
      setEndDate(today);
    }
    setStartKey(prev => prev + 1);
    setEndKey(prev => prev + 1);
  };

  const handleDateChange = (isStart, bsDate) => {
    if (isStart) {
      if (bsDate === startDate) return;
      setStartDate(bsDate);
    } else {
      if (bsDate === endDate) return;
      setEndDate(bsDate);
    }
    setPresetDays(null);
    setReportData(null); // Clear old report
  };

  const handleClearDate = (isStart) => {
    if (isStart) {
      setStartDate(null);
      setStartKey(prev => prev + 1);
    } else {
      setEndDate(null);
      setEndKey(prev => prev + 1);
    }
    setPresetDays(null);
    setReportData(null); // Clear old report
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Are you sure you want to delete this ${entry.type === 'GOODS_RECEIVED' ? 'received' : entry.type.replace('_', ' ').toLowerCase()}?`)) return;
    
    setLoading(true);
    try {
      if (entry.type === 'SALE') await deleteTransaction(entry.id);
      else if (entry.type === 'PAYMENT') await deletePayment(entry.id);
      else if (entry.type === 'GOODS_RECEIVED') await deleteGoodsReceived(entry.id);
      
      addToast("Entry deleted successfully.", "success");
      await handleGenerate(); // Refresh report
      await fetchCompanies();  // Refresh balances
    } catch (err) {
      console.error(err);
      addToast("Failed to delete entry.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (updatedData) => {
    console.log("[Reports] handleSaveEdit called with:", updatedData);
    try {
      const { type, id } = updatedData;
      if (!id) throw new Error("Missing entry ID for update.");
      
      let dataToUpdate = {};
      
      if (type === 'SALE') {
        dataToUpdate = {
          company_id: updatedData.company_id,
          nepal_date: updatedData.nepal_date,
          goods_name: updatedData.goods_name,
          num_boxes: updatedData.num_boxes && !isNaN(parseFloat(updatedData.num_boxes)) ? parseFloat(updatedData.num_boxes) : null,
          weight_per_box: updatedData.weight_per_box && !isNaN(parseFloat(updatedData.weight_per_box)) ? parseFloat(updatedData.weight_per_box) : null,
          total_weight: parseFloat(updatedData.total_weight) || 0,
          amount_per_kg: parseFloat(updatedData.amount_per_kg) || 0,
          amount: parseFloat(updatedData.amount) || 0
        };
        await updateTransaction(id, dataToUpdate, updatedData.company_id);
      } else if (type === 'PAYMENT') {
        dataToUpdate = {
          company_id: updatedData.company_id,
          nepal_date: updatedData.nepal_date,
          category: updatedData.category,
          amount: parseFloat(updatedData.amount) || 0,
          remarks: updatedData.remarks || null
        };
        await updatePayment(id, dataToUpdate, updatedData.company_id);
      } else if (type === 'GOODS_RECEIVED') {
        dataToUpdate = {
          company_id: updatedData.company_id,
          nepal_date: updatedData.nepal_date,
          goods_name: updatedData.goods_name,
          num_boxes: updatedData.num_boxes && !isNaN(parseFloat(updatedData.num_boxes)) ? parseFloat(updatedData.num_boxes) : null,
          weight_per_box: updatedData.weight_per_box && !isNaN(parseFloat(updatedData.weight_per_box)) ? parseFloat(updatedData.weight_per_box) : null,
          total_weight: parseFloat(updatedData.total_weight) || 0,
          amount_per_kg: parseFloat(updatedData.amount_per_kg) || 0,
          amount: parseFloat(updatedData.amount) || 0,
          remarks: updatedData.remarks || null
        };
        await updateGoodsReceived(id, dataToUpdate, updatedData.company_id);
      } else {
        throw new Error(`Unknown entry type: ${type}`);
      }
      
      addToast("Entry updated successfully.", "success");
      await handleGenerate(); // Refresh report
      await fetchCompanies();  // Refresh balances
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to update entry.", "error");
      throw err;
    }
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

      setIsExporting(true);
      
      // WAIT for React to re-render and hide the Action column
      await new Promise(resolve => setTimeout(resolve, 300));

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = reportRef.current;
      const table = element.querySelector('table');
      const requiredWidth = Math.max(950, table ? table.scrollWidth : element.scrollWidth);

      // Create a clone to export, ensuring it's not clipped by parents
      const clone = element.cloneNode(true);
      document.body.appendChild(clone);
      
      // Style the clone to be full width and off-screen
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = `${requiredWidth}px`;
      clone.style.maxWidth = 'none';
      
      // Ensure the scroll wrapper in the clone is visible
      const cloneScrollWrapper = clone.querySelector('.report-table-wrapper');
      if (cloneScrollWrapper) {
          cloneScrollWrapper.style.overflowX = 'visible';
          cloneScrollWrapper.style.width = '100%';
          cloneScrollWrapper.style.maxWidth = 'none';
      }

      const canvas = await html2canvas(clone, { 
        scale: 2, 
        useCORS: true,
        logging: false,
        width: requiredWidth,
        windowWidth: requiredWidth,
        backgroundColor: '#ffffff'
      });

      // Cleanup clone
      document.body.removeChild(clone);

      // Use JPEG with quality compression (0.7) for smaller file size
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(filename);
      setIsExporting(false);
      addToast(`PDF optimized & exported as ${filename}`, "success");
    } catch (err) {
      console.error(err);
      setIsExporting(false);
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

      setIsExporting(true);
      
      // WAIT for React to re-render and hide the Action column
      await new Promise(resolve => setTimeout(resolve, 300));

      const html2canvas = (await import("html2canvas")).default;

      const element = reportRef.current;
      const table = element.querySelector('table');
      const requiredWidth = Math.max(950, table ? table.scrollWidth : element.scrollWidth);
      
      // Create a clone to export
      const clone = element.cloneNode(true);
      document.body.appendChild(clone);
      
      // Style the clone
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = `${requiredWidth}px`;
      clone.style.maxWidth = 'none';
      
      const cloneScrollWrapper = clone.querySelector('.report-table-wrapper');
      if (cloneScrollWrapper) {
          cloneScrollWrapper.style.overflowX = 'visible';
          cloneScrollWrapper.style.width = '100%';
          cloneScrollWrapper.style.maxWidth = 'none';
      }

      const canvas = await html2canvas(clone, { 
        scale: 2, 
        useCORS: true,
        logging: false,
        width: requiredWidth,
        windowWidth: requiredWidth,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(clone);

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setIsExporting(false);
      addToast(`Image exported as ${filename}`, "success");
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      addToast("Failed to export image.", "error");
    } finally {
      setLoading(false);
    }
  };

  let runningBalance = Number(reportData?.openingBalance ?? 0);

  return (
    <PageTransition>
      <div className="reports-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>Company Ledger Report</h1>

        {/* Filters Section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
        <div className="form-grid-2" style={{ alignItems: 'end' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 100 }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Select Company</label>
            <SearchableSelect 
              value={companyId} 
              onChange={(val) => setCompanyId(val)}
              options={companies.map((c) => ({ value: String(c.id), label: c.name }))}
              placeholder="-- Select Company --"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Quick Presets</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[ {label: 'All Time', val: null}, {label: 'Last 3 Days', val: 3}, {label: 'Last 7 Days', val: 7}, {label: 'Last 15 Days', val: 15}, {label: 'Last 30 Days', val: 30} ].map(preset => {
                  const isActive = presetDays === preset.val && (preset.val !== null || (!startDate && !endDate));
                  return (
                    <button
                      key={preset.label}
                      onClick={() => setPreset(preset.val)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: isActive ? '#4f46e5' : '#f3f4f6',
                        color: isActive ? '#fff' : '#374151',
                        border: '1px solid',
                        borderColor: isActive ? '#4f46e5' : '#e5e7eb',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: isActive ? '600' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="form-grid-3" style={{ alignItems: 'end', marginTop: '4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'flex', justifyContent: 'space-between' }}>
              <span>Start Date (BS)</span>
              {startDate && <span style={{ color: '#ef4444', cursor: 'pointer', fontSize: '11px' }} onClick={() => handleClearDate(true)}>Clear</span>}
            </label>
            <div style={{ position: 'relative' }}>
                <Calendar 
                  key={`start-${startKey}`}
                  defaultDate={startDate || ""}
                  hideDefaultValue={!startDate}
                  onChange={({ bsDate }) => handleDateChange(true, bsDate)} 
                  theme="default" 
                  language="en"
                  placeholder="Select Start Date"
                  className="custom-calendar-input"
                />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'flex', justifyContent: 'space-between' }}>
              <span>End Date (BS)</span>
              {endDate && <span style={{ color: '#ef4444', cursor: 'pointer', fontSize: '11px' }} onClick={() => handleClearDate(false)}>Clear</span>}
            </label>
            <Calendar 
              key={`end-${endKey}`}
              defaultDate={endDate || ""}
              hideDefaultValue={!endDate}
              onChange={({ bsDate }) => handleDateChange(false, bsDate)} 
              theme="default" 
              language="en"
              placeholder="Select End Date"
              className="custom-calendar-input"
            />
          </div>

          <style>{`
            .custom-calendar-input {
              width: 100%;
              padding: 10px 14px;
              border: 1.5px solid #e5e7eb;
              border-radius: 8px;
              font-size: 14px;
              outline: none;
              transition: border-color 0.2s;
              font-family: inherit;
              height: 42.5px;
            }
            .custom-calendar-input:focus {
              border-color: #6366f1;
            }
          `}</style>

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
      </motion.div>

        {/* Ledger View */}
      {reportData && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: '0 0 4px' }}>Statement of Account</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{reportData.company.name}</p>
                <div 
                  onClick={() => setShowModernView(!showModernView)}
                  style={{ 
                    cursor: 'pointer', padding: '2px 8px', background: showModernView ? '#eef2ff' : '#f3f4f6', color: showModernView ? '#4f46e5' : '#6b7280', borderRadius: '12px', fontSize: '10px', fontWeight: '700', border: '1px solid', borderColor: showModernView ? '#c7d2fe' : '#e5e7eb', transition: 'all 0.2s'
                  }}
                >
                  {showModernView ? "MODERN VIEW ON" : "SWITCH TO MODERN"}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleExportImage}
                  disabled={loading}
                  aria-label="Export report as image"
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.borderColor = '#9ca3af'}
                  onMouseOut={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  <IoImageOutline fontSize="16px" aria-hidden="true" /> Export PNG
                </button>
                <button 
                  onClick={handleExportPDF}
                  disabled={loading}
                  aria-label="Export report as PDF"
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <IoFileTrayOutline fontSize="16px" aria-hidden="true" /> Export PDF
                </button>
            </div>
          </div>

          <div ref={reportRef} style={{ background: '#fff', padding: showModernView ? '30px' : '15px', fontFamily: "Arial, sans-serif" }}>
            {showModernView ? (
              /* MODERN VIEW HEADER */
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {settings.logoUrl && (
                      <img src={settings.logoUrl} alt="Logo" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', background: 'linear-gradient(90deg, #111, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{settings.companyName}</h1>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
                        <span>{settings.address}</span>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <span>{settings.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report generated on</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{getTodayBS()}</span>
                  </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #f8fafc, #eff6ff)', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Consolidated for</span>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>{reportData.company.name}</span>
                   </div>
                   <div style={{ display: 'flex', gap: '32px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>TOTAL DEBIT</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>Rs. {reportData.entries.reduce((acc, e) => acc + (e.type === 'SALE' ? Number(e.amount) : (e.type === 'PAYMENT' && Number(e.amount) < 0 ? Math.abs(Number(e.amount)) : 0)), 0).toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>TOTAL CREDIT</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#2563eb' }}>Rs. {reportData.entries.reduce((acc, e) => acc + (e.type === 'GOODS_RECEIVED' || (e.type === 'PAYMENT' && Number(e.amount) >= 0) ? Number(e.amount) : 0), 0).toLocaleString()}</div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              /* CLEANER OLD HEADER */
              <div style={{ textAlign: 'center', paddingBottom: '12px', borderBottom: '2.5px solid #000', marginBottom: '15px' }}>
                 {settings.logoUrl && (
                   <img src={settings.logoUrl} alt="Logo" style={{ height: '65px', width: 'auto', display: 'block', margin: '0 auto 10px', objectFit: 'contain' }} />
                 )}
                 <h1 style={{ margin: '0 0 2px', fontSize: '32px', fontWeight: '1000', color: '#000', textTransform: 'uppercase', letterSpacing: '1px' }}>{settings.companyName}</h1>
                 <p style={{ margin: '2px 0', fontSize: '15px', color: '#000', fontWeight: '700' }}>{settings.address}</p>
                 <p style={{ margin: '2px 0', fontSize: '14px', color: '#000', fontWeight: '700' }}>
                   Ph: {settings.phone} | Email: {settings.email} {settings.panNumber && `| PAN: ${settings.panNumber}`}
                 </p>
                 
                 <div style={{ marginTop: '10px', display: 'inline-block', padding: '2px 12px', border: '2px solid #000', borderRadius: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '950', color: '#000', textTransform: 'uppercase', letterSpacing: '1px' }}>Statement of Account</span>
                 </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1.5px solid #000', paddingBottom: '8px' }}>
               <div style={{ fontSize: '16px', fontWeight: '1000', color: '#000' }}>
                  Customer: {reportData.company.name}
               </div>
               <div style={{ textAlign: 'right', fontSize: '13px', fontWeight: '800', color: '#000' }}>
                  Period: {startDate || 'Start'} to {endDate || 'End'} | Date: {getTodayBS()}
               </div>
            </div>

          <div className="report-table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              minWidth: '950px', 
              borderCollapse: 'collapse', 
              tableLayout: 'fixed', 
              border: showModernView ? '1px solid #e2e8f0' : '2px solid #000',
              borderRadius: showModernView ? '12px' : '0',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ 
                  background: showModernView ? '#f8fafc' : '#f3f4f6', 
                  color: '#000', 
                  fontSize: '11px', 
                  textTransform: 'uppercase', 
                  borderBottom: showModernView ? '1px solid #e2e8f0' : '2.5px solid #000' 
                }}>
                  <th style={{ width: '90px', padding: '12px 6px', fontWeight: '800', borderRight: showModernView ? 'none' : '1.5px solid #000' }}>Date</th>
                  <th style={{ width: '100px', padding: '12px 6px', fontWeight: '800', borderRight: showModernView ? 'none' : '1.5px solid #000' }}>Type</th>
                  <th style={{ width: '180px', padding: '12px 10px', fontWeight: '800', textAlign: 'left', borderRight: showModernView ? 'none' : '1.5px solid #000' }}>Description</th>
                  <th style={{ width: '60px', padding: '12px 4px', fontWeight: '800', borderRight: showModernView ? 'none' : '1.5px solid #000' }}>Qty</th>
                  <th style={{ width: '70px', padding: '12px 4px', fontWeight: '800', borderRight: showModernView ? 'none' : '1.5px solid #000' }}>Wt/Unit</th>
                  <th style={{ width: '85px', padding: '12px 4px', fontWeight: '800', borderRight: showModernView ? 'none' : '1.5px solid #000' }}>Total Wt</th>
                  <th style={{ width: '85px', padding: '12px 4px', fontWeight: '800', borderRight: showModernView ? 'none' : '1.5px solid #000' }}>Rate</th>
                  <th style={{ width: '120px', padding: '12px 10px', fontWeight: '800', color: '#000', textAlign: 'right', borderRight: showModernView ? 'none' : (isExporting ? 'none' : '1.5px solid #000') }}>Amount</th>
                  {!isExporting && (
                    <th style={{ width: '80px', padding: '12px 6px', fontWeight: '800', textAlign: 'center' }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr style={{ 
                  borderBottom: showModernView ? '1px solid #f1f5f9' : '2px solid #000', 
                  background: '#91d2eb' 
                }}>
                  <td style={{ padding: '8px 10px', fontSize: '13px', color: '#000', fontWeight: '600', borderRight: showModernView ? 'none' : '1.5px solid #000' }}>---</td>
                  <td colSpan="6" style={{ padding: '8px 12px', fontSize: '14px', fontWeight: '700', color: '#000', textAlign: 'left', borderRight: showModernView ? 'none' : '1.5px solid #000', textTransform: 'uppercase' }}>Opening Balance</td>
                  <td style={{ padding: '8px 10px', fontSize: '15px', fontWeight: '800', textAlign: 'right', color: '#000', borderRight: showModernView ? 'none' : (isExporting ? 'none' : '1.5px solid #000') }}>
                    {runningBalance.toLocaleString()}
                  </td>
                  {!isExporting && <td style={{ background: 'transparent' }}></td>}
                </tr>

                {reportData.entries.length === 0 ? (
                  <tr>
                    <td colSpan={isExporting ? "8" : "9"} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No transactions found for the selected period.</td>
                  </tr>
                ) : (() => {
                  const renderedRows = [];
                  let currentBalance = runningBalance;

                  // Group entries by date
                  const dateGroups = reportData.entries.reduce((acc, entry) => {
                    if (!acc[entry.nepal_date]) acc[entry.nepal_date] = [];
                    acc[entry.nepal_date].push(entry);
                    return acc;
                  }, {});

                  const sortedDates = Object.keys(dateGroups).sort();

                  sortedDates.forEach(date => {
                    const entries = dateGroups[date];
                    const sales = entries.filter(e => e.type === 'SALE');
                    const deductions = entries.filter(e => e.type !== 'SALE');

                    // 1. Render Sales First
                    sales.forEach(entry => {
                      currentBalance += Number(entry.amount || 0);

                      renderedRows.push(
                        <tr key={`tr-sale-${entry.id}`} style={{ 
                          borderBottom: showModernView ? '1px solid #f1f5f9' : '1px solid #000', 
                          background: '#c6e0b4' 
                        }}>
                          <td style={{ padding: '10px 6px', fontSize: '12px', color: '#000', fontWeight: '600', borderRight: showModernView ? 'none' : '1.5px solid #000', textAlign: 'center' }}>{entry.nepal_date}</td>
                          <td style={{ padding: '10px 6px', borderRight: showModernView ? 'none' : '1.5px solid #000', textAlign: 'center' }}>
                            <span style={{ padding: '2px 6px', background: '#dcfce7', color: '#166534', borderRadius: '12px', fontSize: '10.5px', fontWeight: '700', whiteSpace: 'nowrap' }}>Sale</span>
                          </td>
                          <td style={{ padding: '10px 10px', fontSize: '13px', fontWeight: '700', color: '#000', borderRight: showModernView ? 'none' : '1.5px solid #000', textAlign: 'left' }}>{entry.goods_name}</td>
                          <td style={{ padding: '10px 4px', fontSize: '13px', color: '#000', fontWeight: '600', borderRight: showModernView ? 'none' : '1.5px solid #000', textAlign: 'center' }}>{entry.num_boxes || (isExporting ? '' : '-')}</td>
                          <td style={{ padding: '10px 4px', fontSize: '13px', color: '#000', fontWeight: '500', borderRight: showModernView ? 'none' : '1.5px solid #000', textAlign: 'center' }}>{entry.weight_per_box ? `${entry.weight_per_box} kg` : (isExporting ? '' : '-')}</td>
                          <td style={{ padding: '10px 4px', fontSize: '13px', color: '#000', fontWeight: '700', borderRight: showModernView ? 'none' : '1.5px solid #000', textAlign: 'center' }}>{entry.total_weight} kg</td>
                          <td style={{ padding: '10px 4px', fontSize: '13px', color: '#000', fontWeight: '600', borderRight: showModernView ? 'none' : '1.5px solid #000', textAlign: 'center' }}>Rs. {entry.amount_per_kg}</td>
                          <td style={{ padding: '10px 10px', fontSize: '14.5px', color: '#000', textAlign: 'right', fontWeight: '800', borderRight: showModernView ? 'none' : (isExporting ? 'none' : '1.5px solid #000') }}>{Number(entry.amount || 0).toLocaleString()}</td>
                          {!isExporting && (
                             <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', opacity: 0.6 }}>
                                  <IoPencilOutline onClick={() => { setSelectedEntry(entry); setIsEditModalOpen(true); }} style={{ cursor: 'pointer', color: '#4f46e5' }} />
                                  <IoTrashOutline onClick={() => handleDelete(entry)} style={{ cursor: 'pointer', color: '#ef4444' }} />
                                </div>
                             </td>
                           )}
                        </tr>
                      );
                    });

                    // 2. Daily Sales Total row (visible only if there were multiple sales or for clarity)
                    if (sales.length > 0) {
                      renderedRows.push(
                        <tr key={`sales-subtotal-${date}`} style={{ 
                          background: '#91d2eb', 
                          borderBottom: showModernView ? '1px solid #e2e8f0' : '2.5px solid #000', 
                          borderTop: showModernView ? '1px solid #e2e8f0' : '2.5px solid #000' 
                        }}>
                          <td colSpan="7" style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '800', textAlign: 'right', color: '#000', textTransform: 'uppercase', borderRight: showModernView ? 'none' : '1.5px solid #000' }}>Daily Sales Total ({date})</td>
                          <td style={{ padding: '8px 10px', fontSize: '15px', fontWeight: '800', textAlign: 'right', color: '#000', borderRight: showModernView ? 'none' : (isExporting ? 'none' : '1.5px solid #000') }}>{currentBalance.toLocaleString()}</td>
                          {!isExporting && <td style={{ background: 'transparent' }}></td>}
                        </tr>
                      );
                    }

                    // 3. Render Deductions (Payments and Received)
                    deductions.forEach(entry => {
                      currentBalance -= Number(entry.amount || 0);
                      const isPayment = entry.type === 'PAYMENT';
                      const isPenalty = isPayment && Number(entry.amount || 0) < 0;

                      renderedRows.push(
                        <tr key={`tr-deduct-${entry.id}`} style={{ 
                          borderBottom: showModernView ? '1px solid #f1f5f9' : '1px solid #000', 
                          background: isPayment ? '#f9cbac' : '#c6e0b4' 
                        }}>
                          <td style={{ padding: '10px 6px', fontSize: '12px', color: '#000', fontWeight: '600', borderRight: showModernView ? 'none' : '1.5px solid #000', textAlign: 'center' }}>{entry.nepal_date}</td>
                          <td style={{ padding: '10px 6px', borderRight: showModernView ? 'none' : '1.5px solid #000', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '2px 6px', 
                              background: isPenalty ? '#fee2e2' : (isPayment ? '#dbeafe' : '#f3e8ff'), 
                              color: isPenalty ? '#991b1b' : (isPayment ? '#1e40af' : '#6b21a8'), 
                              borderRadius: '12px', 
                              fontSize: '10.5px', 
                              fontWeight: '700', 
                              whiteSpace: 'nowrap' 
                            }}>
                              {isPenalty ? 'Penalty' : (isPayment ? 'Payment' : 'Received')}
                            </span>
                          </td>
                          <td style={{ padding: '10px 10px', fontSize: '13px', fontWeight: '700', color: '#000', borderRight: showModernView ? 'none' : '1.5px solid #000', textAlign: 'left' }}>
                            {isPayment ? (
                               <div style={{ display: 'flex', flexDirection: 'column' }}>
                                 <span>{entry.category === 'Custom' ? (entry.remarks || 'Custom') : entry.category}</span>
                                 {entry.remarks && entry.category !== 'Custom' && (
                                   <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '500', marginTop: '1px' }}>({entry.remarks})</span>
                                 )}
                               </div>
                            ) : entry.goods_name}
                          </td>
                          <td style={{ padding: '10px 4px', fontSize: '13px', color: '#000', fontWeight: '600', borderRight: showModernView ? 'none' : '1.5px solid #000', textAlign: 'center' }}>{!isPayment ? (entry.num_boxes || '-') : (isExporting ? '' : '-')}</td>
                          <td style={{ padding: '10px 4px', fontSize: '13px', color: '#000', fontWeight: '500', borderRight: showModernView ? 'none' : '1.5px solid #000', textAlign: 'center' }}>{!isPayment && entry.weight_per_box ? `${entry.weight_per_box} kg` : (isExporting ? '' : '-')}</td>
                          <td style={{ padding: '10px 4px', fontSize: '13px', color: '#000', fontWeight: '700', borderRight: showModernView ? 'none' : '1.5px solid #000', textAlign: 'center' }}>{!isPayment ? `${entry.total_weight} kg` : (isExporting ? '' : '-')}</td>
                          <td style={{ padding: '10px 4px', fontSize: '13px', color: '#000', fontWeight: '600', borderRight: showModernView ? 'none' : '1.5px solid #000', textAlign: 'center' }}>{!isPayment ? `Rs. ${entry.amount_per_kg}` : (isExporting ? '' : '-')}</td>
                          <td style={{ padding: '10px 10px', fontSize: '14.5px', color: isPayment ? '#ef4444' : '#000', textAlign: 'right', fontWeight: '800', borderRight: showModernView ? 'none' : (isExporting ? 'none' : '1.5px solid #000') }}>{Number(entry.amount || 0).toLocaleString()}</td>
                          {!isExporting && (
                             <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', opacity: 0.6 }}>
                                  <IoPencilOutline onClick={() => { setSelectedEntry(entry); setIsEditModalOpen(true); }} style={{ cursor: 'pointer', color: '#4f46e5' }} />
                                  <IoTrashOutline onClick={() => handleDelete(entry)} style={{ cursor: 'pointer', color: '#ef4444' }} />
                                </div>
                             </td>
                           )}
                        </tr>
                      );
                    });

                    renderedRows.push(
                      <tr key={`closing-subtotal-${date}`} style={{ 
                        background: '#91d2eb', 
                        borderBottom: showModernView ? '1px solid #e2e8f0' : '3.5px solid #000', 
                        borderTop: showModernView ? '1px solid #e2e8f0' : '3.5px solid #000' 
                      }}>
                         <td colSpan="7" style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '800', textAlign: 'right', color: '#000', textTransform: 'uppercase', borderRight: showModernView ? 'none' : '1.5px solid #000' }}>Closing Balance ({date})</td>
                         <td style={{ padding: '8px 10px', fontSize: '15px', fontWeight: '800', textAlign: 'right', color: '#000', borderRight: showModernView ? 'none' : (isExporting ? 'none' : '1.5px solid #000') }}>{currentBalance.toLocaleString()}</td>
                         {!isExporting && <td style={{ background: 'transparent' }}></td>}
                      </tr>
                    );

                  });
                    // 5. Final Grand Total Row
                    renderedRows.push(
                      <tr key="final-grand-total" style={{ 
                        background: '#91d2eb', 
                        borderTop: showModernView ? '2px solid #e2e8f0' : '3px solid #000', 
                        borderBottom: showModernView ? '2px solid #e2e8f0' : '3px solid #000' 
                      }}>
                        <td colSpan="7" style={{ padding: '12px 12px', fontSize: '14px', fontWeight: '800', textAlign: 'right', color: '#000', borderRight: showModernView ? 'none' : '1.5px solid #000', textTransform: 'uppercase' }}>Final Totals</td>
                        <td style={{ padding: '12px 10px', fontSize: '18px', fontWeight: '900', textAlign: 'right', color: '#000', borderRight: showModernView ? 'none' : (isExporting ? 'none' : '1.5px solid #000') }}>
                          {currentBalance.toLocaleString()}
                        </td>
                        {!isExporting && <td style={{ background: 'transparent' }}></td>}
                      </tr>
                    );

                    return renderedRows;
                  })()}
                
                {/* Stale totals row removed - now handled inside the dynamic loop */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
       <EditEntryModal 
         isOpen={isEditModalOpen}
         entry={selectedEntry}
         onClose={() => { setIsEditModalOpen(false); setSelectedEntry(null); }}
         onSave={handleSaveEdit}
       />
      </div>
    </PageTransition>
  );
}

export default Reports;