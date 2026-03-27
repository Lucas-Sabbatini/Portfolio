import { useState, useEffect } from 'react'
import type { Skill } from '../../api/content'
import { fetchSkills, createSkill, updateSkill, deleteSkill } from '../../api/content'

const emptyForm = { name: '', category: '', icon: '', sort_order: 0 }

function SkillForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<Skill, 'id'>
  onSave: (data: Omit<Skill, 'id'>) => void
  onCancel?: () => void
}) {
  const [name, setName] = useState(initial.name)
  const [category, setCategory] = useState(initial.category)
  const [icon, setIcon] = useState(initial.icon ?? '')
  const [sortOrder, setSortOrder] = useState(String(initial.sort_order))

  return (
    <div className="space-y-3 p-6 glass-card rounded-[1.5rem]">
      {[
        { label: 'Name', value: name, set: setName },
        { label: 'Category', value: category, set: setCategory },
        { label: 'Icon', value: icon, set: setIcon },
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
      <div className="flex gap-3">
        <button
          onClick={() => onSave({ name, category, icon: icon || undefined, sort_order: Number(sortOrder) })}
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

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSkills().then(setSkills).catch((err) => setError(err.message))
  }, [])

  const handleUpdate = async (id: string, data: Omit<Skill, 'id'>) => {
    try {
      const updated = await updateSkill(id, data)
      setSkills(prev => prev.map(s => s.id === id ? updated : s))
      setEditing(null)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    }
  }

  const handleCreate = async (data: Omit<Skill, 'id'>) => {
    try {
      const created = await createSkill(data)
      setSkills(prev => [...prev, created])
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    try {
      await deleteSkill(id)
      setSkills(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-headline font-extrabold text-3xl tracking-tighter">Skills</h1>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="space-y-3">
        {skills.map(skill => (
          <div key={skill.id}>
            {editing === skill.id ? (
              <SkillForm
                initial={skill}
                onSave={(data) => handleUpdate(skill.id, data)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div
                className="glass-card rounded-[1.5rem] p-5 flex items-center gap-6 cursor-pointer"
                onClick={() => setEditing(skill.id)}
              >
                <span className="text-xl">{skill.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-on-surface">{skill.name}</p>
                  <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">{skill.category}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(skill.id, skill.name) }}
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
        <h2 className="font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Add Skill</h2>
        <SkillForm initial={emptyForm} onSave={handleCreate} />
      </div>
    </div>
  )
}
