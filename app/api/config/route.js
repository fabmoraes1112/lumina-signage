import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// GET /api/config?loja=iuna
export async function GET(req) {
  const loja = new URL(req.url).searchParams.get('loja') || 'iuna'
  const { data, error } = await supabase
    .from('lojas').select('*').eq('id', loja).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ config: data })
}

// PUT /api/config — atualiza config da loja
export async function PUT(req) {
  const body = await req.json()
  const { loja, ...cfg } = body
  if (!loja) return NextResponse.json({ error: 'loja obrigatória' }, { status: 400 })
  const { error } = await supabase.from('lojas').update(cfg).eq('id', loja)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// POST /api/config — heartbeat da TV
export async function POST(req) {
  const { tv_id, loja, nome, modulo } = await req.json()
  if (!tv_id) return NextResponse.json({ error: 'tv_id obrigatório' }, { status: 400 })
  const { error } = await supabase.from('tvs').upsert({
    id: tv_id, loja: loja || 'iuna', nome: nome || 'TV',
    last_seen: new Date().toISOString(), modulo: modulo || '',
    updated_at: new Date().toISOString(),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
