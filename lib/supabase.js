import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ── Upload de mídia para o Storage ──
export async function uploadMidia(file, loja) {
  const ext  = file.name.split('.').pop().toLowerCase()
  const path = `${loja}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage
    .from('midias')
    .upload(path, file, { upsert: false, contentType: file.type })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('midias').getPublicUrl(path)
  return { path: data.path, url: publicUrl }
}

// ── Deleta arquivo do Storage ──
export async function deleteMidiaStorage(path) {
  const { error } = await supabase.storage.from('midias').remove([path])
  if (error) throw error
}

// ── URL pública de uma mídia ──
export function getMidiaUrl(path) {
  const { data: { publicUrl } } = supabase.storage.from('midias').getPublicUrl(path)
  return publicUrl
}

// ── Realtime: inscreve em mudanças de playlist ──
export function subscribePlaylist(loja, callback) {
  return supabase
    .channel(`playlist_${loja}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'playlist',
      filter: `loja=eq.${loja}`,
    }, callback)
    .subscribe()
}
