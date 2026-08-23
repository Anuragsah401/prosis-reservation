import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
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
import type { CalendarReservation } from "@/features/reservations-calendar/calendar-data"
import { deleteReservationOnServer } from "../reservations-api"

interface DeleteReservationDialogProps {
  reservation: CalendarReservation
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (id: string) => void
}

/**
 * Confirms before permanently deleting a reservation. The dialog owns the
 * server call and only reports success once the delete has gone through, so a
 * failed delete keeps the dialog open with an error instead of the row
 * silently coming back on the next refresh.
 */
export function DeleteReservationDialog({
  reservation,
  open,
  onOpenChange,
  onDeleted,
}: DeleteReservationDialogProps) {
  const { t } = useTranslation()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteReservationOnServer(reservation.id)
    } catch (err) {
      console.error("[reservations] Failed to delete reservation:", err)
      setError(err instanceof Error ? err.message : t("pages.reservations.deleteDialog.errorDelete"))
      return
    } finally {
      setIsDeleting(false)
    }
    onDeleted(reservation.id)
    toast.success(t("pages.reservations.toasts.deleted", "Reservation deleted successfully"), {
      description: reservation.customerName,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("pages.reservations.deleteDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("pages.reservations.deleteDialog.description", { name: reservation.customerName })}
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("pages.reservations.cancel")}
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={isDeleting}>
            {isDeleting && <Loader2 className="size-4 animate-spin" />}
            {t("pages.reservations.deleteDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
