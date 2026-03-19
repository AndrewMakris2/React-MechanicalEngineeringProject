import React, { useState, useMemo } from 'react'

interface UnitDef {
  label: string
  toBase: (v: number) => number
  fromBase: (v: number) => number
}

interface Category {
  name: string
  icon: string
  baseUnit: string
  units: UnitDef[]
}

const CATEGORIES: Category[] = [
  {
    name: 'Force',
    icon: '↗️',
    baseUnit: 'N',
    units: [
      { label: 'Newton (N)', toBase: v => v, fromBase: v => v },
      { label: 'Kilonewton (kN)', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { label: 'Pound-force (lbf)', toBase: v => v * 4.44822, fromBase: v => v / 4.44822 },
      { label: 'Kilopound (kip)', toBase: v => v * 4448.22, fromBase: v => v / 4448.22 },
      { label: 'Dyne (dyn)', toBase: v => v * 1e-5, fromBase: v => v * 1e5 },
      { label: 'Kilogram-force (kgf)', toBase: v => v * 9.80665, fromBase: v => v / 9.80665 },
    ],
  },
  {
    name: 'Pressure',
    icon: '🔵',
    baseUnit: 'Pa',
    units: [
      { label: 'Pascal (Pa)', toBase: v => v, fromBase: v => v },
      { label: 'Kilopascal (kPa)', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { label: 'Megapascal (MPa)', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
      { label: 'Gigapascal (GPa)', toBase: v => v * 1e9, fromBase: v => v / 1e9 },
      { label: 'Bar', toBase: v => v * 1e5, fromBase: v => v / 1e5 },
      { label: 'Millibar (mbar)', toBase: v => v * 100, fromBase: v => v / 100 },
      { label: 'Atmosphere (atm)', toBase: v => v * 101325, fromBase: v => v / 101325 },
      { label: 'PSI (lbf/in²)', toBase: v => v * 6894.76, fromBase: v => v / 6894.76 },
      { label: 'KSI (kip/in²)', toBase: v => v * 6894760, fromBase: v => v / 6894760 },
      { label: 'mmHg (Torr)', toBase: v => v * 133.322, fromBase: v => v / 133.322 },
      { label: 'inHg', toBase: v => v * 3386.39, fromBase: v => v / 3386.39 },
    ],
  },
  {
    name: 'Energy',
    icon: '⚡',
    baseUnit: 'J',
    units: [
      { label: 'Joule (J)', toBase: v => v, fromBase: v => v },
      { label: 'Kilojoule (kJ)', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { label: 'Megajoule (MJ)', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
      { label: 'Calorie (cal)', toBase: v => v * 4.18400, fromBase: v => v / 4.18400 },
      { label: 'Kilocalorie (kcal)', toBase: v => v * 4184, fromBase: v => v / 4184 },
      { label: 'BTU', toBase: v => v * 1055.06, fromBase: v => v / 1055.06 },
      { label: 'kWh', toBase: v => v * 3.6e6, fromBase: v => v / 3.6e6 },
      { label: 'ft·lbf', toBase: v => v * 1.35582, fromBase: v => v / 1.35582 },
      { label: 'eV (electron-volt)', toBase: v => v * 1.60218e-19, fromBase: v => v / 1.60218e-19 },
    ],
  },
  {
    name: 'Power',
    icon: '💡',
    baseUnit: 'W',
    units: [
      { label: 'Watt (W)', toBase: v => v, fromBase: v => v },
      { label: 'Kilowatt (kW)', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { label: 'Megawatt (MW)', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
      { label: 'Horsepower (hp)', toBase: v => v * 745.700, fromBase: v => v / 745.700 },
      { label: 'Metric hp (PS)', toBase: v => v * 735.499, fromBase: v => v / 735.499 },
      { label: 'BTU/hr', toBase: v => v * 0.29307107, fromBase: v => v / 0.29307107 },
      { label: 'ft·lbf/s', toBase: v => v * 1.35582, fromBase: v => v / 1.35582 },
    ],
  },
  {
    name: 'Length',
    icon: '📏',
    baseUnit: 'm',
    units: [
      { label: 'Millimeter (mm)', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { label: 'Centimeter (cm)', toBase: v => v / 100, fromBase: v => v * 100 },
      { label: 'Meter (m)', toBase: v => v, fromBase: v => v },
      { label: 'Kilometer (km)', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { label: 'Inch (in)', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
      { label: 'Foot (ft)', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
      { label: 'Yard (yd)', toBase: v => v * 0.9144, fromBase: v => v / 0.9144 },
      { label: 'Mile (mi)', toBase: v => v * 1609.344, fromBase: v => v / 1609.344 },
      { label: 'Micrometer (µm)', toBase: v => v * 1e-6, fromBase: v => v * 1e6 },
    ],
  },
  {
    name: 'Mass',
    icon: '⚖️',
    baseUnit: 'kg',
    units: [
      { label: 'Gram (g)', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { label: 'Kilogram (kg)', toBase: v => v, fromBase: v => v },
      { label: 'Metric ton (t)', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { label: 'Pound-mass (lbm)', toBase: v => v * 0.453592, fromBase: v => v / 0.453592 },
      { label: 'Ounce (oz)', toBase: v => v * 0.0283495, fromBase: v => v / 0.0283495 },
      { label: 'Slug', toBase: v => v * 14.5939, fromBase: v => v / 14.5939 },
      { label: 'Short ton (US)', toBase: v => v * 907.185, fromBase: v => v / 907.185 },
      { label: 'Long ton (UK)', toBase: v => v * 1016.05, fromBase: v => v / 1016.05 },
    ],
  },
  {
    name: 'Temperature',
    icon: '🌡️',
    baseUnit: '°C',
    units: [
      { label: 'Celsius (°C)', toBase: v => v, fromBase: v => v },
      { label: 'Fahrenheit (°F)', toBase: v => (v - 32) * 5 / 9, fromBase: v => v * 9 / 5 + 32 },
      { label: 'Kelvin (K)', toBase: v => v - 273.15, fromBase: v => v + 273.15 },
      { label: 'Rankine (°R)', toBase: v => (v - 491.67) * 5 / 9, fromBase: v => (v + 273.15) * 9 / 5 },
    ],
  },
  {
    name: 'Torque',
    icon: '🔩',
    baseUnit: 'N·m',
    units: [
      { label: 'Newton-meter (N·m)', toBase: v => v, fromBase: v => v },
      { label: 'Kilonewton-meter (kN·m)', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { label: 'Pound-force·foot (lbf·ft)', toBase: v => v * 1.35582, fromBase: v => v / 1.35582 },
      { label: 'Pound-force·inch (lbf·in)', toBase: v => v * 0.11298, fromBase: v => v / 0.11298 },
      { label: 'Kilogram-force·meter (kgf·m)', toBase: v => v * 9.80665, fromBase: v => v / 9.80665 },
      { label: 'oz·in', toBase: v => v * 0.00706155, fromBase: v => v / 0.00706155 },
    ],
  },
  {
    name: 'Velocity',
    icon: '🚀',
    baseUnit: 'm/s',
    units: [
      { label: 'Meters/second (m/s)', toBase: v => v, fromBase: v => v },
      { label: 'Kilometers/hour (km/h)', toBase: v => v / 3.6, fromBase: v => v * 3.6 },
      { label: 'Miles/hour (mph)', toBase: v => v * 0.44704, fromBase: v => v / 0.44704 },
      { label: 'Feet/second (ft/s)', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
      { label: 'Knot (kn)', toBase: v => v * 0.514444, fromBase: v => v / 0.514444 },
      { label: 'Mach (at sea level)', toBase: v => v * 340.29, fromBase: v => v / 340.29 },
    ],
  },
  {
    name: 'Area',
    icon: '◻️',
    baseUnit: 'm²',
    units: [
      { label: 'mm²', toBase: v => v * 1e-6, fromBase: v => v * 1e6 },
      { label: 'cm²', toBase: v => v * 1e-4, fromBase: v => v * 1e4 },
      { label: 'm²', toBase: v => v, fromBase: v => v },
      { label: 'in²', toBase: v => v * 6.4516e-4, fromBase: v => v / 6.4516e-4 },
      { label: 'ft²', toBase: v => v * 0.092903, fromBase: v => v / 0.092903 },
      { label: 'acre', toBase: v => v * 4046.86, fromBase: v => v / 4046.86 },
      { label: 'km²', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
    ],
  },
  {
    name: 'Volume',
    icon: '📦',
    baseUnit: 'm³',
    units: [
      { label: 'cm³ (mL)', toBase: v => v * 1e-6, fromBase: v => v * 1e6 },
      { label: 'Liter (L)', toBase: v => v * 1e-3, fromBase: v => v * 1e3 },
      { label: 'm³', toBase: v => v, fromBase: v => v },
      { label: 'in³', toBase: v => v * 1.6387e-5, fromBase: v => v / 1.6387e-5 },
      { label: 'ft³', toBase: v => v * 0.0283168, fromBase: v => v / 0.0283168 },
      { label: 'US gallon', toBase: v => v * 0.00378541, fromBase: v => v / 0.00378541 },
      { label: 'UK gallon', toBase: v => v * 0.00454609, fromBase: v => v / 0.00454609 },
      { label: 'US fluid oz', toBase: v => v * 2.9574e-5, fromBase: v => v / 2.9574e-5 },
    ],
  },
  {
    name: 'Stress (same as Pressure)',
    icon: '💪',
    baseUnit: 'Pa',
    units: [
      { label: 'Pascal (Pa)', toBase: v => v, fromBase: v => v },
      { label: 'Kilopascal (kPa)', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { label: 'Megapascal (MPa)', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
      { label: 'Gigapascal (GPa)', toBase: v => v * 1e9, fromBase: v => v / 1e9 },
      { label: 'PSI', toBase: v => v * 6894.76, fromBase: v => v / 6894.76 },
      { label: 'KSI', toBase: v => v * 6894760, fromBase: v => v / 6894760 },
      { label: 'kgf/cm²', toBase: v => v * 98066.5, fromBase: v => v / 98066.5 },
    ],
  },
]

function formatNum(n: number): string {
  if (!isFinite(n)) return '—'
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 1e9 || (abs < 0.001 && abs > 0)) {
    return n.toExponential(6).replace(/\.?0+e/, 'e')
  }
  const str = n.toPrecision(8)
  const parsed = parseFloat(str)
  return parsed.toString()
}

export default function UnitConverterPage() {
  const [activeCat, setActiveCat] = useState(0)
  const [fromIdx, setFromIdx] = useState(0)
  const [toIdx, setToIdx] = useState(1)
  const [inputVal, setInputVal] = useState('1')

  const cat = CATEGORIES[activeCat]

  const result = useMemo(() => {
    const v = parseFloat(inputVal)
    if (isNaN(v)) return null
    const base = cat.units[fromIdx].toBase(v)
    return cat.units[toIdx].fromBase(base)
  }, [inputVal, activeCat, fromIdx, toIdx])

  const allResults = useMemo(() => {
    const v = parseFloat(inputVal)
    if (isNaN(v)) return []
    const base = cat.units[fromIdx].toBase(v)
    return cat.units.map(u => ({ label: u.label, value: u.fromBase(base) }))
  }, [inputVal, activeCat, fromIdx])

  function handleCatChange(idx: number) {
    setActiveCat(idx)
    setFromIdx(0)
    setToIdx(Math.min(1, CATEGORIES[idx].units.length - 1))
    setInputVal('1')
  }

  function swap() {
    const tmp = fromIdx
    setFromIdx(toIdx)
    setToIdx(tmp)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Unit Converter</h1>
        <p className="text-gray-400 text-sm mt-1">Engineering-specific unit conversions</p>
      </div>

      {/* Category tabs — scrollable */}
      <div className="overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-2 w-max">
          {CATEGORIES.map((c, i) => (
            <button
              key={c.name}
              onClick={() => handleCatChange(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeCat === i ? 'text-blue-300' : 'text-gray-400 hover:text-gray-200'
              }`}
              style={activeCat === i ? {
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.3)',
              } : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span>{c.icon}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Converter card */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-white">{cat.icon} {cat.name}</h2>

        {/* From / To selectors */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">From</label>
            <select
              value={fromIdx}
              onChange={e => setFromIdx(Number(e.target.value))}
              className="w-full input-base text-sm"
            >
              {cat.units.map((u, i) => (
                <option key={u.label} value={i}>{u.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={swap}
            className="mb-0.5 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            title="Swap units"
          >
            ⇌
          </button>

          <div>
            <label className="block text-xs text-gray-400 mb-1">To</label>
            <select
              value={toIdx}
              onChange={e => setToIdx(Number(e.target.value))}
              className="w-full input-base text-sm"
            >
              {cat.units.map((u, i) => (
                <option key={u.label} value={i}>{u.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Input and result */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <input
            type="number"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            className="input-base text-lg font-mono"
            placeholder="Enter value"
          />
          <span className="text-gray-500 text-lg">=</span>
          <div
            className="rounded-xl px-4 py-3 font-mono text-lg font-semibold text-blue-300"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            {result !== null ? formatNum(result) : '—'}
          </div>
        </div>

        {/* Unit labels */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 -mt-2">
          <p className="text-xs text-gray-500 text-center">{cat.units[fromIdx].label}</p>
          <div />
          <p className="text-xs text-gray-500 text-center">{cat.units[toIdx].label}</p>
        </div>
      </div>

      {/* All conversions table */}
      {allResults.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-3">
            All {cat.name} conversions for {inputVal || '0'} {cat.units[fromIdx].label}
          </h3>
          <div className="space-y-2">
            {allResults.map((r, i) => (
              <div
                key={r.label}
                className={`flex items-center justify-between py-2 px-3 rounded-xl text-sm transition-all ${
                  i === fromIdx ? 'text-blue-300' : 'text-gray-300'
                }`}
                style={{
                  background: i === fromIdx ? 'rgba(59,130,246,0.08)' : i === toIdx ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: i === fromIdx ? '1px solid rgba(59,130,246,0.2)' : i === toIdx ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                }}
              >
                <span className="text-gray-400">{r.label}</span>
                <span className="font-mono font-medium">{formatNum(r.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
