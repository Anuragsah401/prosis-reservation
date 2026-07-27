import { useParams } from "react-router-dom"
import { PublicBookingFlow } from "@/features/booking/public-booking-flow"
import { ThemeToggle } from "@/components/theme-toggle"

export function PublicBookingPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Restaurant not found.</p>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-svh">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <PublicBookingFlow restaurantId={id} />
    </div>
  )
}
