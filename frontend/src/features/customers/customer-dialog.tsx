import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import {
  createCustomer,
  updateCustomer,
  type ApiCustomer,
} from "./customers-api"

interface CustomerDialogProps {
  /** When provided, the dialog edits this customer; otherwise it creates one. */
  customer: ApiCustomer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (customer: ApiCustomer) => void
}

function toTagList(tags: string[]): string[] {
  return tags.map((t) => t.trim()).filter(Boolean)
}

/**
 * Creates or edits a customer. Shared by the "Add Customer" button and the
 * per-card edit affordance, so the same form drives both flows.
 *
 * Tags are free-text: the user types a value and presses Enter (or comma) to
 * add it as a chip, matching the `String[]` column on the customer model. The
 * dialog owns the save and only calls `onSaved` once the server confirms, so a
 * failed save keeps the dialog open with an error rather than silently
 * dropping the edit.
 */
export function CustomerDialog({ customer, open, onOpenChange, onSaved }: CustomerDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(customer)

  const [name, setName] = useState(() => customer?.name ?? "")
  const [email, setEmail] = useState(() => customer?.email ?? "")
  const [phone, setPhone] = useState(() => customer?.phone ?? "")
  const [notes, setNotes] = useState(() => customer?.notes ?? "")
  const [tags, setTags] = useState<string[]>(() => toTagList(customer?.tags ?? []))
  const [tagDraft, setTagDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function addTag(raw: string) {
    const value = raw.trim()
    if (!value) return
    setTags((prev) => (prev.includes(value) ? prev : [...prev, value]))
    setTagDraft("")
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPhone = phone.trim()
    if (!trimmedName) {
      setError(t("pages.customers.dialog.nameRequired"))
      return
    }
    if (!trimmedEmail) {
      setError(t("pages.customers.dialog.emailRequired"))
      return
    }
    if (!trimmedPhone) {
      setError(t("pages.customers.dialog.phoneRequired"))
      return
    }
    const payload = {
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      notes: notes.trim() || null,
      tags: toTagList(tags),
    }

    setIsSaving(true)
    setError(null)
    try {
      const saved = isEdit
        ? await updateCustomer(customer!.id, payload)
        : await createCustomer(payload)
      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      console.error("[customers] Failed to save customer:", err)
      setError(err instanceof Error ? err.message : t("pages.customers.dialog.errorSave"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("pages.customers.dialog.editTitle") : t("pages.customers.dialog.addTitle")}
          </DialogTitle>
          <DialogDescription>{t("pages.customers.dialog.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-name">{t("pages.customers.dialog.name")}</Label>
            <Input
              id="customer-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("pages.customers.dialog.namePlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customer-email">
                {t("pages.customers.dialog.email")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customer-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("pages.customers.dialog.emailPlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customer-phone">
                {t("pages.customers.dialog.phone")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <PhoneInput
                id="customer-phone"
                required
                value={phone}
                onChange={(value) => setPhone(value ?? "")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-tags">{t("pages.customers.dialog.tags")}</Label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-destructive"
                    aria-label={t("pages.customers.dialog.removeTag", { tag })}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                id="customer-tags"
                type="text"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault()
                    addTag(tagDraft)
                  } else if (e.key === "Backspace" && !tagDraft && tags.length > 0) {
                    removeTag(tags[tags.length - 1])
                  }
                }}
                onBlur={() => addTag(tagDraft)}
                placeholder={tags.length === 0 ? t("pages.customers.dialog.tagsPlaceholder") : ""}
                className="placeholder:text-muted-foreground min-w-24 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-notes">{t("pages.customers.dialog.notes")}</Label>
            <Textarea
              id="customer-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("pages.customers.dialog.notesPlaceholder")}
              rows={3}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("pages.customers.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? t("pages.customers.dialog.save") : t("pages.customers.dialog.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
