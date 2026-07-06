import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// GET /api/midias?loja=iuna
export async function GET(req) {
  const loja = new URL(req.url).searchParams.get('loja') || 'iuna'
  const { data, error } = await supabase
    .from('midias')
    .select('*')
    .eq('loja', loja)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ midias: data })
}

// DELETE /api/midias?id=uuid
export async function DELETE(req) {
  const id   = new URL(req.url).searchParams.get('id')
  const path = new URL(req.url).searchParams.get('path')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  // Remove do storage
  if (path) await supabase.storage.from('midias').remove([path])
  // Remove do banco
  const { error } = await supabase.from('midias').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
