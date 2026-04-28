import React, { useState, useEffect } from "react";
import Calendar from "@sbmdkl/nepali-datepicker-reactjs";
import "@sbmdkl/nepali-datepicker-reactjs/dist/index.css";
import { useToast } from "../contexts/ToastContext";
import { getAllPayments, getAllGoodsReceived } from "../services/reportsService";
import { IoSearchOutline, IoWalletOutline, IoCubeOutline, IoCalendarOutline } from "react-icons/io5";
import { getTodayBS } from "../utils/nepaliDate";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "../components/PageTransition";
import { useSettings } from "../contexts/SettingsContext";
import { IoFileTrayOutline, IoImageOutline } from "react-icons/io5";

function IncomingLog() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("payments"); // "payments" or "goods"
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const { settings } = useSettings();
  const reportRef = React.useRef();
  const [isExporting, setIsExporting] = useState(false);
  const [startKey, setStartKey] = useState(0);
  const [endKey, setEndKey] = useState(0);

  useEffect(() => {
    document.title = "Incoming Log | Maa Laxmi Fish Suppliers";
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let results = [];
      if (activeTab === "payments") {
        results = await getAllPayments({ startDate, endDate });
      } else {
        results = await getAllGoodsReceived({ startDate, endDate });
      }
      setData(results);
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch records.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (isStart, bsDate) => {
    if (isStart) setStartDate(bsDate);
    else setEndDate(bsDate);
  };

  const handleClearDate = (isStart) => {
    if (isStart) {
      setStartDate("");
      setStartKey(prev => prev + 1);
    } else {
      setEndDate("");
      setEndKey(prev => prev + 1);
    }
  };

  const filteredData = data.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const companyMatch = item.companies?.name?.toLowerCase().includes(searchLower);
    const detailsMatch = activeTab === "payments" 
      ? item.category?.toLowerCase().includes(searchLower) || item.remarks?.toLowerCase().includes(searchLower)
      : item.goods_name?.toLowerCase().includes(searchLower);
    return companyMatch || detailsMatch;
  });

  // Group data by date for "total amount date wise"
  const groupedData = filteredData.reduce((acc, item) => {
    if (!acc[item.nepal_date]) acc[item.nepal_date] = { items: [], total: 0 };
    acc[item.nepal_date].items.push(item);
    acc[item.nepal_date].total += Number(item.amount || 0);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedData).sort((a, b) => b.localeCompare(a)); // Newest first

  // Summary totals for Payments tab
  const cashTotal = activeTab === "payments" 
    ? filteredData.filter(item => item.category === "Cash").reduce((acc, item) => acc + Number(item.amount), 0)
    : 0;
  const bankTotal = activeTab === "payments" 
    ? filteredData.filter(item => item.category === "Bank").reduce((acc, item) => acc + Number(item.amount), 0)
    : 0;

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setLoading(true);
    try {
      const filename = `IncomingLog_${activeTab}_${getTodayBS()}.pdf`;
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const element = reportRef.current;
      const requiredWidth = 1000;
      const clone = element.cloneNode(true);
      document.body.appendChild(clone);
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.width = `${requiredWidth}px`;
      const canvas = await html2canvas(clone, { scale: 2, useCORS: true, width: requiredWidth, windowWidth: requiredWidth, backgroundColor: '#ffffff' });
      document.body.removeChild(clone);
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(filename);
      setIsExporting(false);
      addToast(`PDF exported as ${filename}`, "success");
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
      const filename = `IncomingLog_${activeTab}_${getTodayBS()}.png`;
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      const html2canvas = (await import("html2canvas")).default;
      const element = reportRef.current;
      const requiredWidth = 1000;
      const clone = element.cloneNode(true);
      document.body.appendChild(clone);
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.width = `${requiredWidth}px`;
      const canvas = await html2canvas(clone, { scale: 2, useCORS: true, width: requiredWidth, windowWidth: requiredWidth, backgroundColor: '#ffffff' });
      document.body.removeChild(clone);

      // Download the image
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Copy to clipboard
      try {
        canvas.toBlob(async (blob) => {
          if (blob) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            addToast(`Image exported & copied to clipboard!`, "success");
          }
        }, 'image/png');
      } catch (clipboardErr) {
        console.warn("Clipboard copy failed:", clipboardErr);
        addToast(`Image exported as ${filename}`, "success");
      }

      setIsExporting(false);
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      addToast("Failed to export image.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="reports-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>Incoming Log</h1>
          
          <div style={{ display: 'flex', background: '#f3f4f6', padding: '4px', borderRadius: '12px', gap: '4px' }}>
            <button 
              onClick={() => setActiveTab("payments")}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === "payments" ? '#fff' : 'transparent',
                color: activeTab === "payments" ? '#4f46e5' : '#6b7280',
                boxShadow: activeTab === "payments" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <IoWalletOutline /> Money Received
            </button>
            <button 
              onClick={() => setActiveTab("goods")}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === "goods" ? '#fff' : 'transparent',
                color: activeTab === "goods" ? '#4f46e5' : '#6b7280',
                boxShadow: activeTab === "goods" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <IoCubeOutline /> Goods Received
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleExportImage}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              <IoImageOutline /> PNG
            </button>
            <button 
              onClick={handleExportPDF}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              <IoFileTrayOutline /> PDF
            </button>
          </div>
        </div>

        {/* Summary Stats for Payments */}
        {activeTab === "payments" && filteredData.length > 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              gap: '16px' 
            }}
          >
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid #6366f1' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Total Cash</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#111' }}>Rs. {cashTotal.toLocaleString()}</span>
            </div>
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid #2563eb' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Total Bank</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#111' }}>Rs. {bankTotal.toLocaleString()}</span>
            </div>
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid #059669', background: '#f0fdf4' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Grand Total</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>Rs. {(cashTotal + bankTotal).toLocaleString()}</span>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-grid-3" style={{ alignItems: 'end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'flex', justifyContent: 'space-between' }}>
                <span>Start Date (BS)</span>
                {startDate && <span style={{ color: '#ef4444', cursor: 'pointer', fontSize: '11px' }} onClick={() => handleClearDate(true)}>Clear</span>}
              </label>
              <Calendar 
                key={`start-${startKey}`}
                defaultDate={startDate}
                hideDefaultValue={!startDate}
                onChange={({ bsDate }) => handleDateChange(true, bsDate)} 
                theme="default" 
                language="en"
                placeholder="Start Date"
                className="custom-calendar-input"
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'flex', justifyContent: 'space-between' }}>
                <span>End Date (BS)</span>
                {endDate && <span style={{ color: '#ef4444', cursor: 'pointer', fontSize: '11px' }} onClick={() => handleClearDate(false)}>Clear</span>}
              </label>
              <Calendar 
                key={`end-${endKey}`}
                defaultDate={endDate}
                hideDefaultValue={!endDate}
                onChange={({ bsDate }) => handleDateChange(false, bsDate)} 
                theme="default" 
                language="en"
                placeholder="End Date"
                className="custom-calendar-input"
              />
            </div>

            <button 
              onClick={fetchData}
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
                height: '42.5px'
              }}
            >
              Filter Records
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <IoSearchOutline style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input 
              type="text" 
              placeholder={activeTab === "payments" ? "Search by company or method..." : "Search by company or goods name..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 40px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div ref={reportRef} style={{ background: isExporting ? '#fff' : 'transparent', padding: isExporting ? '20px' : '0' }}>
          {isExporting && (
            <div style={{ textAlign: 'center', paddingBottom: '20px', borderBottom: '2px solid #000', marginBottom: '30px' }}>
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" style={{ height: '60px', marginBottom: '10px' }} />
              )}
              <h1 style={{ margin: '0', fontSize: '24px', fontWeight: '800' }}>{settings.companyName}</h1>
              <p style={{ margin: '4px 0', fontSize: '14px', fontWeight: '600' }}>{settings.address} | Ph: {settings.phone}</p>
              <h2 style={{ marginTop: '15px', fontSize: '18px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Incoming Log: {activeTab === 'payments' ? 'Money Received' : 'Goods Received'}
              </h2>
              <p style={{ fontSize: '13px', color: '#4b5563' }}>Report generated on: {getTodayBS()}</p>
              
              {activeTab === "payments" && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '20px', padding: '10px', border: '1.5px solid #000', borderRadius: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Total Cash</div>
                    <div style={{ fontSize: '16px', fontWeight: '800' }}>Rs. {cashTotal.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Total Bank</div>
                    <div style={{ fontSize: '16px', fontWeight: '800' }}>Rs. {bankTotal.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Grand Total</div>
                    <div style={{ fontSize: '16px', fontWeight: '800' }}>Rs. {(cashTotal + bankTotal).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#6366f1' }}>Loading records...</div>
          ) : sortedDates.length === 0 ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
              No records found for the selected period.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {sortedDates.map(date => (
              <motion.div 
                key={date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="date-group"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111', fontWeight: '700' }}>
                    <IoCalendarOutline style={{ color: '#6366f1' }} />
                    {date}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: activeTab === "payments" ? '#059669' : '#4f46e5', background: activeTab === "payments" ? '#ecfdf5' : '#eef2ff', padding: '4px 12px', borderRadius: '20px' }}>
                    Total: Rs. {groupedData[date].total.toLocaleString()}
                  </div>
                </div>

                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase' }}>Company</th>
                        <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase' }}>{activeTab === "payments" ? "Method/Category" : "Goods Name"}</th>
                        {activeTab === "goods" && (
                          <>
                            <th style={{ textAlign: 'center', padding: '12px 10px', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase' }}>Qty</th>
                            <th style={{ textAlign: 'center', padding: '12px 10px', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase' }}>Total Wt</th>
                            <th style={{ textAlign: 'center', padding: '12px 10px', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase' }}>Rate</th>
                          </>
                        )}
                        <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedData[date].items.map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: idx === groupedData[date].items.length - 1 ? 'none' : '1px solid #f3f4f6' }}>
                          <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '600', color: '#111' }}>{item.companies?.name}</td>
                          <td style={{ padding: '14px 20px', fontSize: '14px', color: '#4b5563' }}>
                            {activeTab === "payments" 
                              ? (item.category === 'Custom' ? (item.remarks || 'Custom') : item.category)
                              : item.goods_name
                            }
                            {activeTab === "payments" && item.remarks && item.category !== 'Custom' && (
                              <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '6px' }}>({item.remarks})</span>
                            )}
                          </td>
                          {activeTab === "goods" && (
                            <>
                              <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px', color: '#111' }}>{item.num_boxes || '-'}</td>
                              <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#111' }}>{item.total_weight} kg</td>
                              <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px', color: '#4b5563' }}>Rs. {item.amount_per_kg}</td>
                            </>
                          )}
                          <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '15px', fontWeight: '700', color: '#111' }}>
                            Rs. {Number(item.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
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
          height: 42.5px;
        }
        .custom-calendar-input:focus {
          border-color: #6366f1;
        }
      `}</style>
    </PageTransition>
  );
}

export default IncomingLog;
