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
    // Play a crisp 'ding' sound using Web Audio API
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        // Higher, steady pitch for a bell/ding sound
        osc.frequency.setValueAtTime(1500, ctx.currentTime);
        
        // Faster attack, louder peak (0.8), and slower, more natural fade out
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.warn("Audio play failed:", e);
    }

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
