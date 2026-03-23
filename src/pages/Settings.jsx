import React, { useState } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { useToast } from "../contexts/ToastContext";
import { IoBusinessOutline, IoLocationOutline, IoCallOutline, IoMailOutline, IoSaveOutline, IoTrashOutline } from "react-icons/io5";
import { motion } from "framer-motion";
import PageTransition, { staggerContainer, staggerItem } from "../components/PageTransition";
import ConfirmModal from "../components/ConfirmModal";

function Settings() {
  const { settings, updateSettings, deleteSettings, loading: settingsLoading } = useSettings();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({ ...settings });
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Sync formData with settings when settings load
  React.useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateSettings(formData);
      if (result && result.success === false) {
        addToast(`Failed to update settings: ${result.error}`, "error");
      } else {
        addToast("Company details updated successfully!", "success");
      }
    } catch (err) {
      addToast("Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
       const result = await deleteSettings();
       if (result.success) {
         addToast("Settings reset to defaults successfully!", "success");
       } else {
         addToast("Failed to reset settings.", "error");
       }
    } catch (err) {
       addToast("Error resetting settings.", "error");
    } finally {
       setShowDeleteModal(false);
    }
  };

  return (
    <PageTransition>
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="settings-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}
      >
        <motion.div variants={staggerItem} style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111', margin: '0 0 8px' }}>Company Settings</h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Configure your company information for reports and invoices.</p>
        </motion.div>

        <motion.div variants={staggerItem} className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IoBusinessOutline style={{ color: '#4f46e5' }} /> Company Logo
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {formData.logoUrl && (
                <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                   <img src={formData.logoUrl} alt="Logo Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="logo-upload"
                />
                <label 
                  htmlFor="logo-upload"
                  style={{ 
                    display: 'inline-block', 
                    padding: '10px 20px', 
                    background: '#f3f4f6', 
                    border: '1.5px solid #e5e7eb', 
                    borderRadius: '10px', 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#4b5563', 
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#e5e7eb'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                >
                  {formData.logoUrl ? "Change Logo" : "Upload Logo"}
                </label>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>Recommended: Square image, max 1MB. (SVG/PNG/JPG)</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => setShowDeleteModal(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 18px', 
              backgroundColor: 'transparent', 
              color: '#ef4444', 
              border: '1.5px solid #fee2e2', 
              borderRadius: '10px', 
              fontSize: '14px', 
              fontWeight: '600', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <IoTrashOutline fontSize="16px" /> Reset to Defaults
          </button>

          <button 
            onClick={handleSave}
            disabled={saving || settingsLoading}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px 28px', 
              backgroundColor: (saving || settingsLoading) ? '#9ca3af' : '#4f46e5', 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontSize: '15px', 
              fontWeight: '600', 
              cursor: (saving || settingsLoading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: (saving || settingsLoading) ? 'none' : '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
            }}
            onMouseOver={(e) => { if (!saving && !settingsLoading) e.currentTarget.style.backgroundColor = '#4338ca'; }}
            onMouseOut={(e) => { if (!saving && !settingsLoading) e.currentTarget.style.backgroundColor = '#4f46e5'; }}
          >
            <IoSaveOutline fontSize="18px" /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
        </motion.div>

        {showDeleteModal && (
          <ConfirmModal 
            onCancel={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
            title="Reset Company Settings"
            message="Are you sure you want to delete all custom company data and reset to system defaults? This will clear your company name, address, and logo for reports."
            isDanger={true}
          />
        )}

        <motion.div variants={staggerItem} className="card" style={{ marginTop: '24px', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#334155', marginBottom: '12px' }}>Preview in Reports</h3>
          <div style={{ padding: '30px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
             {formData.logoUrl && (
               <img src={formData.logoUrl} alt="Logo" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
             )}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
               <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '800', color: '#111', textTransform: 'uppercase', letterSpacing: '1px' }}>{formData.companyName || "Your Company Name"}</h1>
               <p style={{ margin: '0', fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>{formData.address || "Address Goes Here"}</p>
               <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Ph: {formData.phone || "Phone Number"} | Email: {formData.email || "Email"}</p>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}

export default Settings;
