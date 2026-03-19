import React, { useState, useMemo } from 'react'

type Subject = 'all' | 'statics' | 'dynamics' | 'thermo' | 'fluids'

interface Formula {
  id: string
  subject: Exclude<Subject, 'all'>
  name: string
  equation: string
  variables: { sym: string; desc: string }[]
  whenToUse: string
}

const FORMULAS: Formula[] = [
  // ── STATICS ──────────────────────────────────────────
  { id: 's1', subject: 'statics', name: 'Static Equilibrium — Forces', equation: 'ΣFx = 0,   ΣFy = 0,   ΣFz = 0',
    variables: [{ sym: 'ΣF', desc: 'Sum of all external forces in each direction (N)' }],
    whenToUse: 'Any object at rest or moving at constant velocity. Write separate equations for each axis.' },
  { id: 's2', subject: 'statics', name: 'Static Equilibrium — Moments', equation: 'ΣM_A = 0',
    variables: [{ sym: 'M_A', desc: 'Sum of moments about point A (N·m)' }],
    whenToUse: 'Choose pivot point at a location with many unknowns to cancel them from the equation.' },
  { id: 's3', subject: 'statics', name: 'Moment of a Force', equation: 'M = F · d',
    variables: [{ sym: 'F', desc: 'Force (N)' }, { sym: 'd', desc: 'Perpendicular distance to line of action (m)' }],
    whenToUse: 'Calculate the turning effect. d must be the perpendicular distance, NOT the position vector length.' },
  { id: 's4', subject: 'statics', name: 'Normal / Axial Stress', equation: 'σ = F / A',
    variables: [{ sym: 'σ', desc: 'Normal stress (Pa)' }, { sym: 'F', desc: 'Axial force (N)' }, { sym: 'A', desc: 'Cross-sectional area (m²)' }],
    whenToUse: 'Bars, rods, cables under tension (+) or compression (−). Force must be perpendicular to cross-section.' },
  { id: 's5', subject: 'statics', name: 'Average Shear Stress', equation: 'τ = V / A',
    variables: [{ sym: 'V', desc: 'Shear force (N)' }, { sym: 'A', desc: 'Shear area (m²)' }],
    whenToUse: 'Pins, bolts, rivets in shear. For double shear, A = 2 × (pin cross-section area).' },
  { id: 's6', subject: 'statics', name: 'Bending Stress', equation: 'σ = M · y / I',
    variables: [{ sym: 'M', desc: 'Bending moment (N·m)' }, { sym: 'y', desc: 'Distance from neutral axis (m)' }, { sym: 'I', desc: 'Second moment of area (m⁴)' }],
    whenToUse: 'Beams in bending. Max stress at extreme fibers (y = c). Use section modulus S = I/c for shortcut.' },
  { id: 's7', subject: 'statics', name: 'Moment of Inertia — Rectangle', equation: 'I_x = b·h³ / 12',
    variables: [{ sym: 'b', desc: 'Width (m)' }, { sym: 'h', desc: 'Height (m)' }],
    whenToUse: 'Rectangular sections about their centroidal axis. For solid circle: I = π·r⁴/4 = π·d⁴/64.' },
  { id: 's8', subject: 'statics', name: 'Static Friction', equation: 'F_f ≤ μ_s · N',
    variables: [{ sym: 'μ_s', desc: 'Coefficient of static friction' }, { sym: 'N', desc: 'Normal force (N)' }],
    whenToUse: 'Check for impending slip. If required friction > μ_s·N, object slides. Use μ_k for kinetic (sliding) friction.' },
  { id: 's9', subject: 'statics', name: 'Factor of Safety', equation: 'FS = σ_fail / σ_allow',
    variables: [{ sym: 'σ_fail', desc: 'Failure stress — yield (ductile) or ultimate (brittle)' }, { sym: 'σ_allow', desc: 'Allowable stress = σ_fail / FS' }],
    whenToUse: 'Design check. Typical: 1.5–2.0 (static ductile), 3–5 (impact loads), 4–6 (structures).' },
  { id: 's10', subject: 'statics', name: 'Shear Flow (Thin-walled)', equation: 'q = V · Q / I',
    variables: [{ sym: 'Q', desc: 'First moment of area above the cut (m³)' }, { sym: 'q', desc: 'Shear flow (N/m)' }],
    whenToUse: 'Fastener spacing in built-up beams, shear stress distribution in thin-walled sections.' },

  // ── DYNAMICS ─────────────────────────────────────────
  { id: 'd1', subject: 'dynamics', name: "Newton's 2nd Law", equation: 'ΣF = m · a',
    variables: [{ sym: 'ΣF', desc: 'Net force (N)' }, { sym: 'm', desc: 'Mass (kg)' }, { sym: 'a', desc: 'Acceleration (m/s²)' }],
    whenToUse: 'Apply in every direction separately (ΣFx = m·ax, ΣFy = m·ay). Draw FBD first.' },
  { id: 'd2', subject: 'dynamics', name: 'Kinematics — Velocity', equation: 'v = v₀ + a·t',
    variables: [{ sym: 'v₀', desc: 'Initial velocity (m/s)' }, { sym: 'a', desc: 'Constant acceleration (m/s²)' }, { sym: 't', desc: 'Time (s)' }],
    whenToUse: 'Constant acceleration only. Use when time is known or being sought.' },
  { id: 'd3', subject: 'dynamics', name: 'Kinematics — Position', equation: 'x = x₀ + v₀·t + ½·a·t²',
    variables: [{ sym: 'x₀', desc: 'Initial position (m)' }, { sym: 'x', desc: 'Final position (m)' }],
    whenToUse: 'Constant acceleration. Gives displacement as function of time.' },
  { id: 'd4', subject: 'dynamics', name: 'Kinematics — Velocity-Position', equation: 'v² = v₀² + 2·a·Δx',
    variables: [{ sym: 'Δx', desc: 'Displacement = x − x₀ (m)' }],
    whenToUse: 'Constant acceleration when time is NOT involved (time-independent).' },
  { id: 'd5', subject: 'dynamics', name: 'Work Done by a Force', equation: 'W = F · d · cos(θ)',
    variables: [{ sym: 'θ', desc: 'Angle between force vector and displacement vector' }],
    whenToUse: 'Force not parallel to displacement. If force varies with position: W = ∫F dx.' },
  { id: 'd6', subject: 'dynamics', name: 'Kinetic Energy', equation: 'KE = ½·m·v²',
    variables: [{ sym: 'm', desc: 'Mass (kg)' }, { sym: 'v', desc: 'Speed (m/s)' }],
    whenToUse: 'Work-Energy theorem: W_net = ΔKE. Great for finding velocities without acceleration.' },
  { id: 'd7', subject: 'dynamics', name: 'Gravitational Potential Energy', equation: 'PE = m·g·h',
    variables: [{ sym: 'g', desc: '9.81 m/s²' }, { sym: 'h', desc: 'Height above reference datum (m)' }],
    whenToUse: 'Conservation of energy: KE₁ + PE₁ + W_friction = KE₂ + PE₂.' },
  { id: 'd8', subject: 'dynamics', name: 'Impulse-Momentum Theorem', equation: 'J = F·Δt = Δp = m·(v₂ − v₁)',
    variables: [{ sym: 'J', desc: 'Impulse (N·s)' }, { sym: 'p', desc: 'Linear momentum (kg·m/s)' }],
    whenToUse: 'Impact and collision problems. Find average force during short contact time.' },
  { id: 'd9', subject: 'dynamics', name: 'Rotational Dynamics', equation: 'ΣT = I · α',
    variables: [{ sym: 'T', desc: 'Net torque (N·m)' }, { sym: 'I', desc: 'Mass moment of inertia (kg·m²)' }, { sym: 'α', desc: 'Angular acceleration (rad/s²)' }],
    whenToUse: "Rotating bodies — analogue of Newton's 2nd law. Solid cylinder: I = ½mr²; thin ring: I = mr²." },
  { id: 'd10', subject: 'dynamics', name: 'Centripetal Acceleration', equation: 'a_c = v² / r = ω²·r',
    variables: [{ sym: 'ω', desc: 'Angular velocity (rad/s)' }, { sym: 'r', desc: 'Radius (m)' }],
    whenToUse: 'Circular motion. Centripetal force F_c = m·a_c directed toward center of curvature.' },
  { id: 'd11', subject: 'dynamics', name: 'Angular Kinematics', equation: 'ω = ω₀ + α·t,   θ = θ₀ + ω₀t + ½αt²',
    variables: [{ sym: 'ω', desc: 'Angular velocity (rad/s)' }, { sym: 'α', desc: 'Angular acceleration (rad/s²)' }],
    whenToUse: 'Rotating shafts, wheels. Directly analogous to linear kinematics (replace x with θ, v with ω).' },
  { id: 'd12', subject: 'dynamics', name: 'Projectile Motion', equation: 'x = v₀·cos(θ)·t,   y = v₀·sin(θ)·t − ½g·t²',
    variables: [{ sym: 'θ', desc: 'Launch angle above horizontal' }],
    whenToUse: 'No air resistance. Horizontal and vertical motions are independent. At max height: vy = 0.' },

  // ── THERMO ───────────────────────────────────────────
  { id: 't1', subject: 'thermo', name: 'Sensible Heat Transfer', equation: 'Q = m·cp·ΔT',
    variables: [{ sym: 'cp', desc: 'Specific heat at const pressure (J/kg·K). Water: 4186, Air: 1005' }, { sym: 'ΔT', desc: 'Temperature change (°C or K — same magnitude)' }],
    whenToUse: 'Heating or cooling without phase change. For constant volume processes use cv instead.' },
  { id: 't2', subject: 'thermo', name: 'Latent Heat', equation: 'Q = m · L',
    variables: [{ sym: 'L', desc: 'Latent heat (J/kg). Fusion water: 334 kJ/kg. Vaporization water: 2257 kJ/kg' }],
    whenToUse: 'Phase transitions (melting, boiling, condensing, freezing) at constant temperature.' },
  { id: 't3', subject: 'thermo', name: 'First Law of Thermodynamics', equation: 'ΔU = Q − W',
    variables: [{ sym: 'ΔU', desc: 'Change in internal energy (J)' }, { sym: 'Q', desc: 'Heat IN to system (+ = in)' }, { sym: 'W', desc: 'Work done BY system (+ = out)' }],
    whenToUse: 'Closed systems. Sign convention: Q positive into system, W positive out of system.' },
  { id: 't4', subject: 'thermo', name: 'Ideal Gas Law', equation: 'PV = nRT   or   Pv = R_specific · T',
    variables: [{ sym: 'R', desc: 'Universal gas constant = 8.314 J/(mol·K)' }, { sym: 'T', desc: 'ABSOLUTE temperature in Kelvin only' }],
    whenToUse: 'Low-to-moderate pressure gases. Always use absolute pressure (Pa) and temperature (K).' },
  { id: 't5', subject: 'thermo', name: 'Combined Gas Law', equation: 'P₁V₁ / T₁ = P₂V₂ / T₂',
    variables: [{ sym: 'T₁, T₂', desc: 'Must be in Kelvin (K = °C + 273.15)' }],
    whenToUse: 'Same mass of ideal gas changing state. Isothermal: P₁V₁ = P₂V₂. Isobaric: V₁/T₁ = V₂/T₂.' },
  { id: 't6', subject: 'thermo', name: 'Thermal Efficiency', equation: 'η = W_net / Q_H = 1 − Q_L / Q_H',
    variables: [{ sym: 'Q_H', desc: 'Heat input from hot source (J)' }, { sym: 'Q_L', desc: 'Heat rejected to cold sink (J)' }],
    whenToUse: 'Heat engines (Rankine, Brayton, Otto, Diesel cycles). η is always less than 1.' },
  { id: 't7', subject: 'thermo', name: 'Carnot Efficiency (Maximum)', equation: 'η_Carnot = 1 − T_L / T_H',
    variables: [{ sym: 'T_H', desc: 'Hot reservoir temperature (K)' }, { sym: 'T_L', desc: 'Cold reservoir temperature (K)' }],
    whenToUse: 'Upper bound on any heat engine efficiency between two temperatures. T in Kelvin.' },
  { id: 't8', subject: 'thermo', name: 'Steady-Flow Energy Equation', equation: 'Q̇ − Ẇ = ṁ·[(h₂−h₁) + ½(V₂²−V₁²) + g(z₂−z₁)]',
    variables: [{ sym: 'ṁ', desc: 'Mass flow rate (kg/s)' }, { sym: 'h', desc: 'Specific enthalpy (J/kg)' }],
    whenToUse: 'Open systems: turbines, compressors, pumps, heat exchangers, nozzles. Often KE and PE terms drop out.' },
  { id: 't9', subject: 'thermo', name: 'Fourier Law of Conduction', equation: 'Q̇ = k·A·ΔT / L',
    variables: [{ sym: 'k', desc: 'Thermal conductivity (W/m·K). Steel ≈ 50, Al ≈ 167, Insulation ≈ 0.04' }, { sym: 'L', desc: 'Wall thickness (m)' }],
    whenToUse: 'Steady 1-D conduction through a flat wall. Thermal resistance: R_th = L/(k·A).' },
  { id: 't10', subject: 'thermo', name: 'Newton\'s Law of Cooling', equation: 'Q̇ = h·A·(T_s − T_∞)',
    variables: [{ sym: 'h', desc: 'Convection coefficient (W/m²·K). Forced air: 25–250, Water: 1000–15000' }, { sym: 'T_s', desc: 'Surface temperature (K)' }],
    whenToUse: 'Convective heat transfer from a surface to a flowing fluid.' },

  // ── FLUIDS ───────────────────────────────────────────
  { id: 'f1', subject: 'fluids', name: 'Hydrostatic Pressure', equation: 'P = P₀ + ρ·g·h',
    variables: [{ sym: 'ρ', desc: 'Fluid density (kg/m³). Water: 1000, Seawater: 1025, Air: 1.225' }, { sym: 'h', desc: 'Depth below surface (m)' }],
    whenToUse: 'Pressure at any depth in a static fluid. Gauge pressure = ρ·g·h (set P₀ = 0).' },
  { id: 'f2', subject: 'fluids', name: 'Continuity Equation', equation: 'Q = A·V = const   →   A₁V₁ = A₂V₂',
    variables: [{ sym: 'Q', desc: 'Volumetric flow rate (m³/s)' }, { sym: 'A', desc: 'Cross-sectional area (m²)' }, { sym: 'V', desc: 'Average velocity (m/s)' }],
    whenToUse: 'Steady, incompressible flow. Smaller area → higher velocity.' },
  { id: 'f3', subject: 'fluids', name: "Bernoulli's Equation", equation: 'P₁ + ½ρV₁² + ρgz₁ = P₂ + ½ρV₂² + ρgz₂',
    variables: [{ sym: 'z', desc: 'Elevation above datum (m)' }, { sym: '½ρV²', desc: 'Dynamic pressure (Pa)' }],
    whenToUse: 'Steady, inviscid, incompressible flow along a streamline. Neglects friction losses.' },
  { id: 'f4', subject: 'fluids', name: 'Reynolds Number', equation: 'Re = ρ·V·D / μ = V·D / ν',
    variables: [{ sym: 'μ', desc: 'Dynamic viscosity (Pa·s). Water at 20°C: 1.0×10⁻³' }, { sym: 'ν', desc: 'Kinematic viscosity = μ/ρ (m²/s)' }],
    whenToUse: 'Classify flow: Re < 2300 laminar, 2300–4000 transitional, > 4000 turbulent.' },
  { id: 'f5', subject: 'fluids', name: 'Darcy-Weisbach Head Loss', equation: 'h_f = f · (L/D) · (V²/2g)',
    variables: [{ sym: 'f', desc: 'Darcy friction factor (from Moody chart). Laminar: f = 64/Re' }, { sym: 'h_f', desc: 'Head loss (m)' }],
    whenToUse: 'Major (friction) losses in pipe flow. Add minor losses: h_m = K·V²/(2g).' },
  { id: 'f6', subject: 'fluids', name: 'Buoyancy Force', equation: 'F_B = ρ_fluid · g · V_sub',
    variables: [{ sym: 'V_sub', desc: 'Volume of fluid displaced (m³)' }],
    whenToUse: "Archimedes' principle. Object floats when F_B ≥ weight. Net upward force = F_B − W." },
  { id: 'f7', subject: 'fluids', name: 'Drag Force', equation: 'F_D = ½ · ρ · V² · C_D · A',
    variables: [{ sym: 'C_D', desc: 'Drag coefficient. Sphere: 0.47, Flat plate (normal): 1.28, Streamlined body: 0.04' }, { sym: 'A', desc: 'Frontal (projected) area (m²)' }],
    whenToUse: 'Drag on objects moving through fluids. Same form for lift force (use C_L and planform area).' },
  { id: 'f8', subject: 'fluids', name: 'Mass Flow Rate', equation: 'ṁ = ρ · A · V = ρ · Q',
    variables: [{ sym: 'ṁ', desc: 'Mass flow rate (kg/s)' }],
    whenToUse: 'Convert between volumetric and mass flow. Use in energy/momentum equations for open systems.' },
]

const SUBJECT_COLORS: Record<string, { badge: string; tab: string; dot: string }> = {
  statics:  { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',   tab: 'border-blue-500 text-blue-400',   dot: 'bg-blue-500' },
  dynamics: { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', tab: 'border-purple-500 text-purple-400', dot: 'bg-purple-500' },
  thermo:   { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', tab: 'border-orange-500 text-orange-400', dot: 'bg-orange-500' },
  fluids:   { badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',   tab: 'border-cyan-500 text-cyan-400',   dot: 'bg-cyan-500' },
}

const SUBJECT_ICONS: Record<string, string> = {
  all: '📐', statics: '⚖️', dynamics: '🚀', thermo: '🔥', fluids: '💧',
}

export default function FormulaSheetPage() {
  const [activeSubject, setActiveSubject] = useState<Subject>('all')
  const [search, setSearch] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('formula_favorites') ?? '[]')) }
    catch { return new Set() }
  })
  const [expanded, setExpanded] = useState<string | null>(null)

  function toggleFavorite(id: string) {
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem('formula_favorites', JSON.stringify([...next]))
      return next
    })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return FORMULAS.filter(f => {
      if (activeSubject !== 'all' && f.subject !== activeSubject) return false
      if (!q) return true
      return (
        f.name.toLowerCase().includes(q) ||
        f.equation.toLowerCase().includes(q) ||
        f.variables.some(v => v.sym.toLowerCase().includes(q) || v.desc.toLowerCase().includes(q)) ||
        f.whenToUse.toLowerCase().includes(q)
      )
    })
  }, [activeSubject, search])

  const tabs: Subject[] = ['all', 'statics', 'dynamics', 'thermo', 'fluids']

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="page-header">📐 Formula Sheet</h1>
          <p className="page-sub">{FORMULAS.length} engineering equations — searchable and bookmarkable</p>
        </div>
        {favorites.size > 0 && (
          <button
            onClick={() => setActiveSubject('all')}
            className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
          >
            ⭐ {favorites.size} favorited
          </button>
        )}
      </div>

      {/* Search */}
      <input
        className="input-base"
        placeholder="Search formulas, symbols, or keywords (e.g. 'Bernoulli', 'σ', 'friction')..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Subject tabs */}
      <div className="flex gap-1 flex-wrap">
        {tabs.map(s => (
          <button
            key={s}
            onClick={() => setActiveSubject(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              activeSubject === s
                ? s === 'all'
                  ? 'bg-white/10 border-white/20 text-white'
                  : `${SUBJECT_COLORS[s].tab} bg-white/[0.05]`
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
            }`}
          >
            {SUBJECT_ICONS[s]} {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 text-gray-500">
              {s === 'all' ? FORMULAS.length : FORMULAS.filter(f => f.subject === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-gray-500">
        {filtered.length === FORMULAS.length ? `All ${filtered.length} formulas` : `${filtered.length} of ${FORMULAS.length} formulas`}
        {search && ` matching "${search}"`}
      </p>

      {/* Formula grid */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No formulas match your search.</p>
          <button onClick={() => setSearch('')} className="text-blue-400 text-sm mt-2 hover:text-blue-300">Clear search</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(f => {
            const colors = SUBJECT_COLORS[f.subject]
            const isFav = favorites.has(f.id)
            const isExp = expanded === f.id
            return (
              <div key={f.id} className="card space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge border ${colors.badge} text-xs`}>
                      {SUBJECT_ICONS[f.subject]} {f.subject}
                    </span>
                    <h3 className="text-sm font-semibold text-white">{f.name}</h3>
                  </div>
                  <button
                    onClick={() => toggleFavorite(f.id)}
                    className={`shrink-0 text-base leading-none transition-all ${isFav ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFav ? '⭐' : '☆'}
                  </button>
                </div>

                {/* Equation */}
                <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.12)' }}>
                  <p className="text-yellow-300 font-mono text-sm leading-relaxed break-words">{f.equation}</p>
                </div>

                {/* Variables + When to use (collapsible) */}
                <button
                  onClick={() => setExpanded(isExp ? null : f.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                    <span>{isExp ? '▼' : '▶'}</span>
                    <span>{isExp ? 'Hide details' : 'Show variables & usage'}</span>
                  </div>
                </button>

                {isExp && (
                  <div className="space-y-3 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    {/* Variables */}
                    <div className="space-y-1">
                      {f.variables.map(v => (
                        <div key={v.sym} className="flex gap-2 text-xs">
                          <span className="text-blue-300 font-mono font-bold shrink-0 w-16">{v.sym}</span>
                          <span className="text-gray-400">{v.desc}</span>
                        </div>
                      ))}
                    </div>
                    {/* When to use */}
                    <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        <span className="text-green-400 font-semibold">When to use: </span>
                        {f.whenToUse}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
