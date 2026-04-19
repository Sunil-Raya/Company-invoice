import { useState } from "react";
import { HiXMark, HiPencilSquare, HiCheck } from "react-icons/hi2";
import { HiOfficeBuilding } from "react-icons/hi";
import { updateCompany } from "../services/companiesService";
import { useToast } from "../contexts/ToastContext";
import { motion, AnimatePresence } from "framer-motion";

function CompanyDetailModal({ company, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(company.name);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSaveName = async () => {
    if (!name.trim() || name === company.name) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      const updated = await updateCompany(company.id, { 
        name: name.trim(),
        initials: name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
      });
      onUpdate(updated);
      setIsEditing(false);
      addToast("Company name updated successfully!", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to update company name.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openingBalance = Number(company.opening_balance || 0);
  const totalSales = Number(company.totalSales || 0);
  const combinedSold = openingBalance + totalSales;
  const totalPayments = Number(company.totalPayments || 0);
  const totalReceived = Number(company.totalGoodsReceived || 0);
  const finalBalance = combinedSold - totalPayments - totalReceived;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="modal-box" 
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-left" style={{ flex: 1 }}>
            <div className="modal-icon" style={{ background: company.color, color: '#fff' }}>
              {company.initials}
            </div>
            <div style={{ flex: 1, marginRight: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <input 
                      autoFocus
                      className="modal-field input"
                      style={{ 
                        fontSize: '18px', fontWeight: '700', padding: '4px 8px', border: '1.5px solid #4f46e5', borderRadius: '6px', outline: 'none', width: '100%'
                      }}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <button onClick={handleSaveName} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} disabled={loading}>
                      <HiCheck />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="modal-title" style={{ fontSize: '20px' }}>{company.name}</h2>
                    <HiPencilSquare 
                      style={{ cursor: 'pointer', color: '#9ca3af', fontSize: '18px' }} 
                      onClick={() => setIsEditing(true)}
                    />
                  </>
                )}
              </div>
              <p className="modal-subtitle">{company.industry || 'No Industry'} • {company.location || 'No Location'}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <HiXMark />
          </button>
        </div>

        <div className="company-detail-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
          
          {/* Main Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
             <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opening Balance</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>Rs. {openingBalance.toLocaleString()}</div>
             </div>
             <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Net Balance</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: finalBalance >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>Rs. {finalBalance.toLocaleString()}</div>
             </div>
          </div>

          {/* Breakdown Table */}
          <div style={{ background: '#fff', border: '1.5px solid #f1f5f9', borderRadius: '14px', overflow: 'hidden' }}>
             <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px', fontWeight: '700', color: '#334155' }}> Financial Summary</div>
             
             <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                   <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Total Sales (Items Sold)</span>
                   <span style={{ fontSize: '13.5px', color: '#1e293b', fontWeight: '700' }}>Rs. {totalSales.toLocaleString()}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#fcfcfc' }}>
                   <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700' }}>Combined Total (Opening + Sold)</span>
                   <span style={{ fontSize: '13.5px', color: '#4f46e5', fontWeight: '800' }}>Rs. {combinedSold.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                   <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Total Payments Received</span>
                   <span style={{ fontSize: '13.5px', color: '#ef4444', fontWeight: '700' }}>- Rs. {totalPayments.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}>
                   <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Total Goods Received</span>
                   <span style={{ fontSize: '13.5px', color: '#ef4444', fontWeight: '700' }}>- Rs. {totalReceived.toLocaleString()}</span>
                </div>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
             <button 
               onClick={onClose}
               style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
             >
               Close
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default CompanyDetailModal;
