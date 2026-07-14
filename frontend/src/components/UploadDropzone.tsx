import { useRef, useState } from 'react'
import type { DragEvent } from 'react'

const ACCEPTED_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.flac', '.m4a']

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void
  disabled: boolean
}

export function UploadDropzone({ onFileSelected, disabled }: UploadDropzoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDraggingOver(false)
    const file = event.dataTransfer.files[0]
    if (file) onFileSelected(file)
  }

  function handleBrowseClick() {
    inputRef.current?.click()
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) onFileSelected(file)
    event.target.value = ''
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setIsDraggingOver(true)
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className={`flex items-center justify-between gap-4 rounded-xl border p-6 transition-colors ${
        isDraggingOver ? 'border-accent bg-surface-hover' : 'border-border bg-surface'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg">
          ⬆
        </span>
        <div>
          <p className="font-medium text-white">Drop an audio file or browse</p>
          <p className="text-sm text-gray-400">
            Accepts wav, mp3, ogg, flac, or m4a — a few seconds of clear birdsong works best.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleBrowseClick}
        disabled={disabled}
        className="shrink-0 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Browse
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}
