'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { initialChapters } from '@/data/chapters'
import type { Chapter, Photo } from '@/lib/types'

export default function BuilderPage() {
  const router = useRouter()
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')
  const urlRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (sessionStorage.getItem('auth') !== 'builder') {
      router.push('/')
      return
    }
    fetch('/api/chapters')
      .then(r => r.json())
      .then(data => { if (data.chapters) setChapters(data.chapters) })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [router])

  // Reset URL input when chapter changes
  useEffect(() => {
    setUrlInput('')
    setUrlError('')
  }, [selected])

  const selectedChapter = chapters.find(c => c.id === selected)

  function updateChapter(id: string, updates: Partial<Chapter>) {
    setChapters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  function updatePhoto(chapterId: string, photoIdx: number, updates: Partial<Photo>) {
    setChapters(prev => prev.map(c => {
      if (c.id !== chapterId) return c
      const photos = [...(c.photos ?? [])]
      photos[photoIdx] = { ...photos[photoIdx], ...updates }
      return { ...c, photos }
    }))
  }

  function removePhoto(chapterId: string, photoIdx: number) {
    setChapters(prev => prev.map(c => {
      if (c.id !== chapterId) return c
      return { ...c, photos: (c.photos ?? []).filter((_, i) => i !== photoIdx) }
    }))
  }

  function addPhotoUrl() {
    if (!selected || !urlInput.trim()) return
    const url = urlInput.trim()

    // Basic URL check
    if (!url.startsWith('http')) {
      setUrlError('Please paste a valid image URL starting with http')
      return
    }

    const currentPhotos = selectedChapter?.photos ?? []
    if (currentPhotos.length >= 5) {
      setUrlError('Maximum 5 photos per chapter')
      return
    }

    setChapters(prev => prev.map(c => {
      if (c.id !== selected) return c
      return { ...c, photos: [...(c.photos ?? []), { url, caption: '' }] }
    }))
    setUrlInput('')
    setUrlError('')
    urlRef.current?.focus()
  }

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const filtered = chapters.filter(c =>
    search === '' || c.title.toLowerCase().includes(search.toLowerCase())
  )

  if (!loaded) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-muted text-sm font-sans tracking-widest">Loading builder...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="border-b border-dust bg-white flex items-center justify-between px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-muted text-xs tracking-widest hover:text-ink transition-colors"
          >
            ← EXIT
          </button>
          <div className="w-px h-4 bg-dust" />
          <h1 className="font-sans text-sm font-medium text-ink tracking-wide">
            Book Builder — {chapters.length} chapters
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { sessionStorage.setItem('auth', 'book'); window.open('/book', '_blank') }}
            className="text-xs font-sans tracking-wide text-muted border border-dust px-4 py-2 hover:border-ink hover:text-ink transition-all duration-200"
          >
            Preview Book
          </button>
          <button
            onClick={save}
            disabled={saving}
            className={`text-xs font-sans tracking-wide px-5 py-2 transition-all duration-200 ${
              saved
                ? 'bg-green-600 text-white border border-green-600'
                : 'bg-ink text-white hover:bg-ink/90'
            }`}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Book'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: Chapter list */}
        <div className="w-80 border-r border-dust flex flex-col bg-white overflow-hidden">
          <div className="p-4 border-b border-dust">
            <input
              type="text"
              placeholder="Search chapters..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs font-sans py-2 px-3 border border-dust bg-cream placeholder-muted text-ink"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map((ch, i) => {
              const photoCount = (ch.photos ?? []).length
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelected(ch.id)}
                  className={`w-full text-left px-4 py-3.5 border-b border-dust/50 transition-colors duration-150 ${
                    selected === ch.id ? 'bg-ink text-white' : 'hover:bg-cream'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-xs mt-0.5 shrink-0 font-sans tabular-nums ${selected === ch.id ? 'text-white/50' : 'text-muted'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-sans leading-snug line-clamp-2 ${selected === ch.id ? 'text-white' : 'text-ink'}`}>
                        {ch.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {ch.date && (
                          <span className={`text-xs ${selected === ch.id ? 'text-white/40' : 'text-muted'}`}>
                            {ch.date}
                          </span>
                        )}
                        {photoCount > 0 && (
                          <span className={`text-xs ${selected === ch.id ? 'text-white/40' : 'text-green-600'}`}>
                            · {photoCount} photo{photoCount !== 1 ? 's' : ''} ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Editor */}
        <div className="flex-1 overflow-y-auto">
          {!selectedChapter ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
              <p className="text-muted text-sm font-sans">← Select a chapter to edit</p>
              <p className="text-muted/60 text-xs font-sans max-w-xs leading-relaxed">
                For each chapter, paste your Google Photos image URLs and add your notes.
              </p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto py-10 px-8">
              <div className="flex items-center gap-3 mb-8">
                <span className="text-muted text-xs font-sans tracking-[0.25em]">
                  CHAPTER {String(chapters.findIndex(c => c.id === selected) + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 h-px bg-dust" />
              </div>

              {/* Title */}
              <div className="mb-5">
                <label className="text-xs font-sans tracking-[0.15em] uppercase text-muted block mb-2">Title</label>
                <textarea
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
                <input
                  type="text"
                  value={selectedChapter.date}
                  onChange={e => updateChapter(selected!, { date: e.target.value })}
                  placeholder="e.g. April 20, 2025"
                  className="w-full font-sans text-sm text-ink bg-white border border-dust px-4 py-3"
                />
              </div>

              {/* Notes */}
              <div className="mb-8">
                <label className="text-xs font-sans tracking-[0.15em] uppercase text-muted block mb-2">Notes / Memory</label>
                <textarea
                  value={selectedChapter.notes}
                  onChange={e => updateChapter(selected!, { notes: e.target.value })}
                  rows={5}
                  placeholder="Write your memory here..."
                  className="w-full font-sans text-sm text-ink bg-white border border-dust px-4 py-3 resize-y leading-relaxed"
                />
              </div>

              {/* Photos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-sans tracking-[0.15em] uppercase text-muted">
                    Photos ({(selectedChapter.photos ?? []).length} / 5)
                  </label>
                </div>

                {/* How to get Google Photos URL */}
                <div className="bg-amber-50 border border-amber-200 rounded px-4 py-3 mb-4">
                  <p className="text-xs font-sans text-amber-800 leading-relaxed">
                    <strong>How to get a Google Photos URL:</strong> Open the photo in Google Photos on desktop → right-click the photo → <em>Open image in new tab</em> → copy the URL from the address bar.
                  </p>
                </div>

                {/* URL input */}
                {(selectedChapter.photos ?? []).length < 5 && (
                  <div className="flex gap-2 mb-4">
                    <input
                      ref={urlRef}
                      type="url"
                      value={urlInput}
                      onChange={e => { setUrlInput(e.target.value); setUrlError('') }}
                      onKeyDown={e => e.key === 'Enter' && addPhotoUrl()}
                      placeholder="Paste Google Photos image URL here..."
                      className="flex-1 font-sans text-xs text-ink bg-white border border-dust px-3 py-2.5 placeholder-muted"
                    />
                    <button
                      onClick={addPhotoUrl}
                      disabled={!urlInput.trim()}
                      className="text-xs font-sans tracking-wide text-white bg-ink px-4 py-2.5 hover:bg-ink/90 transition-all disabled:opacity-30 shrink-0"
                    >
                      Add
                    </button>
                  </div>
                )}

                {urlError && (
                  <p className="text-red-400 text-xs font-sans mb-3">{urlError}</p>
                )}

                {/* Photo grid */}
                {(selectedChapter.photos ?? []).length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {(selectedChapter.photos ?? []).map((photo, i) => (
                      <div key={i} className="group">
                        <div className="aspect-video bg-dust overflow-hidden relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={e => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                          <button
                            onClick={() => removePhoto(selected!, i)}
                            className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          type="text"
                          value={photo.caption ?? ''}
                          onChange={e => updatePhoto(selected!, i, { caption: e.target.value })}
                          placeholder="Caption (optional)"
                          className="w-full mt-1 text-xs font-sans border border-dust px-2 py-1.5 bg-cream text-ink"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-dust flex flex-col items-center justify-center py-10">
                    <p className="text-muted text-sm font-sans">No photos yet</p>
                    <p className="text-muted/60 text-xs font-sans mt-1">Paste a Google Photos URL above to add one</p>
                  </div>
                )}
              </div>

              {/* Save */}
              <div className="mt-12 pt-6 border-t border-dust flex items-center justify-between">
                <p className="text-xs text-muted font-sans">
                  Changes go live for Ashley when you click Save Book.
                </p>
                <button
                  onClick={save}
                  disabled={saving}
                  className="text-xs font-sans tracking-wide bg-ink text-white px-5 py-2 hover:bg-ink/90 transition-all disabled:opacity-50"
                >
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
