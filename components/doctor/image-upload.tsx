"use client"

import type React from "react"
import { useRef } from "react"
import { ImageIcon, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

type ImageUploadProps = {
  label: string
  imageUrl: string | null
  onUpload: (file: File) => void
  alt: string
  className?: string
  height?: string
}

/**
 * Reusable image-drop placeholder.
 * The actual file goes nowhere yet — onUpload is a placeholder for a
 * Firebase Storage upload you can wire up later.
 */
export function ImageUpload({
  label,
  imageUrl,
  onUpload,
  alt,
  className,
  height = "h-56",
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
        className={`${height} flex w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/40`}
      >
        {imageUrl ? (
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
        className="mt-3 w-full bg-transparent"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
        {label}
      </Button>
    </div>
  )
}
