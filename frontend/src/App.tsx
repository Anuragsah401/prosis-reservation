import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardPage } from '@/pages/dashboard-page'
import { TablesPage } from '@/pages/tables-page'
import { FloorPlanPage } from '@/pages/floor-plan-page'
import { ReservationsPage } from '@/pages/reservations-page'
import { CustomersPage } from '@/pages/customers-page'
import { AnalyticsPage } from '@/pages/analytics-page'
import { SettingsPage } from '@/pages/settings-page'
import { PublicBookingPage } from '@/pages/public-booking-page'

function App() {
  return (
    <Routes>
      <Route path="/restaurant/:id/book" element={<PublicBookingPage />} />
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tables" element={<TablesPage />} />
        <Route path="/floor-plan" element={<FloorPlanPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
