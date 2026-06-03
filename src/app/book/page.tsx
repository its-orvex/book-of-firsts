'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { initialChapters } from '@/data/chapters'
import { defaultConfig } from '@/data/config'
import type { Chapter, BookConfig } from '@/lib/types'

const COVER_COLOR = '#0D1B2A'
const GOLD = '#C8A96E'
const GOLD_DIM = 'rgba(200,169,110,0.3)'

export default function BookPage() {
  const router = useRouter()
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const [config, setConfig] = useState<BookConfig>(defaultConfig)
  const [spread, setSpread] = useState(0)
  const [visible, setVisible] = useState(true)
  const [dir, setDir] = useState<'next'|'prev'>('next')
  const [loaded, setLoaded] = useState(false)
  const touchStartX = useRef(0)

  // spreads: 0=front cover, 1=inside front+title, 2..n+1=chapters, n+2=back cover
  const totalSpreads = chapters.length + 3

  useEffect(() => {
    const auth = sessionStorage.getItem('auth')
    if (auth !== 'book' && auth !== 'builder') { router.push('/'); return }
    fetch('/api/chapters')
      .then(r => r.json())
      .then(d => {
        if (d.chapters?.length) setChapters(d.chapters)
        if (d.config) setConfig(d.config)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [router])

  const navigate = useCallback((direction: 'next'|'prev') => {
    if (!visible) return
    if (direction === 'next' && spread >= totalSpreads - 1) return
    if (direction === 'prev' && spread <= 0) return
    setDir(direction)
    setVisible(false)
    setTimeout(() => {
      setSpread(s => direction === 'next' ? s + 1 : s - 1)
      setVisible(true)
    }, 300)
  }, [visible, spread, totalSpreads])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate('next')
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') navigate('prev')
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [navigate])

  if (!loaded) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: COVER_COLOR }}>
      <p style={{ color: GOLD }} className="text-sm tracking-widest font-sans">Opening your book...</p>
    </div>
  )

  const isFrontCover = spread === 0
  const isInsideCover = spread === 1
  const isBackCover = spread === totalSpreads - 1
  const chapterIdx = spread >= 2 && spread <= chapters.length + 1 ? spread - 2 : -1
  const chapter = chapterIdx >= 0 ? chapters[chapterIdx] : null
  const pageNum = spread > 1 && !isBackCover ? spread - 1 : null

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center select-none"
      style={{ background: '#0A1520' }}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const dx = touchStartX.current - e.changedTouches[0].clientX
        if (Math.abs(dx) > 50) navigate(dx > 0 ? 'next' : 'prev')
      }}
    >
      {/* Top bar */}
      <div className="absolute top-5 left-0 right-0 flex items-center justify-between px-6">
        <button onClick={() => router.push('/')} className="text-stone-500 hover:text-stone-300 text-xs tracking-widest transition-colors font-sans">← EXIT</button>
        <p className="text-stone-600 text-xs font-sans tracking-widest">
          {spread === 0 ? 'COVER' : spread === 1 ? 'DEDICATION' : isBackCover ? 'THE END' : `${chapterIdx + 1} / ${chapters.length}`}
        </p>
      </div>

      {/* Book + arrows */}
      <div className="flex items-center gap-5 px-4 w-full max-w-5xl">

        {/* Left arrow */}
        <button
          onClick={() => navigate('prev')}
          disabled={spread === 0}
          aria-label="Previous page"
          className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-stone-500 border border-stone-700 hover:text-stone-200 hover:border-stone-500 disabled:opacity-0 transition-all duration-200 text-lg"
        >←</button>

        {/* Book */}
        <div
          className="flex-1 rounded-sm overflow-hidden"
          style={{
            height: 'min(600px, 78vh)',
            boxShadow: `0 50px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05), 4px 0 20px rgba(0,0,0,0.5)`,
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0) scale(1)' : `translateX(${dir === 'next' ? '-20px' : '20px'}) scale(0.99)`,
          }}
        >
          {isFrontCover || isBackCover ? (
            <FullCover
              isFront={isFrontCover}
              config={config}
              onOpen={isFrontCover ? () => navigate('next') : undefined}
              onClose={isBackCover ? () => navigate('prev') : undefined}
            />
          ) : (
            <div className="flex h-full">
              {/* Left page */}
              <div className="flex-1 flex flex-col relative overflow-hidden" style={{ background: '#FAF8F5', boxShadow: 'inset -6px 0 16px rgba(0,0,0,0.07)' }}>
                <LeftPage chapter={chapter} isInsideCover={isInsideCover} dedication={config.dedication} />
                {pageNum && <span className="absolute bottom-4 left-6 text-stone-300 text-xs font-sans">{pageNum * 2 - 1}</span>}
              </div>

              {/* Spine */}
              <div style={{ width: 26, flexShrink: 0, background: 'linear-gradient(to right, #BEB5A8, #E8E2DA, #F2EDE5, #E8E2DA, #BEB5A8)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.12)' }} />

              {/* Right page */}
              <div className="flex-1 flex flex-col relative overflow-hidden" style={{ background: '#F8F6F2', boxShadow: 'inset 4px 0 16px rgba(0,0,0,0.05)' }}>
                <RightPage chapter={chapter} isInsideCover={isInsideCover} />
                {pageNum && <span className="absolute bottom-4 right-6 text-stone-300 text-xs font-sans">{pageNum * 2}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => navigate('next')}
          disabled={spread >= totalSpreads - 1}
          aria-label="Next page"
          className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-stone-500 border border-stone-700 hover:text-stone-200 hover:border-stone-500 disabled:opacity-0 transition-all duration-200 text-lg"
        >→</button>
      </div>

      {/* Dots */}
      <div className="flex items-center gap-1.5 mt-7">
        {Array.from({ length: totalSpreads }).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (i === spread) return
              setDir(i > spread ? 'next' : 'prev')
              setVisible(false)
              setTimeout(() => { setSpread(i); setVisible(true) }, 300)
            }}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === spread ? 20 : 6,
              height: 6,
              background: i === spread ? '#4A5568' : '#1E2D3D',
            }}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Full cover (front & back) ───────────────────────────── */
function FullCover({ isFront, config, onOpen, onClose }: {
  isFront: boolean; config: BookConfig; onOpen?: () => void; onClose?: () => void
}) {
  return (
    <div
      className="w-full h-full flex"
      style={{ background: COVER_COLOR }}
    >
      {/* Left half */}
      <div
        className="flex-1 flex flex-col items-center justify-center relative"
        style={{
          borderRight: `1px solid ${GOLD_DIM}`,
          background: 'linear-gradient(135deg, #0D1B2A 0%, #111F2E 100%)',
        }}
      >
        {isFront ? (
          // Left side of front cover — decorative
          <div className="flex flex-col items-center gap-5 opacity-40">
            <div style={{ width: 1, height: 60, background: GOLD }} />
            <div style={{ width: 30, height: 1, background: GOLD }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD }} />
            <div style={{ width: 30, height: 1, background: GOLD }} />
            <div style={{ width: 1, height: 60, background: GOLD }} />
          </div>
        ) : (
          // Back cover
          <div className="flex flex-col items-center justify-center text-center px-12 gap-8">
            <div style={{ width: 1, height: 40, background: GOLD, opacity: 0.4 }} />
            <p
              className="font-serif italic leading-relaxed text-base"
              style={{ color: GOLD, fontFamily: 'var(--font-playfair)', opacity: 0.85 }}
            >
              "One year of firsts.<br />A lifetime to go."
            </p>
            <div style={{ width: 40, height: 1, background: GOLD, opacity: 0.4 }} />
            <p className="text-xs tracking-[0.3em] font-sans" style={{ color: GOLD, opacity: 0.5 }}>
              {config.backMessage.split('\n').filter(Boolean)[0]}
            </p>
            {onClose && (
              <button
                onClick={onClose}
                className="text-xs tracking-[0.2em] font-sans transition-opacity hover:opacity-100"
                style={{ color: GOLD, opacity: 0.4, borderBottom: `1px solid ${GOLD_DIM}`, paddingBottom: 2 }}
              >
                ← GO BACK
              </button>
            )}
          </div>
        )}
        {/* Corner ornament */}
        <div className="absolute top-5 left-5 opacity-20" style={{ color: GOLD }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M1 27V1h26" stroke={GOLD} strokeWidth="1"/>
          </svg>
        </div>
        <div className="absolute bottom-5 right-5 opacity-20 rotate-180" style={{ color: GOLD }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M1 27V1h26" stroke={GOLD} strokeWidth="1"/>
          </svg>
        </div>
      </div>

      {/* Spine */}
      <div style={{ width: 26, flexShrink: 0, background: `linear-gradient(to right, #091420, #0F2030, #091420)` }} />

      {/* Right half — main cover face */}
      <div
        className="flex-1 flex flex-col items-center justify-center relative p-12"
        style={{ background: 'linear-gradient(135deg, #111F2E 0%, #0D1B2A 100%)' }}
      >
        {/* Outer border */}
        <div
          className="absolute inset-5"
          style={{ border: `1px solid ${GOLD_DIM}` }}
        />
        {/* Inner border */}
        <div
          className="absolute inset-7"
          style={{ border: `1px solid rgba(200,169,110,0.12)` }}
        />

        {/* Corner ornaments */}
        {[['top-5 left-5', '0'], ['top-5 right-5', '90'], ['bottom-5 right-5', '180'], ['bottom-5 left-5', '270']].map(([pos, rot]) => (
          <div key={rot} className={`absolute ${pos} opacity-50`} style={{ transform: `rotate(${rot}deg)` }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M1 21V1h20" stroke={GOLD} strokeWidth="0.8"/>
            </svg>
          </div>
        ))}

        {/* Title content */}
        <div className="flex flex-col items-center text-center gap-0 z-10">
          <p className="text-xs tracking-[0.4em] font-sans mb-7" style={{ color: GOLD, opacity: 0.6 }}>
            A COLLECTION OF
          </p>

          <h1
            className="font-serif leading-tight"
            style={{ fontFamily: 'var(--font-playfair)', color: GOLD, fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '0.02em' }}
          >
            Our Book
          </h1>
          <h1
            className="font-serif italic font-normal"
            style={{ fontFamily: 'var(--font-playfair)', color: GOLD, fontSize: 'clamp(22px, 3vw, 34px)', opacity: 0.9 }}
          >
            of Firsts
          </h1>

          <div className="flex items-center gap-4 my-7">
            <div style={{ width: 30, height: 1, background: GOLD, opacity: 0.5 }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, opacity: 0.5 }} />
            <div style={{ width: 30, height: 1, background: GOLD, opacity: 0.5 }} />
          </div>

          <p className="font-serif italic text-base mb-1" style={{ fontFamily: 'var(--font-playfair)', color: GOLD, opacity: 0.75 }}>
            Ashley & Dilee
          </p>
          <p className="text-xs tracking-[0.25em] font-sans mt-3" style={{ color: GOLD, opacity: 0.45 }}>
            YEAR ONE
          </p>
          <p className="text-xs tracking-[0.2em] font-sans mt-1" style={{ color: GOLD, opacity: 0.35 }}>
            APRIL 2025 — APRIL 2026
          </p>

          {onOpen && (
            <button
              onClick={onOpen}
              className="mt-10 text-xs tracking-[0.3em] font-sans transition-all hover:opacity-100"
              style={{
                color: GOLD,
                opacity: 0.5,
                border: `1px solid ${GOLD_DIM}`,
                padding: '10px 28px',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
            >
              OPEN BOOK
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Left page ───────────────────────────────────────────── */
function LeftPage({ chapter, isInsideCover, dedication }: {
  chapter: Chapter | null; isInsideCover: boolean; dedication: string
}) {
  if (isInsideCover) return (
    <div className="flex-1 flex flex-col p-10 pt-12 overflow-y-auto">
      <p className="text-stone-300 text-xs font-sans tracking-[0.3em] mb-8">DEDICATION</p>
      <div className="flex-1">
        {dedication.split('\n\n').map((para, i) => (
          <p
            key={i}
            className={`font-serif leading-relaxed text-stone-600 mb-5 ${i === 0 ? 'text-xl italic' : 'text-sm'}`}
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {para}
          </p>
        ))}
      </div>
    </div>
  )

  if (!chapter) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 opacity-15">
        <div className="w-px h-14 bg-stone-400" />
        <div className="w-8 h-px bg-stone-400" />
        <div className="w-px h-14 bg-stone-400" />
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col p-10 pt-11 overflow-y-auto">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-5 h-px bg-stone-300" />
        <p className="text-stone-300 text-xs font-sans tracking-[0.3em]">
          {String(chapter.id).padStart(2, '0')}
        </p>
      </div>
      <h2
        className="font-serif text-2xl text-stone-800 leading-snug mb-3"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        {chapter.title}
      </h2>
      {chapter.date && (
        <p className="font-serif italic text-stone-400 text-sm mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>
          {chapter.date}
        </p>
      )}
      <div className="w-full h-px bg-stone-100 mb-6" />
      {chapter.notes && (
        <p className="text-stone-500 text-sm font-sans leading-relaxed">{chapter.notes}</p>
      )}
    </div>
  )
}

/* ── Right page ──────────────────────────────────────────── */
function RightPage({ chapter, isInsideCover }: { chapter: Chapter | null; isInsideCover: boolean }) {
  if (isInsideCover) return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
      <div className="w-px h-10 bg-stone-200 mb-8" />
      <h1 className="font-serif text-4xl text-stone-700 leading-tight mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
        Our Firsts
      </h1>
      <p className="font-serif italic text-stone-400 text-base mt-3" style={{ fontFamily: 'var(--font-playfair)' }}>Ashley & Dilee</p>
      <div className="w-8 h-px bg-stone-200 my-5" />
      <p className="text-stone-300 text-xs font-sans tracking-[0.25em]">YEAR ONE</p>
      <p className="text-stone-300 text-xs font-sans tracking-[0.15em] mt-1">APRIL 2025 — APRIL 2026</p>
      <div className="w-px h-10 bg-stone-200 mt-8" />
    </div>
  )

  if (!chapter) return null

  const photos = chapter.photos ?? []

  if (photos.length === 0) return (
    <div className="flex-1 flex items-center justify-center p-10">
      <div className="w-full h-full border border-dashed border-stone-150 rounded flex items-center justify-center">
        <p className="text-stone-300 text-xs font-sans italic">Photo coming soon</p>
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col p-5 gap-2.5 overflow-hidden">
      {photos.length === 1 && <PhotoCard photo={photos[0]} flex="1" />}
      {photos.length === 2 && <>
        <PhotoCard photo={photos[0]} flex="1" />
        <PhotoCard photo={photos[1]} flex="1" />
      </>}
      {photos.length === 3 && <>
        <PhotoCard photo={photos[0]} flex="1.5" />
        <div className="flex gap-2.5" style={{ flex: 1 }}>
          <PhotoCard photo={photos[1]} flex="1" />
          <PhotoCard photo={photos[2]} flex="1" />
        </div>
      </>}
      {photos.length === 4 && <>
        <div className="flex gap-2.5" style={{ flex: 1 }}>
          <PhotoCard photo={photos[0]} flex="1" />
          <PhotoCard photo={photos[1]} flex="1" />
        </div>
        <div className="flex gap-2.5" style={{ flex: 1 }}>
          <PhotoCard photo={photos[2]} flex="1" />
          <PhotoCard photo={photos[3]} flex="1" />
        </div>
      </>}
      {photos.length >= 5 && <>
        <PhotoCard photo={photos[0]} flex="1.6" />
        <div className="flex gap-2" style={{ flex: 1 }}>
          {photos.slice(1, 5).map((p, i) => <PhotoCard key={i} photo={p} flex="1" />)}
        </div>
      </>}
    </div>
  )
}

function PhotoCard({ photo, flex }: { photo: { url: string; caption?: string }; flex: string }) {
  return (
    <div className="overflow-hidden flex flex-col min-h-0" style={{ flex }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.caption || ''} className="w-full object-cover" style={{ flex: 1, minHeight: 0 }} />
      {photo.caption && (
        <p className="text-stone-400 text-xs font-sans italic mt-1 px-0.5 shrink-0">{photo.caption}</p>
      )}
    </div>
  )
}
