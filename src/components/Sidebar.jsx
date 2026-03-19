import { BsCalendarDate } from "react-icons/bs";
import { NavLink } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { FaRegChartBar } from "react-icons/fa";
import { MdOutlinePayments, MdOutlineFactory } from "react-icons/md";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { IoSettingsOutline } from "react-icons/io5";

function Sidebar() {
  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const fullDate = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="sidebar">
      {/* Logo + Date */}
      <div className="sidebar-logo">
        <h1>Ledger</h1>
        <div className="sidebar-date">
          <span className="sidebar-date-day">{weekday}</span>
          <span className="sidebar-date-full">
            <BsCalendarDate />
            {fullDate}
          </span>
        </div>
      </div>

      {/* Main nav */}
      <div className="wrapper">
        {/* Overview Group */}
        <p className="nav-label">Main Menu</p>
        <nav>
          <NavLink to="/" end>
            <RxDashboard className="nav-icon" />
            Dashboard
          </NavLink>
          <NavLink to="/companies">
            <MdOutlineFactory className="nav-icon" />
            Companies
          </NavLink>
          <NavLink to="/reports">
            <HiOutlineDocumentReport className="nav-icon" />
            Reports
          </NavLink>
        </nav>

        {/* Transactions Group */}
        <p className="nav-label" style={{ marginTop: '12px' }}>Transactions</p>
        <nav>
          <NavLink to="/add-sale">
            <FaRegChartBar className="nav-icon" />
            Add Sale
          </NavLink>
          <NavLink to="/add-payment">
            <MdOutlinePayments className="nav-icon" />
            Add Payment
          </NavLink>
        </nav>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">SR</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">Sunil Raya</span>
            <span className="sidebar-user-role">Admin</span>
          </div>
        </div>
        <button className="sidebar-settings" title="Settings">
          <IoSettingsOutline />
        </button>
      </div>
    </div>
  );
}

export default Sidebar;