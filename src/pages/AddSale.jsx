import React, { useState, useEffect } from "react";
import {
  addTransaction,
} from "../services/transactionsService";
import Calendar from "@sbmdkl/nepali-datepicker-reactjs";
import "@sbmdkl/nepali-datepicker-reactjs/dist/index.css";
import { useToast } from "../contexts/ToastContext";
import { useCompanies } from "../contexts/CompaniesContext";

function AddSale() {
  const { companies, fetchCompanies } = useCompanies();
  const [companyId, setCompanyId] = useState("");
  const [date, setDate] = useState("");
  const [goodsName, setGoodsName] = useState("");
  const [numBoxes, setNumBoxes] = useState("");
  const [weightPerBox, setWeightPerBox] = useState("");
  const [totalWeight, setTotalWeight] = useState("");
  const [amountPerKg, setAmountPerKg] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [due, setDue] = useState("");
  
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  // Fetch true balance (due) when company changes, dynamically accounting for all sales and payments
  useEffect(() => {
    if (!companyId) {
      setDue("");
      return;
    }
    const selectedCompany = companies.find(c => String(c.id) === String(companyId));
    if (selectedCompany) {
      // Set the due to the company's real-time calculated balance
      setDue(selectedCompany.balance || 0);
    }
  }, [companyId, companies]);

  // Handle auto calculations for Auto Total Weight
  const handleBoxesChange = (e) => {
    const val = e.target.value;
    setNumBoxes(val);
    if (val && weightPerBox) {
      const w = parseFloat(val) * parseFloat(weightPerBox);
      setTotalWeight(w.toFixed(2));
    }
  };

  const handleWeightPerBoxChange = (e) => {
    const val = e.target.value;
    setWeightPerBox(val);
    if (numBoxes && val) {
      const w = parseFloat(numBoxes) * parseFloat(val);
      setTotalWeight(w.toFixed(2));
    }
  };

  // Handle auto calculation for Total Amount
  useEffect(() => {
    if (totalWeight && amountPerKg) {
      const amt = parseFloat(totalWeight) * parseFloat(amountPerKg);
      setTotalAmount(amt.toFixed(2));
    }
  }, [totalWeight, amountPerKg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!companyId || !date || !goodsName || !totalWeight || !amountPerKg || !totalAmount) {
      addToast("Please fill all required fields.", "error");
      setLoading(false);
      return;
    }

    try {
      await addTransaction({
        company_id: companyId,
        nepal_date: date,
        goods_name: goodsName,
        num_boxes: numBoxes ? parseFloat(numBoxes) : null,
        weight_per_box: weightPerBox ? parseFloat(weightPerBox) : null,
        total_weight: parseFloat(totalWeight),
        amount_per_kg: parseFloat(amountPerKg),
        amount: parseFloat(totalAmount),
        // due stores the previous due (balance before this transaction) + current amount
        due: (due ? parseFloat(due) : 0) + parseFloat(totalAmount),
      });

      addToast("Sale added successfully!", "success");
      // Reset form
      setDate("");
      setGoodsName("");
      setNumBoxes("");
      setWeightPerBox("");
      setTotalWeight("");
      setAmountPerKg("");
      setTotalAmount("");
      
      // Refresh the global companies data to recalculate balances immediately
      await fetchCompanies();
      
    } catch (err) {
      console.error(err);
      addToast("Failed to add sale. " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-sale-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>Add Sale</h2>
      
      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                }
                .custom-calendar-input:focus {
                  border-color: #6366f1;
                }
              `}</style>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Company *</label>
              <select 
                value={companyId} 
                onChange={(e) => setCompanyId(e.target.value)}
                style={{
                  padding: '10px 14px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                required
              >
                <option value="">-- Select Company --</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Goods Name *</label>
            <input 
              type="text"
              value={goodsName}
              onChange={(e) => setGoodsName(e.target.value)}
              placeholder="e.g. Apples, Potatoes"
              style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>No. of Boxes</label>
              <input 
                type="number"
                value={numBoxes}
                onChange={handleBoxesChange}
                placeholder="Optional"
                style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Weight per Box (kg)</label>
              <input 
                type="number"
                step="0.01"
                value={weightPerBox}
                onChange={handleWeightPerBoxChange}
                placeholder="Optional"
                style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Total Weight (kg) *</label>
              <input 
                type="number"
                step="0.01"
                value={totalWeight}
                onChange={(e) => setTotalWeight(e.target.value)}
                placeholder="Required"
                style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Amount per Kg *</label>
              <input 
                type="number"
                step="0.01"
                value={amountPerKg}
                onChange={(e) => setAmountPerKg(e.target.value)}
                placeholder="Required"
                style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>Total Amount *</label>
              <input 
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                style={{ padding: '10px 14px', border: '1.5px solid #6366f1', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#eef2ff', fontWeight: '600' }}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Previous Due</label>
              <input 
                type="number"
                step="0.01"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                placeholder="Remaining Balance"
                style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '10px', 
              padding: '12px 24px', 
              backgroundColor: '#4f46e5', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '15px', 
              fontWeight: '600', 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Saving...' : 'Add Sale'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddSale;