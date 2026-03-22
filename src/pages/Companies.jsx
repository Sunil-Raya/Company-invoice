import { useState } from "react";
import { HiMagnifyingGlass, HiMiniPlus } from "react-icons/hi2";
import CompanyCard, { AddCompanyCard } from "../components/CompanyCard";
import AddCompanyModal from "../components/AddCompanyModal";
import ConfirmModal from "../components/ConfirmModal";
import { deleteCompany } from "../services/companiesService";
import { useToast } from "../contexts/ToastContext";
import { useCompanies } from "../contexts/CompaniesContext";
import { motion } from "framer-motion";
import PageTransition, { staggerContainer } from "../components/PageTransition";
import "../styles/companies.css";

function Companies() {
  const [query, setQuery] = useState("");
  const { companies, loading, setCompanies } = useCompanies();
  const [showModal, setShowModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [passcode, setPasscode] = useState("");
  const { addToast } = useToast();

  const filtered = companies.filter((c) =>
    (c.name || "").toLowerCase().includes(query.toLowerCase()) ||
    (c.industry || "").toLowerCase().includes(query.toLowerCase()) ||
    (c.location || "").toLowerCase().includes(query.toLowerCase())
  );

  function handleAddCompany() {
    setShowModal(true);
  }

  function handleNewCompany(newCompany) {
    const companyWithStats = {
      ...newCompany,
      invoices: 0,
      balance: Number(newCompany.opening_balance || 0),
    };
    setCompanies((prev) => [companyWithStats, ...prev]);
  }

  function handleDeleteClick(id) {
    const company = companies.find(c => c.id === id);
    if (company) {
      setCompanyToDelete(company);
      setPasscode(""); // Reset passcode on new delete attempt
    }
  }

  async function confirmDelete() {
    if (!companyToDelete) return;

    const correctPasscode = import.meta.env.VITE_DELETE_PASSCODE;
    if (passcode !== correctPasscode) {
      addToast("Invalid passcode! Deletion canceled.", "error");
      return;
    }
    
    try {
      await deleteCompany(companyToDelete.id);
      setCompanies((prev) => prev.filter((c) => c.id !== companyToDelete.id));
      addToast("Company deleted successfully.", "info");
    } catch (error) {
      console.error("Error deleting company:", error);
      addToast("Failed to delete company.", "error");
    } finally {
      setCompanyToDelete(null);
    }
  }

  return (
    <PageTransition>
      <div className="companies-page">
        {/* ── Toolbar ── */}
        <div className="companies-toolbar">
          <div>
            <h2 className="companies-title">Companies</h2>
            <p className="companies-subtitle">{companies.length} companies registered</p>
          </div>

          <div className="companies-actions">
            {/* Search */}
            <div className="companies-search">
              <HiMagnifyingGlass className="companies-search-icon" />
              <input
                type="text"
                placeholder="Search companies…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Add Company button */}
            <button className="btn-add-company" onClick={handleAddCompany}>
              <HiMiniPlus />
              Add Company
            </button>
          </div>
        </div>

        {/* ── Cards Grid ── */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="companies-grid"
        >
          {/* Skeleton / Add card — always first */}
          <AddCompanyCard onClick={handleAddCompany} />

          {loading ? (
            <p className="companies-empty" style={{ gridColumn: "1 / -1" }}>Loading companies...</p>
          ) : filtered.length > 0 ? (
            filtered.map((company) => (
              <CompanyCard key={company.id} company={company} onDelete={handleDeleteClick} />
            ))
          ) : (
            <p className="companies-empty" style={{ gridColumn: "1 / -1" }}>No companies match your search.</p>
          )}
        </motion.div>
      </div>

      {/* ── Add Company Modal ── */}
      {showModal && (
        <AddCompanyModal
          onClose={() => setShowModal(false)}
          onAdd={handleNewCompany}
        />
      )}

      {companyToDelete && (
        <ConfirmModal
          title="Delete Company"
          message={`Are you sure you want to delete ${companyToDelete.name}? This action cannot be undone and will permanently remove all associated records.`}
          confirmText="Delete"
          isDanger={true}
          onConfirm={confirmDelete}
          onCancel={() => {
            setCompanyToDelete(null);
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

export default Companies;