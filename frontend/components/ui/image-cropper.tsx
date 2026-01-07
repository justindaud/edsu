'use client'

import {
  ImageCrop,
  ImageCropApply,
  ImageCropContent,
  ImageCropReset,
} from '@/components/ui/shadcn-io/image-crop'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { CropIcon, RotateCcwIcon, XIcon } from 'lucide-react'

type Props = {
  file: File
  onCropped: (file: File, previewUrl?: string) => void
  onCancel: () => void
}

export function ImageCropper({ file, onCropped, onCancel }: Props) {
  if (!file) return null

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
        <span>Crop Image</span>
      </div>
      <div className="flex justify-center">
        <div className="w-full max-w-[720px]">
          <ImageCrop
            className="w-full max-w-4xl mx-auto"
            aspect={undefined}
            file={file}
            maxImageSize={1024 * 1024 * 10}
          >
            <div className="flex items-center justify-center px-4">
              <ImageCropContent className="max-h-[30vh] rounded-md shadow-inner inline-block mx-auto" />
            </div>
            <div className="flex items-center justify-center gap-3 pt-3">
              <ImageCropReset asChild>
                <Button type="button" size="icon-sm" variant="ghost" aria-label="Reset crop selection">
                  <RotateCcwIcon className="h-4 w-4" />
                </Button>
              </ImageCropReset>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Cancel crop (close)"
                onClick={() => {
                  onCancel()
                }}
              >
                <XIcon className="h-4 w-4" />
              </Button>
              <ImageCropApply
                asChild
                onApplied={(dataUrl) => {
                  if (!dataUrl) return
                  fetch(dataUrl)
                    .then((r) => r.blob())
                    .then((blob) => {
                      const newFile = new File([blob], file.name, { type: blob.type || file.type })
                      onCropped(newFile, dataUrl)
                    })
                }}
              >
                <Button type="button" size="icon-sm" variant="default" aria-label="Apply crop and use image">
                  <CropIcon className="h-4 w-4" />
                </Button>
              </ImageCropApply>
            </div>
          </ImageCrop>
        </div>
      </div>
    </div>
  )
}
