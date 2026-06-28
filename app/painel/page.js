'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase, uploadMidia } from '../../lib/supabase'

const LOJAS = {
  iuna:  { nome: 'A Paulistana — Iúna',  cidade: 'Iúna, ES',  tv: '/tv/iuna'  },
  mutum: { nome: 'A Paulistana — Mutum', cidade: 'Mutum, MG', tv: '/tv/mutum' },
}
const MODULOS = {
  slides:    { nome: 'Slides institucionais', cor: '#22C55E', bg: 'rgba(34,197,94,.15)',    icone: '🖼️' },
  noticias:  { nome: 'Notícias de moda',      cor: '#EF4444', bg: 'rgba(239,68,68,.15)',   icone: '📰' },
  quiz:      { nome: 'Quiz cultural',          cor: '#a855f7', bg: 'rgba(168,85,247,.15)', icone: '🧠' },
  galeria:   { nome: 'Galeria de fotos',       cor: '#d2b36f', bg: 'rgba(210,179,111,.15)',icone: '📸' },
  clima:     { nome: 'Previsão do tempo',       cor: '#4F7EFF', bg: 'rgba(79,126,255,.15)', icone: '🌤️' },
  instagram: { nome: 'Instagram + QR Code',    cor: '#ec4899', bg: 'rgba(236,72,153,.15)', icone: '📱' },
  video:     { nome: 'Vídeo',                  cor: '#14b8a6', bg: 'rgba(20,184,166,.15)',  icone: '🎬' },
  imagem:    { nome: 'Imagem',                 cor: '#d2b36f', bg: 'rgba(210,179,111,.15)',icone: '🖼️' },
}

export default function Painel() {
  const [loja, setLoja]         = useState('iuna')
  const [pagina, setPagina]     = useState('overview')
  const [midias, setMidias]     = useState([])
  const [playlist, setPlaylist] = useState([])
  const [config, setConfig]     = useState({})
  const [tvs, setTvs]           = useState([])
  const [loading, setLoading]   = useState(false)
  const [toast, setToast]       = useState(null)
  const [drag, setDrag]         = useState(null)
  const fileRef = useRef()

  // ── Toast ──
  function showToast(msg, type = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Carrega dados da loja ──
  async function carregar(lojaId = loja) {
    setLoading(true)
    try {
      const [cfgRes, plRes, midRes, tvRes] = await Promise.all([
        fetch(`/api/config?loja=${lojaId}`).then(r => r.json()),
        fetch(`/api/playlist?loja=${lojaId}`).then(r => r.json()),
        fetch(`/api/midias?loja=${lojaId}`).then(r => r.json()),
        supabase.from('tvs').select('*').eq('loja', lojaId),
      ])
      if (cfgRes.config) setConfig(cfgRes.config)
      if (plRes.playlist) setPlaylist(plRes.playlist.map(p => ({
        ...p, tipo: p.tipo, nome: p.nome || MODULOS[p.tipo]?.nome || p.tipo,
        dur_sec: p.dur_sec || 10,
      })))
      if (midRes.midias) setMidias(midRes.midias)
      if (tvRes.data) setTvs(tvRes.data)
      showToast('Sincronizado com Supabase!', 'ok')
    } catch(e) {
      showToast('Erro ao carregar: ' + e.message, 'err')
    }
    setLoading(false)
  }

  useEffect(() => { carregar(loja) }, [loja])

  // ── Upload de mídia ──
  async function handleUpload(files, categoria = 'Geral') {
    if (!files || !files.length) return
    setLoading(true)
    let ok = 0
    for (const file of Array.from(files)) {
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('loja', loja)
        form.append('categoria', categoria)
        const res = await fetch('/api/upload', { method: 'POST', body: form }).then(r => r.json())
        if (res.ok) ok++
        else showToast('Erro: ' + res.error, 'err')
      } catch(e) { showToast('Erro no upload: ' + e.message, 'err') }
    }
    if (ok > 0) {
      showToast(`${ok} arquivo(s) enviado(s)!`, 'ok')
      carregar(loja)
    }
    setLoading(false)
  }

  // ── Deleta mídia ──
  async function deletarMidia(id, path) {
    if (!confirm('Excluir esta mídia?')) return
    const res = await fetch(`/api/midias?id=${id}&path=${path}`, { method: 'DELETE' }).then(r => r.json())
    if (res.ok) { showToast('Mídia excluída', 'warn'); carregar(loja) }
    else showToast('Erro: ' + res.error, 'err')
  }

  // ── Salva playlist ──
  async function salvarPlaylist() {
    setLoading(true)
    try {
      const res = await fetch('/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loja, playlist }),
      }).then(r => r.json())
      if (res.ok) showToast('Playlist publicada na TV!', 'ok')
      else showToast('Erro: ' + res.error, 'err')
    } catch(e) { showToast('Erro: ' + e.message, 'err') }
    setLoading(false)
  }

  // ── Adiciona módulo à playlist ──
  function addModulo(tipo) {
    const mod = MODULOS[tipo] || {}
    setPlaylist(prev => [...prev, {
      id: 'new_' + Date.now(), loja, tipo,
      nome: mod.nome || tipo, dur_sec: 10, url: '', ordem: prev.length,
    }])
  }

  // ── Remove da playlist ──
  function removeModulo(id) {
    setPlaylist(prev => prev.filter(p => p.id !== id))
  }

  // ── Drag & drop playlist ──
  function onDragStart(e, id) { setDrag(id); e.dataTransfer.effectAllowed = 'move' }
  function onDragOver(e, id) { e.preventDefault(); if (id !== drag) { /* highlight */ } }
  function onDrop(e, id) {
    e.preventDefault()
    if (drag === id) return
    setPlaylist(prev => {
      const arr = [...prev]
      const fi  = arr.findIndex(x => x.id === drag)
      const ti  = arr.findIndex(x => x.id === id)
      const [m] = arr.splice(fi, 1)
      arr.splice(ti, 0, m)
      return arr
    })
    setDrag(null)
  }

  // ── TV online? ──
  function tvOnline(tv) {
    if (!tv?.last_seen) return false
    return (Date.now() - new Date(tv.last_seen).getTime()) < 120000
  }

  const tvIuna = tvs.find(t => t.loja === loja)

  // ═══════════════════════════════
  // RENDER
  // ═══════════════════════════════
  return (
    <div style={S.app}>

      {/* SIDEBAR */}
      <aside style={S.sb}>
        <div style={S.sbHeader}>
          <div style={S.sbLogo}>L</div>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.3px' }}>Lumina<span style={{ color: '#4F7EFF' }}>.</span></div>
        </div>
        <div style={S.sbScroll}>
          {/* Seletor de loja */}
          <div style={{ padding: '12px 8px 4px', fontSize: 9, color: '#7A85A3', textTransform: 'uppercase', letterSpacing: '.1em' }}>Loja ativa</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 6px 10px' }}>
            {Object.entries(LOJAS).map(([k, v]) => (
              <button key={k} onClick={() => setLoja(k)} style={{
                ...S.lojaBtn, background: loja === k ? '#d2b36f' : 'transparent',
                color: loja === k ? '#0B0F1A' : '#7A85A3',
                borderColor: loja === k ? '#d2b36f' : '#2A3454',
                fontWeight: loja === k ? 700 : 400,
              }}>
                📍 {v.nome.split('—')[1]?.trim()}
              </button>
            ))}
          </div>
          {[
            ['overview', '🏠', 'Visão geral'],
            ['biblioteca', '📸', 'Biblioteca'],
            ['playlist', '▶️', 'Playlist'],
            ['configuracoes', '⚙️', 'Configurações'],
          ].map(([key, ic, label]) => (
            <div key={key} onClick={() => setPagina(key)} style={{
              ...S.sbItem, background: pagina === key ? 'rgba(79,126,255,.15)' : 'transparent',
              color: pagina === key ? '#4F7EFF' : '#7A85A3',
            }}>
              <span>{ic}</span><span>{label}</span>
            </div>
          ))}
        </div>
        <div style={S.sbFooter}>
          <div style={S.sbAvatar}>FW</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#F4F6FA' }}>FW Agência</div>
            <div style={{ fontSize: 10, color: '#7A85A3' }}>Administrador</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={S.main}>

        {/* TOPBAR */}
        <header style={S.topbar}>
          <div style={{ fontWeight: 800, fontSize: 17, fontFamily: 'system-ui', letterSpacing: '-.3px' }}>
            {{ overview: 'Visão geral', biblioteca: 'Biblioteca', playlist: 'Playlist da TV', configuracoes: 'Configurações' }[pagina]}
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
            {loading && <div style={{ fontSize: 12, color: '#7A85A3' }}>⏳ Carregando...</div>}
            <button onClick={() => carregar(loja)} style={S.btnGhost}>🔄 Sincronizar</button>
            <a href={LOJAS[loja].tv} target="_blank" style={S.btnGhost}>📺 Ver TV</a>
            {pagina === 'playlist' && (
              <button onClick={salvarPlaylist} style={S.btnPrimary}>💾 Publicar na TV</button>
            )}
            {pagina === 'biblioteca' && (
              <button onClick={() => fileRef.current?.click()} style={S.btnPrimary}>📤 Enviar mídia</button>
            )}
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*" style={{ display: 'none' }}
            onChange={e => handleUpload(e.target.files)} />
        </header>

        {/* CONTEÚDO */}
        <div style={S.content}>

          {/* ── OVERVIEW ── */}
          {pagina === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Métricas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                {[
                  { label: 'Mídias na biblioteca', val: midias.length, sub: 'fotos e vídeos', cor: '#4F7EFF' },
                  { label: 'Módulos na playlist',  val: playlist.length, sub: 'em loop', cor: '#d2b36f' },
                  { label: 'Status da TV',          val: tvIuna ? (tvOnline(tvIuna) ? 'Online' : 'Offline') : '—', sub: tvIuna?.last_seen ? 'visto: ' + new Date(tvIuna.last_seen).toLocaleTimeString('pt-BR') : 'nunca conectou', cor: tvIuna && tvOnline(tvIuna) ? '#22C55E' : '#EF4444' },
                ].map((m, i) => (
                  <div key={i} style={{ ...S.card, borderTop: `2px solid ${m.cor}` }}>
                    <div style={{ fontSize: 11, color: '#7A85A3', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{m.label}</div>
                    <div style={{ fontFamily: 'system-ui', fontSize: 32, fontWeight: 800, color: '#F4F6FA', lineHeight: 1 }}>{m.val}</div>
                    <div style={{ fontSize: 11, color: '#7A85A3', marginTop: 6 }}>{m.sub}</div>
                  </div>
                ))}
              </div>
              {/* Playlist resumo */}
              <div style={S.card}>
                <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 13 }}>Playlist atual — {LOJAS[loja].nome}</div>
                {playlist.length === 0
                  ? <div style={{ color: '#7A85A3', fontSize: 12 }}>Playlist vazia. Vá em Playlist para adicionar módulos.</div>
                  : playlist.map((p, i) => {
                    const mod = MODULOS[p.tipo] || {}
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #2A3454' }}>
                        <div style={{ width: 3, height: 30, borderRadius: 2, background: mod.cor || '#d2b36f', flexShrink: 0 }} />
                        <div style={{ fontSize: 16 }}>{mod.icone}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#F4F6FA' }}>{p.nome}</div>
                          <div style={{ fontSize: 11, color: '#7A85A3' }}>{p.dur_sec > 0 ? p.dur_sec + 's' : 'automático'}</div>
                        </div>
                        <div style={{ fontSize: 11, color: '#7A85A3' }}>{i + 1}</div>
                      </div>
                    )
                  })}
              </div>
              {/* Mídias recentes */}
              <div style={S.card}>
                <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 13 }}>Mídias recentes</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                  {midias.slice(0, 10).map(m => (
                    <div key={m.id} style={{ borderRadius: 8, overflow: 'hidden', background: '#1C2540', border: '1px solid #2A3454' }}>
                      {m.tipo === 'video'
                        ? <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎬</div>
                        : <img src={m.url} alt={m.nome} style={{ width: '100%', height: 60, objectFit: 'cover', display: 'block' }} />
                      }
                      <div style={{ padding: '6px 8px', fontSize: 10, color: '#7A85A3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.nome}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── BIBLIOTECA ── */}
          {pagina === 'biblioteca' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Drop zone */}
              <div
                style={S.dropZone}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#d2b36f' }}
                onDragLeave={e => { e.currentTarget.style.borderColor = '#2A3454' }}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#2A3454'; handleUpload(e.dataTransfer.files) }}
                onClick={() => fileRef.current?.click()}
              >
                <div style={{ fontSize: 32 }}>📤</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#F4F6FA' }}>Arraste fotos e vídeos aqui</div>
                <div style={{ fontSize: 12, color: '#7A85A3' }}>ou clique para selecionar · JPG, PNG, MP4 · qualquer tamanho</div>
              </div>
              {/* Grid de mídias */}
              {midias.length === 0
                ? <div style={{ color: '#7A85A3', textAlign: 'center', padding: 40, fontSize: 14 }}>Nenhuma mídia ainda. Faça o upload acima.</div>
                : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                    {midias.map(m => (
                      <div key={m.id} style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                        <div style={{ height: 120, background: '#1C2540', position: 'relative', overflow: 'hidden' }}>
                          {m.tipo === 'video'
                            ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🎬</div>
                            : <img src={m.url} alt={m.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          }
                          <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(34,197,94,.2)', color: '#22C55E', fontSize: 9, padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>
                            {m.tipo}
                          </div>
                        </div>
                        <div style={{ padding: '10px 12px' }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: '#F4F6FA', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.nome}</div>
                          <div style={{ fontSize: 10, color: '#7A85A3' }}>{m.categoria} · {new Date(m.created_at).toLocaleDateString('pt-BR')}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderTop: '1px solid #2A3454' }}>
                          <button onClick={() => { addModulo('galeria'); showToast('Adicione à playlist!', 'ok') }}
                            style={{ ...S.btnSm, flex: 1 }}>+ Playlist</button>
                          <button onClick={() => deletarMidia(m.id, m.path)}
                            style={{ ...S.btnSm, color: '#EF4444' }}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* ── PLAYLIST ── */}
          {pagina === 'playlist' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Barra visual */}
              <div style={S.card}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Ordem da playlist — {LOJAS[loja].nome}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 8 }}>
                  {playlist.map((p, i) => {
                    const mod = MODULOS[p.tipo] || {}
                    return (
                      <div key={p.id} style={{
                        background: mod.bg || 'rgba(210,179,111,.15)',
                        color: mod.cor || '#d2b36f',
                        border: `1px solid ${mod.cor || '#d2b36f'}44`,
                        borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 600, flexShrink: 0,
                      }}>{mod.icone} {p.nome?.split(' ')[0]}</div>
                    )
                  })}
                  {playlist.length > 0 && <div style={{ color: '#7A85A3', fontSize: 12 }}>↺</div>}
                </div>
                <div style={{ fontSize: 10, color: '#7A85A3', fontStyle: 'italic' }}>
                  Ciclo total: {playlist.reduce((a, p) => a + (p.dur_sec || 0), 0)}s · loop infinito
                </div>
              </div>
              {/* Itens da playlist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {playlist.map((p, i) => {
                  const mod = MODULOS[p.tipo] || {}
                  return (
                    <div key={p.id}
                      draggable
                      onDragStart={e => onDragStart(e, p.id)}
                      onDragOver={e => onDragOver(e, p.id)}
                      onDrop={e => onDrop(e, p.id)}
                      style={{ ...S.plItem, opacity: drag === p.id ? 0.4 : 1 }}
                    >
                      <span style={{ color: '#7A85A3', fontSize: 18, cursor: 'grab' }}>⠿</span>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: mod.bg || 'rgba(210,179,111,.15)', color: mod.cor || '#d2b36f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{i + 1}</div>
                      <div style={{ width: 3, height: 34, borderRadius: 2, background: mod.cor || '#d2b36f', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#F4F6FA' }}>{mod.icone} {p.nome}</div>
                        <div style={{ fontSize: 11, color: '#7A85A3', marginTop: 2 }}>{p.dur_sec > 0 ? p.dur_sec + 's' : 'automático (duração do conteúdo)'}</div>
                      </div>
                      <select
                        value={p.dur_sec}
                        onChange={e => setPlaylist(prev => prev.map(x => x.id === p.id ? {...x, dur_sec: Number(e.target.value)} : x))}
                        style={{ background: '#1C2540', border: '1px solid #2A3454', color: '#F4F6FA', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}
                      >
                        {[0,5,8,10,12,15,20,30,45,60].map(v => (
                          <option key={v} value={v}>{v === 0 ? 'Automático' : v + 's'}</option>
                        ))}
                      </select>
                      <button onClick={() => removeModulo(p.id)} style={{ ...S.btnSm, color: '#EF4444' }}>🗑️</button>
                    </div>
                  )
                })}
              </div>
              {/* Adicionar módulo */}
              <div style={S.card}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Adicionar módulo</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {Object.entries(MODULOS).map(([key, mod]) => (
                    <button key={key} onClick={() => addModulo(key)} style={{
                      background: mod.bg, border: `1px solid ${mod.cor}44`,
                      color: mod.cor, borderRadius: 8, padding: '10px', cursor: 'pointer',
                      fontSize: 12, fontWeight: 500, textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{mod.icone}</div>
                      {mod.nome}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CONFIGURAÇÕES ── */}
          {pagina === 'configuracoes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
              {[
                { key: 'nome',      label: 'Nome da loja',   placeholder: 'A Paulistana Iúna' },
                { key: 'cidade',    label: 'Cidade / Estado', placeholder: 'Iúna, ES' },
                { key: 'instagram', label: 'Instagram (sem @)', placeholder: 'lojaapaulistanaiuna' },
                { key: 'slogan',    label: 'Slogan / Tagline', placeholder: 'Moda que faz você brilhar' },
              ].map(f => (
                <div key={f.key} style={{ ...S.card }}>
                  <div style={{ fontSize: 11, color: '#7A85A3', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{f.label}</div>
                  <input
                    value={config[f.key] || ''}
                    onChange={e => setConfig(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={S.input}
                  />
                </div>
              ))}
              <div style={S.card}>
                <div style={{ fontSize: 11, color: '#7A85A3', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Cor de destaque</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input type="color" value={config.cor || '#d2b36f'}
                    onChange={e => setConfig(prev => ({ ...prev, cor: e.target.value }))}
                    style={{ width: 48, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                  />
                  <input value={config.cor || '#d2b36f'}
                    onChange={e => setConfig(prev => ({ ...prev, cor: e.target.value }))}
                    style={{ ...S.input, maxWidth: 120, fontFamily: 'monospace' }}
                  />
                </div>
              </div>
              <button onClick={async () => {
                setLoading(true)
                const res = await fetch('/api/config', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ loja, ...config }),
                }).then(r => r.json())
                setLoading(false)
                if (res.ok) showToast('Configurações salvas!', 'ok')
                else showToast('Erro: ' + res.error, 'err')
              }} style={{ ...S.btnPrimary, width: 'fit-content' }}>
                💾 Salvar configurações
              </button>
            </div>
          )}

        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          background: '#1C2540', border: '1px solid #2A3454',
          color: '#F4F6FA', padding: '12px 18px', borderRadius: 12,
          fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
        }}>
          <span>{toast.type === 'ok' ? '✅' : toast.type === 'warn' ? '⚠️' : '❌'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ── Estilos ──
const S = {
  app:       { display: 'flex', height: '100vh', overflow: 'hidden', background: '#0B0F1A', color: '#F4F6FA', fontFamily: 'system-ui, sans-serif', fontSize: 13 },
  sb:        { width: 220, flexShrink: 0, background: '#141B2D', borderRight: '1px solid #2A3454', display: 'flex', flexDirection: 'column' },
  sbHeader:  { height: 56, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderBottom: '1px solid #2A3454' },
  sbLogo:    { width: 30, height: 30, borderRadius: 8, background: '#4F7EFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 },
  sbScroll:  { flex: 1, overflowY: 'auto', padding: '10px 8px' },
  sbItem:    { display: 'flex', alignItems: 'center', gap: 9, padding: '9px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginBottom: 2, transition: 'all .12s' },
  sbFooter:  { borderTop: '1px solid #2A3454', padding: 12, display: 'flex', alignItems: 'center', gap: 10 },
  sbAvatar:  { width: 28, height: 28, borderRadius: '50%', background: '#4F7EFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 },
  lojaBtn:   { padding: '7px 12px', borderRadius: 8, border: '1px solid #2A3454', cursor: 'pointer', fontSize: 12, textAlign: 'left', transition: 'all .12s' },
  main:      { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topbar:    { height: 56, borderBottom: '1px solid #2A3454', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14, background: '#141B2D', flexShrink: 0 },
  content:   { flex: 1, overflowY: 'auto', padding: 24 },
  card:      { background: '#141B2D', border: '1px solid #2A3454', borderRadius: 12, padding: '18px 20px' },
  dropZone:  { border: '2px dashed #2A3454', borderRadius: 12, padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'center', transition: 'all .12s' },
  plItem:    { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: '#1C2540', border: '1px solid #2A3454', borderRadius: 12, cursor: 'grab', userSelect: 'none' },
  btnPrimary:{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 34, borderRadius: 8, background: '#4F7EFF', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap', textDecoration: 'none' },
  btnGhost:  { display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 34, borderRadius: 8, background: 'transparent', color: '#7A85A3', fontSize: 13, cursor: 'pointer', border: '1px solid #2A3454', textDecoration: 'none' },
  btnSm:     { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0 10px', height: 28, borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '1px solid #2A3454', background: '#1C2540', color: '#7A85A3' },
  input:     { width: '100%', height: 36, background: '#1C2540', border: '1px solid #2A3454', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#F4F6FA', outline: 'none' },
}
