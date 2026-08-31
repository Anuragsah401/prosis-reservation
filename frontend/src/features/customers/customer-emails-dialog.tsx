import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  Mail,
  Copy,
  Check,
  Download,
  ExternalLink,
  Users,
  Filter,
  AtSign,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ApiCustomer } from "./customers-api"

interface CustomerEmailsDialogProps {
  customers: ApiCustomer[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type EmailFormat = "comma" | "semicolon" | "newline" | "named"

export function CustomerEmailsDialog({
  customers,
  open,
  onOpenChange,
}: CustomerEmailsDialogProps) {
  const { t } = useTranslation()
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const [format, setFormat] = useState<EmailFormat>("comma")
  const [copied, setCopied] = useState(false)

  // Collect all unique tags
  const availableTags = useMemo(() => {
    const set = new Set<string>()
    for (const c of customers) {
      for (const tag of c.tags) {
        if (tag.trim()) set.add(tag.trim())
      }
    }
    return Array.from(set).sort()
  }, [customers])

  // Filter customers that have a valid email address and match tag filter
  const eligibleCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!c.email || !c.email.includes("@")) return false
      if (selectedTag === "all") return true
      return c.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
    })
  }, [customers, selectedTag])

  // Formatted string according to the selected format
  const formattedEmailsString = useMemo(() => {
    if (eligibleCustomers.length === 0) return ""

    switch (format) {
      case "comma":
        return eligibleCustomers.map((c) => c.email!.trim()).join(", ")
      case "semicolon":
        return eligibleCustomers.map((c) => c.email!.trim()).join("; ")
      case "newline":
        return eligibleCustomers.map((c) => c.email!.trim()).join("\n")
      case "named":
        return eligibleCustomers
          .map((c) => `"${c.name.replace(/"/g, "")}" <${c.email!.trim()}>`)
          .join(", ")
      default:
        return eligibleCustomers.map((c) => c.email!.trim()).join(", ")
    }
  }, [eligibleCustomers, format])

  const handleCopy = async () => {
    if (!formattedEmailsString) return
    try {
      await navigator.clipboard.writeText(formattedEmailsString)
      setCopied(true)
      toast.success(
        t(
          "pages.customers.emailsDialog.toasts.copied",
          "Copied {{count}} customer emails to clipboard",
          { count: eligibleCustomers.length },
        ),
      )
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(
        t("pages.customers.emailsDialog.toasts.copyFailed", "Failed to copy to clipboard"),
      )
    }
  }

  const handleExportCSV = () => {
    if (eligibleCustomers.length === 0) return
    const headers = ["Name", "Email", "Phone", "Tags", "Notes"]
    const rows = eligibleCustomers.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.email!.replace(/"/g, '""')}"`,
      `"${(c.phone ?? "").replace(/"/g, '""')}"`,
      `"${c.tags.join(", ").replace(/"/g, '""')}"`,
      `"${(c.notes ?? "").replace(/"/g, '""')}"`,
    ])

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `customer_emails_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(
      t(
        "pages.customers.emailsDialog.toasts.exported",
        "Exported {{count}} customer emails to CSV",
        { count: eligibleCustomers.length },
      ),
    )
  }

  const handleOpenMailClient = () => {
    if (eligibleCustomers.length === 0) return
    const bccList = eligibleCustomers.map((c) => c.email!.trim()).join(",")
    // mailto with BCC to respect recipient privacy
    const mailtoUrl = `mailto:?bcc=${encodeURIComponent(bccList)}`
    window.open(mailtoUrl, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold">
              {t("pages.customers.emailsDialog.title", "Customer Email Directory")}
            </DialogTitle>
          </div>
          <DialogDescription>
            {t(
              "pages.customers.emailsDialog.description",
              "Extract, copy, or export customer email addresses for marketing campaigns, newsletters, and announcements.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Stats Bar */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3 text-xs">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">
                {t(
                  "pages.customers.emailsDialog.matchingCount",
                  "{{count}} reachable emails found",
                  { count: eligibleCustomers.length },
                )}
              </span>
            </div>
            <Badge variant="secondary" className="font-mono text-[11px]">
              {eligibleCustomers.length} / {customers.length} {t("pages.customers.emailsDialog.customersTotal", "customers")}
            </Badge>
          </div>

          {/* Controls: Tag Filter & Format Selector */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tag-filter" className="text-xs flex items-center gap-1">
                <Filter className="size-3 text-muted-foreground" />
                {t("pages.customers.emailsDialog.filterByTag", "Filter by Tag / Group")}
              </Label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger id="tag-filter" className="h-8 text-xs">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    {t("pages.customers.emailsDialog.allCustomers", "All Customers with Email")} (
                    {customers.filter((c) => c.email && c.email.includes("@")).length})
                  </SelectItem>
                  {availableTags.map((tag) => {
                    const count = customers.filter(
                      (c) =>
                        c.email &&
                        c.email.includes("@") &&
                        c.tags.some((t) => t.toLowerCase() === tag.toLowerCase()),
                    ).length
                    return (
                      <SelectItem key={tag} value={tag} className="text-xs">
                        {tag} ({count})
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="format-select" className="text-xs flex items-center gap-1">
                <AtSign className="size-3 text-muted-foreground" />
                {t("pages.customers.emailsDialog.outputFormat", "Output Format")}
              </Label>
              <Select value={format} onValueChange={(val) => setFormat(val as EmailFormat)}>
                <SelectTrigger id="format-select" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comma" className="text-xs">
                    {t("pages.customers.emailsDialog.formatComma", "Comma separated (email1, email2)")}
                  </SelectItem>
                  <SelectItem value="semicolon" className="text-xs">
                    {t("pages.customers.emailsDialog.formatSemicolon", "Semicolon separated (Outlook / BCC)")}
                  </SelectItem>
                  <SelectItem value="named" className="text-xs">
                    {t("pages.customers.emailsDialog.formatNamed", "Name & Email (\"John\" <email>)")}
                  </SelectItem>
                  <SelectItem value="newline" className="text-xs">
                    {t("pages.customers.emailsDialog.formatNewline", "One per line (email list)")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Email Preview Area */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="emails-preview" className="text-xs text-muted-foreground">
                {t("pages.customers.emailsDialog.previewLabel", "Email List Preview")}
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {eligibleCustomers.length} {t("pages.customers.emailsDialog.addresses", "addresses")}
              </span>
            </div>
            <Textarea
              id="emails-preview"
              value={formattedEmailsString}
              readOnly
              rows={6}
              className="font-mono text-xs resize-none bg-muted/20"
              placeholder={t("pages.customers.emailsDialog.emptyPlaceholder", "No emails found matching the filter.")}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleExportCSV}
              disabled={eligibleCustomers.length === 0}
            >
              <Download className="size-3.5" />
              {t("pages.customers.emailsDialog.exportCsv", "Export CSV")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleOpenMailClient}
              disabled={eligibleCustomers.length === 0}
              title={t("pages.customers.emailsDialog.openBccTip", "Opens your default email client with all addresses in BCC")}
            >
              <ExternalLink className="size-3.5" />
              {t("pages.customers.emailsDialog.composeBcc", "Compose (BCC)")}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm" className="text-xs">
                {t("pages.customers.cancel", "Close")}
              </Button>
            </DialogClose>
            <Button
              type="button"
              size="sm"
              className="text-xs gap-1.5 font-semibold"
              onClick={handleCopy}
              disabled={eligibleCustomers.length === 0}
            >
              {copied ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
              {copied
                ? t("pages.customers.emailsDialog.copiedButton", "Copied!")
                : t("pages.customers.emailsDialog.copyButton", "Copy All Emails")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
