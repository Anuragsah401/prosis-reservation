import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ReservationsCalendar } from "@/features/reservations-calendar/reservations-calendar"
import { MiniMonthCalendar } from "@/features/reservations-calendar/mini-month-calendar"
import type { CalendarReservation, ReservationStatus } from "@/features/reservations-calendar/calendar-data"
import { ReservationsToolbar } from "@/features/reservations/components/reservations-toolbar"
import { ReservationsTable } from "@/features/reservations/components/reservations-table"
import { statusSortOrder } from "@/features/reservations/reservations-constants"
import { isSameDay, withOverrides } from "@/features/reservations/reservations-utils"

export function ReservationsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<"list" | "calendar">("list")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [search, setSearch] = useState("")
  const [allReservations, setAllReservations] = useState(() => withOverrides())

  function handleStatusChange(id: string, status: ReservationStatus) {
    setAllReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  function handleCreateReservation(reservation: CalendarReservation) {
    setAllReservations((prev) => [...prev, reservation])
    setSelectedDate(new Date(reservation.start))
  }

  const bookedDates = useMemo(() => {
    const set = new Set<string>()
    for (const r of allReservations) {
      const d = new Date(r.start)
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
    }
    return set
  }, [allReservations])

  const filteredReservations = useMemo(() => {
    return allReservations
      .filter((r) => isSameDay(new Date(r.start), selectedDate))
      .filter((r) => r.customerName.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => {
        const statusDiff = statusSortOrder[a.status] - statusSortOrder[b.status]
        if (statusDiff !== 0) return statusDiff
        return a.start.localeCompare(b.start)
      })
  }, [allReservations, selectedDate, search])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("pages.reservations.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("pages.reservations.subtitle")}</p>
        </div>
        <ReservationsToolbar
          tab={tab}
          onTabChange={setTab}
          defaultDate={selectedDate}
          onCreate={handleCreateReservation}
        />
      </div>

      {tab === "calendar" ? (
        <ReservationsCalendar />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          <div className="bg-card rounded-lg border p-2">
            <MiniMonthCalendar
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              highlightedDates={bookedDates}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  placeholder={t("pages.reservations.searchPlaceholder")}
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <p className="text-muted-foreground text-sm">
                {selectedDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {" · "}
                {t("pages.reservations.resultCount", { count: filteredReservations.length })}
              </p>
            </div>

            <ReservationsTable reservations={filteredReservations} onStatusChange={handleStatusChange} />
          </div>
        </div>
      )}
    </div>
  )
}
