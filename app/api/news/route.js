import { NextResponse } from 'next/server'

// Imagens de moda por categoria — Unsplash (gratuito, sem CORS)
const IMGS = {
  tendencia: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80',
  bota:      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80',
  sandalia:  'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80',
  tenis:     'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
  sapato:    'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=600&q=80',
  masculino: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80',
  feminino:  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80',
  acessorio: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
  inverno:   'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=600&q=80',
  verao:     'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
  moda:      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  estilo:    'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&q=80',
  roupa:     'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80',
  bolsa:     'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
  joia:      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80',
  passarela: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
  default:   'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80',
}

function getImgByText(text) {
  const t = text.toLowerCase()
  if (t.includes('bota') || t.includes('sapato') || t.includes('tênis') || t.includes('calçado') || t.includes('sandália')) return IMGS.calcados
  if (t.includes('bolsa') || t.includes('acessório') || t.includes('bijoux') || t.includes('colar') || t.includes('anel')) return IMGS.acessorio
  if (t.includes('masculin') || t.includes('homem') || t.includes('moletom') || t.includes('camisa')) return IMGS.masculino
  if (t.includes('feminino') || t.includes('mulher') || t.includes('vestido') || t.includes('saia')) return IMGS.feminino
  if (t.includes('inverno') || t.includes('frio') || t.includes('casaco') || t.includes('jaqueta')) return IMGS.inverno
  if (t.includes('verão') || t.includes('praia') || t.includes('biquíni')) return IMGS.verao
  if (t.includes('passarela') || t.includes('semana de moda') || t.includes('fashion week')) return IMGS.passarela
  if (t.includes('joia') || t.includes('ouro') || t.includes('prata') || t.includes('diamante')) return IMGS.joia
  if (t.includes('estilo') || t.includes('look') || t.includes('outfit')) return IMGS.estilo
  if (t.includes('roupa') || t.includes('peça') || t.includes('coleção')) return IMGS.roupa
  if (t.includes('tendência') || t.includes('trend')) return IMGS.tendencia
  return IMGS.moda
}

const FEEDS = [
  'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fvogue.globo.com%2Frss%2F&count=8',
  'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fmarieclaire.globo.com%2Frss%2Fmoda%2F&count=8',
  'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeed.elle.com.br%2Fmoda&count=8',
]

const FALLBACK = [
  { title: 'Inverno 2026: cores vibrantes dominam as passarelas internacionais', desc: 'As principais marcas apostam em paletas ousadas e sobreposição de peças para a temporada.', img: IMGS.inverno, cat: 'Tendência' },
  { title: 'Guarda-roupa cápsula: looks versáteis com poucas peças-chave', desc: 'A técnica garante combinações infinitas e elimina o "não tenho nada para vestir".', img: IMGS.roupa, cat: 'Dica de Estilo' },
  { title: 'Botas de cano médio: o must-have do inverno 2026', desc: 'O modelo está nas vitrines de todas as lojas e cabe em todos os estilos.', img: IMGS.calcados, cat: 'Calçados' },
  { title: 'Acessórios dourados dominam a temporada fria', desc: 'Bijoux, bolsas e cintos em tom dourado elevam qualquer look básico.', img: IMGS.acessorio, cat: 'Acessórios' },
]

export const dynamic = 'force-dynamic'

export async function GET() {
  const feedIdx = Math.floor(Date.now() / 900000) % FEEDS.length

  for (let i = 0; i < FEEDS.length; i++) {
    const feed = FEEDS[(feedIdx + i) % FEEDS.length]
    try {
      const r = await fetch(feed, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
        cache: 'no-store',
      })
      if (!r.ok) continue
      const d = await r.json()
      if (!d.items?.length) continue

      const news = d.items.slice(0, 4).map(it => {
        // Tenta extrair imagem do feed
        let img = it.enclosure?.link || it.thumbnail || ''
        if (!img && it.content) {
          const m = it.content.match(/<img[^>]+src=["']([^"']+)["']/i)
          if (m) img = m[1]
        }
        if (!img && it.description) {
          const m = it.description.match(/<img[^>]+src=["']([^"']+)["']/i)
          if (m) img = m[1]
        }
        // Se não achou imagem no feed, usa imagem temática baseada no título
        if (!img || img.includes('pixel') || img.length < 20) {
          img = getImgByText((it.title || '') + ' ' + (it.categories?.join(' ') || ''))
        }
        return {
          title: (it.title || '').replace(/<[^>]+>/g, ''),
          desc:  (it.description || it.content || '').replace(/<[^>]+>/g, '').trim().slice(0, 160),
          img,
          cat:   it.categories?.[0] || 'Moda',
        }
      })

      return NextResponse.json({ news })
    } catch(e) { continue }
  }

  return NextResponse.json({ news: FALLBACK })
}