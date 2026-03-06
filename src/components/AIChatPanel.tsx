import React, { useState, useRef, useEffect } from 'react'
import type { Result } from '../lib/schema'
import type { LLMConfig } from '../lib/llmService'
import { useAITutor } from '../hooks/useAITutor'

const STARTER_PROMPTS = [
  'Explain step 1 in more detail',
  'Give me a hint without solving it',
  'What is the most common mistake here?',
  'Explain the governing equation',
  'What if the values were different?',
  'Why do we make these assumptions?',
]

interface Props {
  result: Result | null
  config: LLMConfig
  isOpen: boolean
  onClose: () => void
}

export default function AIChatPanel({ result, config, isOpen, onClose }: Props) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { messages, loading, error, sendMessage, clearChat } = useAITutor(config, result)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  async function handleSend() {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    await sendMessage(text)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleStarterPrompt(prompt: string) {
    sendMessage(prompt)
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-full sm:w-96 bg-gray-900 border-l border-gray-700
        shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm">
              🤖
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI Tutor</h2>
              <p className="text-xs text-gray-400">
                {result ? `Helping with: ${result.detectedDomain}` : 'Ask me anything'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Context Banner */}
        {result && (
          <div className="px-4 py-2 bg-blue-900/30 border-b border-blue-800/50 shrink-0">
            <p className="text-xs text-blue-300">
              📋 Context: <span className="font-medium">{result.problemSummary.slice(0, 80)}...</span>
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  🤖
                </div>
                <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3 max-w-xs">
                  <p className="text-sm text-gray-200">
                    {result
                      ? `Hi! I can see you're working on a ${result.detectedDomain} problem. What would you like help with?`
                      : "Hi! I'm your AI engineering tutor. Analyze a problem first, or ask me any engineering question!"}
                  </p>
                </div>
              </div>

              {/* Starter prompts */}
              {result && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 text-center">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {STARTER_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleStarterPrompt(prompt)}
                        className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-400 text-gray-300 px-3 py-1.5 rounded-full transition-colors text-left"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat messages */}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                msg.role === 'user' ? 'bg-gray-600' : 'bg-blue-600'
              }`}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>

              {/* Bubble */}
              <div className={`max-w-xs space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-gray-800 text-gray-200 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
                <span className="text-xs text-gray-600 px-1">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs shrink-0">
                🤖
              </div>
              <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-xl px-3 py-2">
              <p className="text-xs text-red-300">🚨 {error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your tutor anything..."
              rows={1}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-100
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500
                         resize-none transition-colors"
              style={{ minHeight: '40px', maxHeight: '120px' }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 120) + 'px'
              }}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="btn-primary px-3 py-2 shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : '➤'}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">Enter to send, Shift+Enter for new line</p>
        </div>
      </div>
    </>
  )
}