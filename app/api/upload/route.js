import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// POST /api/upload
export async function POST(req) {
  try {
    const form     = await req.formData()
    const file     = form.get('file')
    const loja     = form.get('loja') || 'iuna'
    const categoria = form.get('categoria') || 'Geral'

    if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })

    // Upload para Supabase Storage
    const ext  = file.name.split('.').pop().toLowerCase()
    const path = `${loja}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { data: storageData, error: storageError } = await supabase.storage
      .from('midias')
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (storageError) throw storageError

    // URL pública — sem CORS, funciona direto na TV
    const { data: { publicUrl } } = supabase.storage.from('midias').getPublicUrl(path)

    // Tipo de arquivo
    const tipo = file.type.startsWith('video') ? 'video' : 'imagem'

    // Registra no banco
    const { data: midiaData, error: dbError } = await supabase
      .from('midias')
      .insert({
        loja,
        nome:      file.name.replace(/\.[^.]+$/, ''),
        tipo,
        filename:  file.name,
        path,
        url:       publicUrl,
        categoria,
        tamanho:   file.size,
      })
      .select()
      .single()

    if (dbError) throw dbError

    return NextResponse.json({
      ok:  true,
      id:  midiaData.id,
      url: publicUrl,
      path,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
