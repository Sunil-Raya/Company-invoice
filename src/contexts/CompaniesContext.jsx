import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { getCompaniesWithStats } from "../services/companiesService";

const CompaniesContext = createContext();

export function CompaniesProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCompaniesWithStats();
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch immediately exactly once when the app loads
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

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
