import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import type { LLMConfig } from '../lib/llmService'
import { useAuth } from '../contexts/AuthContext'
import AccountPanel from './AccountPanel'

interface Props {
  children: React.ReactNode
  config: LLMConfig
}

const NAV_ITEMS = [
  { path: '/',           label: 'Home',       icon: '🏠' },
  { path: '/analyzer',   label: 'Analyzer',   icon: '🔬' },
  { path: '/flashcards', label: 'Flashcards', icon: '🃏' },
  { path: '/tutor',      label: 'AI Tutor',   icon: '🤖' },
  { path: '/quiz',       label: 'Quiz',       icon: '📝' },
  { path: '/upload',     label: 'Upload',     icon: '📎' },
]

export default function Layout({ children, config }: Props) {
  const { user, settings } = useAuth()
  const [showAccount, setShowAccount] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const initial = (user?.email?.[0] ?? '?').toUpperCase()

  return (
    <div className="min-h-screen flex flex-col">

      {/* Top Nav — frosted glass */}
      <header
        className="sticky top-0 z-20 border-b"
        style={{
          background: 'rgba(6, 12, 24, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
              style={{
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
              }}
            >
              <span className="text-base leading-none">⚙️</span>
            </div>
            <span className="text-base font-bold text-white tracking-tight">MechStudy</span>
            <span
              className="badge text-xs hidden sm:inline-flex"
              style={{
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
                color: '#93c5fd',
              }}
            >
              Beta
            </span>
          </NavLink>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'
                  }`
                }
                style={({ isActive }) => isActive ? {
                  background: 'rgba(59,130,246,0.12)',
                  border: '1px solid rgba(59,130,246,0.22)',
                } : {
                  border: '1px solid transparent',
                }}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Mode badge */}
            <span
              className={`badge hidden sm:inline-flex text-xs ${
                settings?.llm_mode === 'mock'
                  ? 'bg-purple-500/10 text-purple-300'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
              style={{
                border: `1px solid ${settings?.llm_mode === 'mock' ? 'rgba(168,85,247,0.2)' : 'rgba(52,211,153,0.2)'}`,
              }}
            >
              {(settings?.llm_mode ?? 'api').toUpperCase()}
            </span>

            {/* Account button */}
            <button
              onClick={() => setShowAccount(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                boxShadow: '0 0 12px rgba(59,130,246,0.4)',
              }}
              title={user?.email ?? 'Account'}
            >
              {initial}
            </button>

            {/* Mobile menu button */}
            <button
              className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg transition-colors"
              style={{ background: mobileMenuOpen ? 'rgba(255,255,255,0.08)' : undefined }}
              onClick={() => setMobileMenuOpen(s => !s)}
            >
              <span className="text-lg leading-none">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden border-t px-4 py-3 grid grid-cols-3 gap-2"
            style={{
              background: 'rgba(6,12,24,0.97)',
              borderColor: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-xs font-medium transition-all ${
                    isActive ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'
                  }`
                }
                style={({ isActive }) => isActive ? {
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                } : {
                  border: '1px solid transparent',
                }}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Bottom Nav for Mobile */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 border-t z-20"
        style={{
          background: 'rgba(6,12,24,0.95)',
          borderColor: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
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
      <footer
        className="hidden lg:block py-4 text-center text-xs text-gray-600 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        MechStudy — Engineering Study Platform · Built with Groq AI
      </footer>

      {showAccount && (
        <AccountPanel onClose={() => setShowAccount(false)} />
      )}
    </div>
  )
}
