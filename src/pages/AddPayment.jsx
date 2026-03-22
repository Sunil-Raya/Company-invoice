import React, { useState, useEffect } from "react";
import { addPayment } from "../services/paymentsService";
import Calendar from "@sbmdkl/nepali-datepicker-reactjs";
import "@sbmdkl/nepali-datepicker-reactjs/dist/index.css";
import { useToast } from "../contexts/ToastContext";
import { useCompanies } from "../contexts/CompaniesContext";
import PageTransition from "../components/PageTransition";

function AddPayment() {
  const { companies, fetchCompanies } = useCompanies();
  const [companyId, setCompanyId] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("Cash");
  const [customAction, setCustomAction] = useState("subtract"); // 'subtract' or 'add'
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [due, setDue] = useState("");
  
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  // Fetch true balance (due) when company changes
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!companyId || !date || !amount) {
      addToast("Please fill all required fields.", "error");
      setLoading(false);
      return;
    }

    // Determine stored amount logic:
    // Regular payments (Cash, Bank) or Custom (Subtract) reduce the balance. They are stored as positive in `payments`.
    // Custom (Add to Due) increases the balance. We store it as negative so `totalPayments` goes down.
    let storedAmount = parseFloat(amount);
    if (category === "Custom" && customAction === "add") {
      storedAmount = -storedAmount;
    }

    try {
      await addPayment({
        company_id: companyId,
        nepal_date: date,
        category: category,
        amount: storedAmount,
        remarks: remarks || null,
      });

      const comp = companies.find(c => String(c.id) === String(companyId));
      const actionText = (category === "Custom" && customAction === "add") ? "penalty/fee" : "payment";
      addToast(`Added Rs. ${amount} ${actionText} for ${comp?.name || "company"}`, "success");
      
      // Reset form
      setDate("");
      setCategory("Cash");
      setCustomAction("subtract");
      setAmount("");
      setRemarks("");
      
      // Refresh global companies data to recalculate balances immediately
      await fetchCompanies();
      
    } catch (err) {
      console.error(err);
      addToast("Failed to add payment. " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="add-sale-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>Add Payment</h2>
      
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Category *</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  padding: '10px 14px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                required
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Amount *</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                required
              />
            </div>
          </div>

          {category === "Custom" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Custom Action</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="customAction" 
                    value="subtract" 
                    checked={customAction === "subtract"}
                    onChange={() => setCustomAction("subtract")}
                  />
                  Subtract from Due (Payment)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="customAction" 
                    value="add" 
                    checked={customAction === "add"}
                    onChange={() => setCustomAction("add")}
                  />
                  Add to Due (Penalty/Fee)
                </label>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Remarks</label>
              <textarea 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes or details"
                rows="3"
                style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Current Due</label>
              <div style={{ 
                padding: '10px 14px', 
                backgroundColor: '#eef2ff', 
                border: '1.5px solid #c7d2fe', 
                borderRadius: '8px', 
                fontSize: '18px', 
                fontWeight: '700',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                height: '100%'
              }}>
                {due !== "" ? `Rs. ${parseFloat(due).toLocaleString()}` : '---'}
              </div>
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
            {loading ? 'Saving...' : 'Add Payment'}
          </button>
        </form>
      </div>
      </div>
    </PageTransition>
  );
}

export default AddPayment;
