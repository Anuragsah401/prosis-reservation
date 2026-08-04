import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import en from "@/i18n/locales/en.json"
import da from "@/i18n/locales/da.json"
import tr from "@/i18n/locales/tr.json"

export const LANGUAGE_STORAGE_KEY = "prosisit:language"

export interface SupportedLanguage {
  code: string
  label: string
  nativeLabel: string
}

export const supportedLanguages: SupportedLanguage[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "da", label: "Danish", nativeLabel: "Dansk" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe" },
]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      da: { translation: da },
      tr: { translation: tr },
    },
    fallbackLng: "en",
    supportedLngs: supportedLanguages.map((l) => l.code),
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
  })

export default i18n
