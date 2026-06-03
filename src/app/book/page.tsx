'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { initialChapters } from '@/data/chapters'
import { defaultConfig } from '@/data/config'
import type { Chapter, BookConfig } from '@/lib/types'

const COVER_COLOR = '#0D1B2A'
const GOLD = '#C8A96E'
const GOLD_DIM = 'rgba(200,169,110,0.3)'

type FlipState = 'idle' | 'folding' | 'holding' | 'unfolding'

export default function BookPage() {
  const router = useRouter()
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const [config, setConfig] = useState<BookConfig>(defaultConfig)
  const [spread, setSpread] = useState(0)
  const [flipState, setFlipState] = useState<FlipState>('idle')
  const [flipDir, setFlipDir] = useState<'next'|'prev'>('next')
  const [loaded, setLoaded] = useState(false)
  const touchStartX = useRef(0)
  const animating = flipState !== 'idle'

  const totalSpreads = chapters.length + 3 // cover + inside + chapters + back

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

  const navigate = useCallback((dir: 'next'|'prev') => {
    if (animating) return
    if (dir === 'next' && spread >= totalSpreads - 1) return
    if (dir === 'prev' && spread <= 0) return

    setFlipDir(dir)
    setFlipState('folding')

    setTimeout(() => {
      // Switch to holding (no transition, but content updates)
      setFlipState('holding')
      setSpread(s => dir === 'next' ? s + 1 : s - 1)
      // Two rAFs to ensure DOM renders holding state before unfolding
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFlipState('unfolding')
        })
      })
    }, 340)

    setTimeout(() => setFlipState('idle'), 700)
  }, [animating, spread, totalSpreads])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate('next')
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') navigate('prev')
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [navigate])

  // Compute transforms for the flipping page
  const flipTransform = (() => {
    if (flipState === 'idle') return 'rotateY(0deg)'
    if (flipState === 'folding') return flipDir === 'next' ? 'rotateY(-90deg)' : 'rotateY(90deg)'
    if (flipState === 'holding') return flipDir === 'next' ? 'rotateY(-90deg)' : 'rotateY(90deg)'
    return 'rotateY(0deg)' // unfolding
  })()

  const flipTransition = (() => {
    if (flipState === 'folding') return 'transform 0.34s ease-in'
    if (flipState === 'unfolding') return 'transform 0.34s ease-out'
    return 'none'
  })()

  if (!loaded) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#08131C' }}>
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
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: '#08131C', userSelect: 'none' }}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const dx = touchStartX.current - e.changedTouches[0].clientX
        if (Math.abs(dx) > 50) navigate(dx > 0 ? 'next' : 'prev')
      }}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5">
        <button onClick={() => router.push('/')}
          className="text-stone-600 hover:text-stone-300 text-xs tracking-widest transition-colors font-sans">
          ← EXIT
        </button>
        <p className="text-stone-600 text-xs font-sans tracking-widest">
          {isFrontCover ? 'COVER' : isInsideCover ? 'DEDICATION' : isBackCover ? 'THE END' : `${chapterIdx + 1} / ${chapters.length}`}
        </p>
      </div>

      {/* Book + arrows */}
      <div className="flex items-center gap-6 w-full px-6"
        style={{ height: 'calc(100vh - 100px)' }}>

        {/* Left arrow */}
        <button onClick={() => navigate('prev')} disabled={spread === 0 || animating}
          aria-label="Previous page"
          className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-200 text-lg"
          style={{
            borderColor: spread === 0 ? 'transparent' : '#2A3F52',
            color: spread === 0 ? 'transparent' : '#4A6070',
          }}
          onMouseEnter={e => { if (spread > 0) { (e.currentTarget as HTMLElement).style.borderColor = '#4A6070'; (e.currentTarget as HTMLElement).style.color = '#AAB8C2' } }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = spread === 0 ? 'transparent' : '#2A3F52'; (e.currentTarget as HTMLElement).style.color = spread === 0 ? 'transparent' : '#4A6070' }}
        >←</button>

        {/* Book */}
        <div className="flex-1 h-full"
          style={{
            boxShadow: '0 60px 120px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)',
            borderRadius: 2,
            overflow: 'hidden',
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
            <div className="flex h-full" style={{ perspective: '2400px' }}>
              {/* Left page */}
              <div
                className="flex-1 relative overflow-hidden"
                style={{
                  background: '#FAF8F5',
                  boxShadow: 'inset -8px 0 20px rgba(0,0,0,0.08)',
                  transformOrigin: 'right center',
                  transform: flipDir === 'prev' ? flipTransform : 'rotateY(0deg)',
                  transition: flipDir === 'prev' ? flipTransition : 'none',
                }}
              >
                <LeftPage chapter={chapter} isInsideCover={isInsideCover} dedication={config.dedication} />
                {pageNum && <span className="absolute bottom-5 left-7 text-stone-300 text-xs font-sans">{pageNum * 2 - 1}</span>}
                {/* Page curl shadow during next flip */}
                {flipState !== 'idle' && flipDir === 'next' && (
                  <div className="absolute inset-y-0 right-0 w-12 pointer-events-none"
                    style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.12), transparent)' }} />
                )}
              </div>

              {/* Spine */}
              <div style={{
                width: 28, flexShrink: 0,
                background: 'linear-gradient(to right, #C0B8AC, #E8E2DA, #F0EAE2, #E8E2DA, #C0B8AC)',
                boxShadow: 'inset 0 0 12px rgba(0,0,0,0.15)',
              }} />

              {/* Right page */}
              <div
                className="flex-1 relative overflow-hidden"
                style={{
                  background: '#F8F6F2',
                  boxShadow: 'inset 4px 0 16px rgba(0,0,0,0.06)',
                  transformOrigin: 'left center',
                  transform: flipDir === 'next' ? flipTransform : 'rotateY(0deg)',
                  transition: flipDir === 'next' ? flipTransition : 'none',
                }}
              >
                <RightPage chapter={chapter} isInsideCover={isInsideCover} />
                {pageNum && <span className="absolute bottom-5 right-7 text-stone-300 text-xs font-sans">{pageNum * 2}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Right arrow */}
        <button onClick={() => navigate('next')} disabled={spread >= totalSpreads - 1 || animating}
          aria-label="Next page"
          className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-200 text-lg"
          style={{
            borderColor: spread >= totalSpreads - 1 ? 'transparent' : '#2A3F52',
            color: spread >= totalSpreads - 1 ? 'transparent' : '#4A6070',
          }}
          onMouseEnter={e => { if (spread < totalSpreads - 1) { (e.currentTarget as HTMLElement).style.borderColor = '#4A6070'; (e.currentTarget as HTMLElement).style.color = '#AAB8C2' } }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = spread >= totalSpreads - 1 ? 'transparent' : '#2A3F52'; (e.currentTarget as HTMLElement).style.color = spread >= totalSpreads - 1 ? 'transparent' : '#4A6070' }}
        >→</button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-5 flex items-center gap-1.5">
        {Array.from({ length: totalSpreads }).map((_, i) => (
          <button key={i}
            onClick={() => {
              if (i === spread || animating) return
              setFlipDir(i > spread ? 'next' : 'prev')
              setFlipState('folding')
              setTimeout(() => {
                setFlipState('holding')
                setSpread(i)
                requestAnimationFrame(() => requestAnimationFrame(() => setFlipState('unfolding')))
              }, 340)
              setTimeout(() => setFlipState('idle'), 700)
            }}
            className="rounded-full transition-all duration-300"
            style={{ width: i === spread ? 20 : 5, height: 5, background: i === spread ? '#3A5068' : '#162130' }}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Full cover ─────────────────────────────────── */
function FullCover({ isFront, config, onOpen, onClose }: {
  isFront: boolean; config: BookConfig; onOpen?: () => void; onClose?: () => void
}) {
  return (
    <div className="w-full h-full flex" style={{ background: COVER_COLOR }}>
      {/* Left half */}
      <div className="flex-1 flex flex-col items-center justify-center relative"
        style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #111F2E 100%)', borderRight: `1px solid ${GOLD_DIM}` }}>
        {isFront ? (
          <div className="flex flex-col items-center gap-5 opacity-30">
            <div style={{ width: 1, height: 70, background: GOLD }} />
            <div style={{ width: 32, height: 1, background: GOLD }} />
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD }} />
            <div style={{ width: 32, height: 1, background: GOLD }} />
            <div style={{ width: 1, height: 70, background: GOLD }} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center px-12 gap-8">
            <div style={{ width: 1, height: 40, background: GOLD, opacity: 0.35 }} />
            <p className="font-serif italic leading-relaxed text-base"
              style={{ color: GOLD, fontFamily: 'var(--font-playfair)', opacity: 0.8 }}>
              "One year of firsts.<br />A lifetime to go."
            </p>
            <div style={{ width: 40, height: 1, background: GOLD, opacity: 0.35 }} />
            {onClose && (
              <button onClick={onClose}
                className="text-xs tracking-[0.2em] font-sans"
                style={{ color: GOLD, opacity: 0.4, borderBottom: `1px solid ${GOLD_DIM}`, paddingBottom: 2 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
              >← GO BACK</button>
            )}
          </div>
        )}
        <Ornament pos="top-5 left-5" rot={0} />
        <Ornament pos="bottom-5 right-5" rot={180} />
      </div>

      {/* Spine */}
      <div style={{ width: 28, flexShrink: 0, background: `linear-gradient(to right, #091420, #0F2030, #091420)` }} />

      {/* Right half — main cover */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-14"
        style={{ background: 'linear-gradient(135deg, #111F2E 0%, #0D1B2A 100%)' }}>
        <div className="absolute inset-6" style={{ border: `1px solid ${GOLD_DIM}` }} />
        <div className="absolute inset-9" style={{ border: `1px solid rgba(200,169,110,0.1)` }} />
        <Ornament pos="top-6 left-6" rot={0} />
        <Ornament pos="top-6 right-6" rot={90} />
        <Ornament pos="bottom-6 right-6" rot={180} />
        <Ornament pos="bottom-6 left-6" rot={270} />

        <div className="flex flex-col items-center text-center z-10">
          <p className="text-xs tracking-[0.4em] font-sans mb-8" style={{ color: GOLD, opacity: 0.55 }}>A COLLECTION OF</p>
          <h1 className="font-serif" style={{ fontFamily: 'var(--font-playfair)', color: GOLD, fontSize: 'clamp(32px, 4.5vw, 52px)' }}>
            Our Book
          </h1>
          <h1 className="font-serif italic font-normal" style={{ fontFamily: 'var(--font-playfair)', color: GOLD, fontSize: 'clamp(24px, 3.5vw, 40px)', opacity: 0.88 }}>
            of Firsts
          </h1>
          <div className="flex items-center gap-4 my-8">
            <div style={{ width: 36, height: 1, background: GOLD, opacity: 0.45 }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, opacity: 0.45 }} />
            <div style={{ width: 36, height: 1, background: GOLD, opacity: 0.45 }} />
          </div>
          <p className="font-serif italic" style={{ fontFamily: 'var(--font-playfair)', color: GOLD, opacity: 0.72, fontSize: 'clamp(14px, 1.8vw, 18px)' }}>
            Ashley & Dilee
          </p>
          <p className="text-xs tracking-[0.25em] font-sans mt-3" style={{ color: GOLD, opacity: 0.38 }}>YEAR ONE</p>

          {onOpen && (
            <button onClick={onOpen}
              className="mt-12 text-xs tracking-[0.3em] font-sans"
              style={{ color: GOLD, opacity: 0.45, border: `1px solid ${GOLD_DIM}`, padding: '12px 32px' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.95')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.45')}
            >OPEN BOOK</button>
          )}
        </div>
      </div>
    </div>
  )
}

function Ornament({ pos, rot }: { pos: string; rot: number }) {
  return (
    <div className={`absolute ${pos} opacity-40`} style={{ transform: `rotate(${rot}deg)` }}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M1 21V1h20" stroke={GOLD} strokeWidth="0.8" />
      </svg>
    </div>
  )
}

/* ── Left page ──────────────────────────────────── */
function LeftPage({ chapter, isInsideCover, dedication }: { chapter: Chapter | null; isInsideCover: boolean; dedication: string }) {
  if (isInsideCover) return (
    <div className="h-full flex flex-col p-10 pt-12 overflow-y-auto">
      <p className="text-stone-300 text-xs font-sans tracking-[0.3em] mb-8">DEDICATION</p>
      {dedication.split('\n\n').map((para, i) => (
        <p key={i}
          className={`font-serif leading-relaxed text-stone-600 mb-5 ${i === 0 ? 'text-xl italic' : 'text-sm'}`}
          style={{ fontFamily: 'var(--font-playfair)' }}>
          {para}
        </p>
      ))}
    </div>
  )
  if (!chapter) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 opacity-10">
        <div className="w-px h-16 bg-stone-400" />
        <div className="w-10 h-px bg-stone-400" />
        <div className="w-px h-16 bg-stone-400" />
      </div>
    </div>
  )
  return (
    <div className="h-full flex flex-col p-10 pt-12 overflow-y-auto">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-6 h-px bg-stone-300" />
        <p className="text-stone-300 text-xs font-sans tracking-[0.3em]">{String(chapter.id).padStart(2, '0')}</p>
      </div>
      <h2 className="font-serif text-stone-800 leading-snug mb-3" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(18px, 2.2vw, 26px)' }}>
        {chapter.title}
      </h2>
      {chapter.date && (
        <p className="font-serif italic text-stone-400 text-sm mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>{chapter.date}</p>
      )}
      <div className="w-full h-px bg-stone-100 mb-6" />
      {chapter.notes && <p className="text-stone-500 text-sm font-sans leading-relaxed">{chapter.notes}</p>}
    </div>
  )
}

/* ── Right page ─────────────────────────────────── */
function RightPage({ chapter, isInsideCover }: { chapter: Chapter | null; isInsideCover: boolean }) {
  if (isInsideCover) return (
    <div className="h-full flex flex-col items-center justify-center p-14 text-center">
      <div className="w-px h-10 bg-stone-200 mb-8" />
      <h1 className="font-serif text-stone-700 leading-tight mb-3" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 4vw, 44px)' }}>
        Our Firsts
      </h1>
      <p className="font-serif italic text-stone-400 text-base mt-2" style={{ fontFamily: 'var(--font-playfair)' }}>Ashley & Dilee</p>
      <div className="w-8 h-px bg-stone-200 my-5" />
      <p className="text-stone-300 text-xs font-sans tracking-[0.25em]">YEAR ONE</p>
      <div className="w-px h-10 bg-stone-200 mt-8" />
    </div>
  )
  if (!chapter) return null
  const photos = chapter.photos ?? []
  if (photos.length === 0) return (
    <div className="h-full flex items-center justify-center p-10">
      <div className="w-full h-full border border-dashed border-stone-100 rounded flex items-center justify-center">
        <p className="text-stone-300 text-xs font-sans italic">Photo coming soon</p>
      </div>
    </div>
  )
  return (
    <div className="h-full flex flex-col p-5 gap-2.5 overflow-hidden">
      {photos.length === 1 && <PhotoCard photo={photos[0]} style={{ flex: 1 }} />}
      {photos.length === 2 && <>{photos.map((p, i) => <PhotoCard key={i} photo={p} style={{ flex: 1 }} />)}</>}
      {photos.length === 3 && (
        <>
          <PhotoCard photo={photos[0]} style={{ flex: 1.5 }} />
          <div className="flex gap-2.5" style={{ flex: 1 }}>
            <PhotoCard photo={photos[1]} style={{ flex: 1 }} />
            <PhotoCard photo={photos[2]} style={{ flex: 1 }} />
          </div>
        </>
      )}
      {photos.length === 4 && (
        <>
          <div className="flex gap-2.5" style={{ flex: 1 }}><PhotoCard photo={photos[0]} style={{ flex: 1 }} /><PhotoCard photo={photos[1]} style={{ flex: 1 }} /></div>
          <div className="flex gap-2.5" style={{ flex: 1 }}><PhotoCard photo={photos[2]} style={{ flex: 1 }} /><PhotoCard photo={photos[3]} style={{ flex: 1 }} /></div>
        </>
      )}
      {photos.length >= 5 && (
        <>
          <PhotoCard photo={photos[0]} style={{ flex: 1.6 }} />
          <div className="flex gap-2" style={{ flex: 1 }}>{photos.slice(1, 5).map((p, i) => <PhotoCard key={i} photo={p} style={{ flex: 1 }} />)}</div>
        </>
      )}
    </div>
  )
}

function PhotoCard({ photo, style }: { photo: { url: string; caption?: string }; style: React.CSSProperties }) {
  return (
    <div className="overflow-hidden flex flex-col min-h-0" style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.caption || ''} className="w-full object-cover" style={{ flex: 1, minHeight: 0 }} />
      {photo.caption && <p className="text-stone-400 text-xs font-sans italic mt-1 px-0.5 shrink-0">{photo.caption}</p>}
    </div>
  )
}
