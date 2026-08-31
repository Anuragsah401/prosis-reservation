import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ChevronDown,
  MessageSquare,
  PartyPopper,
  Pencil,
  Trash2,
  UtensilsCrossed,
  Phone,
  Mail,
  CheckCircle2,
  UserCheck,
  CheckCheck,
  XCircle,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  statusLabels,
  type CalendarReservation,
  type ReservationStatus,
} from "@/features/reservations-calendar/calendar-data"
import { useScrollOverflow } from "@/hooks/use-scroll-overflow"
import { statusCellStyles, statusOptions, statusStyles } from "../reservations-constants"
import { capitalize, getReservationEndTime, parseReservationNotes } from "../reservations-utils"
import { EditReservationDialog } from "./edit-reservation-dialog"
import { DeleteReservationDialog } from "./delete-reservation-dialog"

interface ReservationsTableProps {
  reservations: CalendarReservation[]
  onStatusChange: (id: string, status: ReservationStatus) => void
  onBulkStatusChange?: (ids: string[], status: ReservationStatus) => void
  onUpdateReservation: (updated: CalendarReservation) => void
  onDeleteReservation: (id: string) => void
}

function getInitials(name: string): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

/**
 * Enhanced scrollable reservations list with multi-select bulk actions,
 * visual avatars, contact links, event tags, and sticky headers.
 */
export function ReservationsTable({
  reservations,
  onStatusChange,
  onBulkStatusChange,
  onUpdateReservation,
  onDeleteReservation,
}: ReservationsTableProps) {
  const { t } = useTranslation()
  const { ref: listScrollRef, hasMoreBelow } = useScrollOverflow<HTMLDivElement>([reservations])
  const [editingReservation, setEditingReservation] = useState<CalendarReservation | null>(null)
  const [deletingReservation, setDeletingReservation] = useState<CalendarReservation | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const allSelected = reservations.length > 0 && selectedIds.size === reservations.length
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < reservations.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(reservations.map((r) => r.id)))
    }
  }

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBulkAction = (status: ReservationStatus) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    if (onBulkStatusChange) {
      onBulkStatusChange(ids, status)
    } else {
      ids.forEach((id) => onStatusChange(id, status))
    }
    setSelectedIds(new Set())
  }

  return (
    <Card className="border-border/80 shadow-xs">
      {/* Floating / Sticky Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/5 border-primary/20 flex flex-wrap items-center justify-between gap-2 border-b p-2 sm:px-4 sm:py-2.5 text-sm transition-all animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full text-xs font-bold">
              {selectedIds.size}
            </span>
            <span className="font-semibold text-foreground text-xs sm:text-sm">
              {t("pages.reservations.serviceTools.selectedCount", "{{count}} selected", {
                count: selectedIds.size,
              })}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
              onClick={() => handleBulkAction("CONFIRMED")}
            >
              <CheckCircle2 className="size-3" />
              <span className="hidden sm:inline">{t("pages.reservations.serviceTools.bulkMarkConfirmed", "Mark Confirmed")}</span>
              <span className="sm:hidden">{t("pages.reservations.filters.confirmed", "Confirmed")}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10"
              onClick={() => handleBulkAction("CHECKED_IN")}
            >
              <UserCheck className="size-3" />
              <span className="hidden sm:inline">{t("pages.reservations.serviceTools.bulkMarkSeated", "Mark Seated")}</span>
              <span className="sm:hidden">{t("pages.reservations.filters.seated", "Seated")}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10"
              onClick={() => handleBulkAction("COMPLETED")}
            >
              <CheckCheck className="size-3" />
              <span className="hidden sm:inline">{t("pages.reservations.serviceTools.bulkMarkCompleted", "Mark Completed")}</span>
              <span className="sm:hidden">{t("pages.reservations.filters.completed", "Done")}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => handleBulkAction("CANCELLED")}
            >
              <XCircle className="size-3" />
              <span className="hidden sm:inline">{t("pages.reservations.serviceTools.bulkCancel", "Cancel Selected")}</span>
              <span className="sm:hidden">{t("pages.reservations.filters.cancelled", "Cancel")}</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="size-3" />
              <span className="hidden sm:inline ml-1">{t("pages.reservations.serviceTools.clearSelection", "Clear")}</span>
            </Button>
          </div>
        </div>
      )}

      <CardContent className="px-0">
        {reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <p className="text-sm font-medium text-foreground">{t("pages.reservations.emptyState.title", "No reservations found")}</p>
            <p className="text-xs text-muted-foreground">{t("pages.reservations.empty", "No reservations match your criteria.")}</p>
          </div>
        ) : (
          <>
            {/* 1. Mobile Card Feed (< md / < 768px) */}
            <div className="block md:hidden divide-y divide-border/60">
              {/* Mobile Select All Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/60 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isPartiallySelected
                    }}
                    onChange={toggleSelectAll}
                    className="size-4 rounded border-input text-primary accent-primary cursor-pointer"
                  />
                  <span className="font-semibold text-muted-foreground">
                    {t("pages.reservations.serviceTools.selectAll", "Select all")} ({reservations.length})
                  </span>
                </label>
              </div>

              {/* Mobile Reservation Cards */}
              {reservations.map((r) => {
                const parsed = parseReservationNotes(r.notes)
                const eventType = r.eventType || parsed.eventType
                const foodCategories =
                  r.foodCategories && r.foodCategories.length > 0 ? r.foodCategories : parsed.foodCategories
                const specialRequest = r.specialRequests || parsed.specialRequests
                const hasDetails = Boolean(
                  (eventType && eventType !== "unspecified") ||
                  (foodCategories && foodCategories.length > 0) ||
                  specialRequest,
                )
                const isRowSelected = selectedIds.has(r.id)
                const startTime = new Date(r.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
                const endTime = getReservationEndTime(r.start, r.durationMinutes)

                return (
                  <div
                    key={r.id}
                    className={cn(
                      "flex flex-col gap-2.5 p-3 transition-colors",
                      isRowSelected ? "bg-primary/5" : statusCellStyles[r.status],
                    )}
                  >
                    {/* Header: Checkbox + Avatar + Name + Status Dropdown */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={(e) => toggleSelectRow(r.id, e as unknown as React.MouseEvent)}
                          className="size-4 rounded border-input text-primary accent-primary cursor-pointer shrink-0"
                          aria-label={`Select reservation for ${r.customerName}`}
                        />
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
                          {getInitials(r.customerName)}
                        </div>
                        <span className="font-bold text-foreground truncate text-sm">
                          {r.customerName}
                        </span>
                      </div>

                      {/* Status Selector Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-flex cursor-pointer focus:outline-hidden shrink-0">
                            <Badge
                              variant={statusStyles[r.status] ?? "outline"}
                              className="flex items-center gap-1 text-[11px] font-semibold py-0.5"
                            >
                              {statusLabels[r.status]}
                              <ChevronDown className="size-2.5 opacity-70" />
                            </Badge>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuLabel className="text-xs">{t("pages.reservations.setStatus")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {statusOptions.map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => onStatusChange(r.id, status)}
                              className="text-xs font-medium cursor-pointer"
                            >
                              <Badge variant={statusStyles[status]} className="mr-1 text-[11px]">
                                {statusLabels[status]}
                              </Badge>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Meta Row: Time Range, Party Size, Table */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-bold text-foreground bg-card border px-2 py-0.5 rounded-md">
                        {startTime} – {endTime}
                      </span>
                      <span className="font-bold text-xs bg-muted px-2 py-0.5 rounded-md text-foreground">
                        {r.partySize}p
                      </span>
                      {r.tableName ? (
                        <span className="font-semibold text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                          {r.tableName}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                          {t("pages.reservations.unassigned", "Unassigned")}
                        </span>
                      )}
                    </div>

                    {/* Contact details */}
                    {(r.customerPhone || r.customerEmail) && (
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {r.customerPhone && (
                          <a
                            href={`tel:${r.customerPhone}`}
                            className="inline-flex items-center gap-1 hover:text-foreground font-mono"
                          >
                            <Phone className="size-3 text-muted-foreground" />
                            <span>{r.customerPhone}</span>
                          </a>
                        )}
                        {r.customerEmail && (
                          <a
                            href={`mailto:${r.customerEmail}`}
                            className="inline-flex items-center gap-1 hover:text-foreground truncate max-w-48"
                          >
                            <Mail className="size-3 text-muted-foreground" />
                            <span className="truncate">{r.customerEmail}</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Events & Dietary notes */}
                    {hasDetails && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {eventType && eventType !== "unspecified" && (
                          <span className="inline-flex items-center gap-1 font-medium text-purple-700 dark:text-purple-300 bg-purple-500/10 rounded px-1.5 py-0.5 text-[11px]">
                            <PartyPopper className="size-3 shrink-0" />
                            <span className="capitalize">
                              {t(`pages.reservations.newDialog.event${capitalize(eventType)}`, capitalize(eventType))}
                            </span>
                          </span>
                        )}
                        {foodCategories && foodCategories.length > 0 && (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 rounded px-1.5 py-0.5 text-[11px]">
                            <UtensilsCrossed className="size-3 shrink-0" />
                            <span>{foodCategories.join(", ")}</span>
                          </span>
                        )}
                        {specialRequest && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted/80 rounded px-1.5 py-0.5 text-[11px]">
                            <MessageSquare className="size-3 shrink-0 text-primary" />
                            <span>{specialRequest}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-end gap-1 pt-1.5 border-t border-border/40">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                        onClick={() => setEditingReservation(r)}
                      >
                        <Pencil className="size-3" />
                        <span>{t("pages.reservations.actions.edit")}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
                        onClick={() => setDeletingReservation(r)}
                      >
                        <Trash2 className="size-3" />
                        <span>{t("pages.reservations.actions.delete")}</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 2. Tablet & Desktop Scrollable Data Table (>= md / >= 768px) */}
            <div
              ref={listScrollRef}
              className="hidden md:block max-h-[calc(100vh-21rem)] overflow-y-auto overflow-x-auto *:data-[slot=table-container]:overflow-visible"
            >
              <Table className="min-w-[780px]">
                <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-xs">
                  <TableRow className="border-b border-border/80">
                    <TableHead className="w-10 pl-4 pr-0">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isPartiallySelected
                        }}
                        onChange={toggleSelectAll}
                        className="size-4 rounded border-input text-primary accent-primary cursor-pointer focus:ring-1 focus:ring-primary"
                        aria-label={t("pages.reservations.serviceTools.selectAll", "Select all")}
                      />
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">{t("pages.reservations.colCustomer")}</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">{t("pages.reservations.colPhone")}</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">{t("pages.reservations.colTime")}</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">{t("pages.reservations.colParty")}</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">{t("pages.reservations.colTable")}</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">{t("pages.reservations.colEventsNotes", "Events & Notes")}</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">{t("pages.reservations.colStatus")}</TableHead>
                    <TableHead className="w-24 text-right pr-4 font-bold text-xs uppercase tracking-wider">{t("pages.reservations.colActions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((r) => {
                    const parsed = parseReservationNotes(r.notes)
                    const eventType = r.eventType || parsed.eventType
                    const foodCategories =
                      r.foodCategories && r.foodCategories.length > 0 ? r.foodCategories : parsed.foodCategories
                    const specialRequest = r.specialRequests || parsed.specialRequests
                    const hasDetails = Boolean(
                      (eventType && eventType !== "unspecified") ||
                      (foodCategories && foodCategories.length > 0) ||
                      specialRequest,
                    )
                    const isRowSelected = selectedIds.has(r.id)
                    const startTime = new Date(r.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
                    const endTime = getReservationEndTime(r.start, r.durationMinutes)

                    return (
                      <TableRow
                        key={r.id}
                        className={cn(
                          "group transition-colors border-b border-border/50",
                          isRowSelected ? "bg-primary/5 hover:bg-primary/10" : statusCellStyles[r.status],
                        )}
                      >
                        {/* Checkbox */}
                        <TableCell className="pl-4 pr-0 py-3">
                          <input
                            type="checkbox"
                            checked={isRowSelected}
                            onChange={(e) => toggleSelectRow(r.id, e as unknown as React.MouseEvent)}
                            className="size-4 rounded border-input text-primary accent-primary cursor-pointer focus:ring-1 focus:ring-primary"
                            aria-label={`Select reservation for ${r.customerName}`}
                          />
                        </TableCell>

                        {/* Customer Name + Initials Avatar */}
                        <TableCell className="font-medium py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
                              {getInitials(r.customerName)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-foreground truncate max-w-44 text-sm">
                                {r.customerName}
                              </span>
                              {r.customerEmail && (
                                <a
                                  href={`mailto:${r.customerEmail}`}
                                  className="text-muted-foreground hover:text-foreground text-[11px] truncate max-w-44 flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Mail className="size-2.5 shrink-0" />
                                  {r.customerEmail}
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Phone */}
                        <TableCell className="text-muted-foreground text-xs py-3">
                          {r.customerPhone ? (
                            <a
                              href={`tel:${r.customerPhone}`}
                              className="inline-flex items-center gap-1 hover:text-foreground font-mono transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="size-3 text-muted-foreground" />
                              {r.customerPhone}
                            </a>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </TableCell>

                        {/* Time */}
                        <TableCell className="py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-sm">{startTime}</span>
                            <span className="text-muted-foreground text-[11px]">
                              {endTime} ({r.durationMinutes || 90}m)
                            </span>
                          </div>
                        </TableCell>

                        {/* Party */}
                        <TableCell className="py-3">
                          <span className="inline-flex items-center justify-center font-bold text-xs bg-muted px-2 py-0.5 rounded-md">
                            {r.partySize}p
                          </span>
                        </TableCell>

                        {/* Table */}
                        <TableCell className="py-3">
                          {r.tableName ? (
                            <span className="inline-flex items-center font-semibold text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                              {r.tableName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              {t("pages.reservations.unassigned", "Unassigned")}
                            </span>
                          )}
                        </TableCell>

                        {/* Events & Notes Popover */}
                        <TableCell className="py-3">
                          {hasDetails ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="group/btn hover:bg-accent/80 inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-2 py-1 text-xs transition-all hover:border-border cursor-pointer text-left max-w-full"
                                  title={t("pages.reservations.colEventsNotes", "Events & Notes")}
                                >
                                  {eventType && eventType !== "unspecified" && (
                                    <span className="inline-flex items-center gap-1 font-medium text-purple-700 dark:text-purple-300 bg-purple-500/10 rounded px-1.5 py-0.5 text-[11px] shrink-0">
                                      <PartyPopper className="size-3 shrink-0" />
                                      <span className="capitalize">
                                        {t(`pages.reservations.newDialog.event${capitalize(eventType)}`, capitalize(eventType))}
                                      </span>
                                    </span>
                                  )}

                                  {foodCategories && foodCategories.length > 0 && (
                                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 rounded px-1.5 py-0.5 text-[11px] shrink-0">
                                      <UtensilsCrossed className="size-3 shrink-0" />
                                      <span>
                                        {foodCategories.length > 1
                                          ? `${t(`pages.reservations.newDialog.foodCategory${capitalize(foodCategories[0])}`, capitalize(foodCategories[0]))} +${foodCategories.length - 1}`
                                          : t(`pages.reservations.newDialog.foodCategory${capitalize(foodCategories[0])}`, capitalize(foodCategories[0]))}
                                      </span>
                                    </span>
                                  )}

                                  {specialRequest && (
                                    <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted/80 rounded px-1.5 py-0.5 text-[11px] max-w-28 truncate">
                                      <MessageSquare className="size-3 shrink-0 text-primary" />
                                      <span className="truncate">{specialRequest}</span>
                                    </span>
                                  )}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-4 shadow-lg border-border" align="start">
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-center justify-between border-b pb-2">
                                    <div>
                                      <h4 className="font-semibold text-sm">{r.customerName}</h4>
                                      <p className="text-xs text-muted-foreground">{r.customerPhone || "—"}</p>
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                      {r.partySize} {r.partySize === 1 ? "guest" : "guests"}
                                    </span>
                                  </div>

                                  {eventType && eventType !== "unspecified" && (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        {t("pages.reservations.colEvent", "Event")}
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1.5 font-medium text-purple-700 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-md px-2 py-1 text-xs">
                                          <PartyPopper className="size-3.5" />
                                          <span className="capitalize">
                                            {t(`pages.reservations.newDialog.event${capitalize(eventType)}`, capitalize(eventType))}
                                          </span>
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {foodCategories && foodCategories.length > 0 && (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        {t("pages.reservations.colFoodCategory", "Food Category")}
                                      </span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {foodCategories.map((cat) => (
                                          <span
                                            key={cat}
                                            className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2 py-0.5 text-xs"
                                          >
                                            <UtensilsCrossed className="size-3" />
                                            <span>{t(`pages.reservations.newDialog.foodCategory${capitalize(cat)}`, capitalize(cat))}</span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {specialRequest && (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        {t("pages.reservations.colSpecialRequest", "Special Request")}
                                      </span>
                                      <div className="flex items-start gap-2 rounded-lg bg-muted/60 border p-2.5 text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                                        <MessageSquare className="size-3.5 text-primary shrink-0 mt-0.5" />
                                        <span>{specialRequest}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </TableCell>

                        {/* Status Dropdown */}
                        <TableCell className="py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="inline-flex cursor-pointer focus:outline-hidden">
                                <Badge
                                  variant={statusStyles[r.status] ?? "outline"}
                                  className="flex items-center gap-1 text-xs font-semibold py-0.5"
                                >
                                  {statusLabels[r.status]}
                                  <ChevronDown className="size-3 opacity-70" />
                                </Badge>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuLabel className="text-xs">{t("pages.reservations.setStatus")}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {statusOptions.map((status) => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() => onStatusChange(r.id, status)}
                                  className="text-xs font-medium cursor-pointer"
                                >
                                  <Badge variant={statusStyles[status]} className="mr-1 text-[11px]">
                                    {statusLabels[status]}
                                  </Badge>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right pr-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingReservation(r)}
                              className="text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-lg hover:bg-accent cursor-pointer transition-colors"
                              aria-label={t("pages.reservations.actions.edit")}
                              title={t("pages.reservations.actions.edit")}
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingReservation(r)}
                              className="text-muted-foreground hover:text-destructive inline-flex size-8 items-center justify-center rounded-lg hover:bg-destructive/10 cursor-pointer transition-colors"
                              aria-label={t("pages.reservations.actions.delete")}
                              title={t("pages.reservations.actions.delete")}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {hasMoreBelow && (
          <p className="text-muted-foreground border-t py-1.5 text-center text-xs">
            {t("pages.reservations.scrollForMore")}
          </p>
        )}
      </CardContent>

      {editingReservation && (
        <EditReservationDialog
          reservation={editingReservation}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingReservation(null)
          }}
          onSave={onUpdateReservation}
        />
      )}
      {deletingReservation && (
        <DeleteReservationDialog
          reservation={deletingReservation}
          open={true}
          onOpenChange={(open) => {
            if (!open) setDeletingReservation(null)
          }}
          onDeleted={onDeleteReservation}
        />
      )}
    </Card>
  )
}
