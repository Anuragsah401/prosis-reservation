/**
 * Base API URL and frontend configuration sourced from Vite environment.
 * See `.env.production` and `.env.example` for variables.
 */
export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api"
export const APP_NAME: string = import.meta.env.VITE_APP_NAME ?? "Seat Booking"
export const APP_URL: string = import.meta.env.VITE_APP_URL ?? "https://seatbooking.com"
export const WHATSAPP_NUMBER: string = import.meta.env.VITE_WHATSAPP_NUMBER ?? "15557328266"
export const WHATSAPP_DISPLAY_PHONE: string = import.meta.env.VITE_WHATSAPP_DISPLAY_PHONE ?? "+1 (555) 732-8266"

