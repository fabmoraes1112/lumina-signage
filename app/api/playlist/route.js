import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// GET /api/playlist?loja=iuna
export async function GET(req) {
  const loja = new URL(req.url).searchParams.get('loja') || 'iuna'
  const { data, error } = await supabase
    .from('playlist')
    .select('*')
    .eq('loja', loja)
    .eq('ativo', true)
    .order('ordem')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ playlist: data })
}

// POST /api/playlist — salva playlist completa
export async function POST(req) {
  const { loja, playlist } = await req.json()
  if (!loja || !playlist) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  // Deleta playlist antiga e insere nova
  await supabase.from('playlist').delete().eq('loja', loja)
  const rows = playlist.map((p, i) => ({
    loja,
    tipo:    p.tipo || p.type,
    nome:    p.nome || p.name || '',
    dur_sec: p.dur_sec || p.durSec || 10,
    url:     p.url || '',
    path:    p.path || '',
    ordem:   i,
    ativo:   true,
  }))
  const { error } = await supabase.from('playlist').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
