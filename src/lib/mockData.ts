import type { Result } from './schema'

export const EXAMPLES = [
  {
    id: 'statics-incline',
    label: 'Statics – Block on Inclined Plane',
    subject: 'statics' as const,
    problem: `A 50 kg block rests on a frictionless inclined plane that makes an angle of 30° with the horizontal. The block is held in place by a cable parallel to the incline. Find the tension in the cable and the normal force exerted by the plane on the block.`,
  },
  {
    id: 'dynamics-projectile',
    label: 'Dynamics – Projectile Motion',
    subject: 'dynamics' as const,
    problem: `A ball is launched from ground level at an initial velocity of 25 m/s at an angle of 40° above the horizontal. Neglect air resistance. Find the maximum height reached, the total time of flight, and the horizontal range.`,
  },
  {
    id: 'thermo-heating',
    label: 'Thermo – Ideal Gas Heating',
    subject: 'thermo' as const,
    problem: `2 kg of air (ideal gas, cp = 1.005 kJ/kg·K) is heated at constant pressure from 25°C to 150°C. Find the heat added and the change in enthalpy. Assume air behaves as a perfect ideal gas.`,
  },
  {
    id: 'fluids-bernoulli',
    label: 'Fluids – Pipe Flow (Bernoulli)',
    subject: 'fluids' as const,
    problem: `Water flows through a horizontal pipe that narrows from a diameter of 0.1 m to 0.05 m. The velocity at the wide section is 2 m/s and the pressure there is 200 kPa. Using Bernoulli's equation, find the velocity and pressure at the narrow section. Assume steady, incompressible, inviscid flow.`,
  },
]

export const MOCK_RESULTS: Record<string, Result> = {
  'statics-incline': {
    detectedDomain: 'statics',
    problemSummary: 'A 50 kg block on a frictionless 30° inclined plane is held by a cable parallel to the incline. Determine the cable tension and the normal force from the plane.',
    knowns: [
      { name: 'Mass', symbol: 'm', value: '50', units: 'kg', notes: 'Given directly' },
      { name: 'Incline angle', symbol: 'θ', value: '30', units: '°', notes: 'Angle with horizontal' },
      { name: 'Gravitational acceleration', symbol: 'g', value: '9.81', units: 'm/s²', notes: 'Standard gravity' },
      { name: 'Weight', symbol: 'W', value: '490.5', units: 'N', notes: 'W = mg' },
    ],
    unknowns: [
      { name: 'Cable tension', symbol: 'T', units: 'N', notes: 'Force along the incline' },
      { name: 'Normal force', symbol: 'N', units: 'N', notes: 'Perpendicular to incline surface' },
    ],
    assumptions: [
      { assumption: 'Frictionless surface', whyItMatters: 'Eliminates friction force; only T and N act besides weight' },
      { assumption: 'Static equilibrium (ΣF = 0)', whyItMatters: 'Block is at rest, so all forces balance' },
      { assumption: 'Cable is parallel to the incline', whyItMatters: 'Simplifies force components along incline axis' },
      { assumption: 'Rigid body, no deformation', whyItMatters: 'Allows point-force analysis' },
    ],
    governingEquations: [
      { equation: 'ΣFx = 0  →  T − W sin θ = 0', whenToUse: 'Equilibrium along the incline', variables: ['T', 'W', 'θ'] },
      { equation: 'ΣFy = 0  →  N − W cos θ = 0', whenToUse: 'Equilibrium perpendicular to the incline', variables: ['N', 'W', 'θ'] },
      { equation: 'W = mg', whenToUse: 'Convert mass to gravitational force', variables: ['W', 'm', 'g'] },
    ],
    solutionOutline: [
      { step: 1, title: 'Draw Free Body Diagram', details: 'Isolate the block. Show weight W downward, normal force N perpendicular to incline, and tension T up the incline.' },
      { step: 2, title: 'Set up inclined coordinate system', details: 'Rotate axes so x is parallel to incline (positive up-slope) and y is perpendicular (positive away from surface).' },
      { step: 3, title: 'Resolve weight into components', details: 'W_parallel = W sin θ (down the incline), W_perp = W cos θ (into the surface).' },
      { step: 4, title: 'Apply ΣFx = 0', details: 'T = W sin θ. Substitute known values to find T.' },
      { step: 5, title: 'Apply ΣFy = 0', details: 'N = W cos θ. Substitute known values to find N.' },
      { step: 6, title: 'Verify units and sign conventions', details: 'Both T and N should be positive. Check units: kg × m/s² = N.' },
    ],
    commonMistakes: [
      { mistake: 'Using horizontal/vertical axes instead of inclined axes', avoidanceTip: 'Rotate your coordinate system to align with the incline to avoid messy trigonometry.' },
      { mistake: 'Forgetting to resolve weight into two components', avoidanceTip: 'Weight acts vertically; always split it into components parallel and perpendicular to the surface.' },
      { mistake: 'Confusing sin θ and cos θ for force components', avoidanceTip: 'The component along the incline uses sin θ; the component normal to the incline uses cos θ.' },
      { mistake: 'Neglecting to check ΣM = 0 for extended bodies', avoidanceTip: 'For a point mass this is fine, but remember it for beams and frames.' },
    ],
    diagramSpec: {
      type: 'fbd',
      elements: [
        { kind: 'body', id: 'block', shape: 'block', label: '50 kg Block', x: 180, y: 150, w: 100, h: 60 },
        { kind: 'force', from: 'block', label: 'W = mg', fx: 0, fy: 80 },
        { kind: 'force', from: 'block', label: 'N', fx: -55, fy: -55 },
        { kind: 'force', from: 'block', label: 'T', fx: -70, fy: -40 },
        { kind: 'support', at: 'block', supportType: 'roller' },
      ],
      notes: 'N is normal to incline surface; T acts up the slope.',
    },
    units: {
      parsed: [
        { quantity: 'Mass', value: '50', units: 'kg' },
        { quantity: 'Angle', value: '30', units: '°' },
        { quantity: 'Tension (unknown)', value: null, units: 'N' },
        { quantity: 'Normal force (unknown)', value: null, units: 'N' },
      ],
      issues: [
        { issue: 'Angle given in degrees; trig functions need consistent input', severity: 'low', tip: 'Confirm your calculator is in degree mode when using θ = 30°.' },
      ],
    },
    confidence: { parsing: 0.97, domain: 0.99, units: 0.95 },
  },

  'dynamics-projectile': {
    detectedDomain: 'dynamics',
    problemSummary: 'A ball launched at 25 m/s and 40° above horizontal from ground level. Find maximum height, time of flight, and horizontal range. Air resistance neglected.',
    knowns: [
      { name: 'Initial speed', symbol: 'v₀', value: '25', units: 'm/s', notes: 'Magnitude of launch velocity' },
      { name: 'Launch angle', symbol: 'θ', value: '40', units: '°', notes: 'Above horizontal' },
      { name: 'Gravitational acceleration', symbol: 'g', value: '9.81', units: 'm/s²', notes: 'Downward' },
      { name: 'Initial height', symbol: 'y₀', value: '0', units: 'm', notes: 'Ground level launch' },
    ],
    unknowns: [
      { name: 'Maximum height', symbol: 'H', units: 'm', notes: 'Vertical peak of trajectory' },
      { name: 'Total time of flight', symbol: 'T', units: 's', notes: 'Time from launch to landing' },
      { name: 'Horizontal range', symbol: 'R', units: 'm', notes: 'Horizontal distance at landing' },
    ],
    assumptions: [
      { assumption: 'No air resistance', whyItMatters: 'Allows separation of horizontal and vertical motion' },
      { assumption: 'Constant gravitational field', whyItMatters: 'g is treated as constant throughout the trajectory' },
      { assumption: 'Launch and landing at same height', whyItMatters: 'Simplifies time-of-flight calculation by symmetry' },
      { assumption: 'Ball treated as a particle', whyItMatters: 'Rotation and size effects ignored' },
    ],
    governingEquations: [
      { equation: 'v₀x = v₀ cos θ', whenToUse: 'Horizontal component of initial velocity', variables: ['v₀x', 'v₀', 'θ'] },
      { equation: 'v₀y = v₀ sin θ', whenToUse: 'Vertical component of initial velocity', variables: ['v₀y', 'v₀', 'θ'] },
      { equation: 'H = v₀y² / (2g)', whenToUse: 'Maximum height when vy = 0', variables: ['H', 'v₀y', 'g'] },
      { equation: 'T = 2v₀y / g', whenToUse: 'Total time of flight for symmetric trajectory', variables: ['T', 'v₀y', 'g'] },
      { equation: 'R = v₀x · T', whenToUse: 'Horizontal range', variables: ['R', 'v₀x', 'T'] },
    ],
    solutionOutline: [
      { step: 1, title: 'Resolve initial velocity into components', details: 'Compute v₀x = v₀ cos 40° and v₀y = v₀ sin 40°.' },
      { step: 2, title: 'Find maximum height H', details: 'At peak, vertical velocity = 0. Use H = v₀y² / (2g).' },
      { step: 3, title: 'Find time of flight T', details: 'By symmetry: T = 2v₀y / g.' },
      { step: 4, title: 'Find horizontal range R', details: 'Horizontal motion is uniform: R = v₀x × T.' },
      { step: 5, title: 'Verify with energy if needed', details: 'Optional check: energy at peak equals kinetic energy of horizontal component only.' },
    ],
    commonMistakes: [
      { mistake: 'Using total v₀ instead of v₀y for vertical calculations', avoidanceTip: 'Always resolve the velocity vector first. Only the vertical component opposes gravity.' },
      { mistake: 'Forgetting to double the half-flight time', avoidanceTip: 'Time to peak is v₀y/g; full flight time is 2v₀y/g for symmetric trajectories.' },
      { mistake: 'Mixing degree/radian inputs in calculator', avoidanceTip: 'Confirm your calculator is in degree mode when using θ = 40°.' },
      { mistake: 'Applying air resistance correction unnecessarily', avoidanceTip: 'The problem explicitly states to neglect air resistance — keep the model simple.' },
    ],
    diagramSpec: { type: 'none', elements: [], notes: 'Trajectory diagram not applicable as FBD.' },
    units: {
      parsed: [
        { quantity: 'Initial speed', value: '25', units: 'm/s' },
        { quantity: 'Launch angle', value: '40', units: '°' },
        { quantity: 'g', value: '9.81', units: 'm/s²' },
      ],
      issues: [],
    },
    confidence: { parsing: 0.96, domain: 0.98, units: 0.97 },
  },

  'thermo-heating': {
    detectedDomain: 'thermo',
    problemSummary: '2 kg of air heated at constant pressure from 25°C to 150°C with cp = 1.005 kJ/kg·K. Find heat added and change in enthalpy.',
    knowns: [
      { name: 'Mass of air', symbol: 'm', value: '2', units: 'kg', notes: 'Given' },
      { name: 'Specific heat at constant pressure', symbol: 'cₚ', value: '1.005', units: 'kJ/kg·K', notes: 'Given for air' },
      { name: 'Initial temperature', symbol: 'T₁', value: '25', units: '°C', notes: 'Convert to K: 298.15 K' },
      { name: 'Final temperature', symbol: 'T₂', value: '150', units: '°C', notes: 'Convert to K: 423.15 K' },
      { name: 'Process type', symbol: null, value: 'Constant pressure', units: null, notes: 'Isobaric process' },
    ],
    unknowns: [
      { name: 'Heat added', symbol: 'Q', units: 'kJ', notes: 'Energy transferred to the system' },
      { name: 'Change in enthalpy', symbol: 'ΔH', units: 'kJ', notes: 'For isobaric process, Q = ΔH' },
    ],
    assumptions: [
      { assumption: 'Air behaves as a perfect ideal gas', whyItMatters: 'Allows use of cₚ as constant; enthalpy depends only on temperature' },
      { assumption: 'Constant pressure (isobaric) process', whyItMatters: 'Q = mCₚΔT applies directly' },
      { assumption: 'cₚ is constant over the temperature range', whyItMatters: 'Simplification; in reality cₚ varies slightly with temperature' },
      { assumption: 'No heat losses to surroundings', whyItMatters: 'All energy input goes into raising the air temperature' },
    ],
    governingEquations: [
      { equation: 'Q = m · cₚ · ΔT', whenToUse: 'Heat transfer for isobaric process with ideal gas', variables: ['Q', 'm', 'cₚ', 'ΔT'] },
      { equation: 'ΔH = m · cₚ · ΔT', whenToUse: 'Change in enthalpy equals Q for isobaric process', variables: ['ΔH', 'm', 'cₚ', 'ΔT'] },
      { equation: 'ΔT = T₂ − T₁', whenToUse: 'Temperature difference (same in °C or K)', variables: ['ΔT', 'T₁', 'T₂'] },
    ],
    solutionOutline: [
      { step: 1, title: 'Convert temperatures to Kelvin', details: 'T₁ = 298.15 K; T₂ = 423.15 K. Note: ΔT is the same in °C or K.' },
      { step: 2, title: 'Calculate ΔT', details: 'ΔT = T₂ − T₁ = 125 K.' },
      { step: 3, title: 'Apply Q = m·cₚ·ΔT', details: 'Substitute m = 2 kg, cₚ = 1.005 kJ/kg·K, ΔT = 125 K.' },
      { step: 4, title: 'State ΔH = Q for isobaric process', details: 'At constant pressure, all heat input equals the enthalpy rise.' },
      { step: 5, title: 'Check units', details: '[kg] × [kJ/kg·K] × [K] = kJ ✓' },
    ],
    commonMistakes: [
      { mistake: 'Using cv instead of cp for a constant-pressure process', avoidanceTip: 'For constant-pressure heating use cₚ; for constant-volume use cᵥ.' },
      { mistake: 'Forgetting to convert absolute temperatures when needed', avoidanceTip: 'ΔT is the same in °C and K, but absolute T must be in Kelvin for ideal gas law.' },
      { mistake: 'Confusing Q with ΔU (internal energy)', avoidanceTip: 'For isobaric processes, Q = ΔH not ΔU. ΔU = m·cᵥ·ΔT.' },
      { mistake: 'Ignoring the isobaric constraint', avoidanceTip: 'Always identify the process type before selecting equations.' },
    ],
    diagramSpec: { type: 'none', elements: [], notes: 'FBD not applicable for thermodynamics problems.' },
    units: {
      parsed: [
        { quantity: 'Mass', value: '2', units: 'kg' },
        { quantity: 'Specific heat', value: '1.005', units: 'kJ/kg·K' },
        { quantity: 'Initial temperature', value: '25', units: '°C' },
        { quantity: 'Final temperature', value: '150', units: '°C' },
      ],
      issues: [
        { issue: 'Temperatures given in °C', severity: 'medium', tip: 'ΔT in °C equals ΔT in K here, but for ideal gas law always convert to Kelvin.' },
      ],
    },
    confidence: { parsing: 0.95, domain: 0.97, units: 0.92 },
  },

  'fluids-bernoulli': {
    detectedDomain: 'fluids',
    problemSummary: "Water flows through a horizontal pipe narrowing from D=0.1m to D=0.05m. Given inlet velocity 2 m/s and pressure 200 kPa, find outlet velocity and pressure using Bernoulli's equation.",
    knowns: [
      { name: 'Inlet diameter', symbol: 'D₁', value: '0.1', units: 'm', notes: 'Wide section' },
      { name: 'Outlet diameter', symbol: 'D₂', value: '0.05', units: 'm', notes: 'Narrow section' },
      { name: 'Inlet velocity', symbol: 'V₁', value: '2', units: 'm/s', notes: 'At wide section' },
      { name: 'Inlet pressure', symbol: 'P₁', value: '200', units: 'kPa', notes: 'At wide section' },
      { name: 'Water density', symbol: 'ρ', value: '1000', units: 'kg/m³', notes: 'Standard water at ~20°C' },
      { name: 'Pipe orientation', symbol: null, value: 'Horizontal', units: null, notes: 'No elevation change' },
    ],
    unknowns: [
      { name: 'Outlet velocity', symbol: 'V₂', units: 'm/s', notes: 'At narrow section' },
      { name: 'Outlet pressure', symbol: 'P₂', units: 'kPa', notes: 'At narrow section' },
    ],
    assumptions: [
      { assumption: 'Steady flow', whyItMatters: 'Flow properties do not change with time at any point' },
      { assumption: 'Incompressible flow', whyItMatters: 'Density is constant — required for continuity A₁V₁ = A₂V₂' },
      { assumption: 'Inviscid flow', whyItMatters: "Allows application of Bernoulli's equation without friction loss terms" },
      { assumption: 'Horizontal pipe', whyItMatters: 'Eliminates ρgΔz term from Bernoulli equation' },
    ],
    governingEquations: [
      { equation: 'A₁V₁ = A₂V₂  (Continuity)', whenToUse: 'Incompressible steady flow — find V₂ from areas and V₁', variables: ['A₁', 'V₁', 'A₂', 'V₂'] },
      { equation: 'A = π D² / 4', whenToUse: 'Cross-sectional area of a circular pipe', variables: ['A', 'D'] },
      { equation: 'P₁ + ½ρV₁² = P₂ + ½ρV₂²  (Bernoulli, horizontal)', whenToUse: 'Steady, incompressible, inviscid, horizontal flow', variables: ['P₁', 'P₂', 'ρ', 'V₁', 'V₂'] },
    ],
    solutionOutline: [
      { step: 1, title: 'Calculate cross-sectional areas', details: 'Compute A₁ = π(D₁)²/4 and A₂ = π(D₂)²/4.' },
      { step: 2, title: 'Apply continuity to find V₂', details: 'V₂ = A₁V₁ / A₂. Since D₂ = D₁/2, area ratio A₁/A₂ = 4, so V₂ = 4V₁.' },
      { step: 3, title: "Apply Bernoulli's equation", details: 'P₁ + ½ρV₁² = P₂ + ½ρV₂². Solve for P₂.' },
      { step: 4, title: 'Compute P₂', details: 'P₂ = P₁ + ½ρ(V₁² − V₂²). Convert P₁ from kPa to Pa first, then convert result back.' },
      { step: 5, title: 'Sanity check', details: 'Verify P₂ < P₁ (pressure drops as velocity increases — Venturi effect). Check P₂ > 0.' },
    ],
    commonMistakes: [
      { mistake: 'Forgetting to square the diameter ratio for area', avoidanceTip: 'Halving diameter gives quarter area. A ∝ D², so A₁/A₂ = (D₁/D₂)².' },
      { mistake: 'Using kPa instead of Pa in Bernoulli equation', avoidanceTip: 'Convert kPa → Pa (multiply by 1000) before computing ½ρV².' },
      { mistake: 'Including elevation terms when pipe is horizontal', avoidanceTip: 'If z₁ = z₂, the ρgΔz terms cancel.' },
      { mistake: 'Applying Bernoulli across a pump or turbine', avoidanceTip: 'Bernoulli is only valid with no energy addition/removal. Use extended Bernoulli otherwise.' },
    ],
    diagramSpec: { type: 'none', elements: [], notes: 'Flow diagram not rendered as FBD.' },
    units: {
      parsed: [
        { quantity: 'Inlet diameter', value: '0.1', units: 'm' },
        { quantity: 'Outlet diameter', value: '0.05', units: 'm' },
        { quantity: 'Inlet velocity', value: '2', units: 'm/s' },
        { quantity: 'Inlet pressure', value: '200', units: 'kPa' },
        { quantity: 'Density', value: '1000', units: 'kg/m³' },
      ],
      issues: [
        { issue: 'Pressure given in kPa but Bernoulli equation requires Pa', severity: 'high', tip: 'Convert P₁ = 200 kPa → 200,000 Pa before substituting into ½ρV² terms.' },
      ],
    },
    confidence: { parsing: 0.96, domain: 0.98, units: 0.91 },
  },
}

export const GENERIC_MOCK_RESULT = (domain: string): Result => ({
  detectedDomain: (['statics', 'dynamics', 'thermo', 'fluids'].includes(domain) ? domain : 'unknown') as Result['detectedDomain'],
  problemSummary: 'Custom problem detected. This is a generic analysis structure based on keyword detection. Switch to API mode for a real analysis.',
  knowns: [
    { name: 'User-provided value 1', symbol: 'x₁', value: '?', units: 'unknown', notes: 'Extracted from problem text — verify manually' },
    { name: 'User-provided value 2', symbol: 'x₂', value: '?', units: 'unknown', notes: 'Extracted from problem text — verify manually' },
  ],
  unknowns: [
    { name: 'Primary unknown', symbol: 'y', units: 'unknown', notes: 'Determine from governing equations' },
  ],
  assumptions: [
    { assumption: 'Steady-state conditions apply', whyItMatters: 'Simplifies governing equations significantly' },
    { assumption: 'Ideal / simplified material or fluid model', whyItMatters: 'Real-world deviations may need correction factors' },
  ],
  governingEquations: [
    { equation: 'Refer to domain-specific equations', whenToUse: 'Apply based on detected domain and identified process', variables: ['...'] },
  ],
  solutionOutline: [
    { step: 1, title: 'Identify knowns and unknowns', details: 'List all given quantities with units. Identify what is being asked.' },
    { step: 2, title: 'Select governing equations', details: 'Choose equations that relate your knowns to your unknowns.' },
    { step: 3, title: 'Solve algebraically first', details: 'Rearrange equations symbolically before substituting numbers.' },
    { step: 4, title: 'Substitute and compute', details: 'Plug in values with units, compute, and verify unit consistency.' },
    { step: 5, title: 'Sanity-check the result', details: 'Does the magnitude make physical sense? Check limiting cases.' },
  ],
  commonMistakes: [
    { mistake: 'Unit inconsistency', avoidanceTip: 'Always write units alongside every number and cancel them explicitly.' },
    { mistake: 'Wrong equation for the process type', avoidanceTip: 'Confirm the process type before selecting equations.' },
  ],
  diagramSpec: { type: 'none', elements: [], notes: null },
  units: {
    parsed: [{ quantity: 'Generic', value: null, units: null }],
    issues: [{ issue: 'Unable to parse units from custom problem in MOCK mode', severity: 'low', tip: 'Switch to API mode for real units extraction.' }],
  },
  confidence: { parsing: 0.45, domain: 0.55, units: 0.30 },
})