import React, { useState, useEffect } from "react";
import Calendar from "@sbmdkl/nepali-datepicker-reactjs";
import "@sbmdkl/nepali-datepicker-reactjs/dist/index.css";
import { motion, AnimatePresence } from "framer-motion";
import { IoCloseOutline } from "react-icons/io5";

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

function EditEntryModal({ entry, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entry && isOpen) {
      // Initialize form data based on entry type
      setFormData({ ...entry });
    }
  }, [entry, isOpen]);

  if (!isOpen || !entry) return null;

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    
    // Auto-calculations for Sale and Received
    if (entry.type === 'SALE' || entry.type === 'GOODS_RECEIVED') {
      if (field === 'num_boxes' || field === 'weight_per_box') {
        const b = parseFloat(updated.num_boxes);
        const w = parseFloat(updated.weight_per_box);
        if (!isNaN(b) && !isNaN(w)) {
          updated.total_weight = (b * w).toFixed(2);
        } else if (value === "") {
          // If clearing, we don't necessarily clear total_weight unless desired, 
          // but we should avoid NaN. Let's leave it as is or clear it if both are empty.
        }
      }
      
      if (field === 'total_weight' || field === 'amount_per_kg' || field === 'num_boxes' || field === 'weight_per_box') {
        const w = parseFloat(updated.total_weight);
        const r = parseFloat(updated.amount_per_kg);
        if (!isNaN(w) && !isNaN(r)) {
          updated.amount = (w * r).toFixed(2);
        }
      }
    }

    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' };

  const getDisplayAmount = (amount) => {
    if (amount === "" || amount === undefined || amount === null) return "";
    return Math.abs(amount);
  };

  return (
    <AnimatePresence>
      <motion.div 
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        onClick={onClose}
      >
        <motion.div 
          variants={modalVariants}
          style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111' }}>Edit {entry.type === 'SALE' ? 'Sale' : entry.type === 'PAYMENT' ? 'Payment' : 'Received'}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px', display: 'flex' }}><IoCloseOutline fontSize="24px" /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Date (BS)</label>
              <Calendar 
                key={`${entry.id}-${formData.nepal_date}`}
                defaultDate={formData.nepal_date || ""}
                onChange={({ bsDate }) => handleChange('nepal_date', bsDate)} 
                theme="default" 
                language="en"
                placeholder="Select Nepali Date"
                className="custom-calendar-input"
              />
            </div>

            {(entry.type === 'SALE' || entry.type === 'GOODS_RECEIVED') && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Goods Name</label>
                  <input type="text" value={formData.goods_name || ""} onChange={(e) => handleChange('goods_name', e.target.value)} style={inputStyle} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Boxes</label>
                    <input type="number" value={formData.num_boxes ?? ""} onChange={(e) => handleChange('num_boxes', e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Wt/Box</label>
                    <input type="number" step="0.01" value={formData.weight_per_box ?? ""} onChange={(e) => handleChange('weight_per_box', e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Total Wt</label>
                    <input type="number" step="0.01" value={formData.total_weight ?? ""} onChange={(e) => handleChange('total_weight', e.target.value)} style={inputStyle} required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Rate/Kg</label>
                    <input type="number" step="0.01" value={formData.amount_per_kg ?? ""} onChange={(e) => handleChange('amount_per_kg', e.target.value)} style={inputStyle} required />
                  </div>
                </div>
              </>
            )}

            {entry.type === 'PAYMENT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Category</label>
                <select value={formData.category || ""} onChange={(e) => handleChange('category', e.target.value)} style={inputStyle} required>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Amount</label>
              <input 
                type="number" 
                step="0.01" 
                value={getDisplayAmount(formData.amount)} 
                onChange={(e) => handleChange('amount', entry.type === 'PAYMENT' && Number(formData.amount) < 0 ? -Math.abs(e.target.value) : e.target.value)} 
                style={{ ...inputStyle, fontWeight: '700', color: '#111' }} 
                required 
              />
            </div>

            {(entry.type === 'PAYMENT' || entry.type === 'GOODS_RECEIVED') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Remarks</label>
                <textarea value={formData.remarks || ""} onChange={(e) => handleChange('remarks', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} rows="2" />
              </div>
            )}

            <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ flex: 2, padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Saving...' : 'Update Entry'}
              </button>
            </div>
          </form>
        </motion.div>
        
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
          }
          .custom-calendar-input:focus {
            border-color: #6366f1;
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}

export default EditEntryModal;
