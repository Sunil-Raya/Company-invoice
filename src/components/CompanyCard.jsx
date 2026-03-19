import { HiOfficeBuilding } from "react-icons/hi";
import { HiMiniPlus, HiTrash } from "react-icons/hi2";

export function AddCompanyCard({ onClick }) {
  return (
    <button className="company-card company-card--add" onClick={onClick}>
      <div className="company-card-add-icon">
        <HiMiniPlus />
      </div>
      <span className="company-card-add-label">Add Company</span>
    </button>
  );
}

function CompanyCard({ company, onDelete }) {
  const { name, industry, location, invoices, balance, initials, color, email, phone } =
    company;

  return (
    <div className="company-card">
      <div className="company-card-header">
        <div
          className="company-card-avatar"
          style={{ background: color }}
        >
          {initials}
        </div>
        <div className="company-card-meta">
          <h3 className="company-card-name">{name}</h3>
          <span className="company-card-industry">{industry}</span>
        </div>
        <button
          className="company-card-delete"
          onClick={() => onDelete(company.id)}
          title="Delete company"
        >
          <HiTrash />
        </button>
      </div>

      <div className="company-card-body">
        {email && (
          <div className="company-card-stat">
            <span className="company-card-stat-label">Email</span>
            <span className="company-card-stat-value">{email}</span>
          </div>
        )}
        {phone && (
          <div className="company-card-stat">
            <span className="company-card-stat-label">Phone</span>
            <span className="company-card-stat-value">{phone}</span>
          </div>
        )}
        <div className="company-card-stat">
          <span className="company-card-stat-label">Location</span>
          <span className="company-card-stat-value">{location || "—"}</span>
        </div>
        <div className="company-card-stat">
          <span className="company-card-stat-label">Transactions</span>
          <span className="company-card-stat-value">{invoices}</span>
        </div>
        <div className="company-card-stat">
          <span className="company-card-stat-label">Balance</span>
          <span className={`company-card-stat-value ${balance >= 0 ? "revenue" : ""}`}>
            {balance < 0 ? `-$${Math.abs(balance).toLocaleString()}` : `$${balance.toLocaleString()}`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CompanyCard;