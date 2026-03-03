import type { Result } from './schema'

const SI_MAP: Record<string, { dimension: string; factor: number }> = {
  m:      { dimension: 'length', factor: 1 },
  cm:     { dimension: 'length', factor: 0.01 },
  mm:     { dimension: 'length', factor: 0.001 },
  km:     { dimension: 'length', factor: 1000 },
  ft:     { dimension: 'length', factor: 0.3048 },
  in:     { dimension: 'length', factor: 0.0254 },
  kg:     { dimension: 'mass', factor: 1 },
  g:      { dimension: 'mass', factor: 0.001 },
  lbm:    { dimension: 'mass', factor: 0.4536 },
  N:      { dimension: 'force', factor: 1 },
  kN:     { dimension: 'force', factor: 1000 },
  lbf:    { dimension: 'force', factor: 4.448 },
  Pa:     { dimension: 'pressure', factor: 1 },
  kPa:    { dimension: 'pressure', factor: 1000 },
  MPa:    { dimension: 'pressure', factor: 1e6 },
  GPa:    { dimension: 'pressure', factor: 1e9 },
  psi:    { dimension: 'pressure', factor: 6894.76 },
  J:      { dimension: 'energy', factor: 1 },
  kJ:     { dimension: 'energy', factor: 1000 },
  MJ:     { dimension: 'energy', factor: 1e6 },
  W:      { dimension: 'power', factor: 1 },
  kW:     { dimension: 'power', factor: 1000 },
  MW:     { dimension: 'power', factor: 1e6 },
  hp:     { dimension: 'power', factor: 745.7 },
  s:      { dimension: 'time', factor: 1 },
  min:    { dimension: 'time', factor: 60 },
  hr:     { dimension: 'time', factor: 3600 },
  K:      { dimension: 'temperature', factor: 1 },
  C:      { dimension: 'temperature_offset', factor: 1 },
  F:      { dimension: 'temperature_offset', factor: 1 },
  '°C':   { dimension: 'temperature_offset', factor: 1 },
  '°F':   { dimension: 'temperature_offset', factor: 1 },
  'm/s':  { dimension: 'velocity', factor: 1 },
  'km/h': { dimension: 'velocity', factor: 0.2778 },
  'ft/s': { dimension: 'velocity', factor: 0.3048 },
  'm/s²': { dimension: 'acceleration', factor: 1 },
  'm³':   { dimension: 'volume', factor: 1 },
  L:      { dimension: 'volume', factor: 0.001 },
  'kg/m³':{ dimension: 'density', factor: 1 },
}

export interface ParsedUnit {
  raw: string
  dimension: string
  known: boolean
}

export function parseUnit(unitStr: string): ParsedUnit {
  const trimmed = unitStr.trim()
  const entry = SI_MAP[trimmed]
  if (entry) return { raw: trimmed, dimension: entry.dimension, known: true }
  return { raw: trimmed, dimension: 'unknown', known: false }
}

export interface UnitsCheckResult {
  parsed: { quantity: string; value: string | null; units: string | null; dimension: string; known: boolean }[]
  issues: Result['units']['issues']
  equationChecks: { equation: string; status: 'ok' | 'warning' | 'unknown'; note: string }[]
}

export function runUnitsCheck(
  knowns: Result['knowns'],
  unknowns: Result['unknowns'],
  domain: string
): UnitsCheckResult {
  const issues: Result['units']['issues'] = []
  const parsed: UnitsCheckResult['parsed'] = []
  const equationChecks: UnitsCheckResult['equationChecks'] = []

  const allVars = [
    ...knowns.map(k => ({ quantity: k.name, value: k.value ?? null, units: k.units ?? null })),
    ...unknowns.map(u => ({ quantity: u.name, value: null, units: u.units ?? null })),
  ]

  for (const v of allVars) {
    if (!v.units) {
      parsed.push({ ...v, dimension: 'unknown', known: false })
      continue
    }
    const p = parseUnit(v.units)
    parsed.push({ ...v, dimension: p.dimension, known: p.known })

    if (p.dimension === 'temperature_offset' && domain === 'thermo') {
      issues.push({
        issue: `"${v.quantity}" uses ${v.units} (offset temperature scale)`,
        severity: 'medium',
        tip: 'For thermodynamic equations involving absolute temperature, convert to Kelvin. ΔT in °C equals ΔT in K, but absolute T must be in K.',
      })
    }

    if (!p.known) {
      issues.push({
        issue: `Unit "${v.units}" for "${v.quantity}" is not recognized`,
        severity: 'low',
        tip: 'Verify the unit is correct. Consider converting to standard SI units.',
      })
    }
  }

  const hasSI = parsed.some(p => p.units && ['m', 'kg', 'N', 'Pa', 'J', 'W', 'm/s', 'm/s²', 'kg/m³'].includes(p.units))
  const hasImperial = parsed.some(p => p.units && ['ft', 'in', 'lbm', 'lbf', 'psi', 'hp', 'ft/s'].includes(p.units))
  if (hasSI && hasImperial) {
    issues.push({
      issue: 'Mixed unit systems detected (SI and Imperial)',
      severity: 'high',
      tip: 'Convert all quantities to a single consistent unit system before computing.',
    })
  }

  if (domain === 'statics' || domain === 'dynamics') {
    const hasMass = parsed.some(p => p.dimension === 'mass')
    const hasForce = parsed.some(p => p.dimension === 'force')
    const hasAccel = parsed.some(p => p.dimension === 'acceleration')
    if (hasMass && hasAccel) {
      equationChecks.push({
        equation: 'F = m·a',
        status: hasForce ? 'ok' : 'warning',
        note: hasForce
          ? 'Force, mass, and acceleration all present — F=ma is dimensionally consistent.'
          : 'Mass and acceleration found but no explicit force unit — verify F=ma application.',
      })
    }
    const hasLength = parsed.some(p => p.dimension === 'length')
    if (hasForce && hasLength) {
      equationChecks.push({
        equation: 'W = F·d',
        status: 'unknown',
        note: 'Force and length present — work/energy computation is dimensionally possible.',
      })
    }
  }

  if (domain === 'fluids') {
    const hasPressure = parsed.some(p => p.dimension === 'pressure')
    const hasVelocity = parsed.some(p => p.dimension === 'velocity')
    const hasDensity = parsed.some(p => p.dimension === 'density')
    if (hasPressure && hasVelocity && hasDensity) {
      equationChecks.push({
        equation: 'Bernoulli: P + ½ρV²',
        status: 'ok',
        note: 'Pressure, velocity, and density all present — Bernoulli equation is dimensionally applicable.',
      })
    } else if (hasPressure && hasVelocity) {
      equationChecks.push({
        equation: 'Bernoulli: P + ½ρV²',
        status: 'warning',
        note: 'Density (ρ) not explicitly given — Bernoulli requires fluid density.',
      })
    }
  }

  if (domain === 'thermo') {
    const hasMass = parsed.some(p => p.dimension === 'mass')
    const hasEnergy = parsed.some(p => p.dimension === 'energy')
    if (hasMass && !hasEnergy) {
      equationChecks.push({
        equation: 'Q = m·cp·ΔT',
        status: 'unknown',
        note: 'Mass is present but no explicit energy unit found — Q will be in energy units (J or kJ).',
      })
    }
  }

  const hasMixedPressure = parsed.some(p => p.units === 'Pa') && parsed.some(p => p.units === 'kPa' || p.units === 'MPa')
  if (hasMixedPressure) {
    issues.push({
      issue: 'Multiple pressure unit scales detected (Pa, kPa, MPa)',
      severity: 'medium',
      tip: 'Convert all pressures to the same scale. 1 kPa = 1000 Pa; 1 MPa = 1,000,000 Pa.',
    })
  }

  return { parsed, issues, equationChecks }
}

export function getDimensionLabel(dim: string): string {
  const map: Record<string, string> = {
    length: 'Length [L]',
    mass: 'Mass [M]',
    force: 'Force [MLT⁻²]',
    pressure: 'Pressure [ML⁻¹T⁻²]',
    energy: 'Energy [ML²T⁻²]',
    power: 'Power [ML²T⁻³]',
    time: 'Time [T]',
    temperature: 'Temperature [Θ]',
    temperature_offset: 'Temp. Offset [Θ]',
    velocity: 'Velocity [LT⁻¹]',
    acceleration: 'Acceleration [LT⁻²]',
    volume: 'Volume [L³]',
    density: 'Density [ML⁻³]',
    unknown: 'Unknown',
  }
  return map[dim] ?? dim
}