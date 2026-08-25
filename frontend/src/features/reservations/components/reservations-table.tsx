import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, MessageSquare, PartyPopper, Pencil, Trash2, UtensilsCrossed } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
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
import { statusLabels, type CalendarReservation, type ReservationStatus } from "@/features/reservations-calendar/calendar-data"
import { useScrollOverflow } from "@/hooks/use-scroll-overflow"
import { statusCellStyles, statusOptions, statusStyles } from "../reservations-constants"
import { capitalize, parseReservationNotes } from "../reservations-utils"
import { EditReservationDialog } from "./edit-reservation-dialog"
import { DeleteReservationDialog } from "./delete-reservation-dialog"

interface ReservationsTableProps {
  reservations: CalendarReservation[]
  onStatusChange: (id: string, status: ReservationStatus) => void
  onUpdateReservation: (updated: CalendarReservation) => void
  onDeleteReservation: (id: string) => void
}

/**
 * Scrollable reservations list for the selected day. The column header stays
 * pinned via `sticky` while only the rows scroll; a small hint appears below
 * the table when there's more content to scroll to.
 */
export function ReservationsTable({
  reservations,
  onStatusChange,
  onUpdateReservation,
  onDeleteReservation,
}: ReservationsTableProps) {
  const { t } = useTranslation()
  const { ref: listScrollRef, hasMoreBelow } = useScrollOverflow<HTMLDivElement>([reservations])
  const [editingReservation, setEditingReservation] = useState<CalendarReservation | null>(null)
  const [deletingReservation, setDeletingReservation] = useState<CalendarReservation | null>(null)

  return (
    <Card>
      <CardContent className="px-0 sm:px-6">
        <div
          ref={listScrollRef}
          className="max-h-[calc(100vh-20rem)] overflow-y-auto *:data-[slot=table-container]:overflow-visible"
        >
          <Table>
            <TableHeader className="bg-card sticky top-0 z-10">
              <TableRow>
                <TableHead>{t("pages.reservations.colCustomer")}</TableHead>
                <TableHead>{t("pages.reservations.colPhone")}</TableHead>
                <TableHead>{t("pages.reservations.colTime")}</TableHead>
                <TableHead>{t("pages.reservations.colParty")}</TableHead>
                <TableHead>{t("pages.reservations.colTable")}</TableHead>
                <TableHead>{t("pages.reservations.colEventsNotes", "Events & Notes")}</TableHead>
                <TableHead>{t("pages.reservations.colStatus")}</TableHead>
                <TableHead className="w-24 text-right">{t("pages.reservations.colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                    {t("pages.reservations.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                reservations.map((r) => {
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

                  return (
                    <TableRow key={r.id} className={cn("transition-colors", statusCellStyles[r.status])}>
                      <TableCell className="font-medium">{r.customerName}</TableCell>
                      <TableCell className="text-muted-foreground">{r.customerPhone || "—"}</TableCell>
                      <TableCell>
                        {new Date(r.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </TableCell>
                      <TableCell>{r.partySize}</TableCell>
                      <TableCell>
                        {r.tableName ?? (
                          <span className="text-muted-foreground">{t("pages.reservations.unassigned")}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasDetails ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="group hover:bg-accent/60 inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-2 py-1 text-xs transition-all hover:border-border cursor-pointer text-left max-w-full"
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
                            <PopoverContent className="w-80 p-4 shadow-md" align="start">
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
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
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
                            <DropdownMenuLabel>{t("pages.reservations.setStatus")}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {statusOptions.map((status) => (
                              <DropdownMenuItem key={status} onClick={() => onStatusChange(r.id, status)}>
                                <Badge variant={statusStyles[status]} className="mr-1">
                                  {statusLabels[status]}
                                </Badge>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingReservation(r)}
                            className="text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-md hover:bg-accent"
                            aria-label={t("pages.reservations.actions.edit")}
                            title={t("pages.reservations.actions.edit")}
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingReservation(r)}
                            className="text-muted-foreground hover:text-destructive inline-flex size-8 items-center justify-center rounded-md hover:bg-destructive/10"
                            aria-label={t("pages.reservations.actions.delete")}
                            title={t("pages.reservations.actions.delete")}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        {hasMoreBelow && (
          <p className="text-muted-foreground border-t text-center text-xs sm:px-6">
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
