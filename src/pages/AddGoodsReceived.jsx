import React, { useState, useEffect } from "react";
import { addGoodsReceived } from "../services/goodsReceivedService";
import Calendar from "@sbmdkl/nepali-datepicker-reactjs";
import "@sbmdkl/nepali-datepicker-reactjs/dist/index.css";
import { useToast } from "../contexts/ToastContext";
import { useCompanies } from "../contexts/CompaniesContext";
import PageTransition from "../components/PageTransition";
import SearchableSelect from "../components/SearchableSelect";

function AddGoodsReceived() {
  const { companies, fetchCompanies } = useCompanies();
  const [companyId, setCompanyId] = useState("");
  const [date, setDate] = useState("");
  const [due, setDue] = useState("");
  const [conversionRate, setConversionRate] = useState("1");
  
  const [items, setItems] = useState([
    { id: Date.now(), goodsName: "", numBoxes: "", weightPerBox: "", totalWeight: "", amountPerKg: "", totalAmount: "", remarks: "" }
  ]);

  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!companyId) {
      setDue("");
      return;
    }
    const selectedCompany = companies.find(c => String(c.id) === String(companyId));
    if (selectedCompany) {
      setDue(selectedCompany.balance || 0);
    }
  }, [companyId, companies]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    const rate = parseFloat(conversionRate) || 1;

    if (field === 'numBoxes' || field === 'weight_per_box') {
      const b = parseFloat(newItems[index].numBoxes);
      const w = parseFloat(newItems[index].weightPerBox);
      if (!isNaN(b) && !isNaN(w)) {
        newItems[index].totalWeight = (b * w).toFixed(2);
      }
    }
    
    // Recalculate based on totalWeight, amountPerKg (foreign), and conversionRate
    const w = parseFloat(newItems[index].totalWeight);
    const foreignRate = parseFloat(newItems[index].amountPerKg);
    
    if (!isNaN(w) && !isNaN(foreignRate)) {
      newItems[index].totalAmount = (w * foreignRate * rate).toFixed(2);
    }

    setItems(newItems);
  };

  // Recalculate all amounts if conversion rate changes
  useEffect(() => {
    const rate = parseFloat(conversionRate) || 1;
    const newItems = items.map(item => {
      const w = parseFloat(item.totalWeight);
      const foreignRate = parseFloat(item.amountPerKg);
      if (!isNaN(w) && !isNaN(foreignRate)) {
        return { ...item, totalAmount: (w * foreignRate * rate).toFixed(2) };
      }
      return item;
    });
    setItems(newItems);
  }, [conversionRate]);

  const handleKeyDown = (e, index) => {
    // 1. Generic Enter Key Navigation (for ALL fields)
    if (e.key === 'Enter') {
      e.preventDefault();
      const row = e.target.closest('tr');
      const inputs = Array.from(row.querySelectorAll('input'));
      const activeIdx = inputs.indexOf(e.target);

      if (activeIdx < inputs.length - 1) {
        // Move to next input in current row
        inputs[activeIdx + 1].focus();
      } else {
        // We are on the last input of the current row (Remarks)
        if (index === items.length - 1) {
          // Last row -> Submit!
          handleSubmit(e);
        } else {
          // Move to first input of next row
          setTimeout(() => {
            const allRows = document.querySelectorAll('.item-row');
            if (allRows[index + 1]) {
              const nextRowInputs = allRows[index + 1].querySelectorAll('input');
              if (nextRowInputs[0]) nextRowInputs[0].focus();
            }
          }, 10);
        }
      }
    }

    // 2. Tab Key behavior (remains same: adds new row)
    if (e.key === 'Tab' && !e.shiftKey) {
      const row = e.target.closest('tr');
      const inputs = Array.from(row.querySelectorAll('input'));
      const activeIdx = inputs.indexOf(e.target);

      // Only add row if we are on the LAST input of the LAST row
      if (index === items.length - 1 && activeIdx === inputs.length - 1) {
        e.preventDefault();
        setItems([...items, { id: Date.now(), goodsName: "", numBoxes: "", weightPerBox: "", totalWeight: "", amountPerKg: "", totalAmount: "", remarks: "" }]);
        setTimeout(() => {
          const rows = document.querySelectorAll('.item-row');
          if (rows.length > 0) {
             const inputs = rows[rows.length - 1].querySelectorAll('input');
             if (inputs.length > 0) inputs[0].focus();
          }
        }, 10);
      }
    }
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const getGrandTotal = () => {
    return items.reduce((acc, item) => acc + (parseFloat(item.totalAmount) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!companyId || !date) {
      addToast("Please fill date and company.", "error");
      setLoading(false);
      return;
    }

    const validItems = items.filter(item => item.goodsName && item.totalWeight && item.amountPerKg && item.totalAmount);
    if (validItems.length === 0) {
      addToast("Please complete at least one item row.", "error");
      setLoading(false);
      return;
    }

    const rate = parseFloat(conversionRate) || 1;

    const goodsToInsert = validItems.map(item => {
      const amt = parseFloat(item.totalAmount);
      const foreignRate = parseFloat(item.amountPerKg);
      return {
        company_id: companyId,
        nepal_date: date,
        goods_name: item.goodsName,
        num_boxes: item.numBoxes ? parseFloat(item.numBoxes) : null,
        weight_per_box: item.weightPerBox ? parseFloat(item.weightPerBox) : null,
        total_weight: parseFloat(item.totalWeight),
        amount_per_kg: foreignRate * rate, // Save as Local Rate
        amount: amt,
        remarks: item.remarks ? `${item.remarks}${rate > 1 ? ` (Rate: ${rate})` : ''}` : (rate > 1 ? `Converted at ${rate}` : null)
      };
    });

    try {
      await addGoodsReceived(goodsToInsert);

      const comp = companies.find(c => String(c.id) === String(companyId));
      addToast(`Added ${validItems.length} received item(s) for ${comp?.name || "company"}`, "success");
      
      setDate("");
      setItems([{ id: Date.now(), goodsName: "", numBoxes: "", weightPerBox: "", totalWeight: "", amountPerKg: "", totalAmount: "", remarks: "" }]);
      
      await fetchCompanies();
      
    } catch (err) {
      console.error(err);
      addToast("Failed to add received items. " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' };

  return (
    <PageTransition>
      <div className="add-sale-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>Add Received</h2>
      
      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-grid-3" style={{ borderBottom: '1.5px solid #e5e7eb', paddingBottom: '20px' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Date (BS) *</label>
              <Calendar 
                onChange={({ bsDate }) => setDate(bsDate)} 
                theme="default" 
                language="en"
                hideDefaultValue={true}
                placeholder="Select Nepali Date"
                className="custom-calendar-input"
              />
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
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 50 }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Company *</label>
              <SearchableSelect 
                value={companyId} 
                onChange={(val) => setCompanyId(val)}
                options={companies.map((c) => ({ value: String(c.id), label: c.name }))}
                placeholder="-- Select Company --"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e40af' }}>Conv. Rate</label>
                <input 
                  type="number" 
                  step="0.001" 
                  value={conversionRate} 
                  onChange={(e) => setConversionRate(e.target.value)} 
                  placeholder="Rate"
                  style={{ ...inputStyle, height: '42.5px', background: '#eff6ff', borderColor: '#bfdbfe', fontWeight: '600' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Current Due</label>
                <div style={{ 
                  padding: '10px 14px', 
                  backgroundColor: '#f3f4f6', 
                  border: '1.5px solid #e5e7eb', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  color: '#374151',
                  height: '42.5px',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {due !== "" ? `Rs.${parseFloat(due).toLocaleString()}` : '---'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111' }}>Goods Items</h3>
             <div style={{ fontSize: '14px', padding: '6px 12px', background: '#eef2ff', borderRadius: '6px', border: '1px solid #c7d2fe', fontWeight: '600', color: '#4f46e5' }}>Grand Total: Rs. {getGrandTotal().toLocaleString()}</div>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1.5px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 10px', fontWeight: '600' }}>Goods Name *</th>
                  <th style={{ padding: '12px 10px', width: '80px', fontWeight: '600' }}>Boxes</th>
                  <th style={{ padding: '12px 10px', width: '90px', fontWeight: '600' }}>Wt/Box</th>
                  <th style={{ padding: '12px 10px', width: '110px', fontWeight: '600' }}>Total Wt *</th>
                  <th style={{ padding: '12px 10px', width: '110px', fontWeight: '600' }}>Rate/Kg *</th>
                  <th style={{ padding: '12px 10px', width: '120px', fontWeight: '600' }}>Amount *</th>
                  <th style={{ padding: '12px 10px', width: '150px', fontWeight: '600' }}>Remarks</th>
                  <th style={{ padding: '12px 10px', width: '40px', textAlign: 'center' }}>#</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="item-row" style={{ borderBottom: index < items.length - 1 ? '1px solid #f3f4f6' : 'none', background: '#fff' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <input type="text" value={item.goodsName} onChange={(e) => handleItemChange(index, 'goodsName', e.target.value)} onKeyDown={(e) => handleKeyDown(e, index)} onFocus={(e) => e.target.style.borderColor='#6366f1'} onBlur={(e) => e.target.style.borderColor='#e5e7eb'} style={inputStyle} required={index === 0} placeholder="Goods" />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <input type="number" value={item.numBoxes} onChange={(e) => handleItemChange(index, 'numBoxes', e.target.value)} onKeyDown={(e) => handleKeyDown(e, index)} onFocus={(e) => e.target.style.borderColor='#6366f1'} onBlur={(e) => e.target.style.borderColor='#e5e7eb'} style={inputStyle} />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <input type="number" value={item.weightPerBox} onChange={(e) => handleItemChange(index, 'weightPerBox', e.target.value)} onKeyDown={(e) => handleKeyDown(e, index)} onFocus={(e) => e.target.style.borderColor='#6366f1'} onBlur={(e) => e.target.style.borderColor='#e5e7eb'} style={inputStyle} step="0.01" />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <input type="number" value={item.totalWeight} onChange={(e) => handleItemChange(index, 'totalWeight', e.target.value)} onKeyDown={(e) => handleKeyDown(e, index)} onFocus={(e) => e.target.style.borderColor='#6366f1'} onBlur={(e) => e.target.style.borderColor='#e5e7eb'} style={inputStyle} step="0.01" required={index === 0} />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <input type="number" value={item.amountPerKg} onChange={(e) => handleItemChange(index, 'amountPerKg', e.target.value)} onKeyDown={(e) => handleKeyDown(e, index)} onFocus={(e) => e.target.style.borderColor='#6366f1'} onBlur={(e) => e.target.style.borderColor='#e5e7eb'} style={inputStyle} step="0.01" required={index === 0} />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <input type="number" value={item.totalAmount} onChange={(e) => handleItemChange(index, 'totalAmount', e.target.value)} onKeyDown={(e) => handleKeyDown(e, index)} onFocus={(e) => e.target.style.borderColor='#6366f1'} onBlur={(e) => e.target.style.borderColor='#e5e7eb'} style={{ ...inputStyle, backgroundColor: '#f9fafb', fontWeight: '600' }} step="0.01" required={index === 0} />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <input type="text" value={item.remarks} onChange={(e) => handleItemChange(index, 'remarks', e.target.value)} onKeyDown={(e) => handleKeyDown(e, index)} onFocus={(e) => e.target.style.borderColor='#6366f1'} onBlur={(e) => e.target.style.borderColor='#e5e7eb'} style={inputStyle} placeholder="Optional" />
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifySelf: 'center' }} title="Remove item">&times;</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button 
              type="button" 
              onClick={() => setItems([...items, { id: Date.now(), goodsName: "", numBoxes: "", weightPerBox: "", totalWeight: "", amountPerKg: "", totalAmount: "", remarks: "" }])} 
              style={{ 
                width: '100%', 
                padding: '10px', 
                background: '#f9fafb', 
                color: '#4f46e5', 
                border: 'none', 
                borderTop: '1px solid #e5e7eb', 
                cursor: 'pointer', 
                fontSize: '13px', 
                fontWeight: '600', 
                transition: 'background 0.2s' 
              }} 
              onMouseEnter={(e) => e.target.style.background='#f3f4f6'} 
              onMouseLeave={(e) => e.target.style.background='#f9fafb'}
            >
              + Add Item Row
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '16px', 
              padding: '12px 24px', 
              backgroundColor: '#4f46e5', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '15px', 
              fontWeight: '600', 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              alignSelf: 'flex-start'
            }}
          >
            {loading ? 'Saving...' : 'Save All Received'}
          </button>
        </form>
      </div>
      </div>
    </PageTransition>
  );
}

export default AddGoodsReceived;
