import React, { createContext, useContext, useState, useEffect } from "react";

const CityContext = createContext();

export function CityProvider({ children }) {
  const defaultCity = "Таганрог";
  const [city, setCity] = useState(() => {
    return localStorage.getItem("selectedCity") || defaultCity;
  });

  useEffect(() => {
    localStorage.setItem("selectedCity", city);
  }, [city]);

  return (
    <CityContext.Provider value={{ city, setCity }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  return useContext(CityContext);
} 