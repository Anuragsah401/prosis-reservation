import { Outlet } from "react-router-dom"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SEOHead } from "@/components/seo"

export function DashboardLayout() {
  return (
    <div className="flex min-h-svh">
      <SEOHead robots="noindex, nofollow" />
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
