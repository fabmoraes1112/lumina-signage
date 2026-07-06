import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
export async function GET() {
  const { data, error, count } = await supabase
    .from('midias')
    .select('*', { count: 'exact' })
    .limit(3)
  return NextResponse.json({ data, error, count, url: process.env.NEXT_PUBLIC_SUPABASE_URL })
}
