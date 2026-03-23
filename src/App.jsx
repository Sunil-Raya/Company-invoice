import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { ToastProvider } from "./contexts/ToastContext";
import { CompaniesProvider, useCompanies } from "./contexts/CompaniesContext";
import { AuthProvider } from "./contexts/AuthContext";
import PasscodeGate from "./components/PasscodeGate";
import VectorLoader from "./components/VectorLoader";

import { SettingsProvider } from "./contexts/SettingsContext";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import AddSale from "./pages/AddSale";
import AddPayment from "./pages/AddPayment";
import AddGoodsReceived from "./pages/AddGoodsReceived";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function MainApp() {
  const { loading } = useCompanies();

  if (loading) {
    return (
      <div className="global-loader-container">
        <VectorLoader />
        <h2 className="global-loader-text" style={{ marginTop: '0', color: '#555', fontSize: '13px' }}>INITIALIZING SYSTEM...</h2>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <PasscodeGate>
        <div className="app">
          <Sidebar />

          <div className="main">
            <Navbar />

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
      </PasscodeGate>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SettingsProvider>
          <CompaniesProvider>
            <MainApp />
          </CompaniesProvider>
        </SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;