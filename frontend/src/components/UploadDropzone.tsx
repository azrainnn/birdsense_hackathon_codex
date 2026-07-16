import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { Icon } from './Icon'

const ACCEPTED_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.flac', '.m4a', '.webm']
const MAX_FILE_SIZE = 50 * 1024 * 1024

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void
  disabled: boolean
}

function recordingExtension(mimeType: string) {
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('mp4')) return 'm4a'
  return 'webm'
}

export function UploadDropzone({ onFileSelected, disabled }: UploadDropzoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => () => {
    recorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  useEffect(() => {
    if (!isRecording) return
    const interval = window.setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000)
    return () => window.clearInterval(interval)
  }, [isRecording])

  function validateAndSelect(file: File) {
    const fileName = file.name.toLowerCase()
    const isSupported = ACCEPTED_EXTENSIONS.some((extension) => fileName.endsWith(extension))
    if (!isSupported) {
      setValidationMessage('Use a WAV, MP3, OGG, FLAC, M4A or WebM recording.')
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

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setValidationMessage('Microphone recording is not supported in this browser. Upload an audio file instead.')
      return
    }

    try {
      setValidationMessage('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg']
        .find((candidate) => MediaRecorder.isTypeSupported(candidate))
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      const chunks: BlobPart[] = []
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        recorderRef.current = null
        const type = recorder.mimeType || mimeType || 'audio/webm'
        const recording = new File(chunks, `birdsense-field-recording.${recordingExtension(type)}`, { type })
        if (recording.size === 0) {
          setValidationMessage('No audio was captured. Please try recording again.')
          return
        }
        onFileSelected(recording)
      }
      recorderRef.current = recorder
      setRecordingSeconds(0)
      setIsRecording(true)
      recorder.start()
    } catch (error) {
      const message = error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Microphone access was blocked. Allow it in your browser settings, then try again.'
        : 'Could not open the microphone. Check that another app is not using it and try again.'
      setValidationMessage(message)
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    setIsRecording(false)
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
          <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-paper shadow-sm transition hover:bg-forest disabled:cursor-wait disabled:opacity-60">
            {disabled ? 'Analysing recording...' : 'Choose audio file'} <Icon name="arrow-right" className="h-4 w-4" />
          </button>
          <p className="mt-4 text-xs text-muted">WAV, MP3, OGG, FLAC, M4A or WebM - up to 50 MB</p>
          {validationMessage && <p role="alert" className="mt-3 text-sm font-medium text-sarawak-red">{validationMessage}</p>}
        </div>
        <input ref={inputRef} type="file" accept={ACCEPTED_EXTENSIONS.join(',')} onChange={handleInputChange} className="hidden" />
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl border border-forest/10 bg-canvas/70 px-5 py-4 sm:flex-row">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isRecording ? 'bg-sarawak-red text-white' : 'bg-sarawak-yellow text-ink'}`}><Icon name="microphone" className="h-5 w-5" /></span>
          <div><p className="text-sm font-semibold text-ink">Record from this device</p><p className="text-xs text-muted">{isRecording ? `Recording ${recordingSeconds}s - capture a clear call, then stop.` : 'Use your microphone instead of an existing file.'}</p></div>
        </div>
        <button type="button" onClick={isRecording ? stopRecording : startRecording} disabled={disabled} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${isRecording ? 'bg-sarawak-red text-white hover:bg-sarawak-red/85' : 'bg-ink text-paper hover:bg-forest'}`}>
          <span className={`h-2 w-2 rounded-full ${isRecording ? 'bg-white' : 'bg-sarawak-yellow'}`} />
          {isRecording ? 'Stop and identify' : 'Open microphone'}
        </button>
      </div>
    </section>
  )
}
