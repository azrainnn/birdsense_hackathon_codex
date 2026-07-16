import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { Icon } from './Icon'

const ACCEPTED_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.flac', '.m4a']
const MAX_FILE_SIZE = 50 * 1024 * 1024

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void
  disabled: boolean
}

export function UploadDropzone({ onFileSelected, disabled }: UploadDropzoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function validateAndSelect(file: File) {
    const fileName = file.name.toLowerCase()
    const isSupported = ACCEPTED_EXTENSIONS.some((extension) => fileName.endsWith(extension))
    if (!isSupported) {
      setValidationMessage('Use a WAV, MP3, OGG, FLAC or M4A recording.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setValidationMessage('Choose a recording smaller than 50 MB.')
      return
    }
    setValidationMessage('')
    onFileSelected(file)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDraggingOver(false)
    const file = event.dataTransfer.files[0]
    if (file) validateAndSelect(file)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) validateAndSelect(file)
    event.target.value = ''
  }

  return (
    <section className="rounded-3xl border border-forest/10 bg-paper p-4 shadow-[0_16px_48px_rgb(9_29_24/6%)] sm:p-6" aria-labelledby="upload-title">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setIsDraggingOver(true)
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-2xl border border-dashed px-5 py-10 text-center transition sm:px-10 sm:py-14 ${
          isDraggingOver ? 'border-sarawak-red bg-sarawak-yellow/20' : 'border-forest/25 bg-canvas/70'
        } ${disabled ? 'cursor-wait opacity-70' : ''}`}
      >
        <div className="absolute top-0 right-0 h-28 w-28 rounded-full bg-sarawak-yellow/20 blur-2xl" />
        <div className="relative mx-auto flex max-w-lg flex-col items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-sarawak-yellow shadow-lg shadow-forest/20"><Icon name="upload" className="h-6 w-6" /></span>
          <p className="mt-5 text-xs font-bold tracking-[0.15em] text-sarawak-red uppercase">Audio identification</p>
          <h2 id="upload-title" className="mt-2 text-2xl font-semibold tracking-tight text-ink">Upload a birdsong recording</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">A few seconds of clear birdsong works best. BirdSense will compare the sound with its current Bornean species guide.</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-paper shadow-sm transition hover:bg-forest disabled:cursor-wait disabled:opacity-60"
          >
            {disabled ? 'Analysing recording…' : 'Choose audio file'} <Icon name="arrow-right" className="h-4 w-4" />
          </button>
          <p className="mt-4 text-xs text-muted">WAV, MP3, OGG, FLAC or M4A · up to 50 MB</p>
          {validationMessage && <p role="alert" className="mt-3 text-sm font-medium text-sarawak-red">{validationMessage}</p>}
        </div>
        <input ref={inputRef} type="file" accept={ACCEPTED_EXTENSIONS.join(',')} onChange={handleInputChange} className="hidden" />
      </div>
    </section>
  )
}
