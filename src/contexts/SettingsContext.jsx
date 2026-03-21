import React, { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("company_details");
    return saved ? JSON.parse(saved) : {
      companyName: "Maa Laxmi Fish Suppliers",
      address: "Bhardaha-1, Saptari, Nepal",
      phone: "+977-9800000000",
      email: "info@maalaxmifish.com"
    };
  });

  useEffect(() => {
    localStorage.setItem("company_details", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
