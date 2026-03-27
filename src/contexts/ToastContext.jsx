import { createContext, useState, useContext, useCallback, useEffect } from "react";
import { HiCheckCircle, HiXCircle, HiXMark, HiInformationCircle } from "react-icons/hi2";
import "../styles/toast.css";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("app_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("app_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const addToast = useCallback((message, type = "success") => {
    console.log('Toast: Adding toast:', message, type);

    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setNotifications((prev) => {
      const newNotif = { id, message, type, date: new Date().toISOString(), read: false };
      return [newNotif, ...prev].slice(0, 50);
    });

    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ToastContext.Provider value={{ addToast, notifications, unreadCount, markAllAsRead, clearNotifications }}>
      {children}
      
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === "success" && <HiCheckCircle />}
              {toast.type === "error" && <HiXCircle />}
              {toast.type === "info" && <HiInformationCircle />}
            </div>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <HiXMark />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
