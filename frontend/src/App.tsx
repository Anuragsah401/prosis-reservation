import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, RedirectIfAuthenticated } from '@/features/auth/require-auth'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardPage } from '@/pages/dashboard-page'
import { TablesPage } from '@/pages/tables-page'
import { FloorPlanPage } from '@/pages/floor-plan-page'
import { ReservationsPage } from '@/pages/reservations-page'
import { CustomersPage } from '@/pages/customers-page'
import { AnalyticsPage } from '@/pages/analytics-page'
import { SettingsPage } from '@/pages/settings-page'
import { NotificationsPage } from '@/pages/notifications-page'
import { PublicBookingPage } from '@/pages/public-booking-page'
import { LandingPage } from '@/pages/landing-page'
import { LoginPage } from '@/pages/login-page'
import { SignupPage } from '@/pages/signup-page'
import { ForgotPasswordPage } from '@/pages/forgot-password-page'
import { ResetPasswordPage } from '@/pages/reset-password-page'

function App() {
  return (
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
      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/floor-plan" element={<FloorPlanPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
