import React, { useContext, createContext, useState, useEffect } from 'react';
import { i18n } from '../i18n/i18nManager';

const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState(i18n.getCurrentLanguage());

  useEffect(() => {
    const handleLanguageChange = (event) => {
      setLanguage(event.detail.language);
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const changeLanguage = (newLang) => {
    i18n.setLanguage(newLang);
    setLanguage(newLang);
  };

  const t = (key, defaultValue = '') => {
    return i18n.translate(key, defaultValue);
  };

  const tParams = (key, params) => {
    return i18n.translateWithParams(key, params);
  };

  return (
    <I18nContext.Provider value={{ language, changeLanguage, t, tParams }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
