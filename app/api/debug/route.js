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
    .eq('loja', loja)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [], midias: data || [], count: data?.length })
}
