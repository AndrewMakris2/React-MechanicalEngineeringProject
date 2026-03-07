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
  { path: '/',           label: 'Home',      icon: '🏠' },
  { path: '/analyzer',   label: 'Analyzer',  icon: '🔬' },
  { path: '/flashcards', label: 'Flashcards',icon: '🃏' },
  { path: '/tutor',      label: 'AI Tutor',  icon: '🤖' },
  { path: '/quiz',       label: 'Quiz',      icon: '📝' },
  { path: '/upload',     label: 'Upload',    icon: '📎' },
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
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <span className="text-lg font-bold text-white">MechStudy</span>
            <span className="badge bg-blue-900 text-blue-300 text-xs">Beta</span>
          </NavLink>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
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
              <span className={`badge ${config.mode === 'mock' ? 'bg-purple-900 text-purple-300' : 'bg-green-900 text-green-300'}`}>
                {config.mode.toUpperCase()}
              </span>
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-400 hover:text-white p-1"
              onClick={() => setMobileMenuOpen(s => !s)}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-gray-900 px-4 py-2">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full ${
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
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
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