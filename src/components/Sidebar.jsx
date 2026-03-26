import { BsCalendarDate } from "react-icons/bs";
import { NavLink, useNavigate } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { FaRegChartBar } from "react-icons/fa";
import { MdOutlinePayments, MdOutlineFactory, MdOutlineInventory2 } from "react-icons/md";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { IoSettingsOutline, IoLogOutOutline } from "react-icons/io5";
import { useAuth } from "../contexts/AuthContext";

function Sidebar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const fullDate = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Derive display name from email (before the @)
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
    <div className="sidebar">
      {/* Logo + Date */}
      <div className="sidebar-logo">
        <h1>Maa Laxmi Fish Suppliers</h1>
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
          <NavLink to="/add-goods-received">
            <MdOutlineInventory2 className="nav-icon" />
            Add Goods Recv.
          </NavLink>
        </nav>
      </div>

      {/* Footer */}
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
          <NavLink to="/settings" className="sidebar-settings" title="Settings">
            <IoSettingsOutline />
          </NavLink>
          <button className="sidebar-settings" title="Logout" onClick={handleLogout}>
            <IoLogOutOutline />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;