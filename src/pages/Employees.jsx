import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiMagnifyingGlass, HiMiniPlus } from "react-icons/hi2";
import { FiPhone, FiCalendar, FiDollarSign, FiTrash2 } from "react-icons/fi";
import { getEmployees, deleteEmployee } from "../services/employeesService";
import AddEmployeeModal from "../components/AddEmployeeModal";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../contexts/ToastContext";
import { motion } from "framer-motion";
import PageTransition, { staggerContainer, staggerItem } from "../components/PageTransition";
import "../styles/employees.css";

const GRADIENTS = [
  "linear-gradient(135deg,#f59e0b,#fbbf24)",
  "linear-gradient(135deg,#10b981,#34d399)",
  "linear-gradient(135deg,#6366f1,#818cf8)",
  "linear-gradient(135deg,#ec4899,#f472b6)",
  "linear-gradient(135deg,#3b82f6,#60a5fa)",
  "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  "linear-gradient(135deg,#f97316,#fb923c)",
  "linear-gradient(135deg,#84cc16,#a3e635)",
];

function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getGradient(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [passcode, setPasscode] = useState("");
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
    document.title = "Employees | Maa Laxmi Fish Suppliers";
  }, []);

  async function fetchEmployees() {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      addToast("Failed to load employees.", "error");
    } finally {
      setLoading(false);
    }
  }

  const filtered = employees.filter((e) =>
    (e.name || "").toLowerCase().includes(query.toLowerCase()) ||
    (e.phone || "").toLowerCase().includes(query.toLowerCase())
  );

  function handleNewEmployee(newEmp) {
    setEmployees((prev) => [newEmp, ...prev]);
  }

  function handleDeleteClick(e, emp) {
    e.stopPropagation();
    setEmployeeToDelete(emp);
    setPasscode("");
  }

  async function confirmDelete() {
    if (!employeeToDelete) return;
    const correctPasscode = import.meta.env.VITE_DELETE_PASSCODE;
    if (passcode !== correctPasscode) {
      addToast("Invalid passcode! Deletion canceled.", "error");
      return;
    }
    try {
      await deleteEmployee(employeeToDelete.id);
      setEmployees((prev) => prev.filter((e) => e.id !== employeeToDelete.id));
      addToast("Employee deleted successfully.", "info");
    } catch (error) {
      console.error("Error deleting employee:", error);
      addToast("Failed to delete employee.", "error");
    } finally {
      setEmployeeToDelete(null);
    }
  }

  return (
    <PageTransition>
      <div className="employees-page">
        {/* Toolbar */}
        <div className="employees-toolbar">
          <div>
            <h1 className="employees-title">Employees</h1>
            <p className="employees-subtitle">{employees.length} employees registered</p>
          </div>
          <div className="employees-actions">
            <div className="employees-search">
              <HiMagnifyingGlass className="employees-search-icon" />
              <input
                type="text"
                placeholder="Search employees…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button className="btn-add-employee" onClick={() => setShowModal(true)}>
              <HiMiniPlus />
              Add Employee
            </button>
          </div>
        </div>

        {/* Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="employees-grid"
        >
          {/* Add card */}
          <motion.div
            variants={staggerItem}
            className="employee-card employee-card--add"
            onClick={() => setShowModal(true)}
          >
            <div className="employee-card-add-icon">
              <HiMiniPlus />
            </div>
            <span className="employee-card-add-label">Add Employee</span>
          </motion.div>

          {loading ? (
            <p className="employees-empty" style={{ gridColumn: "1 / -1" }}>Loading employees...</p>
          ) : filtered.length > 0 ? (
            filtered.map((emp) => (
              <motion.div
                key={emp.id}
                variants={staggerItem}
                whileHover={{ scale: 1.02 }}
                className="employee-card"
                onClick={() => navigate(`/employees/${emp.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="employee-card-header">
                  <div
                    className="employee-card-avatar"
                    style={{ background: getGradient(emp.name) }}
                  >
                    {getInitials(emp.name)}
                  </div>
                  <div className="employee-card-meta">
                    <span className="employee-card-name">{emp.name}</span>
                    {emp.phone && (
                      <span className="employee-card-phone">
                        <FiPhone size={11} /> {emp.phone}
                      </span>
                    )}
                  </div>
                  <button
                    className="employee-card-delete"
                    onClick={(e) => handleDeleteClick(e, emp)}
                    title="Delete employee"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                <div className="employee-card-body">
                  <div className="employee-card-stat">
                    <span className="employee-card-stat-label">
                      <FiDollarSign size={12} /> Daily Wage
                    </span>
                    <span className="employee-card-stat-value">
                      Rs. {Number(emp.daily_wage).toLocaleString()}
                    </span>
                  </div>
                  <div className="employee-card-stat">
                    <span className="employee-card-stat-label">
                      <FiCalendar size={12} /> Monthly (30d)
                    </span>
                    <span className="employee-card-stat-value revenue">
                      Rs. {(Number(emp.daily_wage) * 30).toLocaleString()}
                    </span>
                  </div>
                  <div className="employee-card-stat">
                    <span className="employee-card-stat-label">
                      <FiCalendar size={12} /> Joined
                    </span>
                    <span className="employee-card-stat-value">
                      {emp.joining_date}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="employees-empty" style={{ gridColumn: "1 / -1" }}>
              {query ? "No employees match your search." : "No employees added yet."}
            </p>
          )}
        </motion.div>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <AddEmployeeModal
          onClose={() => setShowModal(false)}
          onAdd={handleNewEmployee}
        />
      )}

      {/* Delete Confirm Modal */}
      {employeeToDelete && (
        <ConfirmModal
          title="Delete Employee"
          message={`Are you sure you want to delete ${employeeToDelete.name}? This will permanently remove all their salary records, advances, and absences.`}
          confirmText="Delete"
          isDanger={true}
          onConfirm={confirmDelete}
          onCancel={() => {
            setEmployeeToDelete(null);
            setPasscode("");
          }}
        >
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Enter Passcode to Confirm</label>
            <input
              type="password"
              placeholder="Passcode..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{ padding: '10px 14px', border: '1.5px solid #ef4444', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            />
          </div>
        </ConfirmModal>
      )}
    </PageTransition>
  );
}

export default Employees;
