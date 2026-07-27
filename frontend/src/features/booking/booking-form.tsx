import { useState } from "react"
import type { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

export interface BookingContactDetails {
  name: string
  email: string
  phone: string
  notes?: string
}

interface BookingFormProps {
  isSubmitting: boolean
  onSubmit: (details: BookingContactDetails) => void
}

export function BookingForm({ isSubmitting, onSubmit }: BookingFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Partial<Record<keyof BookingContactDetails, string>>>({})

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof BookingContactDetails, string>> = {}
    if (!name.trim()) nextErrors.name = "Name is required"
    if (!email.trim()) {
      nextErrors.email = "Email is required"
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "Enter a valid email"
    }
    if (!phone.trim()) nextErrors.phone = "Phone number is required"
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim(), notes: notes.trim() || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="booking-name">Full name</Label>
        <Input
          id="booking-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="booking-email">Email</Label>
          <Input
            id="booking-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="booking-phone">Phone</Label>
          <Input
            id="booking-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 0100"
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone && <p className="text-destructive text-xs">{errors.phone}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="booking-notes">Special requests (optional)</Label>
        <Textarea
          id="booking-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Allergies, occasion, seating preference..."
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? "Confirming..." : "Confirm reservation"}
      </Button>
    </form>
  )
}
