import { NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'
import { initialChapters } from '@/data/chapters'
import { defaultConfig } from '@/data/config'
import type { BookData } from '@/lib/types'

const BLOB_KEY = 'chapters-data.json'

export async function GET() {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY })
    if (blobs.length === 0) {
      return NextResponse.json({ chapters: initialChapters, config: defaultConfig, lastUpdated: new Date().toISOString() })
    }
    const res = await fetch(blobs[0].url)
    const data = await res.json()
    // Backfill config if missing from older saves
    if (!data.config) data.config = defaultConfig
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ chapters: initialChapters, config: defaultConfig, lastUpdated: new Date().toISOString() })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data: BookData = { ...body, lastUpdated: new Date().toISOString() }
    await put(BLOB_KEY, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    } as Parameters<typeof put>[2])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
