import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-xhr-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    // lng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    react: {
      wait: true,
      bindI18n: 'languageChanged loaded',
      bindStore: 'added removed',
    },
    backend: {
      allowMultiLoading: false,
      crossDomain: true,
      withCredentials: false
    }
});

export default i18n;
