'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { initialChapters } from '@/data/chapters'
import { defaultConfig } from '@/data/config'
import type { Chapter, BookConfig } from '@/lib/types'

type Tab = 'message' | 'chapters'

interface AvailablePhoto { name: string; url: string }

export default function BuilderPage() {
  const router = useRouter()
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const [config, setConfig] = useState<BookConfig>(defaultConfig)
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('chapters')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [availablePhotos, setAvailablePhotos] = useState<AvailablePhoto[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')

  useEffect(() => {
    if (sessionStorage.getItem('auth') !== 'builder') { router.push('/'); return }
    Promise.all([
      fetch('/api/chapters').then(r => r.json()),
      fetch('/api/photos').then(r => r.json()),
    ]).then(([chData, phData]) => {
      if (chData.chapters?.length) setChapters(chData.chapters)
      if (chData.config) setConfig(chData.config)
      if (phData.photos) setAvailablePhotos(phData.photos)
    }).catch(() => {}).finally(() => setLoaded(true))
  }, [router])

  const selectedChapter = chapters.find(c => c.id === selected)

  function updateChapter(id: string, updates: Partial<Chapter>) {
    setChapters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  function addChapter() {
    const newCh: Chapter = {
      id: `ch-${Date.now()}`,
      title: 'New chapter',
      date: '',
      notes: '',
      photos: [],
    }
    setChapters(prev => [...prev, newCh])
    setSelected(newCh.id)
    setTab('chapters')
    setTimeout(() => {
      document.getElementById('chapter-title-input')?.focus()
    }, 100)
  }

  function deleteChapter(id: string) {
    if (!window.confirm('Delete this chapter? This cannot be undone.')) return
    setChapters(prev => prev.filter(c => c.id !== id))
    if (selected === id) setSelected(null)
  }

  function moveChapter(id: string, dir: 'up' | 'down') {
    setChapters(prev => {
      const idx = prev.findIndex(c => c.id === id)
      if (dir === 'up' && idx === 0) return prev
      if (dir === 'down' && idx === prev.length - 1) return prev
      const next = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  function togglePhoto(url: string) {
    if (!selected) return
    const ch = chapters.find(c => c.id === selected)
    if (!ch) return
    const photos = ch.photos ?? []
    const exists = photos.some(p => p.url === url)
    if (exists) {
      updateChapter(selected, { photos: photos.filter(p => p.url !== url) })
    } else {
      if (photos.length >= 5) return
      updateChapter(selected, { photos: [...photos, { url }] })
    }
  }

  function removePhoto(chapterId: string, idx: number) {
    setChapters(prev => prev.map(c =>
      c.id !== chapterId ? c : { ...c, photos: (c.photos ?? []).filter((_, i) => i !== idx) }
    ))
  }

  function updateCaption(chapterId: string, idx: number, caption: string) {
    setChapters(prev => prev.map(c => {
      if (c.id !== chapterId) return c
      const photos = [...(c.photos ?? [])]
      photos[idx] = { ...photos[idx], caption }
      return { ...c, photos }
    }))
  }

  const save = useCallback(async () => {
    setSaving(true)
    try {
      await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters, config }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }, [chapters, config])

  const filtered = chapters.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  )

  const filteredPhotos = availablePhotos.filter(p =>
    !pickerSearch || p.name.toLowerCase().includes(pickerSearch.toLowerCase())
  )

  const assignedUrls = new Set((selectedChapter?.photos ?? []).map(p => p.url))

  if (!loaded) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="text-muted text-sm font-sans tracking-widest">Loading builder...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="border-b border-dust bg-white flex items-center justify-between px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-muted text-xs tracking-widest hover:text-ink transition-colors">← EXIT</button>
          <div className="w-px h-4 bg-dust" />
          <h1 className="font-sans text-sm font-medium text-ink">{chapters.length} chapters · {availablePhotos.length} photos available</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { sessionStorage.setItem('auth', 'book'); window.open('/book', '_blank') }}
            className="text-xs font-sans text-muted border border-dust px-4 py-2 hover:border-ink hover:text-ink transition-all"
          >Preview Book</button>
          <button
            onClick={save}
            disabled={saving}
            className={`text-xs font-sans px-5 py-2 transition-all ${saved ? 'bg-green-600 text-white' : 'bg-ink text-white hover:bg-ink/90'}`}
          >{saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Book'}</button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-80 border-r border-dust flex flex-col bg-white">
          <div className="flex border-b border-dust">
            {(['message', 'chapters'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-xs font-sans tracking-wide transition-colors ${tab === t ? 'text-ink border-b-2 border-ink' : 'text-muted hover:text-ink'}`}
              >{t === 'message' ? '✉ Message' : '📖 Chapters'}</button>
            ))}
          </div>

          {tab === 'message' ? (
            <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto">
              <div>
                <p className="text-xs font-sans tracking-[0.15em] uppercase text-muted mb-1">Dedication</p>
                <p className="text-xs text-muted/70 font-sans mb-2">First thing Ashley reads when she opens the book.</p>
                <textarea value={config.dedication}
                  onChange={e => setConfig(c => ({ ...c, dedication: e.target.value }))}
                  rows={16}
                  className="w-full font-sans text-xs text-ink bg-cream border border-dust px-3 py-2.5 resize-y leading-relaxed"
                />
              </div>
              <div>
                <p className="text-xs font-sans tracking-[0.15em] uppercase text-muted mb-1">Back cover</p>
                <textarea value={config.backMessage}
                  onChange={e => setConfig(c => ({ ...c, backMessage: e.target.value }))}
                  rows={4}
                  className="w-full font-sans text-xs text-ink bg-cream border border-dust px-3 py-2.5 resize-y leading-relaxed"
                />
              </div>
              <button onClick={save} disabled={saving}
                className="text-xs font-sans bg-ink text-white py-2.5 hover:bg-ink/90 transition-all disabled:opacity-50">
                {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-dust">
                <input type="text" placeholder="Search chapters..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full text-xs font-sans py-2 px-3 border border-dust bg-cream placeholder-muted text-ink"
                />
              </div>
              <div className="overflow-y-auto flex-1">
                {filtered.map((ch, i) => {
                  const pc = (ch.photos ?? []).length
                  const isSelected = selected === ch.id
                  return (
                    <div key={ch.id} className={`group border-b border-dust/50 transition-colors ${isSelected ? 'bg-ink' : 'hover:bg-cream'}`}>
                      <div className="flex items-center">
                        <button onClick={() => setSelected(ch.id)} className="flex-1 text-left px-4 py-3">
                          <div className="flex items-start gap-3">
                            <span className={`text-xs mt-0.5 shrink-0 tabular-nums ${isSelected ? 'text-white/50' : 'text-muted'}`}>
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-sans leading-snug line-clamp-2 ${isSelected ? 'text-white' : 'text-ink'}`}>{ch.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {ch.date && <span className={`text-xs ${isSelected ? 'text-white/40' : 'text-muted'}`}>{ch.date}</span>}
                                {pc > 0 && <span className={`text-xs ${isSelected ? 'text-white/40' : 'text-green-600'}`}>· {pc} ✓</span>}
                              </div>
                            </div>
                          </div>
                        </button>
                        {/* Reorder + delete — show on hover */}
                        <div className={`flex flex-col gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}>
                          <button onClick={() => moveChapter(ch.id, 'up')} title="Move up"
                            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${isSelected ? 'text-white/60 hover:text-white' : 'text-muted hover:text-ink'}`}>↑</button>
                          <button onClick={() => moveChapter(ch.id, 'down')} title="Move down"
                            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${isSelected ? 'text-white/60 hover:text-white' : 'text-muted hover:text-ink'}`}>↓</button>
                          <button onClick={() => deleteChapter(ch.id)} title="Delete"
                            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${isSelected ? 'text-red-300 hover:text-red-200' : 'text-muted hover:text-red-400'}`}>×</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Add chapter */}
              <div className="p-3 border-t border-dust">
                <button onClick={addChapter}
                  className="w-full text-xs font-sans text-muted border border-dashed border-dust py-2.5 hover:border-ink hover:text-ink transition-all">
                  + Add Chapter
                </button>
              </div>
            </>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'message' ? (
            <div className="h-full flex items-center justify-center text-center px-12">
              <div className="max-w-sm">
                <p className="text-3xl mb-4">✉️</p>
                <p className="text-ink font-sans text-sm font-medium mb-2">Edit your dedication</p>
                <p className="text-muted text-xs font-sans leading-relaxed">Your message is the first thing Ashley sees when she opens the book. Edit it in the panel on the left.</p>
              </div>
            </div>
          ) : !selectedChapter ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <p className="text-muted text-sm font-sans">← Select a chapter to edit</p>
              <p className="text-muted/50 text-xs font-sans">or click "+ Add Chapter" to create a new one</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto py-10 px-8">
              <div className="flex items-center gap-3 mb-8">
                <span className="text-muted text-xs font-sans tracking-[0.25em]">
                  CHAPTER {String(chapters.findIndex(c => c.id === selected) + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 h-px bg-dust" />
                <button onClick={() => deleteChapter(selected!)}
                  className="text-xs text-muted hover:text-red-400 transition-colors font-sans">Delete chapter</button>
              </div>

              {/* Title */}
              <div className="mb-5">
                <label className="text-xs font-sans tracking-[0.15em] uppercase text-muted block mb-2">Title</label>
                <textarea id="chapter-title-input"
                  value={selectedChapter.title}
                  onChange={e => updateChapter(selected!, { title: e.target.value })}
                  rows={2}
                  className="w-full font-serif text-xl text-ink bg-white border border-dust px-4 py-3 resize-none leading-snug"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                />
              </div>

              {/* Date */}
              <div className="mb-5">
                <label className="text-xs font-sans tracking-[0.15em] uppercase text-muted block mb-2">Date</label>
                <input type="text" value={selectedChapter.date}
                  onChange={e => updateChapter(selected!, { date: e.target.value })}
                  placeholder="e.g. April 20, 2025"
                  className="w-full font-sans text-sm text-ink bg-white border border-dust px-4 py-3"
                />
              </div>

              {/* Notes */}
              <div className="mb-8">
                <label className="text-xs font-sans tracking-[0.15em] uppercase text-muted block mb-2">Notes / Memory</label>
                <textarea value={selectedChapter.notes}
                  onChange={e => updateChapter(selected!, { notes: e.target.value })}
                  rows={5} placeholder="Write your memory here..."
                  className="w-full font-sans text-sm text-ink bg-white border border-dust px-4 py-3 resize-y leading-relaxed"
                />
              </div>

              {/* Photos assigned */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-sans tracking-[0.15em] uppercase text-muted">
                    Assigned photos ({(selectedChapter.photos ?? []).length} / 5)
                  </label>
                  <button onClick={() => setShowPicker(p => !p)}
                    className="text-xs font-sans text-white bg-ink px-4 py-2 hover:bg-ink/90 transition-all">
                    {showPicker ? 'Close picker' : '+ Pick photos'}
                  </button>
                </div>

                {(selectedChapter.photos ?? []).length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {(selectedChapter.photos ?? []).map((photo, i) => (
                      <div key={i} className="group relative">
                        <div className="aspect-square bg-dust overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <button onClick={() => removePhoto(selected!, i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                        <input type="text" value={photo.caption ?? ''}
                          onChange={e => updateCaption(selected!, i, e.target.value)}
                          placeholder="Caption..."
                          className="w-full mt-1 text-xs font-sans border border-dust px-2 py-1 bg-cream text-ink"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-dust py-8 flex items-center justify-center mb-4">
                    <p className="text-muted text-xs font-sans">No photos assigned yet — click "+ Pick photos"</p>
                  </div>
                )}

                {/* Photo picker */}
                {showPicker && (
                  <div className="border border-dust bg-white p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-sans font-medium text-ink">
                        {availablePhotos.length === 0
                          ? 'No photos found in /public/photos/'
                          : `${availablePhotos.length} photos available — click to assign`}
                      </p>
                      <input type="text" placeholder="Search..." value={pickerSearch}
                        onChange={e => setPickerSearch(e.target.value)}
                        className="text-xs font-sans border border-dust px-2 py-1 bg-cream w-32"
                      />
                    </div>

                    {availablePhotos.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-muted text-xs font-sans leading-relaxed">
                          Drop your photos into the <code className="bg-cream px-1">/public/photos/</code> folder,<br />
                          push to GitHub, then refresh this page.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto">
                        {filteredPhotos.map(photo => {
                          const isAssigned = assignedUrls.has(photo.url)
                          const isFull = (selectedChapter.photos ?? []).length >= 5 && !isAssigned
                          return (
                            <button key={photo.name}
                              onClick={() => !isFull && togglePhoto(photo.url)}
                              disabled={isFull}
                              className={`relative aspect-square overflow-hidden border-2 transition-all ${
                                isAssigned ? 'border-green-500' : 'border-transparent hover:border-stone-300'
                              } ${isFull ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                              {isAssigned && (
                                <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                                <p className="text-white text-xs truncate" style={{ fontSize: 9 }}>{photo.name}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-dust flex items-center justify-between">
                <p className="text-xs text-muted font-sans">Changes go live for Ashley when you click Save Book.</p>
                <button onClick={save} disabled={saving}
                  className="text-xs font-sans bg-ink text-white px-5 py-2 hover:bg-ink/90 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Book'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
