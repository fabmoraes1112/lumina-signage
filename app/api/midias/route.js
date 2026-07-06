import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(req) {
  const loja = new URL(req.url).searchParams.get('loja') || 'iuna'
  const { data, error } = await supabase
    .from('midias')
    .select('*')
    .limit(200)
  const filtrado = (data || []).filter(m => m.loja === loja)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ midias: filtrado, total: data?.length, loja })
}

export async function DELETE(req) {
  const id   = new URL(req.url).searchParams.get('id')
  const path = new URL(req.url).searchParams.get('path')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  if (path) await supabase.storage.from('midias').remove([path])
  const { error } = await supabase.from('midias').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
