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
    panNumber: "",
    logoUrl: ""
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
          panNumber: data.pan_number || "",
          logoUrl: data.logo_url || ""
        };
        setSettings(mappedData);
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

      // Map camelCase back to snake_case for Supabase
      const dbData = {
        id: updated.id,
        company_name: updated.companyName,
        address: updated.address,
        phone: updated.phone,
        email: updated.email,
        pan_number: updated.panNumber,
        logo_url: updated.logoUrl
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

  const deleteSettings = async () => {
    try {
      const { error } = await supabase
        .from("company_settings")
        .delete()
        .eq("id", 1);
      
      if (error) throw error;

      // Reset to defaults
      setSettings({
        companyName: "Maa Laxmi Fish Suppliers",
        address: "Bhardaha-1, Saptari, Nepal",
        phone: "+977-9800000000",
        email: "info@maalaxmifish.com",
        panNumber: "",
        logoUrl: ""
      });
      return { success: true };
    } catch (err) {
      console.error("Failed to delete settings:", err);
      return { success: false, error: err.message };
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, deleteSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
