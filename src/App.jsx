import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, lazy, Suspense } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./contexts/ToastContext";
import { CompaniesProvider } from "./contexts/CompaniesContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";

// Lazy load pages for massive bundle size reduction
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Companies = lazy(() => import("./pages/Companies"));
const AddSale = lazy(() => import("./pages/AddSale"));
const AddPayment = lazy(() => import("./pages/AddPayment"));
const AddGoodsReceived = lazy(() => import("./pages/AddGoodsReceived"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Employees = lazy(() => import("./pages/Employees"));
const EmployeeDetail = lazy(() => import("./pages/EmployeeDetail"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', color: '#6366f1', fontSize: '14px', fontWeight: '600' }}>
      LOADING...
    </div>
  );
}

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/employees/:id" element={<EmployeeDetail />} />
              <Route path="/add-sale" element={<AddSale />} />
              <Route path="/add-payment" element={<AddPayment />} />
              <Route path="/add-goods-received" element={<AddGoodsReceived />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
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
              <Suspense fallback={<PageLoader />}>
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
              </Suspense>
              <SpeedInsights />
            </BrowserRouter>
          </CompaniesProvider>
        </SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;