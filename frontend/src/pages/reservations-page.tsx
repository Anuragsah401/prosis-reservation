import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"

const reservations = [
  { customer: "Alicia Ford", date: "2026-07-25", time: "7:00 PM", party: 4, table: "T4", status: "CONFIRMED" },
  { customer: "Marcus Lee", date: "2026-07-25", time: "7:30 PM", party: 2, table: "T7", status: "PENDING" },
  { customer: "Priya Nair", date: "2026-07-25", time: "8:00 PM", party: 6, table: "T2", status: "CHECKED_IN" },
  { customer: "Diego Alvarez", date: "2026-07-24", time: "8:15 PM", party: 3, table: "T9", status: "COMPLETED" },
  { customer: "Hannah Kim", date: "2026-07-24", time: "6:45 PM", party: 5, table: "T1", status: "NO_SHOW" },
  { customer: "Tom Becker", date: "2026-07-23", time: "9:00 PM", party: 2, table: "T5", status: "CANCELLED" },
]

const statusStyles: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  CHECKED_IN: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
}

export function ReservationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reservations</h1>
          <p className="text-muted-foreground text-sm">
            View and manage upcoming and past reservations.
          </p>
        </div>
        <Button>
          <Plus className="size-4" />
          New Reservation
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input placeholder="Search reservations..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((r) => (
                <TableRow key={`${r.customer}-${r.date}-${r.time}`}>
                  <TableCell className="font-medium">{r.customer}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.time}</TableCell>
                  <TableCell>{r.party}</TableCell>
                  <TableCell>{r.table}</TableCell>
                  <TableCell>
                    <Badge variant={statusStyles[r.status] ?? "outline"}>
                      {r.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
