import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { getCompaniesWithStats } from "../services/companiesService";
import { useAuth } from "./AuthContext";

const CompaniesContext = createContext();

export function CompaniesProvider({ children }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    try {
      // Only show global loader if we have no data yet
      if (companies.length === 0) setLoading(true);
      
      const startTime = Date.now();
      const data = await getCompaniesWithStats();
      setCompanies(data);
      
      const elapsed = Date.now() - startTime;
      const minDuration = 2000; 
      
      // Delay only on first load for smooth entrance
      if (companies.length === 0 && elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
    } catch (error) {
      console.error("Error fetching companies data:", error);
    } finally {
      setLoading(false);
    }
  }, [companies.length]);

  // This provider mounts before login, so fetch again when the signed-in user changes.
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies, user?.id]);

  return (
    <CompaniesContext.Provider value={{ companies, setCompanies, loading, fetchCompanies }}>
      {children}
    </CompaniesContext.Provider>
  );
}

export function useCompanies() {
  const context = useContext(CompaniesContext);
  if (!context) {
    throw new Error("useCompanies must be used within a CompaniesProvider");
  }
  return context;
}
