import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    // Try to serve the trapstar.webp as favicon
    const imagePath = join(process.cwd(), 'public', 'trapstar.webp')
    const imageBuffer = await readFile(imagePath)
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    // If file doesn't exist, return 204 No Content
    return new NextResponse(null, { status: 204 })
  }
}

