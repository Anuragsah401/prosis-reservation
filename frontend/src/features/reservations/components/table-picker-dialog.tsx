import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import type { FloorPlanViewerTable } from "@/features/floor-plan/floor-plan-viewer"
import { FloorPlanViewer } from "@/features/floor-plan/floor-plan-viewer"
import type { TableOption } from "../reservations-utils"
import { buildViewerTables, loadViewerTables } from "../reservations-utils"

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
 * Lets staff pick a table for a reservation visually from the floor plan,
 * reusing the same viewer shown to guests on the confirmation page. Clicking
 * a table highlights it; the Confirm button commits the choice back to the
 * parent form.
 *
 * The parent remounts this dialog (via a key tied to `open`) so `selection`
 * re-initializes from the parent's current assignment each time it opens —
 * otherwise a cancelled pick would linger into the next open.
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
  // Render this browser's last snapshot instantly, then swap in the backend's
  // authoritative plan once it arrives. The parent remounts this dialog per
  // open (key tied to `open`), so a fresh fetch happens every time it opens.
  const [tables, setTables] = useState<FloorPlanViewerTable[]>(() => buildViewerTables(partySize))
  const [loading, setLoading] = useState(true)
  const [selection, setSelection] = useState<string | null>(selectedTableId)

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(async () => {
      const next = await loadViewerTables(partySize, reservedFor)
      if (cancelled) return
      setTables(next)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [partySize, reservedFor])

  const chosenTable = tables.find((t) => t.id === selection)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-[96vw] max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden gap-3">
        <DialogHeader className="pb-1 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <DialogTitle className="text-lg font-bold">
                {t("pages.reservations.tablePicker.title", "Choose Table from Floor Plan")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("pages.reservations.tablePicker.description", "Click an available table to assign it to this reservation.")}
              </DialogDescription>
            </div>

            {/* Quick Status Legend */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md border self-start sm:self-auto">
              <span className="flex items-center gap-1 font-medium">
                <span className="size-2 rounded-full bg-emerald-500" />
                {t("pages.reservations.tablePicker.legendAvailable", "Available")}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="size-2 rounded-full bg-blue-500" />
                {t("pages.reservations.tablePicker.legendReserved", "Reserved")}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="size-2 rounded-full bg-amber-500" />
                {t("pages.reservations.tablePicker.legendOccupied", "Occupied")}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Floor Plan Viewport Area */}
        <div className="flex-1 min-h-0 flex flex-col w-full h-[52vh] sm:h-[58vh]">
          {loading && tables.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            </div>
          ) : tables.length === 0 ? (
            <div className="bg-muted/30 text-muted-foreground flex h-full items-center justify-center rounded-lg border text-center text-sm px-6">
              {t("pages.reservations.tablePicker.empty", "No tables found on the floor plan.")}
            </div>
          ) : (
            <FloorPlanViewer
              tables={tables}
              selectedTableId={selection}
              currentTableId={selectedTableId}
              onSelect={setSelection}
              seatsLabel={t("pages.reservations.newDialog.seats", "seats")}
              showFullscreen={true}
            />
          )}
        </div>

        {/* Dialog Footer with Selection Summary */}
        <DialogFooter className="pt-2 border-t flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            {chosenTable ? (
              <Badge variant="secondary" className="px-2.5 py-1 text-xs font-semibold gap-1.5 border border-primary/20 bg-primary/10 text-primary">
                <Check className="size-3.5" />
                <span>
                  {chosenTable.name} ({chosenTable.capacity} seats · {chosenTable.floor}
                  {chosenTable.groupName ? ` · Group: ${chosenTable.groupName}` : ""})
                </span>
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                {t("pages.reservations.tablePicker.noSelection", "No table selected")}
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                {t("pages.reservations.cancel", "Cancel")}
              </Button>
            </DialogClose>
            <Button
              type="button"
              size="sm"
              disabled={selection === null}
              onClick={() => {
                if (selection !== null) {
                  const chosen = tables.find((t) => t.id === selection)
                  const tableOpt: TableOption | undefined = chosen
                    ? { id: chosen.id, name: chosen.name, floor: chosen.floor, capacity: chosen.capacity }
                    : undefined
                  onConfirm(selection, tableOpt)
                  onOpenChange(false)
                }
              }}
            >
              {t("pages.reservations.tablePicker.confirm", "Confirm Table")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
