import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import AnalyzerPage from './pages/AnalyzerPage'
import FlashcardsPage from './pages/FlashcardsPage'
import TutorPage from './pages/TutorPage'
import QuizPage from './pages/QuizPage'
import UploadPage from './pages/UploadPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import FormulaSheetPage from './pages/FormulaSheetPage'
import UnitConverterPage from './pages/UnitConverterPage'
import MaterialPropsPage from './pages/MaterialPropsPage'
import ConceptNotesPage from './pages/ConceptNotesPage'
import ProgressDashboardPage from './pages/ProgressDashboardPage'
import ProblemGeneratorPage from './pages/ProblemGeneratorPage'
import ExamSimulatorPage from './pages/ExamSimulatorPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import type { LLMConfig } from './lib/llmService'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <span className="inline-block w-8 h-8 border-2 border-blue-600/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user, settings, groqApiKey } = useAuth()

  const config: LLMConfig = {
    mode: settings?.llm_mode ?? 'api',
    endpointUrl: 'https://stalwart-shortbread-fff106.netlify.app/api/analyze',
    groqApiKey,
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout config={config}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/analyzer" element={<AnalyzerPage config={config} />} />
                <Route path="/flashcards" element={<FlashcardsPage config={config} />} />
                <Route path="/tutor" element={<TutorPage config={config} />} />
                <Route path="/quiz" element={<QuizPage config={config} />} />
                <Route path="/upload" element={<UploadPage config={config} />} />
                <Route path="/formulas" element={<FormulaSheetPage />} />
                <Route path="/converter" element={<UnitConverterPage />} />
                <Route path="/materials" element={<MaterialPropsPage />} />
                <Route path="/notes" element={<ConceptNotesPage />} />
                <Route path="/progress" element={<ProgressDashboardPage />} />
                <Route path="/generator" element={<ProblemGeneratorPage config={config} />} />
                <Route path="/exam" element={<ExamSimulatorPage config={config} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
