import { IoSearchOutline } from "react-icons/io5";
import { IoMdNotificationsOutline } from "react-icons/io";
import { HiCheckCircle, HiXCircle, HiInformationCircle, HiBars3 } from "react-icons/hi2";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../contexts/ToastContext";

const pageTitles = {
  "/": "Dashboard",
  "/companies": "Companies",
  "/add-sale": "Add Sale",
  "/add-payment": "Add Payment",
  "/add-goods-received": "Add Goods Recv.",
  "/reports": "Reports",
  "/settings": "Settings",
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function useScramble(text) {
  const [display, setDisplay] = useState(text);
  const intervalRef = useRef(null);

  useEffect(() => {
    let iterations = 0;
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < iterations) return char;
            return LETTERS[Math.floor(Math.random() * 26)];
          })
          .join("")
      );

      if (iterations >= text.length) {
        clearInterval(intervalRef.current);
        setDisplay(text);
      }
      iterations += 1 / 2;
    }, 30);

    return () => clearInterval(intervalRef.current);
  }, [text]);

  return display;
}

function Navbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = pageTitles[location.pathname] || "Dashboard";
  const scrambledTitle = useScramble(pageTitle);

  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useToast();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  const sidebarOptions = [
    { title: "Dashboard", path: "/" },
    { title: "Companies", path: "/companies" },
    { title: "Reports", path: "/reports" },
    { title: "Add Sale", path: "/add-sale" },
    { title: "Add Payment", path: "/add-payment" },
    { title: "Add Goods Received", path: "/add-goods-received" },
  ];

  const filteredOptions = sidebarOptions.filter(opt =>
    opt.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotifClick = () => {
    setShowDropdown((prev) => !prev);
    if (!showDropdown && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <button className="mobile-menu-btn" onClick={onMenuClick}>
          <HiBars3 />
        </button>
        <h3 className="navbar-title">{scrambledTitle}</h3>
      </div>

      <div className="navbar-right">
        <div className="navbar-search-wrapper" ref={searchRef} style={{ position: 'relative' }}>
          <div className="navbar-search">
            <IoSearchOutline className="search-icon" />
            <input 
              type="text" 
              placeholder="Search pages..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
            />
          </div>

          {showSearchDropdown && searchQuery && (
            <div className="search-dropdown">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div 
                    key={opt.path}
                    className="search-option"
                    onClick={() => {
                      navigate(opt.path);
                      setSearchQuery("");
                      setShowSearchDropdown(false);
                    }}
                  >
                    {opt.title}
                  </div>
                ))
              ) : (
                <div className="search-empty">No matching pages</div>
              )}
            </div>
          )}
        </div>

        <div className="navbar-icon-wrapper" ref={dropdownRef}>
          <button className="navbar-icon-btn" title="Notifications" onClick={handleNotifClick}>
            <IoMdNotificationsOutline />
            {unreadCount > 0 && <span className="notif-dot animate-pulse" />}
          </button>

          {showDropdown && (
            <div className="notifications-dropdown">
              <div className="notif-header">
                <h4>Notifications</h4>
                {notifications.length > 0 && (
                  <button onClick={clearNotifications} className="clear-notifs-btn">
                    Clear All
                  </button>
                )}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">No notifications yet</div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`notif-item ${notif.type}`}>
                      <div className="notif-icon">
                        {notif.type === "success" && <HiCheckCircle />}
                        {notif.type === "error" && <HiXCircle />}
                        {notif.type === "info" && <HiInformationCircle />}
                      </div>
                      <div className="notif-content">
                        <p>{notif.message}</p>
                        <span>{new Date(notif.date).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="navbar-avatar" title="Profile">
          SR
        </div>
      </div>
    </div>
  );
}

export default Navbar;