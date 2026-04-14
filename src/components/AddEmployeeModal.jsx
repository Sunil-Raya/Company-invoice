import { useState } from "react";
import { HiXMark } from "react-icons/hi2";
import { HiUserAdd } from "react-icons/hi";
import Calendar from "@sbmdkl/nepali-datepicker-reactjs";
import "@sbmdkl/nepali-datepicker-reactjs/dist/index.css";
import { addEmployee } from "../services/employeesService";
import { useToast } from "../contexts/ToastContext";

function AddEmployeeModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    joining_date: "",
    daily_wage: "500",
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
      setError("Employee name is required.");
      return;
    }
    if (!form.joining_date) {
      setError("Joining date is required.");
      return;
    }
    if (!form.daily_wage || Number(form.daily_wage) <= 0) {
      setError("Daily wage must be greater than 0.");
      return;
    }

    setLoading(true);
    setError("");

    const newEmployee = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      joining_date: form.joining_date,
      daily_wage: parseFloat(form.daily_wage),
    };

    try {
      const data = await addEmployee(newEmployee);
      onAdd(data);
      addToast("Employee added successfully!", "success");
      onClose();
    } catch (insertError) {
      console.error("Error adding employee:", insertError);
      setError("Failed to add employee. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <HiUserAdd />
            </div>
            <div>
              <h2 className="modal-title">Add Employee</h2>
              <p className="modal-subtitle">Enter employee details below</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <HiXMark />
          </button>
        </div>

        {/* Form */}
        <form className="modal-form" onSubmit={handleSubmit}>
          {error && (
            <p className="modal-error" style={{ color: "#ef4444", fontSize: "13px", marginTop: "-4px" }}>
              {error}
            </p>
          )}

          <div className="modal-field">
            <label>Employee Name <span className="required">*</span></label>
            <input
              name="name"
              type="text"
              placeholder="e.g. Ram Bahadur"
              value={form.name}
              onChange={handleChange}
              autoFocus
              required
            />
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label>Phone</label>
              <input
                name="phone"
                type="text"
                placeholder="e.g. 9801234567"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
            <div className="modal-field">
              <label>Daily Wage (Rs.) <span className="required">*</span></label>
              <input
                name="daily_wage"
                type="number"
                step="1"
                min="1"
                placeholder="e.g. 500"
                value={form.daily_wage}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="modal-field">
            <label>Joining Date (BS) <span className="required">*</span></label>
            <Calendar
              onChange={({ bsDate }) => setForm((prev) => ({ ...prev, joining_date: bsDate }))}
              theme="default"
              language="en"
              hideDefaultValue={true}
              placeholder="Select Nepali Date"
              className="emp-calendar-input"
            />
            <style>{`
              .emp-calendar-input {
                width: 100%;
                padding: 10px 14px;
                border: 1.5px solid #e5e7eb;
                border-radius: 10px;
                font-size: 13.5px;
                outline: none;
                transition: border-color 0.2s;
                font-family: inherit;
                background: #f9fafb;
                color: #111;
              }
              .emp-calendar-input:focus {
                border-color: #a5b4fc;
                background: #fff;
                box-shadow: 0 0 0 3px rgba(165,180,252,0.2);
              }
            `}</style>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="modal-btn-submit" disabled={loading}>
              {loading ? "Adding..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEmployeeModal;
