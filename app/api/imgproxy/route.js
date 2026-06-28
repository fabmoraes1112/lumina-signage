import { NextResponse } from 'next/server'

export async function GET(req) {
  const url = new URL(req.url).searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.google.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) return NextResponse.json({ error: 'fetch failed' }, { status: 502 })

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
