import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabase";

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    companyName: "Maa Laxmi Fish Suppliers",
    address: "Bhardaha-1, Saptari, Nepal",
    phone: "+977-9800000000",
    email: "info@maalaxmifish.com",
    panNumber: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching settings:", error);
      }

      if (data) {
        // Map snake_case from DB to camelCase for app
        const mappedData = {
          id: data.id,
          companyName: data.company_name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          panNumber: data.pan_number || ""
        };
        setSettings(mappedData);
        localStorage.setItem("company_details", JSON.stringify(mappedData));
      } else {
        const saved = localStorage.getItem("company_details");
        if (saved) setSettings(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updated = { ...settings, ...newSettings, id: 1 };
      
      setSettings(updated);
      localStorage.setItem("company_details", JSON.stringify(updated));

      // Map camelCase back to snake_case for Supabase
      const dbData = {
        id: updated.id,
        company_name: updated.companyName,
        address: updated.address,
        phone: updated.phone,
        email: updated.email,
        pan_number: updated.panNumber
      };

      const { error } = await supabase
        .from("company_settings")
        .upsert(dbData);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("Failed to update settings:", err);
      return { success: false, error: err.message };
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
