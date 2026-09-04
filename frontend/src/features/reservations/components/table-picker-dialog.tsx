import { useEffect, useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Check, LayoutGrid, List, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { FloorPlanViewerTable } from "@/features/floor-plan/floor-plan-viewer"
import { FloorPlanViewer } from "@/features/floor-plan/floor-plan-viewer"
import type { TableOption } from "../reservations-utils"
import { loadViewerTables } from "../reservations-utils"

interface TablePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The reservation's current table assignment, if any. */
  selectedTableId: string | null
  /** Used to dim tables too small for the party. */
  partySize: number
  /** The ISO timestamp the reservation is for, used to check time conflicts. */
  reservedFor?: string
  /** Called with the chosen table id and details when staff confirms the selection. */
  onConfirm: (tableId: string, table?: TableOption) => void
}

/**
 * Table picker dialog for new/edit reservation and walk-in flows, implementing
 * the same segmented Map vs. List table selection modal from the public booking page.
 */
export function TablePickerDialog({
  open,
  onOpenChange,
  selectedTableId,
  partySize,
  reservedFor,
  onConfirm,
}: TablePickerDialogProps) {
  const { t } = useTranslation()
  const [tables, setTables] = useState<FloorPlanViewerTable[]>([])
  const [loading, setLoading] = useState(true)
  const [selection, setSelection] = useState<string | null>(selectedTableId)
  const [tablePickerView, setTablePickerView] = useState<"MAP" | "LIST">("MAP")
  const [activeFloor, setActiveFloor] = useState<string>("")

  // Fetch authoritative tables on open
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setSelection(selectedTableId)

    void Promise.resolve().then(async () => {
      const next = await loadViewerTables(partySize, reservedFor)
      if (cancelled) return
      setTables(next)
      setLoading(false)

      // Auto-select the floor of the currently chosen table if available
      const existing = next.find((t) => t.id === selectedTableId)
      if (existing?.floor) {
        setActiveFloor(existing.floor)
      }
    })

    return () => {
      cancelled = true
    }
  }, [open, partySize, reservedFor, selectedTableId])

  const floors = useMemo(
    () => [...new Set(tables.map((t) => t.floor).filter((f): f is string => Boolean(f)))],
    [tables],
  )

  const currentFloor = activeFloor || floors[0] || "Main Floor"

  // Filter tables by floor for List view (excluding facilities)
  const floorFilteredTables = useMemo(() => {
    return tables.filter((t) => {
      const isFacility =
        t.elementType === "FACILITY" ||
        t.capacity === 0 ||
        Boolean(t.facilityType) ||
        t.section?.startsWith("FACILITY:")
      if (isFacility) return false
      return (t.floor || "Main Floor") === currentFloor
    })
  }, [tables, currentFloor])

  const availableTablesList = useMemo(() => {
    return floorFilteredTables.filter((t) => t.available)
  }, [floorFilteredTables])

  const chosenTable = tables.find((t) => t.id === selection)

  const formattedDate = useMemo(() => {
    if (!reservedFor) return null
    try {
      const d = new Date(reservedFor)
      if (isNaN(d.getTime())) return null
      return d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return null
    }
  }, [reservedFor])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-5xl w-[96vw] h-[90vh] sm:max-h-[850px] flex flex-col p-0 overflow-hidden gap-0 rounded-2xl sm:rounded-3xl border border-border shadow-2xl pointer-events-auto"
      >
        {/* Header: Title, Reservation Context, View Switcher & Close */}
        <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-b border-border/80 bg-card shrink-0 gap-3 space-y-0">
          <div className="flex flex-col min-w-0 text-left">
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate">
              {t("pages.reservations.tablePicker.title", "Choose Table from Floor Plan")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground truncate mt-0.5">
              {partySize} {t("pages.reservations.newDialog.seats", "guests")}
              {formattedDate ? ` • ${formattedDate}` : ""}
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Segmented Map vs List View Switcher */}
            <div className="flex items-center rounded-full border border-border/80 bg-muted/40 p-0.5 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setTablePickerView("MAP")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all font-semibold cursor-pointer",
                  tablePickerView === "MAP"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="size-3.5" />
                <span>{t("pages.reservations.tablePicker.viewMap", "Map")}</span>
              </button>
              <button
                type="button"
                onClick={() => setTablePickerView("LIST")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all font-semibold cursor-pointer",
                  tablePickerView === "LIST"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="size-3.5" />
                <span>
                  {t("pages.reservations.tablePicker.viewList", "List")} ({availableTablesList.length})
                </span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Dedicated Floor Selector Strip (Only shown when multiple floors exist) */}
        {floors.length > 1 && (
          <div className="flex items-center gap-2 px-4 py-2 sm:px-6 border-b border-border/60 bg-muted/20 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
              Floor:
            </span>
            <div className="flex items-center gap-1.5">
              {floors.map((fl) => {
                const isActive = (activeFloor || floors[0]) === fl
                return (
                  <button
                    key={fl}
                    type="button"
                    onClick={() => setActiveFloor(fl)}
                    className={cn(
                      "px-3.5 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-background border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    {fl}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 relative overflow-hidden bg-muted/15 flex flex-col min-h-0">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-8 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-medium">
                  {t("pages.reservations.tablePicker.loading", "Loading floor plan layout…")}
                </span>
              </div>
            </div>
          ) : tables.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <AlertCircle className="size-10 text-muted-foreground" />
              <p className="text-sm font-semibold">
                {t("pages.reservations.tablePicker.empty", "No floor plan layout available")}
              </p>
            </div>
          ) : tablePickerView === "LIST" ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {floorFilteredTables.map((tbl) => {
                  const isAvailable = tbl.available
                  const isSelected = selection === tbl.id

                  return (
                    <button
                      key={tbl.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelection(isSelected ? null : tbl.id)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border text-left transition-all touch-manipulation cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md font-semibold"
                          : isAvailable
                            ? "border-border bg-card hover:bg-muted/70 active:scale-[0.98] shadow-xs"
                            : "opacity-40 bg-muted/30 cursor-not-allowed border-border/40",
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">
                          {tbl.name}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {tbl.capacity} {t("pages.reservations.newDialog.seats", "seats")} {tbl.floor ? `• ${tbl.floor}` : ""}
                        </span>
                      </div>

                      {isSelected ? (
                        <Badge variant="default" className="text-xs">Selected</Badge>
                      ) : isAvailable ? (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30 bg-emerald-500/10">Available</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Unavailable</Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 relative w-full h-full overflow-hidden flex flex-col pointer-events-auto">
              <div className="flex-1 w-full h-full relative overflow-hidden pointer-events-auto">
                <FloorPlanViewer
                  tables={tables}
                  selectedTableId={selection}
                  currentTableId={selectedTableId}
                  activeFloor={activeFloor || floors[0]}
                  onFloorChange={setActiveFloor}
                  hideFloorTabs={true}
                  onSelect={setSelection}
                  seatsLabel={t("pages.reservations.newDialog.seats", "seats")}
                  showFullscreen={false}
                />
              </div>

              {/* Map Legend */}
              <div className="border-t bg-card/80 backdrop-blur-xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground shrink-0">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="bg-card inline-block size-3 rounded-sm border-2 border-emerald-500/60" />
                    <span>Available ({partySize}+ seats)</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="bg-muted inline-block size-3 rounded-sm border-2 opacity-40" />
                    <span>Unavailable</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="border-primary bg-primary/20 inline-block size-3 rounded-sm border-2" />
                    <span>Selected</span>
                  </span>
                </div>
                <span className="hidden sm:inline text-[11px] text-muted-foreground">Pinch / Drag to pan & zoom</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="flex flex-row items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-t border-border/80 bg-card shrink-0 space-x-0">
          <div className="flex items-center gap-2">
            {chosenTable ? (
              <div className="flex flex-col text-left">
                <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Selected Table</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {chosenTable.name} ({chosenTable.capacity} seats · {chosenTable.floor})
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic text-left">
                {t("pages.reservations.tablePicker.noSelection", "Tap any available table on the layout to select")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => onOpenChange(false)}
            >
              {t("pages.reservations.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              disabled={!selection}
              size="default"
              onClick={() => {
                if (selection) {
                  const chosen = tables.find((t) => t.id === selection)
                  const tableOpt: TableOption | undefined = chosen
                    ? { id: chosen.id, name: chosen.name, floor: chosen.floor, capacity: chosen.capacity }
                    : undefined
                  onConfirm(selection, tableOpt)
                  onOpenChange(false)
                }
              }}
              className="gap-1.5 font-semibold shadow-xs cursor-pointer"
            >
              <Check className="size-4" />
              <span>{t("pages.reservations.tablePicker.confirm", "Confirm Table")}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
