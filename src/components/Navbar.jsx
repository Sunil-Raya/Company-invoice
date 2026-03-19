import { IoSearchOutline } from "react-icons/io5";
import { IoMdNotificationsOutline } from "react-icons/io";
import { useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const pageTitles = {
  "/": "Dashboard",
  "/companies": "Companies",
  "/add-sale": "Add Sale",
  "/add-payment": "Add Payment",
  "/reports": "Reports",
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

function Navbar() {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "Dashboard";
  const scrambledTitle = useScramble(pageTitle);

  return (
    <div className="navbar">
      <h3 className="navbar-title">{scrambledTitle}</h3>

      <div className="navbar-right">
        <div className="navbar-search">
          <IoSearchOutline className="search-icon" />
          <input type="text" placeholder="Search..." />
        </div>

        <button className="navbar-icon-btn" title="Notifications">
          <IoMdNotificationsOutline />
          <span className="notif-dot" />
        </button>

        <div className="navbar-avatar" title="Profile">
          SR
        </div>
      </div>
    </div>
  );
}

export default Navbar;