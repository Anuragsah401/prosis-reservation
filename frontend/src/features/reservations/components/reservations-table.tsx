import { useTranslation } from "react-i18next"
import { ChevronDown, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { statusLabels, type CalendarReservation, type ReservationStatus } from "@/features/reservations-calendar/calendar-data"
import { useScrollOverflow } from "@/hooks/use-scroll-overflow"
import { statusCellStyles, statusOptions, statusStyles } from "../reservations-constants"

interface ReservationsTableProps {
  reservations: CalendarReservation[]
  onStatusChange: (id: string, status: ReservationStatus) => void
}

/**
 * Scrollable reservations list for the selected day. The column header stays
 * pinned via `sticky` while only the rows scroll; a small hint appears below
 * the table when there's more content to scroll to.
 */
export function ReservationsTable({ reservations, onStatusChange }: ReservationsTableProps) {
  const { t } = useTranslation()
  const { ref: listScrollRef, hasMoreBelow } = useScrollOverflow<HTMLDivElement>([reservations])

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
                <TableHead>{t("pages.reservations.colStatus")}</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">{t("pages.reservations.colComment")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                    {t("pages.reservations.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                reservations.map((r) => (
                  <TableRow key={r.id} className={cn("transition-colors", statusCellStyles[r.status])}>
                    <TableCell className="font-medium">{r.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">{r.customerPhone}</TableCell>
                    <TableCell>
                      {new Date(r.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
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
                    <TableCell>
                      {r.notes ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground inline-flex"
                            >
                              <MessageSquare className="size-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-56">
                            <p>{r.notes}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
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
    </Card>
  )
}
