import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Plus,
  Search,
  Phone,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  Mail,
  Copy,
  LayoutGrid,
  List,
  X,
  Sparkles,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { CustomerDialog } from "@/features/customers/customer-dialog"
import { DeleteCustomerDialog } from "@/features/customers/delete-customer-dialog"
import { CustomerDetailDialog } from "@/features/customers/customer-detail-dialog"
import { CustomerEmailsDialog } from "@/features/customers/customer-emails-dialog"
import { CustomerStats } from "@/features/customers/customer-stats"
import {
  fetchCustomers,
  type ApiCustomer,
} from "@/features/customers/customers-api"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Enhanced customer relationship management database. Lists the restaurant's
 * customers, with KPI statistics, search, tag filters, table/card views,
 * full email directory extraction/export, add/edit/delete, and detailed history.
 */
export function CustomersPage() {
  const { t } = useTranslation()
  const [customers, setCustomers] = useState<ApiCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedFilterTag, setSelectedFilterTag] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [editing, setEditing] = useState<ApiCustomer | null>(null)
  const [viewing, setViewing] = useState<ApiCustomer | null>(null)
  const [deleting, setDeleting] = useState<ApiCustomer | null>(null)
  const [emailsDialogOpen, setEmailsDialogOpen] = useState(false)

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCustomers(await fetchCustomers())
    } catch (err) {
      console.error("[customers] Failed to load customers:", err)
      setError(t("pages.customers.loadError", "Failed to load customers."))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) void loadCustomers()
    })
    return () => {
      cancelled = true
    }
  }, [loadCustomers])

  // Aggregate unique custom tags from customer records
  const availableTags = useMemo(() => {
    const set = new Set<string>()
    for (const c of customers) {
      for (const tag of c.tags) {
        if (tag.trim()) set.add(tag.trim())
      }
    }
    return Array.from(set).sort()
  }, [customers])

  // Count reachable emails
  const totalReachableEmails = useMemo(() => {
    return customers.filter((c) => c.email && c.email.includes("@")).length
  }, [customers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return customers.filter((c) => {
      // Tag filter
      if (selectedFilterTag === "with-email") {
        if (!c.email || !c.email.includes("@")) return false
      } else if (selectedFilterTag === "with-phone") {
        if (!c.phone || c.phone.trim().length === 0) return false
      } else if (selectedFilterTag === "vip") {
        if (!c.tags.some((t) => t.toLowerCase() === "vip" || t.toLowerCase() === "regular")) return false
      } else if (selectedFilterTag !== "all") {
        if (!c.tags.some((t) => t.toLowerCase() === selectedFilterTag.toLowerCase())) return false
      }

      // Search query
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        c.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    })
  }, [customers, search, selectedFilterTag])

  function handleSaved(saved: ApiCustomer) {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id)
      if (idx === -1) return [saved, ...prev]
      const next = [...prev]
      next[idx] = saved
      return next
    })
    setViewing((cur) => (cur && cur.id === saved.id ? saved : cur))
    setEditing(null)
  }

  function handleDeleted(id: string) {
    setCustomers((prev) => prev.filter((c) => c.id !== id))
    setDeleting(null)
  }

  const handleCopyEmail = (email: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!email) return
    navigator.clipboard.writeText(email)
    toast.success(t("pages.customers.toasts.emailCopied", "Copied {{email}} to clipboard", { email }))
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("pages.customers.title", "Customers")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("pages.customers.subtitle", "Manage customer profiles, contact info, notes, and reservation history.")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Get All Emails Action Button */}
          <Button
            variant="outline"
            className="h-9 gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => setEmailsDialogOpen(true)}
            title={t("pages.customers.getEmailsTitle", "Get all customer email addresses for newsletters and announcements")}
          >
            <Mail className="size-4" />
            <span>{t("pages.customers.getEmailsButton", "Get All Emails")}</span>
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-bold">
              {totalReachableEmails}
            </Badge>
          </Button>

          {/* Add Customer Button */}
          <Button
            className="h-9 gap-1.5 text-xs font-semibold"
            onClick={() => setEditing({} as ApiCustomer)}
          >
            <Plus className="size-4" />
            <span>{t("pages.customers.addCustomer", "Add Customer")}</span>
          </Button>
        </div>
      </div>

      {/* Customer KPI Stats Cards */}
      <CustomerStats customers={customers} />

      {/* Filter Chips, Search Input & View Switcher */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input with Clear Button */}
          <div className="relative w-full sm:w-80">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder={t("pages.customers.searchPlaceholder", "Search by name, email, phone, or tag...")}
              className="h-9 pl-9 pr-8 text-xs bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* View Toggle (Grid / Table) */}
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
            <Button
              size="sm"
              variant={viewMode === "grid" ? "default" : "ghost"}
              className="h-7 px-2.5 text-xs font-semibold shadow-xs"
              onClick={() => setViewMode("grid")}
              title={t("pages.customers.views.grid", "Grid view")}
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden sm:inline ml-1">{t("pages.customers.views.grid", "Cards")}</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === "table" ? "default" : "ghost"}
              className="h-7 px-2.5 text-xs font-semibold shadow-xs"
              onClick={() => setViewMode("table")}
              title={t("pages.customers.views.table", "Table view")}
            >
              <List className="size-3.5" />
              <span className="hidden sm:inline ml-1">{t("pages.customers.views.table", "Table")}</span>
            </Button>
          </div>
        </div>

        {/* Quick Filter Tag Chips */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedFilterTag("all")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
              selectedFilterTag === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60",
            )}
          >
            <span>{t("pages.customers.filters.all", "All")}</span>
            <span className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-tight",
              selectedFilterTag === "all" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
            )}>
              {customers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilterTag("with-email")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
              selectedFilterTag === "with-email"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60",
            )}
          >
            <Mail className="size-3" />
            <span>{t("pages.customers.filters.withEmail", "With Email")}</span>
            <span className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-tight",
              selectedFilterTag === "with-email" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
            )}>
              {totalReachableEmails}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilterTag("vip")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
              selectedFilterTag === "vip"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60",
            )}
          >
            <Sparkles className="size-3 text-amber-500" />
            <span>{t("pages.customers.filters.vip", "VIP & Regular")}</span>
            <span className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-tight",
              selectedFilterTag === "vip" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
            )}>
              {customers.filter((c) => c.tags.some((t) => t.toLowerCase() === "vip" || t.toLowerCase() === "regular")).length}
            </span>
          </button>

          {availableTags.slice(0, 6).map((tag) => {
            const count = customers.filter((c) => c.tags.some((t) => t.toLowerCase() === tag.toLowerCase())).length
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedFilterTag(tag)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  selectedFilterTag === tag
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60",
                )}
              >
                <span>{tag}</span>
                <span className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-tight",
                  selectedFilterTag === tag ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span>{t("pages.customers.loading", "Loading customers...")}</span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card>
          <CardContent className="text-muted-foreground flex items-center justify-between gap-3 py-6 text-sm">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadCustomers()}
              className="font-medium underline underline-offset-4 cursor-pointer"
            >
              {t("pages.customers.retry", "Retry")}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center text-sm">
            <Users className="size-8 text-muted-foreground/50 mb-2" />
            <p className="font-semibold text-foreground">
              {customers.length === 0
                ? t("pages.customers.empty", "No customers yet.")
                : t("pages.customers.noMatch", "No customers match your search.")}
            </p>
            <p className="text-muted-foreground text-xs mt-1 max-w-sm">
              {customers.length === 0
                ? t("pages.customers.emptyDesc", "New customers will appear here automatically when reservations are made.")
                : t("pages.customers.noMatchDesc", "Try adjusting your search query or filter tags.")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grid View (Cards) */}
      {!loading && !error && filtered.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="group hover:border-primary/40 hover:shadow-xs transition-all">
              <CardContent className="flex flex-col gap-3 p-4">
                <div
                  role="button"
                  tabIndex={0}
                  className="flex min-w-0 items-start gap-3 text-left cursor-pointer focus-visible:outline-hidden"
                  onClick={() => setViewing(c)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setViewing(c)
                    }
                  }}
                >
                  <Avatar className="size-10 border border-border/80">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {initials(c.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                        {c.name}
                      </p>
                      {c.tags.length > 0 && (
                        <div className="flex shrink-0 flex-wrap justify-end gap-1">
                          {c.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant={tag.toLowerCase() === "vip" ? "default" : "secondary"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {c.tags.length > 2 && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              +{c.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {c.email ? (
                      <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                        <p className="truncate text-xs">{c.email}</p>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleCopyEmail(c.email!, e)}
                          title="Copy email"
                        >
                          <Copy className="size-2.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground/60 text-xs italic mt-0.5">{t("pages.customers.noEmail", "No email")}</p>
                    )}

                    {c.phone && (
                      <p className="text-muted-foreground flex items-center gap-1 truncate text-xs mt-0.5">
                        <Phone className="size-2.5 shrink-0" />
                        <span>{c.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-2.5 border-t border-border/60">
                  <span className="text-[11px] text-muted-foreground">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setViewing(c)
                      }}
                      aria-label={t("pages.customers.viewHistory", "View history")}
                      title={t("pages.customers.viewHistory", "View history")}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditing(c)
                      }}
                      aria-label={t("pages.customers.editAction", "Edit customer")}
                      title={t("pages.customers.editAction", "Edit customer")}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleting(c)
                      }}
                      aria-label={t("pages.customers.deleteAction", "Delete customer")}
                      title={t("pages.customers.deleteAction", "Delete customer")}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table View (List) */}
      {!loading && !error && filtered.length > 0 && viewMode === "table" && (
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider pl-4">{t("pages.customers.table.customer", "Customer")}</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">{t("pages.customers.table.email", "Email")}</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">{t("pages.customers.table.phone", "Phone")}</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">{t("pages.customers.table.tags", "Tags")}</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">{t("pages.customers.table.added", "Added")}</TableHead>
                  <TableHead className="w-24 text-right pr-4 font-bold text-xs uppercase tracking-wider">{t("pages.customers.table.actions", "Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="group hover:bg-muted/40 cursor-pointer transition-colors border-b border-border/50"
                    onClick={() => setViewing(c)}
                  >
                    {/* Customer */}
                    <TableCell className="pl-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {initials(c.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-foreground text-sm">{c.name}</span>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="py-3">
                      {c.email ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`mailto:${c.email}`}
                            className="text-xs text-muted-foreground hover:text-foreground truncate max-w-56 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail className="size-3 shrink-0 text-muted-foreground" />
                            <span>{c.email}</span>
                          </a>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleCopyEmail(c.email!, e)}
                            title="Copy email"
                          >
                            <Copy className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs">—</span>
                      )}
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="py-3">
                      {c.phone ? (
                        <a
                          href={`tel:${c.phone}`}
                          className="text-xs text-muted-foreground hover:text-foreground font-mono flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="size-3 shrink-0 text-muted-foreground" />
                          <span>{c.phone}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs">—</span>
                      )}
                    </TableCell>

                    {/* Tags */}
                    <TableCell className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.length > 0 ? (
                          c.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant={tag.toLowerCase() === "vip" ? "default" : "secondary"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground/60 text-xs">—</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Added */}
                    <TableCell className="text-xs text-muted-foreground py-3">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-4 py-3">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setViewing(c)}
                          className="text-muted-foreground hover:text-foreground inline-flex size-7 items-center justify-center rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          aria-label={t("pages.customers.viewHistory")}
                          title={t("pages.customers.viewHistory")}
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(c)}
                          className="text-muted-foreground hover:text-foreground inline-flex size-7 items-center justify-center rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          aria-label={t("pages.customers.editAction")}
                          title={t("pages.customers.editAction")}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(c)}
                          className="text-muted-foreground hover:text-destructive inline-flex size-7 items-center justify-center rounded-lg hover:bg-destructive/10 cursor-pointer transition-colors"
                          aria-label={t("pages.customers.deleteAction")}
                          title={t("pages.customers.deleteAction")}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Customer Email Extraction / Directory Modal */}
      <CustomerEmailsDialog
        customers={customers}
        open={emailsDialogOpen}
        onOpenChange={setEmailsDialogOpen}
      />

      {/* Customer Edit/Add Modal */}
      {editing !== null && (
        <CustomerDialog
          customer={editing.id ? editing : null}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          onSaved={handleSaved}
        />
      )}

      {/* Customer Detail History Modal */}
      {viewing !== null && (
        <CustomerDetailDialog
          customer={viewing}
          open={true}
          onOpenChange={(open) => {
            if (!open) setViewing(null)
          }}
          onEdit={(c) => {
            setViewing(null)
            setEditing(c)
          }}
        />
      )}

      {/* Customer Delete Confirmation Modal */}
      {deleting !== null && (
        <DeleteCustomerDialog
          customer={deleting}
          open={true}
          onOpenChange={(open) => {
            if (!open) setDeleting(null)
          }}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
