import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
      const next = await loadViewerTables(partySize)
      if (cancelled) return
      setTables(next)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [partySize])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("pages.reservations.tablePicker.title")}</DialogTitle>
          <DialogDescription>{t("pages.reservations.tablePicker.description")}</DialogDescription>
        </DialogHeader>

        {loading && tables.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        ) : tables.length === 0 ? (
          <div className="bg-muted/30 text-muted-foreground flex h-48 items-center justify-center rounded-lg border text-center text-sm px-6">
            {t("pages.reservations.tablePicker.empty")}
          </div>
        ) : (
          <FloorPlanViewer
            tables={tables}
            selectedTableId={selection}
            currentTableId={selectedTableId}
            onSelect={setSelection}
            seatsLabel={t("pages.reservations.newDialog.seats")}
            showFullscreen={false}
          />
        )}

        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("pages.reservations.cancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
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
            {t("pages.reservations.tablePicker.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
