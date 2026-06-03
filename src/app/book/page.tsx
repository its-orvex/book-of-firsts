'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { initialChapters } from '@/data/chapters'
import type { Chapter } from '@/lib/types'

export default function BookPage() {
  const router = useRouter()
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const [current, setCurrent] = useState(-1) // -1 = cover
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [animating, setAnimating] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('auth') !== 'book' && sessionStorage.getItem('auth') !== 'builder') {
      router.push('/')
      return
    }
    fetch('/api/chapters')
      .then(r => r.json())
      .then(data => { if (data.chapters) setChapters(data.chapters) })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [router])

  const navigate = useCallback((dir: 'next' | 'prev') => {
    if (animating) return
    const max = chapters.length - 1
    if (dir === 'next' && current >= max) return
    if (dir === 'prev' && current <= -1) return
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setCurrent(c => dir === 'next' ? c + 1 : c - 1)
      setAnimating(false)
    }, 320)
  }, [animating, current, chapters.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate('next')
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') navigate('prev')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  if (!loaded) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-muted text-sm font-sans tracking-widest">Opening your book...</div>
      </div>
    )
  }

  const chapter = current >= 0 ? chapters[current] : null
  const progress = current >= 0 ? ((current + 1) / chapters.length) * 100 : 0

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-dust">
        <button
          onClick={() => router.push('/')}
          className="text-muted text-xs tracking-widest font-sans hover:text-ink transition-colors"
        >
          ← BACK
        </button>
        <div className="text-muted text-xs font-sans tracking-[0.2em]">
          {current === -1 ? 'COVER' : `${current + 1} / ${chapters.length}`}
        </div>
        <div className="w-16 h-px bg-dust relative">
          <div
            className="absolute top-0 left-0 h-full bg-ink transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Page */}
      <div
        className={`flex-1 flex items-center justify-center px-4 py-8 transition-opacity duration-300 ${animating ? 'opacity-0' : 'opacity-100'}`}
      >
        {current === -1 ? (
          <CoverPage onStart={() => navigate('next')} />
        ) : chapter ? (
          <ChapterPage chapter={chapter} index={current} total={chapters.length} />
        ) : null}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-6 border-t border-dust">
        <button
          onClick={() => navigate('prev')}
          disabled={current <= -1 || animating}
          className="group flex items-center gap-2 text-sm font-sans tracking-wide text-muted hover:text-ink disabled:opacity-20 transition-all duration-200"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          <span>{current === 0 ? 'Cover' : 'Previous'}</span>
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5 max-w-xs overflow-hidden">
          {[-1, ...chapters.map((_, i) => i)].slice(
            Math.max(0, current - 3),
            Math.min(chapters.length, current + 4)
          ).map((i) => (
            <button
              key={i}
              onClick={() => {
                if (i === current) return
                setDirection(i > current ? 'next' : 'prev')
                setAnimating(true)
                setTimeout(() => { setCurrent(i); setAnimating(false) }, 320)
              }}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-4 h-1.5 bg-ink' : 'w-1.5 h-1.5 bg-dust hover:bg-muted'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => navigate('next')}
          disabled={current >= chapters.length - 1 || animating}
          className="group flex items-center gap-2 text-sm font-sans tracking-wide text-muted hover:text-ink disabled:opacity-20 transition-all duration-200"
        >
          <span>{current === -1 ? 'Begin' : 'Next'}</span>
          <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
        </button>
      </div>
    </div>
  )
}

function CoverPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center max-w-lg mx-auto page-enter">
      <div className="inline-block border border-dust px-16 py-20">
        <p className="text-muted text-xs tracking-[0.35em] uppercase font-sans mb-8">A collection of</p>
        <h1
          className="font-serif text-6xl text-ink leading-tight mb-3"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Our Firsts
        </h1>
        <div className="w-12 h-px bg-ink mx-auto my-6" />
        <p
          className="font-serif text-xl italic text-muted mb-1"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Dilee & Ashley
        </p>
        <p className="text-muted text-xs font-sans tracking-[0.2em] mt-4">
          APRIL 2025 — APRIL 2026
        </p>
        <button
          onClick={onStart}
          className="mt-12 text-xs tracking-[0.3em] uppercase font-sans text-ink border border-ink px-8 py-3 hover:bg-ink hover:text-white transition-all duration-300"
        >
          Open Book
        </button>
      </div>
    </div>
  )
}

function ChapterPage({ chapter, index, total }: { chapter: Chapter; index: number; total: number }) {
  const photos = chapter.photos ?? []
  const hasPhotos = photos.length > 0

  return (
    <div className="w-full max-w-2xl mx-auto page-enter">
      {/* Chapter number */}
      <div className="flex items-center gap-4 mb-8">
        <span className="text-muted text-xs font-sans tracking-[0.3em]">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <div className="flex-1 h-px bg-dust" />
      </div>

      {/* Photo grid */}
      {hasPhotos && (
        <div className={`mb-8 ${
          photos.length === 1 ? '' :
          photos.length === 2 ? 'grid grid-cols-2 gap-2' :
          'grid grid-cols-2 gap-2'
        }`}>
          {photos.map((photo, i) => (
            <div
              key={i}
              className={`overflow-hidden bg-dust ${
                photos.length === 3 && i === 0 ? 'col-span-2' : ''
              }`}
              style={{ aspectRatio: photos.length === 1 ? '16/10' : photos.length === 3 && i === 0 ? '16/9' : '4/3' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption || chapter.title}
                className="w-full h-full object-cover"
              />
              {photo.caption && (
                <p className="text-xs text-muted font-sans mt-1 italic px-1">{photo.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No photos placeholder */}
      {!hasPhotos && (
        <div
          className="mb-8 bg-dust/40 border border-dust flex items-center justify-center"
          style={{ aspectRatio: '16/9' }}
        >
          <p className="text-muted text-sm font-sans italic">Photo coming soon</p>
        </div>
      )}

      {/* Content */}
      <div>
        <h2
          className="font-serif text-3xl text-ink leading-snug mb-3"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {chapter.title}
        </h2>

        {chapter.date && (
          <p
            className="font-serif text-sm italic text-muted mb-5"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {chapter.date}
          </p>
        )}

        {chapter.notes && (
          <p className="text-ink/80 text-sm font-sans leading-relaxed">
            {chapter.notes}
          </p>
        )}
      </div>
    </div>
  )
}
