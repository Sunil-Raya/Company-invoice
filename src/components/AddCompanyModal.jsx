import { useState } from "react";
import { HiXMark } from "react-icons/hi2";
import { HiOfficeBuilding } from "react-icons/hi";
import { addCompany } from "../services/companiesService";
import { useToast } from "../contexts/ToastContext";

const GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#818cf8)",
  "linear-gradient(135deg,#f59e0b,#fbbf24)",
  "linear-gradient(135deg,#10b981,#34d399)",
  "linear-gradient(135deg,#3b82f6,#60a5fa)",
  "linear-gradient(135deg,#84cc16,#a3e635)",
  "linear-gradient(135deg,#ec4899,#f472b6)",
  "linear-gradient(135deg,#f97316,#fb923c)",
  "linear-gradient(135deg,#8b5cf6,#a78bfa)",
];

function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AddCompanyModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    industry: "",
    location: "",
    email: "",
    phone: "",
    address: "",
    opening_balance: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { addToast } = useToast();

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Company Name is required.");
      return;
    }

    setLoading(true);
    setError("");

    // Prepare data, excluding empty optional fields if desired, but passing empty strings is also fine based on schema.
    const newCompanyData = {
      name: form.name.trim(),
      industry: form.industry.trim() || null,
      location: form.location.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      opening_balance: form.opening_balance ? parseFloat(form.opening_balance) : 0,
      initials: getInitials(form.name),
      color: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
    };

    try {
      const data = await addCompany(newCompanyData);
      onAdd(data); // Pass the newly created DB record back to parent
      addToast("Company added successfully!", "success");
      onClose();
    } catch (insertError) {
      console.error("Error inserting company:", insertError);
      setError("Failed to add company. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon">
              <HiOfficeBuilding />
            </div>
            <div>
              <h2 className="modal-title">Add Company</h2>
              <p className="modal-subtitle">Fill in the company details below</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <HiXMark />
          </button>
        </div>

        {/* Form */}
        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <p className="modal-error" style={{ color: "#ef4444", fontSize: "13px", marginTop: "-4px" }}>{error}</p>}

          <div className="modal-field">
            <label>Company Name <span className="required">*</span></label>
            <input
              name="name"
              type="text"
              placeholder="e.g. Apex Solutions"
              value={form.name}
              onChange={handleChange}
              autoFocus
              required
            />
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label>Industry</label>
              <input
                name="industry"
                type="text"
                placeholder="e.g. Technology"
                value={form.industry}
                onChange={handleChange}
              />
            </div>
            <div className="modal-field">
              <label>Location</label>
              <input
                name="location"
                type="text"
                placeholder="e.g. New York, NY"
                value={form.location}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label>Email</label>
              <input
                name="email"
                type="email"
                placeholder="e.g. contact@apex.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div className="modal-field">
              <label>Phone</label>
              <input
                name="phone"
                type="text"
                placeholder="e.g. +1 555-0198"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label>Address</label>
              <input
                name="address"
                type="text"
                placeholder="e.g. 123 Tech Blvd, Suite 400"
                value={form.address}
                onChange={handleChange}
              />
            </div>
            <div className="modal-field">
              <label>Opening Balance <span className="required">*</span></label>
              <input
                name="opening_balance"
                type="number"
                step="0.01"
                placeholder="e.g. 1500"
                value={form.opening_balance}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="modal-btn-submit" disabled={loading}>
              {loading ? "Adding..." : "Add Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCompanyModal;
