import React, { useRef, useState } from 'react'
import { extractFromFile } from '../lib/imageExtractor'

interface Props {
  endpointUrl: string
  onExtracted: (text: string) => void
  disabled?: boolean
}

export default function FileUpload({ endpointUrl, onExtracted, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>('')
  const [dragOver, setDragOver] = useState(false)

  async function processFile(file: File) {
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, WEBP, or PDF file.')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('File too large. Max size is 20MB.')
      return
    }

    setLoading(true)
    setError(null)
    setProgress('Reading file...')

    try {
      const extracted = await extractFromFile(file)
      setProgress('Extracting text with AI...')

      let base64Images: string[]
      let mimeType: string

      if (extracted.type === 'pdf') {
        base64Images = extracted.base64Images
        mimeType = 'image/jpeg'
        setProgress(`Processing ${extracted.pageCount} page${extracted.pageCount !== 1 ? 's' : ''}...`)
      } else {
        base64Images = [extracted.base64]
        mimeType = extracted.mimeType
      }

      if (!endpointUrl) {
        throw new Error('API endpoint not configured. Please set it in Settings.')
      }

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ocr', base64Images, mimeType }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? `HTTP ${response.status}`)
      }

      const data = await response.json()
      const text = data.text ?? ''

      if (!text.trim()) {
        throw new Error('Could not extract text from the file. Try a clearer image.')
      }

      setProgress('Done!')
      onExtracted(text)
      setTimeout(() => setProgress(''), 2000)

    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-400 block">Upload Photo or PDF</label>

      {/* Drop Zone */}
      <div
        onClick={() => !disabled && !loading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all
          ${dragOver ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 hover:border-gray-400'}
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || loading}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-xs text-blue-400">{progress}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">📎</span>
            <p className="text-xs text-gray-300 font-medium">
              Click or drag & drop
            </p>
            <p className="text-xs text-gray-500">
              JPG, PNG, WEBP, PDF (max 20MB)
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">
          <p className="text-xs text-red-300">🚨 {error}</p>
        </div>
      )}

      {/* Success */}
      {!loading && progress === 'Done!' && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg px-3 py-2">
          <p className="text-xs text-green-300">✅ Text extracted! Review it in the problem box above.</p>
        </div>
      )}
    </div>
  )
}