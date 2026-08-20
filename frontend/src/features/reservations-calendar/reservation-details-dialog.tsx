import { useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getCalendarTables,
  statusLabels,
  type CalendarReservation,
} from "@/features/reservations-calendar/calendar-data"
import { resendConfirmationEmail } from "@/features/reservations/reservations-api"

export interface ReservationDetailsDialogProps {
  reservation: CalendarReservation | null
  onClose: () => void
  onSave: (id: string, changes: { tableId: string; start: string; durationMinutes: number }) => void
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ReservationDetailsDialog({
  reservation,
  onClose,
  onSave,
}: ReservationDetailsDialogProps) {
  return (
    <Dialog open={!!reservation} onOpenChange={(open) => !open && onClose()}>
      {reservation && (
        <ReservationDetailsForm
          key={reservation.id}
          reservation={reservation}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Dialog>
  )
}

function ReservationDetailsForm({
  reservation,
  onClose,
  onSave,
}: {
  reservation: CalendarReservation
  onClose: () => void
  onSave: (id: string, changes: { tableId: string; start: string; durationMinutes: number }) => void
}) {
  const [tableId, setTableId] = useState(reservation.tableId)
  const [start, setStart] = useState(toLocalInputValue(reservation.start))
  const [durationMinutes, setDurationMinutes] = useState(String(reservation.durationMinutes))
  const calendarTables = useMemo(() => getCalendarTables(), [])

  // Send confirmation email state
  const [showSendEmail, setShowSendEmail] = useState(false)
  const [sendEmailAddress, setSendEmailAddress] = useState(reservation.customerEmail ?? "")
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  )

  const handleSave = () => {
    onSave(reservation.id, {
      tableId,
      start: new Date(start).toISOString(),
      durationMinutes: Math.max(15, Number(durationMinutes) || 90),
    })
  }

  const handleSendConfirmation = async () => {
    if (!sendEmailAddress) return
    setIsSending(true)
    setSendResult(null)
    try {
      await resendConfirmationEmail(reservation.id, sendEmailAddress)
      setSendResult({ type: "success", message: "Confirmation email sent!" })
      setTimeout(() => {
        setShowSendEmail(false)
        setSendResult(null)
      }, 2000)
    } catch (err) {
      setSendResult({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to send email",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {reservation.customerName}
          <Badge variant="outline">{statusLabels[reservation.status]}</Badge>
        </DialogTitle>
        <DialogDescription>
          Party of {reservation.partySize} · Reassign the table, change the time, or adjust the
          booking duration.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="res-start">Date &amp; time</Label>
          <Input
            id="res-start"
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>Table</Label>
            <Select value={tableId} onValueChange={setTableId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {calendarTables.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} · Seats {t.capacity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="res-duration">Duration (min)</Label>
            <Input
              id="res-duration"
              type="number"
              min={15}
              step={15}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>
        </div>

        {/* Send Confirmation to Email Section */}
        {reservation.status === "PENDING" && (
          <div className="border-t pt-4">
            {showSendEmail ? (
              <div className="grid gap-3">
                <Label htmlFor="send-email">Send confirmation to any email</Label>
                <Input
                  id="send-email"
                  type="email"
                  placeholder="guest@example.com"
                  value={sendEmailAddress}
                  onChange={(e) => {
                    setSendEmailAddress(e.target.value)
                    setSendResult(null)
                  }}
                />
                {sendResult && (
                  <p className={`text-sm ${sendResult.type === "success" ? "text-green-600" : "text-red-600"}`}>
                    {sendResult.message}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowSendEmail(false)
                      setSendResult(null)
                    }}
                    disabled={isSending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendConfirmation}
                    disabled={!sendEmailAddress || isSending}
                  >
                    {isSending ? "Sending..." : "Send Email"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowSendEmail(true)}>
                Send confirmation to email
              </Button>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save changes</Button>
      </DialogFooter>
    </DialogContent>
  )
}
