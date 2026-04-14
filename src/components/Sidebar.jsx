import { BsCalendarDate } from "react-icons/bs";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { FaRegChartBar } from "react-icons/fa";
import { MdOutlinePayments, MdOutlineFactory, MdOutlineInventory2 } from "react-icons/md";
import { HiOutlineDocumentReport, HiX, HiOutlineUserGroup } from "react-icons/hi";
import { IoSettingsOutline, IoLogOutOutline } from "react-icons/io5";
import { useAuth } from "../contexts/AuthContext";

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const fullDate = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const email = user?.email || '';
  const displayName = email.split('@')[0]
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?';
  const role = profile?.role || 'user';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h1>INVOICE</h1>
            <button className="mobile-close-btn" onClick={onClose}>
              <HiX />
            </button>
          </div>
          <div className="sidebar-date">
            <span className="sidebar-date-day">{weekday}</span>
            <span className="sidebar-date-full">
              <BsCalendarDate />
              {fullDate}
            </span>
          </div>
        </div>

        <div className="wrapper">
          <p className="nav-label">Main Menu</p>
          <nav>
            <NavLink to="/" end onClick={onClose}>
              <RxDashboard className="nav-icon" />
              Dashboard
            </NavLink>
            <NavLink to="/companies" onClick={onClose}>
              <MdOutlineFactory className="nav-icon" />
              Companies
            </NavLink>
            <NavLink to="/employees" onClick={onClose}>
              <HiOutlineUserGroup className="nav-icon" />
              Employees
            </NavLink>
            <NavLink to="/reports" onClick={onClose}>
              <HiOutlineDocumentReport className="nav-icon" />
              Reports
            </NavLink>
          </nav>

          <p className="nav-label" style={{ marginTop: '12px' }}>Transactions</p>
          <nav>
            <NavLink to="/add-sale" onClick={onClose}>
              <FaRegChartBar className="nav-icon" />
              Add Sale
            </NavLink>
            <NavLink to="/add-payment" onClick={onClose}>
              <MdOutlinePayments className="nav-icon" />
              Add Payment
            </NavLink>
            <NavLink to="/add-goods-received" onClick={onClose}>
              <MdOutlineInventory2 className="nav-icon" />
              Add Goods Recv.
            </NavLink>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{displayName || email}</span>
              <span className="sidebar-user-role" style={{
                textTransform: 'capitalize',
                color: role === 'admin' ? '#4f46e5' : '#9ca3af'
              }}>
                {role}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <NavLink to="/settings" className="sidebar-settings" title="Settings" onClick={onClose}>
              <IoSettingsOutline />
            </NavLink>
            <button className="sidebar-settings" title="Logout" onClick={handleLogout}>
              <IoLogOutOutline />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;