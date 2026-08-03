import { Plus, Search, Phone, ChevronDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

type CustomerStatus = "ACTIVE" | "INACTIVE" | "VIP" | "BLOCKED"

const statusOptions: CustomerStatus[] = ["ACTIVE", "VIP", "INACTIVE", "BLOCKED"]

const statusStyles: Record<CustomerStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  VIP: "secondary",
  INACTIVE: "outline",
  BLOCKED: "destructive",
}

const statusLabels: Record<CustomerStatus, string> = {
  ACTIVE: "Active",
  VIP: "VIP",
  INACTIVE: "Inactive",
  BLOCKED: "Blocked",
}

interface Customer {
  name: string
  email: string
  phone: string
  visits: number
  tags: string[]
  status: CustomerStatus
}

const initialCustomers: Customer[] = [
  { name: "Alicia Ford", email: "alicia@example.com", phone: "+1 555 0102", visits: 12, tags: ["VIP"], status: "VIP" },
  { name: "Marcus Lee", email: "marcus@example.com", phone: "+1 555 0187", visits: 3, tags: [], status: "ACTIVE" },
  { name: "Priya Nair", email: "priya@example.com", phone: "+1 555 0143", visits: 8, tags: ["Regular"], status: "ACTIVE" },
  { name: "Diego Alvarez", email: "diego@example.com", phone: "+1 555 0199", visits: 1, tags: ["New"], status: "INACTIVE" },
  { name: "Hannah Kim", email: "hannah@example.com", phone: "+1 555 0121", visits: 5, tags: [], status: "BLOCKED" },
]

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)

  function handleStatusChange(email: string, status: CustomerStatus) {
    setCustomers((prev) =>
      prev.map((c) => (c.email === email ? { ...c, status } : c)),
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm">
            Your restaurant&apos;s customer relationship database.
          </p>
        </div>
        <Button>
          <Plus className="size-4" />
          Add Customer
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input placeholder="Search customers..." className="pl-9" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {customers.map((c) => (
          <Card key={c.email}>
            <CardContent className="flex items-start gap-3">
              <Avatar>
                <AvatarFallback>{initials(c.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-medium">{c.name}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="shrink-0">
                        <Badge
                          variant={statusStyles[c.status]}
                          className="flex cursor-pointer items-center gap-1"
                        >
                          {statusLabels[c.status]}
                          <ChevronDown className="size-3" />
                        </Badge>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Set status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {statusOptions.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => handleStatusChange(c.email, status)}
                        >
                          <Badge variant={statusStyles[status]} className="mr-1">
                            {statusLabels[status]}
                          </Badge>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-muted-foreground truncate text-xs">{c.email}</p>
                <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                  <Phone className="size-3" />
                  {c.phone}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline">{c.visits} visits</Badge>
                  {c.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

