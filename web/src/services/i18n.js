import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-xhr-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: {
      'zh-Hant': [ 'zh' ],
      'zh-TW': [ 'zh' ],
      'zh-CN': [ 'zh' ],
      'zh-Hans-CN': [ 'zh' ],
      'zh-SG': [ 'zh' ],
      'zh-HK': [ 'zh' ],
      'zh-Hans': [ 'zh' ],
      'en-US': [ 'en' ],
      default: [ 'en' ]
    },
    debug: false,
    interpolation: {
      escapeValue: false
    }
});

export default i18n;
