import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./contexts/ToastContext";
import { CompaniesProvider } from "./contexts/CompaniesContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";

import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import AddSale from "./pages/AddSale";
import AddPayment from "./pages/AddPayment";
import AddGoodsReceived from "./pages/AddGoodsReceived";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/add-sale" element={<AddSale />} />
            <Route path="/add-payment" element={<AddPayment />} />
            <Route path="/add-goods-received" element={<AddGoodsReceived />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SettingsProvider>
          <CompaniesProvider>
            <BrowserRouter>
              <Routes>
                {/* Public auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* All other routes are protected */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </CompaniesProvider>
        </SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;