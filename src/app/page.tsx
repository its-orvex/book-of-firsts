'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const BOOK_PW = 'ashleyndileeforever'
const BUILDER_PW = 'dileeonly'

export default function Home() {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pw === BOOK_PW) {
      sessionStorage.setItem('auth', 'book')
      router.push('/book')
    } else if (pw === BUILDER_PW) {
      sessionStorage.setItem('auth', 'builder')
      router.push('/builder')
    } else {
      setError(true)
      setShaking(true)
      setPw('')
      setTimeout(() => setShaking(false), 500)
      setTimeout(() => setError(false), 3000)
    }
  }

  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        {/* Decorative lines */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-dust" />
          <span className="text-muted text-xs tracking-[0.25em] uppercase font-sans">Private</span>
          <div className="flex-1 h-px bg-dust" />
        </div>

        <h1
          className="font-serif text-5xl text-ink mb-2 leading-tight"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Our Book
          <br />
          <span className="italic font-normal text-4xl">of Firsts</span>
        </h1>

        <p className="text-muted text-sm font-sans mt-4 mb-12 tracking-wide">
          April 2025 — April 2026
        </p>

        <form onSubmit={handleSubmit}>
          <div
            className={`relative transition-transform duration-100 ${shaking ? 'animate-[shake_0.4s_ease]' : ''}`}
            style={shaking ? { animation: 'shake 0.4s ease' } : {}}
          >
            <input
              ref={inputRef}
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setError(false) }}
              placeholder="Enter password"
              className={`w-full bg-white border text-center font-sans text-sm tracking-widest py-4 px-6 rounded-none transition-colors duration-200 ${
                error
                  ? 'border-red-300 text-red-400 placeholder-red-200'
                  : 'border-dust text-ink placeholder-muted hover:border-muted'
              }`}
              style={{ letterSpacing: pw ? '0.35em' : '0.1em' }}
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs mt-3 font-sans fade-in">
              Incorrect password. Try again.
            </p>
          )}

          <button
            type="submit"
            className="mt-4 w-full bg-ink text-white font-sans text-sm tracking-[0.15em] py-4 hover:bg-ink/90 transition-colors duration-200"
          >
            ENTER
          </button>
        </form>

        <div className="flex items-center gap-4 mt-12">
          <div className="flex-1 h-px bg-dust" />
          <span className="text-dust text-xs">✦</span>
          <div className="flex-1 h-px bg-dust" />
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </main>
  )
}
