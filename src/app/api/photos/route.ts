import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'public', 'photos')
    if (!fs.existsSync(dir)) return NextResponse.json({ photos: [] })
    const files = fs.readdirSync(dir)
      .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
      .sort()
      .map(name => ({ name, url: `/photos/${name}` }))
    return NextResponse.json({ photos: files })
  } catch {
    return NextResponse.json({ photos: [] })
  }
}
