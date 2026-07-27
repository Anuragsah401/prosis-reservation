import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

const customers = [
  { name: "Alicia Ford", email: "alicia@example.com", phone: "+1 555 0102", visits: 12, tags: ["VIP"] },
  { name: "Marcus Lee", email: "marcus@example.com", phone: "+1 555 0187", visits: 3, tags: [] },
  { name: "Priya Nair", email: "priya@example.com", phone: "+1 555 0143", visits: 8, tags: ["Regular"] },
  { name: "Diego Alvarez", email: "diego@example.com", phone: "+1 555 0199", visits: 1, tags: ["New"] },
  { name: "Hannah Kim", email: "hannah@example.com", phone: "+1 555 0121", visits: 5, tags: [] },
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
                <p className="truncate font-medium">{c.name}</p>
                <p className="text-muted-foreground truncate text-xs">{c.email}</p>
                <p className="text-muted-foreground truncate text-xs">{c.phone}</p>
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
