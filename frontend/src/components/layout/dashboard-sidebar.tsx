import { SidebarNav } from "@/components/layout/sidebar-nav"

export function DashboardSidebar() {
  return (
    <aside className="bg-background hidden w-64 shrink-0 border-r md:flex md:flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-semibold">Prosisit Table</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav />
      </div>
    </aside>
  )
}
