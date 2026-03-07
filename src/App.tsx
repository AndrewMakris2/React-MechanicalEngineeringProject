import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import AnalyzerPage from './pages/AnalyzerPage'
import FlashcardsPage from './pages/FlashcardsPage'
import TutorPage from './pages/TutorPage'
import QuizPage from './pages/QuizPage'
import UploadPage from './pages/UploadPage'
import { loadConfig } from './lib/llmService'
import type { LLMConfig } from './lib/llmService'
import { useState } from 'react'

export default function App() {
  const [config, setConfig] = useState<LLMConfig>(loadConfig)

  return (
    <Layout config={config} onConfigChange={setConfig}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/analyzer" element={<AnalyzerPage config={config} />} />
        <Route path="/flashcards" element={<FlashcardsPage config={config} />} />
        <Route path="/tutor" element={<TutorPage config={config} />} />
        <Route path="/quiz" element={<QuizPage config={config} />} />
        <Route path="/upload" element={<UploadPage config={config} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}