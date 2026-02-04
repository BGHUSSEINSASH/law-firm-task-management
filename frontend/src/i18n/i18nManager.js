import { translations } from './translations';

class I18nManager {
  constructor() {
    this.language = this.getStoredLanguage() || this.detectBrowserLanguage() || 'ar';
    this.translations = translations;
  }

  // Get stored language from localStorage
  getStoredLanguage() {
    try {
      return localStorage.getItem('language');
    } catch (e) {
      return null;
    }
  }

  // Detect browser language
  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('ar')) return 'ar';
    if (browserLang.startsWith('en')) return 'en';
    return 'ar'; // Default to Arabic
  }

  // Set language and save to localStorage
  setLanguage(lang) {
    if (this.translations[lang]) {
      this.language = lang;
      localStorage.setItem('language', lang);
      // Trigger language change event
      window.dispatchEvent(
        new CustomEvent('languageChanged', { detail: { language: lang } })
      );
      // Set HTML dir attribute for RTL/LTR
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      return true;
    }
    return false;
  }

  // Get current language
  getCurrentLanguage() {
    return this.language;
  }

  // Translate a key
  translate(key, defaultValue = '') {
    const keys = key.split('.');
    let value = this.translations[this.language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue || key;
      }
    }

    return value || defaultValue || key;
  }

  // Translate with parameters
  translateWithParams(key, params = {}) {
    let text = this.translate(key);
    Object.keys(params).forEach((param) => {
      text = text.replace(`{${param}}`, params[param]);
    });
    return text;
  }

  // Get all translations for current language
  getAllTranslations() {
    return this.translations[this.language];
  }

  // Get available languages
  getAvailableLanguages() {
    return Object.keys(this.translations);
  }
}

// Export singleton instance
export const i18n = new I18nManager();

// Initialize
i18n.setLanguage(i18n.language);
