import React, { useState } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { useToast } from "../contexts/ToastContext";
import { IoBusinessOutline, IoLocationOutline, IoCallOutline, IoMailOutline, IoSaveOutline } from "react-icons/io5";

function Settings() {
  const { settings, updateSettings } = useSettings();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({ ...settings });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateSettings(formData);
    addToast("Company details updated successfully!", "success");
  };

  return (
    <div className="settings-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111', margin: '0 0 8px' }}>Company Settings</h2>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Configure your company information for reports and invoices.</p>
      </div>

      <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IoBusinessOutline style={{ color: '#4f46e5' }} /> Company Name
            </label>
            <input 
              type="text" 
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Enter company name"
              style={{ padding: '12px 16px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IoLocationOutline style={{ color: '#4f46e5' }} /> Address
            </label>
            <input 
              type="text" 
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="City, District, Country"
              style={{ padding: '12px 16px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IoCallOutline style={{ color: '#4f46e5' }} /> Phone Number
            </label>
            <input 
              type="text" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+977-9800000000"
              style={{ padding: '12px 16px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IoMailOutline style={{ color: '#4f46e5' }} /> Email Address
            </label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@example.com"
              style={{ padding: '12px 16px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>

        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleSave}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px 28px', 
              backgroundColor: '#4f46e5', 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontSize: '15px', 
              fontWeight: '600', 
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
          >
            <IoSaveOutline fontSize="18px" /> Save Settings
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#334155', marginBottom: '12px' }}>Preview in Reports</h3>
        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
           <h1 style={{ margin: '0 0 5px', fontSize: '20px', color: '#111', textTransform: 'uppercase', letterSpacing: '1px' }}>{formData.companyName || "Your Company Name"}</h1>
           <p style={{ margin: '3px 0', fontSize: '13px', color: '#4b5563' }}>{formData.address || "Address Goes Here"}</p>
           <p style={{ margin: '3px 0', fontSize: '13px', color: '#4b5563' }}>Ph: {formData.phone || "Phone Number"} | Email: {formData.email || "Email"}</p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
