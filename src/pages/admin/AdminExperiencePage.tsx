import { useState, useEffect } from 'react'
import type { ExperienceEntry } from '../../api/content'
import { fetchExperience, createExperience, updateExperience, deleteExperience } from '../../api/content'

const emptyForm = { role: '', company: '', period: '', description: [], sort_order: 0 }

function EntryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<ExperienceEntry, 'id'>
  onSave: (data: Omit<ExperienceEntry, 'id'>) => void
  onCancel?: () => void
}) {
  const [role, setRole] = useState(initial.role)
  const [company, setCompany] = useState(initial.company)
  const [period, setPeriod] = useState(initial.period)
  const [description, setDescription] = useState(initial.description.join('\n'))
  const [sortOrder, setSortOrder] = useState(String(initial.sort_order))

  return (
    <div className="space-y-3 p-6 glass-card rounded-[1.5rem]">
      {[
        { label: 'Role', value: role, set: setRole },
        { label: 'Company', value: company, set: setCompany },
        { label: 'Period', value: period, set: setPeriod },
        { label: 'Sort Order', value: sortOrder, set: setSortOrder },
      ].map(({ label, value, set }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-24">{label}</span>
          <input
            type="text"
            value={value}
            onChange={(e) => set(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      ))}
      <div className="flex items-start gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-24 mt-2">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="One bullet per line"
          className="flex-1 bg-white/5 border border-white/10 rounded-[1rem] px-4 py-2 text-sm outline-none focus:border-primary/40 transition-colors resize-none"
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onSave({ role, company, period, description: description.split('\n').filter(Boolean), sort_order: Number(sortOrder) })}
          className="bg-primary text-on-primary font-bold tracking-wider text-[10px] uppercase px-6 py-2 rounded-full"
        >
          Save
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full hover:text-primary transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminExperiencePage() {
  const [entries, setEntries] = useState<ExperienceEntry[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchExperience().then(setEntries).catch((err) => setError(err.message))
  }, [])

  const handleUpdate = async (id: string, data: Omit<ExperienceEntry, 'id'>) => {
    try {
      const updated = await updateExperience(id, data)
      setEntries(prev => prev.map(e => e.id === id ? updated : e))
      setEditing(null)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    }
  }

  const handleCreate = async (data: Omit<ExperienceEntry, 'id'>) => {
    try {
      const created = await createExperience(data)
      setEntries(prev => [...prev, created])
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    }
  }

  const handleDelete = async (id: string, role: string) => {
    if (!window.confirm(`Delete "${role}"?`)) return
    try {
      await deleteExperience(id)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-headline font-extrabold text-3xl tracking-tighter">Experience</h1>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="space-y-4">
        {entries.map(entry => (
          <div key={entry.id}>
            {editing === entry.id ? (
              <EntryForm
                initial={entry}
                onSave={(data) => handleUpdate(entry.id, data)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div
                className="glass-card rounded-[1.5rem] p-5 flex items-center gap-6 cursor-pointer"
                onClick={() => setEditing(entry.id)}
              >
                <div className="flex-1">
                  <p className="font-bold text-sm text-on-surface">{entry.role}</p>
                  <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">{entry.company} · {entry.period}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(entry.id, entry.role) }}
                  className="text-red-400 text-[10px] font-bold uppercase tracking-widest"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <h2 className="font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Add Entry</h2>
        <EntryForm initial={emptyForm} onSave={handleCreate} />
      </div>
    </div>
  )
}
