import React from 'react'

interface BarProps {
  label: string
  value: number
}

function Bar({ label, value }: BarProps) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? 'bg-green-500' : pct >= 55 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 w-16 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-300 w-8 text-right">{pct}%</span>
    </div>
  )
}

interface Props {
  confidence: { parsing: number; domain: number; units: number }
}

export default function ConfidencePanel({ confidence }: Props) {
  return (
    <div className="card space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Confidence Scores</p>
      <Bar label="Parsing" value={confidence.parsing} />
      <Bar label="Domain" value={confidence.domain} />
      <Bar label="Units" value={confidence.units} />
    </div>
  )
}