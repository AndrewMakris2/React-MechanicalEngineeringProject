import React, { useState, useMemo } from 'react'

interface Material {
  name: string
  category: string
  density: string        // kg/m³
  youngsModulus: string  // GPa
  yieldStrength: string  // MPa
  ultimateStrength: string // MPa
  poissonRatio: string
  thermalExp: string     // µm/(m·°C)
  thermalCond: string    // W/(m·K)
  specificHeat: string   // J/(kg·K)
  meltingPoint: string   // °C
  notes: string
}

const MATERIALS: Material[] = [
  {
    name: 'AISI 1020 Steel (HR)',
    category: 'Steel',
    density: '7,860',
    youngsModulus: '200',
    yieldStrength: '210',
    ultimateStrength: '380',
    poissonRatio: '0.29',
    thermalExp: '11.7',
    thermalCond: '51.9',
    specificHeat: '486',
    meltingPoint: '1,420–1,470',
    notes: 'Low-carbon, general-purpose structural steel. Easy to weld and machine.',
  },
  {
    name: 'AISI 1040 Steel (HR)',
    category: 'Steel',
    density: '7,845',
    youngsModulus: '200',
    yieldStrength: '290',
    ultimateStrength: '525',
    poissonRatio: '0.29',
    thermalExp: '11.3',
    thermalCond: '50.7',
    specificHeat: '486',
    meltingPoint: '1,420–1,460',
    notes: 'Medium-carbon. Good strength and wear resistance. Used in shafts, gears.',
  },
  {
    name: 'AISI 4140 Steel (Q&T)',
    category: 'Steel',
    density: '7,850',
    youngsModulus: '205',
    yieldStrength: '655',
    ultimateStrength: '1,020',
    poissonRatio: '0.29',
    thermalExp: '12.3',
    thermalCond: '42.6',
    specificHeat: '473',
    meltingPoint: '1,415–1,445',
    notes: 'Chromium-molybdenum alloy. High fatigue and torsion resistance.',
  },
  {
    name: 'AISI 304 Stainless',
    category: 'Steel',
    density: '8,000',
    youngsModulus: '193',
    yieldStrength: '215',
    ultimateStrength: '505',
    poissonRatio: '0.29',
    thermalExp: '17.2',
    thermalCond: '16.2',
    specificHeat: '500',
    meltingPoint: '1,400–1,450',
    notes: 'Austenitic stainless. Excellent corrosion resistance. Non-magnetic.',
  },
  {
    name: 'AISI 316 Stainless',
    category: 'Steel',
    density: '8,000',
    youngsModulus: '193',
    yieldStrength: '205',
    ultimateStrength: '515',
    poissonRatio: '0.27',
    thermalExp: '15.9',
    thermalCond: '16.3',
    specificHeat: '502',
    meltingPoint: '1,370–1,400',
    notes: 'Marine-grade stainless with Mo for superior chloride corrosion resistance.',
  },
  {
    name: 'Aluminum 6061-T6',
    category: 'Aluminum',
    density: '2,700',
    youngsModulus: '68.9',
    yieldStrength: '276',
    ultimateStrength: '310',
    poissonRatio: '0.33',
    thermalExp: '23.6',
    thermalCond: '167',
    specificHeat: '896',
    meltingPoint: '582–652',
    notes: 'Most common Al alloy. Excellent strength-to-weight, good weldability.',
  },
  {
    name: 'Aluminum 7075-T6',
    category: 'Aluminum',
    density: '2,810',
    youngsModulus: '71.7',
    yieldStrength: '503',
    ultimateStrength: '572',
    poissonRatio: '0.33',
    thermalExp: '23.4',
    thermalCond: '130',
    specificHeat: '960',
    meltingPoint: '477–635',
    notes: 'Aerospace-grade. Highest strength aluminum alloy. Poor weldability.',
  },
  {
    name: 'Aluminum 2024-T4',
    category: 'Aluminum',
    density: '2,780',
    youngsModulus: '73.1',
    yieldStrength: '325',
    ultimateStrength: '469',
    poissonRatio: '0.33',
    thermalExp: '23.2',
    thermalCond: '121',
    specificHeat: '875',
    meltingPoint: '500–638',
    notes: 'High-strength Al-Cu alloy used in aircraft structures.',
  },
  {
    name: 'Copper (pure)',
    category: 'Non-ferrous',
    density: '8,960',
    youngsModulus: '110',
    yieldStrength: '70',
    ultimateStrength: '220',
    poissonRatio: '0.34',
    thermalExp: '17.0',
    thermalCond: '385',
    specificHeat: '385',
    meltingPoint: '1,084',
    notes: 'Excellent electrical and thermal conductor. Ductile, easy to form.',
  },
  {
    name: 'Brass (C26000)',
    category: 'Non-ferrous',
    density: '8,530',
    youngsModulus: '110',
    yieldStrength: '125',
    ultimateStrength: '340',
    poissonRatio: '0.34',
    thermalExp: '20.0',
    thermalCond: '120',
    specificHeat: '375',
    meltingPoint: '915–955',
    notes: '70/30 Cu-Zn cartridge brass. Excellent formability and corrosion resistance.',
  },
  {
    name: 'Titanium Ti-6Al-4V',
    category: 'Non-ferrous',
    density: '4,430',
    youngsModulus: '113.8',
    yieldStrength: '880',
    ultimateStrength: '950',
    poissonRatio: '0.34',
    thermalExp: '8.6',
    thermalCond: '6.7',
    specificHeat: '526',
    meltingPoint: '1,600–1,660',
    notes: 'Premier aerospace alloy. High strength, low density, excellent corrosion resistance.',
  },
  {
    name: 'Inconel 718',
    category: 'Non-ferrous',
    density: '8,190',
    youngsModulus: '200',
    yieldStrength: '1,035',
    ultimateStrength: '1,240',
    poissonRatio: '0.29',
    thermalExp: '13.0',
    thermalCond: '11.4',
    specificHeat: '435',
    meltingPoint: '1,260–1,336',
    notes: 'Ni superalloy. Exceptional high-temperature strength. Used in jet engines.',
  },
  {
    name: 'Cast Iron (Gray)',
    category: 'Cast Iron',
    density: '7,150',
    youngsModulus: '100',
    yieldStrength: '—',
    ultimateStrength: '200 (compression: 570)',
    poissonRatio: '0.26',
    thermalExp: '11.4',
    thermalCond: '46.0',
    specificHeat: '490',
    meltingPoint: '1,150–1,200',
    notes: 'Brittle in tension. Excellent vibration damping and wear resistance.',
  },
  {
    name: 'Ductile Iron (Grade 65-45-12)',
    category: 'Cast Iron',
    density: '7,100',
    youngsModulus: '169',
    yieldStrength: '310',
    ultimateStrength: '448',
    poissonRatio: '0.29',
    thermalExp: '11.0',
    thermalCond: '36.0',
    specificHeat: '461',
    meltingPoint: '1,150–1,200',
    notes: 'Spheroidal graphite iron. Much better ductility than gray iron.',
  },
  {
    name: 'Concrete (normal)',
    category: 'Non-metal',
    density: '2,300',
    youngsModulus: '25–35',
    yieldStrength: '—',
    ultimateStrength: '20–40 (compression)',
    poissonRatio: '0.15–0.20',
    thermalExp: '10–12',
    thermalCond: '1.7',
    specificHeat: '880',
    meltingPoint: 'N/A',
    notes: 'Brittle in tension. f\'c typically 3,000–5,000 psi (21–35 MPa).',
  },
  {
    name: 'HDPE Plastic',
    category: 'Polymer',
    density: '952',
    youngsModulus: '0.8',
    yieldStrength: '25',
    ultimateStrength: '30',
    poissonRatio: '0.46',
    thermalExp: '108',
    thermalCond: '0.49',
    specificHeat: '1,900',
    meltingPoint: '130',
    notes: 'High-density polyethylene. Common structural polymer, chemical resistant.',
  },
  {
    name: 'ASTM A36 Steel',
    category: 'Steel',
    density: '7,850',
    youngsModulus: '200',
    yieldStrength: '250',
    ultimateStrength: '400–500',
    poissonRatio: '0.26',
    thermalExp: '11.7',
    thermalCond: '51.9',
    specificHeat: '490',
    meltingPoint: '1,420–1,460',
    notes: 'Standard structural steel (W-sections, angles, plates). Widely used in construction.',
  },
  {
    name: 'Magnesium AZ31B',
    category: 'Non-ferrous',
    density: '1,770',
    youngsModulus: '45',
    yieldStrength: '200',
    ultimateStrength: '260',
    poissonRatio: '0.35',
    thermalExp: '26.0',
    thermalCond: '96',
    specificHeat: '1,020',
    meltingPoint: '605–630',
    notes: 'Lightest structural metal. Good strength-to-weight. Flammable at high temp.',
  },
]

const CATEGORIES_MAT = ['All', 'Steel', 'Aluminum', 'Non-ferrous', 'Cast Iron', 'Non-metal', 'Polymer']

const COLUMNS = [
  { key: 'name', label: 'Material', short: 'Material' },
  { key: 'density', label: 'Density (kg/m³)', short: 'ρ' },
  { key: 'youngsModulus', label: "Young's Modulus (GPa)", short: 'E (GPa)' },
  { key: 'yieldStrength', label: 'Yield Strength (MPa)', short: 'Sy (MPa)' },
  { key: 'ultimateStrength', label: 'Ultimate Strength (MPa)', short: 'Su (MPa)' },
  { key: 'poissonRatio', label: "Poisson's Ratio (ν)", short: 'ν' },
  { key: 'thermalExp', label: 'Thermal Exp. (µm/m·°C)', short: 'α' },
  { key: 'thermalCond', label: 'Thermal Cond. (W/m·K)', short: 'k' },
  { key: 'meltingPoint', label: 'Melting Pt (°C)', short: 'Tm' },
]

const CAT_COLORS: Record<string, string> = {
  Steel: 'rgba(148,163,184,0.15)',
  Aluminum: 'rgba(59,130,246,0.12)',
  'Non-ferrous': 'rgba(234,179,8,0.1)',
  'Cast Iron': 'rgba(107,114,128,0.15)',
  'Non-metal': 'rgba(34,197,94,0.1)',
  Polymer: 'rgba(168,85,247,0.1)',
}

const CAT_TEXT: Record<string, string> = {
  Steel: '#94a3b8',
  Aluminum: '#93c5fd',
  'Non-ferrous': '#fde047',
  'Cast Iron': '#9ca3af',
  'Non-metal': '#86efac',
  Polymer: '#d8b4fe',
}

export default function MaterialPropsPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selected, setSelected] = useState<Material | null>(null)

  const filtered = useMemo(() => {
    return MATERIALS.filter(m => {
      if (activeCategory !== 'All' && m.category !== activeCategory) return false
      if (search) {
        const q = search.toLowerCase()
        return m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.notes.toLowerCase().includes(q)
      }
      return true
    })
  }, [search, activeCategory])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Material Properties</h1>
        <p className="text-gray-400 text-sm mt-1">Quick reference for common engineering materials</p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search materials..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-base flex-1"
        />
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES_MAT.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === c ? 'text-blue-300' : 'text-gray-400 hover:text-gray-200'
              }`}
              style={activeCategory === c ? {
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.3)',
              } : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '800px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {COLUMNS.map(col => (
                  <th key={col.key} className="px-3 py-3 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">
                    <span className="hidden md:inline">{col.label}</span>
                    <span className="md:hidden">{col.short}</span>
                  </th>
                ))}
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr
                  key={m.name}
                  onClick={() => setSelected(selected?.name === m.name ? null : m)}
                  className="cursor-pointer transition-all"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: selected?.name === m.name
                      ? 'rgba(59,130,246,0.08)'
                      : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  }}
                >
                  <td className="px-3 py-3">
                    <div className="font-medium text-white text-xs sm:text-sm">{m.name}</div>
                    <span
                      className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium"
                      style={{ background: CAT_COLORS[m.category], color: CAT_TEXT[m.category] }}
                    >
                      {m.category}
                    </span>
                  </td>
                  {COLUMNS.slice(1).map(col => (
                    <td key={col.key} className="px-3 py-3 font-mono text-gray-300 text-xs whitespace-nowrap">
                      {m[col.key as keyof Material]}
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <span className="text-gray-600 text-xs">{selected?.name === m.name ? '▲' : '▼'}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-4 py-8 text-center text-gray-500">
                    No materials match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="card space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{selected.name}</h3>
              <span
                className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: CAT_COLORS[selected.category], color: CAT_TEXT[selected.category] }}
              >
                {selected.category}
              </span>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
          </div>

          <p className="text-gray-300 text-sm">{selected.notes}</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { label: 'Density', value: selected.density, unit: 'kg/m³' },
              { label: "Young's Modulus", value: selected.youngsModulus, unit: 'GPa' },
              { label: 'Yield Strength', value: selected.yieldStrength, unit: 'MPa' },
              { label: 'Ultimate Strength', value: selected.ultimateStrength, unit: 'MPa' },
              { label: "Poisson's Ratio", value: selected.poissonRatio, unit: '' },
              { label: 'Thermal Expansion', value: selected.thermalExp, unit: 'µm/(m·°C)' },
              { label: 'Thermal Conductivity', value: selected.thermalCond, unit: 'W/(m·K)' },
              { label: 'Specific Heat', value: selected.specificHeat, unit: 'J/(kg·K)' },
              { label: 'Melting Point', value: selected.meltingPoint, unit: '°C' },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className="font-mono font-semibold text-white">{item.value}</p>
                {item.unit && <p className="text-xs text-gray-500 mt-0.5">{item.unit}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Units legend */}
      <div className="card">
        <p className="text-xs font-semibold text-gray-400 mb-2">Property Units Legend</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
          {[
            ['ρ — Density', 'kg/m³'],
            ['E — Young\'s Modulus', 'GPa'],
            ['Sy — Yield Strength', 'MPa'],
            ['Su — Ultimate Tensile', 'MPa'],
            ['ν — Poisson\'s Ratio', 'dimensionless'],
            ['α — Thermal Expansion', 'µm/(m·°C)'],
            ['k — Thermal Conductivity', 'W/(m·K)'],
            ['cp — Specific Heat', 'J/(kg·K)'],
          ].map(([prop, unit]) => (
            <div key={prop} className="flex items-baseline gap-1">
              <span className="text-xs text-gray-300">{prop}</span>
              <span className="text-xs text-gray-500">({unit})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
