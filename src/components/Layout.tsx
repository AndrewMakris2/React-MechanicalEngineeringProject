import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { LLMConfig } from '../lib/llmService'
import SettingsPanel from './SettingsPanel'

interface Props {
  children: React.ReactNode
  config: LLMConfig
  onConfigChange: (c: LLMConfig) => void
}

const NAV_ITEMS = [
  { path: '/',           label: 'Home',       icon: '🏠' },
  { path: '/analyzer',   label: 'Analyzer',   icon: '🔬' },
  { path: '/flashcards', label: 'Flashcards', icon: '🃏' },
  { path: '/tutor',      label: 'AI Tutor',   icon: '🤖' },
  { path: '/quiz',       label: 'Quiz',       icon: '📝' },
  { path: '/upload',     label: 'Upload',     icon: '📎' },
]

export default function Layout({ children, config, onConfigChange }: Props) {
  const [showSettings, setShowSettings] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Top Nav */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl">⚙️</span>
            <span className="text-lg font-bold text-white">MechStudy</span>
            <span className="badge bg-blue-900 text-blue-300 text-xs hidden sm:inline-flex">Beta</span>
          </NavLink>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="btn-secondary text-xs flex items-center gap-1"
            >
              ⚙️
              <span className={`badge hidden sm:inline-flex ${config.mode === 'mock' ? 'bg-purple-900 text-purple-300' : 'bg-green-900 text-green-300'}`}>
                {config.mode.toUpperCase()}
              </span>
            </button>

            {/* Mobile menu button */}
            <button
              className="lg:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
              onClick={() => setMobileMenuOpen(s => !s)}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-800 bg-gray-900 px-4 py-3 grid grid-cols-3 gap-2">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Bottom Nav for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-20">
        <div className="grid grid-cols-6 h-14">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  isActive ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 pb-20 lg:pb-6">
        {children}
      </main>

      {/* Footer - desktop only */}
      <footer className="hidden lg:block border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        MechStudy — Engineering Study Platform · Built with Groq AI
      </footer>

      {showSettings && (
        <SettingsPanel
          config={config}
          onChange={onConfigChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}