"use client"

import type React from "react"
import { useRef } from "react"
import { ImageIcon, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type ImageUploadProps = {
  label: string
  imageUrl: string | null
  onUpload: (file: File) => void
  alt: string
  className?: string
  height?: string
  uploading?: boolean
}

/**
 * Reusable image-drop placeholder with Firebase Storage upload indicator.
 */
export function ImageUpload({
  label,
  imageUrl,
  onUpload,
  alt,
  className,
  height = "h-56",
  uploading = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    e.target.value = ""
  }

  return (
    <div className={className}>
      <div
        className={`${height} flex w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/40 relative`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-primary">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm font-medium">Uploading image to Storage...</span>
          </div>
        ) : imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl || "/placeholder.svg"} alt={alt} className="h-full w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" aria-hidden="true" />
            <span className="text-sm">No image uploaded yet</span>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <Button
        type="button"
        variant="outline"
        disabled={uploading}
        className="mt-3 w-full bg-transparent"
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            {label}
          </>
        )}
      </Button>
    </div>
  )
}
