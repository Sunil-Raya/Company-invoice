import { useState, useEffect } from "react";
import { HiMagnifyingGlass, HiMiniPlus } from "react-icons/hi2";
import CompanyCard, { AddCompanyCard } from "../components/CompanyCard";
import AddCompanyModal from "../components/AddCompanyModal";
import ConfirmModal from "../components/ConfirmModal";
import { getCompaniesWithStats, deleteCompany } from "../services/companiesService";
import { useToast } from "../contexts/ToastContext";
import "../styles/companies.css";

function Companies() {
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const processedCompanies = await getCompaniesWithStats();
      setCompanies(processedCompanies);
    } catch (error) {
      console.error("Error fetching companies data:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = companies.filter((c) =>
    (c.name || "").toLowerCase().includes(query.toLowerCase()) ||
    (c.industry || "").toLowerCase().includes(query.toLowerCase()) ||
    (c.location || "").toLowerCase().includes(query.toLowerCase())
  );

  function handleAddCompany() {
    setShowModal(true);
  }

  function handleNewCompany(newCompany) {
    // New company starts with 0 invoices and 0 balance
    const companyWithStats = {
      ...newCompany,
      invoices: 0,
      balance: 0,
    };
    setCompanies((prev) => [companyWithStats, ...prev]);
  }

  function handleDeleteClick(id) {
    const company = companies.find(c => c.id === id);
    if (company) setCompanyToDelete(company);
  }

  async function confirmDelete() {
    if (!companyToDelete) return;
    
    try {
      await deleteCompany(companyToDelete.id);
      setCompanies((prev) => prev.filter((c) => c.id !== companyToDelete.id));
      addToast("Company deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting company:", error);
      addToast("Failed to delete company.", "error");
    } finally {
      setCompanyToDelete(null);
    }
  }

  return (
    <>
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
      <div className="companies-grid">
        {/* Skeleton / Add card — always first */}
        <AddCompanyCard onClick={handleAddCompany} />

        {loading ? (
          <p className="companies-empty" style={{ gridColumn: "1 / -1" }}>Loading companies...</p>
        ) : filtered.length > 0 ? (
          filtered.map((company) => (
            <CompanyCard key={company.id} company={company} onDelete={handleDeleteClick} />
          ))
        ) : (
          <p className="companies-empty">No companies match your search.</p>
        )}
      </div>
    </div>

    {/* ── Add Company Modal ── */}
    {showModal && (
      <AddCompanyModal
        onClose={() => setShowModal(false)}
        onAdd={handleNewCompany}
      />
    )}

    {/* ── Confirm Delete Modal ── */}
    {companyToDelete && (
      <ConfirmModal
        title="Delete Company"
        message={`Are you sure you want to delete ${companyToDelete.name}? This action cannot be undone and will permanently remove all associated records.`}
        confirmText="Delete"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setCompanyToDelete(null)}
      />
    )}
    </>
  );
}

export default Companies;