import type { Result } from './schema'

type Domain = Result['detectedDomain']

const KEYWORDS: Record<Exclude<Domain, 'unknown'>, string[]> = {
  statics: [
    'equilibrium', 'static', 'statics', 'truss', 'beam', 'moment', 'torque',
    'reaction', 'support', 'pin', 'roller', 'fixed', 'cable', 'tension', 'incline',
    'free body', 'fbd', 'concurrent', 'coplanar', 'friction', 'normal force',
  ],
  dynamics: [
    'velocity', 'acceleration', 'projectile', 'kinetic', 'momentum', 'impulse',
    'collision', 'angular velocity', 'rotation', 'dynamics', 'newton', 'force',
    'trajectory', 'launch', 'displacement', 'kinematics', 'speed', 'time of flight',
    'angular acceleration', 'inertia',
  ],
  thermo: [
    'temperature', 'heat', 'entropy', 'enthalpy', 'thermodynamic', 'thermo',
    'ideal gas', 'isothermal', 'adiabatic', 'isobaric', 'isochoric', 'carnot',
    'efficiency', 'work done', 'internal energy', 'specific heat', 'cp', 'cv',
    'kelvin', 'celsius', 'boiling', 'condensation', 'refrigeration', 'cycle',
  ],
  fluids: [
    'fluid', 'flow', 'pressure', 'bernoulli', 'viscosity', 'pipe', 'continuity',
    'reynolds', 'laminar', 'turbulent', 'density', 'velocity profile', 'head loss',
    'pump', 'turbine', 'nozzle', 'venturi', 'manometer', 'hydraulic', 'incompressible',
    'buoyancy', 'archimedes',
  ],
}

export function detectDomain(text: string, hint: string): Domain {
  if (hint && hint !== 'auto') return hint as Domain

  const lower = text.toLowerCase()
  const scores: Record<string, number> = { statics: 0, dynamics: 0, thermo: 0, fluids: 0 }

  for (const [domain, keywords] of Object.entries(KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[domain] += 1
    }
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return best[1] > 0 ? (best[0] as Domain) : 'unknown'
}