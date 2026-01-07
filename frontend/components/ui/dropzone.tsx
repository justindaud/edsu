import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Progress } from "./progress"
import { cn } from "@/lib/utils"

type DropzoneProps = {
  onFileAccepted: (file: File) => Promise<void> | void
  accept?: { [key: string]: string[] }
  className?: string
  previewUrl?: string
  previewAlt?: string
  previewType?: 'image' | 'video' | 'pdf' | null
  onClear?: () => void
}

const MAX_FILE_MB = 50

export function Dropzone({
  onFileAccepted,
  accept,
  className,
  previewUrl,
  previewAlt,
  previewType,
  onClear,
}: DropzoneProps) {
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return
      setError(null)
      setProgress(0)
      try {
        const file = acceptedFiles[0]
        const maybePromise = onFileAccepted(file)
        if (maybePromise && typeof (maybePromise as any).then === "function") {
          // naive progress simulation
          setProgress(25)
          await maybePromise
          setProgress(100)
          setTimeout(() => setProgress(null), 500)
        } else {
          setProgress(null)
        }
      } catch (e: any) {
        setError(e?.message || "Upload failed")
        setProgress(null)
      }
    },
    [onFileAccepted]
  )

  const isInteractiveMedia = previewType === "video" || previewType === "pdf"

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleDrop,
    accept,
    maxFiles: 1,
    noClick: isInteractiveMedia, // allow play/scroll instead of reopening picker
  })

  return (
    <div className={cn("space-y-2", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative overflow-hidden flex min-h-[240px] cursor-pointer items-center justify-center rounded-md border border-dashed text-sm",
          isDragActive ? "bg-edsu-cream text-edsu-black" : "bg-muted text-muted-foreground"
        )}
      >
        <input {...getInputProps()} />
        {previewUrl && previewType === "image" && (
          <img src={previewUrl} alt={previewAlt || "Preview"} className="pointer-events-none absolute inset-0 h-full w-full object-contain bg-white" />
        )}
        {previewUrl && previewType === "video" && (
          <video
            src={previewUrl}
            className="absolute inset-0 h-full w-full object-contain bg-black"
            controls
            muted
            playsInline
          />
        )}
        {previewUrl && previewType === "pdf" && (
          <iframe src={previewUrl} className="absolute inset-0 h-full w-full bg-white" title={previewAlt || "Preview PDF"} />
        )}
        <span
          className={cn(
            "z-[1] px-3 py-1 rounded-md bg-white/80 text-foreground text-sm font-medium",
            previewUrl ? "backdrop-blur" : ""
          )}
        >
          {isDragActive ? "Drop the file here" : "Drop or click to upload"}
        </span>
      </div>
      {isInteractiveMedia && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClear || open}
            className="text-xs underline text-foreground/70"
          >
            Clear
          </button>
        </div>
      )}
      {!isInteractiveMedia && previewUrl && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClear || open}
            className="text-xs underline text-foreground/70"
          >
            Clear
          </button>
        </div>
      )}
      {progress !== null && (
        <div className="space-y-1">
          <Progress value={progress} />
          <div className="text-xs text-muted-foreground">{progress}%</div>
        </div>
      )}
      {error && <div className="text-xs text-red-500">{error}</div>}
      <div className="text-[11px] text-muted-foreground">
        Max size: {MAX_FILE_MB}MB. Images/videos/PDF supported.
      </div>
    </div>
  )
}
