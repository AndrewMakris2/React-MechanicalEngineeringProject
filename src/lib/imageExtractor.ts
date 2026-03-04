import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export type ExtractResult = {
  type: 'image'
  base64: string
  mimeType: string
} | {
  type: 'pdf'
  base64Images: string[]
  pageCount: number
}

export async function extractFromFile(file: File): Promise<ExtractResult> {
  if (file.type === 'application/pdf') {
    return extractFromPDF(file)
  }
  return extractFromImage(file)
}

async function extractFromImage(file: File): Promise<ExtractResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve({ type: 'image', base64, mimeType: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function extractFromPDF(file: File): Promise<ExtractResult> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pageCount = pdf.numPages
  const base64Images: string[] = []

  for (let pageNum = 1; pageNum <= Math.min(pageCount, 5); pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 2.0 })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height

    const ctx = canvas.getContext('2d')
    if (!ctx) continue

    await page.render({
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise

    const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
    base64Images.push(base64)
  }

  return { type: 'pdf', base64Images, pageCount }
}