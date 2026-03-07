import React, { useState, useRef, useEffect } from 'react'
import type { LLMConfig } from '../lib/llmService'
import { useAITutor } from '../hooks/useAITutor'
import { useProblemHistory } from '../hooks/useProblemHistory'
import type { Result } from '../lib/schema'

interface Props { config: LLMConfig }

const STARTER_PROMPTS = [
  'Explain Newton\'s Second Law with an example',
  'What is the difference between static and kinetic friction?',
  'How do I approach a statics problem from scratch?',
  'Explain Bernoulli\'s equation in simple terms',
  'What is the first law of thermodynamics?',
  'How do I set up a free body diagram?',
  'What is the difference between stress and strain?',
  'Explain conservation of energy',
]

export default function TutorPage({ config }: Props) {
  const [input, setInput] = useState('')
  const [selectedProblem, setSelectedProblem] = useState<Result | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { history } = useProblemHistory()
  const { messages, loading, error, sendMessage, clearChat } = useAITutor(config, selectedProblem)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🤖 AI Tutor</h1>
          <p className="text-xs text-gray-400 mt-0.5">Ask anything — your personal engineering professor</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="btn-secondary text-xs">
            🗑 Clear Chat
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">

          {/* Context selector */}
          <div className="card">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Problem Context</p>
            {history.length === 0 ? (
              <p className="text-xs text-gray-500">No problems analyzed yet. Go to the Analyzer first.</p>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedProblem(null)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                    !selectedProblem
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}
                >
                  🌐 General Mode
                </button>
                {history.slice(0, 5).map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedProblem(entry.result)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                      selectedProblem === entry.result
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    <span className="font-medium">{entry.result.detectedDomain}</span>
                    <p className="text-gray-500 line-clamp-1 mt-0.5">{entry.problemText.slice(0, 40)}...</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Starter prompts */}
          <div className="card">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Questions</p>
            <div className="space-y-1">
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 px-2 py-1.5 rounded transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-3 flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
          <div className="card flex-1 flex flex-col overflow-hidden p-0">

            {/* Context banner */}
            {selectedProblem && (
              <div className="px-4 py-2 bg-blue-900/30 border-b border-blue-800/50 shrink-0">
                <p className="text-xs text-blue-300">
                  📋 Context: <span className="font-medium">{selectedProblem.problemSummary.slice(0, 100)}...</span>
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-3">
                    <div className="text-5xl">🤖</div>
                    <p className="text-gray-400 text-sm font-medium">Hello! I am your AI Engineering Tutor.</p>
                    <p className="text-gray-500 text-xs max-w-xs">
                      {selectedProblem
                        ? 'I have context on your current problem. Ask me anything about it!'
                        : 'Select a problem from the sidebar for context, or ask me any engineering question!'}
                    </p>
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5 ${
                    msg.role === 'user' ? 'bg-gray-600' : 'bg-blue-600'
                  }`}>
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className={`max-w-lg space-y-1 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
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

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm shrink-0">🤖</div>
                  <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

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
                  className="flex-1 input-base resize-none"
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
                  className="btn-primary px-4 py-2 shrink-0"
                >
                  ➤
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">Enter to send · Shift+Enter for new line</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}