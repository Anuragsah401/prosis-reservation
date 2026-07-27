import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

const tables = [
  { name: "T1", capacity: 2, location: "Window", status: "AVAILABLE" },
  { name: "T2", capacity: 6, location: "Main Hall", status: "RESERVED" },
  { name: "T3", capacity: 4, location: "Patio", status: "AVAILABLE" },
  { name: "T4", capacity: 4, location: "Main Hall", status: "OCCUPIED" },
  { name: "T5", capacity: 2, location: "Bar", status: "AVAILABLE" },
  { name: "T6", capacity: 8, location: "Private Room", status: "MAINTENANCE" },
]

const statusStyles: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  AVAILABLE: "default",
  OCCUPIED: "secondary",
  RESERVED: "outline",
  MAINTENANCE: "destructive",
}

export function TablesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tables</h1>
          <p className="text-muted-foreground text-sm">
            Manage your restaurant&apos;s tables and their live status.
          </p>
        </div>
        <Button>
          <Plus className="size-4" />
          Add Table
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => (
          <Card key={table.name}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
              <div>
                <CardTitle>{table.name}</CardTitle>
                <CardDescription>{table.location}</CardDescription>
              </div>
              <Badge variant={statusStyles[table.status] ?? "outline"}>
                {table.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Capacity: <span className="text-foreground font-medium">{table.capacity}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
