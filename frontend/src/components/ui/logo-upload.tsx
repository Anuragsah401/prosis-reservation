import { useState, useRef, type ChangeEvent, type DragEvent } from "react"
import { useTranslation } from "react-i18next"
import { Upload, X, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface LogoUploadProps {
  value?: string | null
  onChange: (value: string | null) => void
  optional?: boolean
  label?: string
  description?: string
  disabled?: boolean
  className?: string
}

const MAX_RAW_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const TARGET_MAX_DIMENSION = 512

/**
 * Compresses and resizes a user-provided image file client-side into a lightweight,
 * high-definition data URL (WebP/PNG) ready for instant storage and rendering.
 */
async function processImageFile(file: File): Promise<string> {
  if (file.size > MAX_RAW_FILE_SIZE_BYTES) {
    throw new Error("File size exceeds 5MB limit. Please choose a smaller image.")
  }

  // Preserve vector SVGs as-is
  if (file.type === "image/svg+xml") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error("Failed to read SVG file."))
      reader.readAsDataURL(file)
    })
  }

  // Load raster image and scale down on offscreen canvas
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas")
          let { width, height } = img

          if (width > TARGET_MAX_DIMENSION || height > TARGET_MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * TARGET_MAX_DIMENSION) / width)
              width = TARGET_MAX_DIMENSION
            } else {
              width = Math.round((width * TARGET_MAX_DIMENSION) / height)
              height = TARGET_MAX_DIMENSION
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            resolve(reader.result as string)
            return
          }

          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          ctx.drawImage(img, 0, 0, width, height)

          const isTransparent = file.type === "image/png" || file.type === "image/webp"
          const outputType = isTransparent ? "image/png" : "image/jpeg"
          const dataUrl = canvas.toDataURL(outputType, 0.88)
          resolve(dataUrl)
        } catch {
          resolve(reader.result as string)
        }
      }
      img.onerror = () => reject(new Error("Failed to load image."))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error("Failed to read file."))
    reader.readAsDataURL(file)
  })
}

export function LogoUpload({
  value,
  onChange,
  optional = false,
  label,
  description,
  disabled = false,
  className,
}: LogoUploadProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const displayLabel = label || t("components.logoUpload.label", "Restaurant Logo")
  const displayDescription =
    description || t("components.logoUpload.description", "Recommended square PNG, JPG, or SVG up to 5MB")

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error(t("components.logoUpload.invalidType", "Please upload a valid image file (PNG, JPG, SVG, WebP)."))
      return
    }

    setIsProcessing(true)
    try {
      const compressedDataUrl = await processImageFile(file)
      onChange(compressedDataUrl)
      toast.success(t("components.logoUpload.uploadSuccess", "Logo uploaded successfully"))
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("components.logoUpload.error", "Failed to process logo image.")
      toast.error(msg)
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      void handleFile(file)
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isProcessing) {
      setIsDragging(true)
    }
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled || isProcessing) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      void handleFile(file)
    }
  }

  function triggerFileDialog() {
    if (disabled || isProcessing) return
    fileInputRef.current?.click()
  }

  function handleRemove() {
    if (disabled || isProcessing) return
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <span>{displayLabel}</span>
          {optional && (
            <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0 text-muted-foreground">
              {t("common.optional", "Optional")}
            </Badge>
          )}
        </Label>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled || isProcessing}
      />

      {value ? (
        <div className="flex items-center gap-4 rounded-xl border bg-muted/20 p-3 transition-colors hover:bg-muted/30">
          <div className="relative size-16 shrink-0 rounded-lg border bg-background overflow-hidden shadow-xs flex items-center justify-center">
            <img src={value} alt="Restaurant Logo" className="size-full object-contain p-1" />
            {isProcessing && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="size-5 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-semibold text-foreground truncate">
              {t("components.logoUpload.currentLogo", "Restaurant Logo Attached")}
            </span>
            <span className="text-[11px] text-muted-foreground truncate">{displayDescription}</span>

            <div className="flex items-center gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5 gap-1.5"
                onClick={triggerFileDialog}
                disabled={disabled || isProcessing}
              >
                <RefreshCw className="size-3" />
                <span>{t("components.logoUpload.change", "Change")}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                onClick={handleRemove}
                disabled={disabled || isProcessing}
              >
                <X className="size-3" />
                <span>{t("components.logoUpload.remove", "Remove")}</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileDialog}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-all cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5 scale-[0.99]"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 shadow-2xs">
            {isProcessing ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Upload className="size-5" />
            )}
          </div>

          <p className="text-xs font-medium text-foreground">
            <span className="text-primary hover:underline">{t("components.logoUpload.clickToUpload", "Click to upload")}</span>{" "}
            {t("components.logoUpload.orDragAndDrop", "or drag and drop")}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{displayDescription}</p>
        </div>
      )}
    </div>
  )
}
