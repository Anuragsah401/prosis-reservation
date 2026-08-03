import { Plus, Search, List, CalendarDays, ChevronDown, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ReservationsCalendar } from "@/features/reservations-calendar/reservations-calendar"
import { MiniMonthCalendar } from "@/features/reservations-calendar/mini-month-calendar"
import {
  initialReservations,
  statusLabels,
  calendarTables,
  type ReservationStatus,
  type CalendarReservation,
} from "@/features/reservations-calendar/calendar-data"
import { loadOverrides } from "@/features/reservations-calendar/calendar-storage"
import { loadFloorPlanTables } from "@/features/floor-plan/floor-plan-storage"

const statusStyles: Record<ReservationStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  CHECKED_IN: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
}

const statusCellStyles: Record<ReservationStatus, string> = {
  PENDING: "bg-yellow-500/15 dark:bg-yellow-500/10",
  CONFIRMED: "bg-blue-500/15 dark:bg-blue-500/10",
  CHECKED_IN: "bg-green-500/15 dark:bg-green-500/10",
  COMPLETED: "bg-muted",
  CANCELLED: "bg-destructive/15 dark:bg-destructive/10",
  NO_SHOW: "bg-destructive/15 dark:bg-destructive/10",
}

const statusOptions: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]

const statusSortOrder: Record<ReservationStatus, number> = {
  CONFIRMED: 0,
  CHECKED_IN: 1,
  PENDING: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  NO_SHOW: 5,
}

function withOverrides() {
  const overrides = loadOverrides()
  return initialReservations.map((r) => {
    const o = overrides[r.id]
    if (!o) return r
    return { ...r, start: o.start, durationMinutes: o.durationMinutes, tableId: o.tableId }
  })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

interface TableOption {
  id: string
  name: string
  floor: string
  capacity: number
}

/**
 * Table choices for the New Reservation / Walk-in forms. Prefers whatever
 * tables are currently configured in the Floor Plan builder, so adding a
 * table there makes it selectable here immediately. Falls back to the mock
 * calendar tables if nothing has been configured in Floor Plan yet.
 */
function useTableOptions(): TableOption[] {
  return useMemo(() => {
    const floorPlanTables = loadFloorPlanTables()
    if (floorPlanTables && floorPlanTables.length > 0) return floorPlanTables
    return calendarTables
  }, [])
}

function toDateInputValue(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

interface NewReservationDialogProps {
  defaultDate: Date
  onCreate: (reservation: CalendarReservation) => void
}

function NewReservationDialog({ defaultDate, onCreate }: NewReservationDialogProps) {
  const [open, setOpen] = useState(false)
  const tableOptions = useTableOptions()
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [tableId, setTableId] = useState(tableOptions[0]?.id ?? "")
  const [date, setDate] = useState(() => toDateInputValue(defaultDate))
  const [time, setTime] = useState("19:00")
  const [partySize, setPartySize] = useState("2")
  const [durationMinutes, setDurationMinutes] = useState("unspecified")
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setCustomerName("")
    setCustomerPhone("")
    setCustomerEmail("")
    setTableId(tableOptions[0]?.id ?? "")
    setDate(toDateInputValue(defaultDate))
    setTime("19:00")
    setPartySize("2")
    setDurationMinutes("unspecified")
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!customerName.trim() || !customerPhone.trim() || !tableId || !date || !time) {
      setError("Please fill in all required fields.")
      return
    }
    const party = Number(partySize)
    if (!Number.isFinite(party) || party < 1) {
      setError("Party size must be at least 1.")
      return
    }

    const [hour, minute] = time.split(":").map(Number)
    const start = new Date(date)
    start.setHours(hour, minute, 0, 0)

    // "Not specified" duration falls back to the default table hold time
    // (90 min) internally, since the calendar/timeline views need a numeric
    // duration to render — the customer simply wasn't asked for an exact one.
    const duration = durationMinutes === "unspecified" ? 90 : Number(durationMinutes)

    onCreate({
      id: `r-${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      tableId,
      partySize: party,
      start: start.toISOString(),
      durationMinutes: Number.isFinite(duration) && duration > 0 ? duration : 90,
      status: "PENDING",
    })

    resetForm()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New Reservation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New reservation</DialogTitle>
          <DialogDescription>Add a booking to the reservations list.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-res-name">Customer name</Label>
            <Input
              id="new-res-name"
              placeholder="Alicia Ford"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-res-phone">Phone number</Label>
            <Input
              id="new-res-phone"
              placeholder="+1 555 0100"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-res-email">
              Email <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="new-res-email"
              type="email"
              placeholder="alicia@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-res-date">Date</Label>
              <Input
                id="new-res-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-res-time">Time</Label>
              <Input
                id="new-res-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-res-party">Party size</Label>
              <Input
                id="new-res-party"
                type="number"
                min={1}
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-res-duration">Duration</Label>
              <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                <SelectTrigger id="new-res-duration" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified">Not specified</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="150">2.5 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Table</Label>
            <Select value={tableId} onValueChange={setTableId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select table" />
              </SelectTrigger>
              <SelectContent>
                {tableOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.floor} · Table {t.name} ({t.capacity} seats)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create reservation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface WalkInDialogProps {
  onCreate: (reservation: CalendarReservation) => void
}

function WalkInDialog({ onCreate }: WalkInDialogProps) {
  const [open, setOpen] = useState(false)
  const tableOptions = useTableOptions()
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [tableId, setTableId] = useState(tableOptions[0]?.id ?? "")
  const [partySize, setPartySize] = useState("2")
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setCustomerName("")
    setCustomerPhone("")
    setCustomerEmail("")
    setTableId(tableOptions[0]?.id ?? "")
    setPartySize("2")
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!customerName.trim() || !tableId) {
      setError("Please enter a name and select a table.")
      return
    }
    const party = Number(partySize)
    if (!Number.isFinite(party) || party < 1) {
      setError("Party size must be at least 1.")
      return
    }

    onCreate({
      id: `w-${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || "—",
      customerEmail: customerEmail.trim() || undefined,
      tableId,
      partySize: party,
      start: new Date().toISOString(),
      durationMinutes: 90,
      status: "CHECKED_IN",
      notes: "Walk-in",
    })

    resetForm()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary">
          <UserPlus className="size-4" />
          Walk in
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Walk-in customer</DialogTitle>
          <DialogDescription>
            Seat a walk-in right away — they&apos;ll be marked as checked in for right now.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="walkin-name">Customer name</Label>
            <Input
              id="walkin-name"
              placeholder="Guest name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="walkin-phone">Phone number (optional)</Label>
            <Input
              id="walkin-phone"
              placeholder="+1 555 0100"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="walkin-email">
              Email <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="walkin-email"
              type="email"
              placeholder="guest@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="walkin-party">Party size</Label>
              <Input
                id="walkin-party"
                type="number"
                min={1}
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Table</Label>
              <Select value={tableId} onValueChange={setTableId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {tableOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.floor} · Table {t.name} ({t.capacity} seats)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Seat walk-in</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ReservationsPage() {
  const [tab, setTab] = useState<"list" | "calendar">("list")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [search, setSearch] = useState("")
  const [allReservations, setAllReservations] = useState(() => withOverrides())

  function handleStatusChange(id: string, status: ReservationStatus) {
    setAllReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    )
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
          <h1 className="text-2xl font-semibold tracking-tight">Reservations</h1>
          <p className="text-muted-foreground text-sm">
            View and manage upcoming and past reservations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border p-0.5">
            <Button
              size="sm"
              variant={tab === "list" ? "default" : "ghost"}
              className="h-8 px-2.5"
              onClick={() => setTab("list")}
            >
              <List className="size-3.5" />
              List
            </Button>
            <Button
              size="sm"
              variant={tab === "calendar" ? "default" : "ghost"}
              className="h-8 px-2.5"
              onClick={() => setTab("calendar")}
            >
              <CalendarDays className="size-3.5" />
              Calendar
            </Button>
          </div>
          <WalkInDialog onCreate={handleCreateReservation} />
          <NewReservationDialog defaultDate={selectedDate} onCreate={handleCreateReservation} />
        </div>
      </div>

      {tab === "calendar" ? (
        <ReservationsCalendar />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          <div className="rounded-lg border bg-card p-2">
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
                  placeholder="Search reservations..."
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
                {filteredReservations.length} reservation{filteredReservations.length === 1 ? "" : "s"}
              </p>
            </div>

            <Card>
              <CardContent className="px-0 sm:px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReservations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                          No reservations for this date.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReservations.map((r) => (
                        <TableRow
                          key={r.id}
                          className={cn("transition-colors", statusCellStyles[r.status])}
                        >
                          <TableCell className="font-medium">{r.customerName}</TableCell>
                          <TableCell className="text-muted-foreground">{r.customerPhone}</TableCell>
                          <TableCell>
                            {new Date(r.start).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>{r.partySize}</TableCell>
                          <TableCell>{r.tableId.toUpperCase()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="inline-flex">
                                  <Badge
                                    variant={statusStyles[r.status] ?? "outline"}
                                    className="flex cursor-pointer items-center gap-1"
                                  >
                                    {statusLabels[r.status]}
                                    <ChevronDown className="size-3" />
                                  </Badge>
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Set status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {statusOptions.map((status) => (
                                  <DropdownMenuItem
                                    key={status}
                                    onClick={() => handleStatusChange(r.id, status)}
                                  >
                                    <Badge variant={statusStyles[status]} className="mr-1">
                                      {statusLabels[status]}
                                    </Badge>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

