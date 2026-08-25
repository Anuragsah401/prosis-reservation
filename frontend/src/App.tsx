import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, RedirectIfAuthenticated } from '@/features/auth/require-auth'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { RestaurantProvider } from '@/features/restaurant/restaurant-context'
import { RealtimeProvider } from '@/features/realtime'
import { Toaster } from '@/components/ui/sonner'
import { Loader2 } from 'lucide-react'

// Route-level lazy loading for performance & instant initial page loads
const LandingPage = lazy(() => import('@/pages/landing-page').then((m) => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import('@/pages/login-page').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/pages/signup-page').then((m) => ({ default: m.SignupPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/forgot-password-page').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/pages/reset-password-page').then((m) => ({ default: m.ResetPasswordPage })))
const PublicBookingPage = lazy(() => import('@/pages/public-booking-page').then((m) => ({ default: m.PublicBookingPage })))
const ReservationConfirmPage = lazy(() => import('@/pages/reservation-confirm-page').then((m) => ({ default: m.ReservationConfirmPage })))
const DashboardPage = lazy(() => import('@/pages/dashboard-page').then((m) => ({ default: m.DashboardPage })))
const FloorPlanPage = lazy(() => import('@/pages/floor-plan-page').then((m) => ({ default: m.FloorPlanPage })))
const ReservationsPage = lazy(() => import('@/pages/reservations-page').then((m) => ({ default: m.ReservationsPage })))
const CustomersPage = lazy(() => import('@/pages/customers-page').then((m) => ({ default: m.CustomersPage })))
const AnalyticsPage = lazy(() => import('@/pages/analytics-page').then((m) => ({ default: m.AnalyticsPage })))
const SettingsPage = lazy(() => import('@/pages/settings-page').then((m) => ({ default: m.SettingsPage })))
const NotificationsPage = lazy(() => import('@/pages/notifications-page').then((m) => ({ default: m.NotificationsPage })))
const NotFoundPage = lazy(() => import('@/pages/not-found-page').then((m) => ({ default: m.NotFoundPage })))

function PageLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <Loader2 className="text-primary size-8 animate-spin" />
    </div>
  )
}

function App() {
  return (
    <RestaurantProvider>
      <RealtimeProvider>
        <Toaster />
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={
                <RedirectIfAuthenticated>
                  <LoginPage />
                </RedirectIfAuthenticated>
              }
            />
            <Route
              path="/signup"
              element={
                <RedirectIfAuthenticated>
                  <SignupPage />
                </RedirectIfAuthenticated>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <RedirectIfAuthenticated>
                  <ForgotPasswordPage />
                </RedirectIfAuthenticated>
              }
            />
            <Route
              path="/reset-password"
              element={
                <RedirectIfAuthenticated>
                  <ResetPasswordPage />
                </RedirectIfAuthenticated>
              }
            />
            <Route path="/restaurant/:id/book" element={<PublicBookingPage />} />
            <Route path="/reservation/confirm" element={<ReservationConfirmPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/floor-plan" element={<FloorPlanPage />} />
                <Route path="/reservations" element={<ReservationsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<Navigate to="/settings?section=profile" replace />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </RealtimeProvider>
    </RestaurantProvider>
  )
}

export default App
