import { useState } from "react"
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
import { deleteCustomer, type ApiCustomer } from "./customers-api"

interface DeleteCustomerDialogProps {
  customer: ApiCustomer
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (id: string) => void
}

/**
 * Confirms before permanently deleting a customer. The dialog owns the server
 * call and only reports success once the delete has gone through, so a failed
 * delete keeps the dialog open with an error instead of the card silently
 * coming back on the next refresh.
 */
export function DeleteCustomerDialog({
  customer,
  open,
  onOpenChange,
  onDeleted,
}: DeleteCustomerDialogProps) {
  const { t } = useTranslation()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteCustomer(customer.id)
    } catch (err) {
      console.error("[customers] Failed to delete customer:", err)
      setError(err instanceof Error ? err.message : t("pages.customers.delete.errorDelete"))
      return
    } finally {
      setIsDeleting(false)
    }
    onDeleted(customer.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("pages.customers.delete.title")}</DialogTitle>
          <DialogDescription>
            {t("pages.customers.delete.description", { name: customer.name })}
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("pages.customers.cancel")}
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={isDeleting}>
            {isDeleting && <Loader2 className="size-4 animate-spin" />}
            {t("pages.customers.delete.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
