import React, { useState, useEffect, useMemo } from 'react'

interface Note {
  id: string
  title: string
  body: string
  subject: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

const SUBJECTS = ['General', 'Statics', 'Dynamics', 'Thermodynamics', 'Fluids', 'Mechanics of Materials', 'Machine Design', 'Other']

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  General: { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
  Statics: { bg: 'rgba(59,130,246,0.1)', text: '#93c5fd', border: 'rgba(59,130,246,0.2)' },
  Dynamics: { bg: 'rgba(168,85,247,0.1)', text: '#d8b4fe', border: 'rgba(168,85,247,0.2)' },
  Thermodynamics: { bg: 'rgba(249,115,22,0.1)', text: '#fdba74', border: 'rgba(249,115,22,0.2)' },
  Fluids: { bg: 'rgba(6,182,212,0.1)', text: '#67e8f9', border: 'rgba(6,182,212,0.2)' },
  'Mechanics of Materials': { bg: 'rgba(234,179,8,0.1)', text: '#fde047', border: 'rgba(234,179,8,0.2)' },
  'Machine Design': { bg: 'rgba(236,72,153,0.1)', text: '#f9a8d4', border: 'rgba(236,72,153,0.2)' },
  Other: { bg: 'rgba(107,114,128,0.1)', text: '#9ca3af', border: 'rgba(107,114,128,0.2)' },
}

const STORAGE_KEY = 'concept_notes_v1'

function loadNotes(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

function newId() {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export default function ConceptNotesPage() {
  const [notes, setNotes] = useState<Note[]>(loadNotes)
  const [search, setSearch] = useState('')
  const [filterSubject, setFilterSubject] = useState('All')
  const [editing, setEditing] = useState<Note | null>(null)
  const [isNew, setIsNew] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formBody, setFormBody] = useState('')
  const [formSubject, setFormSubject] = useState('General')
  const [formTags, setFormTags] = useState('')

  useEffect(() => {
    saveNotes(notes)
  }, [notes])

  const filtered = useMemo(() => {
    return notes.filter(n => {
      if (filterSubject !== 'All' && n.subject !== filterSubject) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.tags.some(t => t.toLowerCase().includes(q))
        )
      }
      return true
    }).sort((a, b) => b.updatedAt - a.updatedAt)
  }, [notes, search, filterSubject])

  function openNew() {
    setFormTitle('')
    setFormBody('')
    setFormSubject('General')
    setFormTags('')
    setEditing(null)
    setIsNew(true)
  }

  function openEdit(note: Note) {
    setFormTitle(note.title)
    setFormBody(note.body)
    setFormSubject(note.subject)
    setFormTags(note.tags.join(', '))
    setEditing(note)
    setIsNew(false)
  }

  function handleSave() {
    if (!formTitle.trim()) return
    const tags = formTags.split(',').map(t => t.trim()).filter(Boolean)
    const now = Date.now()

    if (isNew) {
      const note: Note = {
        id: newId(),
        title: formTitle.trim(),
        body: formBody.trim(),
        subject: formSubject,
        tags,
        createdAt: now,
        updatedAt: now,
      }
      setNotes(prev => [note, ...prev])
    } else if (editing) {
      setNotes(prev => prev.map(n =>
        n.id === editing.id
          ? { ...n, title: formTitle.trim(), body: formBody.trim(), subject: formSubject, tags, updatedAt: now }
          : n
      ))
    }
    setIsNew(false)
    setEditing(null)
  }

  function handleDelete(id: string) {
    setNotes(prev => prev.filter(n => n.id !== id))
    if (editing?.id === id) setEditing(null)
  }

  function handleCancel() {
    setIsNew(false)
    setEditing(null)
  }

  const isEditorOpen = isNew || editing !== null

  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = { All: notes.length }
    notes.forEach(n => {
      counts[n.subject] = (counts[n.subject] ?? 0) + 1
    })
    return counts
  }, [notes])

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Concept Notes</h1>
          <p className="text-gray-400 text-sm mt-1">Your personal engineering study notes</p>
        </div>
        <button onClick={openNew} className="btn-primary px-4 py-2 text-sm shrink-0">
          + New Note
        </button>
      </div>

      {/* Editor */}
      {isEditorOpen && (
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-white">{isNew ? 'New Note' : 'Edit Note'}</h2>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Title *</label>
            <input
              type="text"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className="input-base"
              placeholder="e.g. Free Body Diagram Steps"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Subject</label>
            <select
              value={formSubject}
              onChange={e => setFormSubject(e.target.value)}
              className="input-base"
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea
              value={formBody}
              onChange={e => setFormBody(e.target.value)}
              className="input-base"
              rows={8}
              placeholder="Write your notes here. You can use plain text, bullet points, or equations..."
              style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formTags}
              onChange={e => setFormTags(e.target.value)}
              className="input-base"
              placeholder="e.g. equilibrium, FBD, moment"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!formTitle.trim()}
              className="btn-primary text-sm px-4 py-2"
            >
              {isNew ? 'Create Note' : 'Save Changes'}
            </button>
            <button onClick={handleCancel} className="btn-secondary text-sm px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-base flex-1"
        />
      </div>

      {/* Subject filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {['All', ...SUBJECTS].map(s => (
          <button
            key={s}
            onClick={() => setFilterSubject(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              filterSubject === s ? 'text-blue-300' : 'text-gray-400 hover:text-gray-200'
            }`}
            style={filterSubject === s ? {
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.3)',
            } : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {s}
            {subjectCounts[s] !== undefined && (
              <span className="text-gray-500 text-xs">({subjectCounts[s] ?? 0})</span>
            )}
          </button>
        ))}
      </div>

      {/* Notes grid */}
      {notes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-white font-medium mb-1">No notes yet</p>
          <p className="text-gray-400 text-sm">Click "New Note" to start building your study notes</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No notes match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(note => {
            const colors = SUBJECT_COLORS[note.subject] ?? SUBJECT_COLORS.Other
            const isEditingThis = editing?.id === note.id
            return (
              <div
                key={note.id}
                className="card flex flex-col gap-3 cursor-pointer hover:border-white/20 transition-all"
                style={isEditingThis ? { border: '1px solid rgba(59,130,246,0.4)' } : {}}
                onClick={() => !isEditingThis && openEdit(note)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white text-sm leading-snug flex-1">{note.title}</h3>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(note.id) }}
                    className="text-gray-600 hover:text-red-400 transition-colors text-xs shrink-0"
                    title="Delete note"
                  >
                    🗑
                  </button>
                </div>

                {note.body && (
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-4 whitespace-pre-line">
                    {note.body}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                  <span
                    className="px-2 py-0.5 rounded-lg text-xs font-medium"
                    style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                  >
                    {note.subject}
                  </span>
                  {note.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-lg text-xs text-gray-400"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      #{tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{note.tags.length - 3}</span>
                  )}
                </div>

                <p className="text-xs text-gray-600">
                  {note.updatedAt !== note.createdAt ? 'Updated ' : 'Created '}
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
