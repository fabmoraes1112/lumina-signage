import { NextResponse } from 'next/server'

const FALLBACK = [
  { title: 'Tendências do inverno 2026: cores vibrantes dominam as passarelas', desc: 'As principais marcas apostam em paletas ousadas e sobreposição de peças para a temporada fria.', img: '', cat: 'Tendência' },
  { title: 'Guarda-roupa cápsula: como montar looks versáteis com poucas peças', desc: 'A técnica garante combinações infinitas com apenas 10 peças-chave e revoluciona a forma de se vestir.', img: '', cat: 'Dica de Estilo' },
  { title: 'Botas de cano médio lideram as vendas no inverno 2026', desc: 'O modelo ganhou versões para todos os estilos e orçamentos, sendo o calçado mais procurado da temporada.', img: '', cat: 'Calçados' },
  { title: 'Moletom vira peça-chave no visual masculino moderno', desc: 'Conforto e estilo se unem na peça mais desejada pelos homens neste inverno, do casual ao social.', img: '', cat: 'Masculino' },
]

// Alterna entre feeds a cada requisição para variar conteúdo
const FEEDS = [
  'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fvogue.globo.com%2Frss%2F&count=6',
  'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fmarieclaire.globo.com%2Frss%2Fmoda%2F&count=6',
  'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeed.elle.com.br%2Fmoda&count=6',
  'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.estilo.uol.com.br%2Ffeed%2F&count=6',
]

export const revalidate = 600 // revalida a cada 10 minutos

export async function GET() {
  // Escolhe um feed baseado na hora atual para variar
  const feedIdx = Math.floor(Date.now() / 600000) % FEEDS.length
  
  for (let i = 0; i < FEEDS.length; i++) {
    const feed = FEEDS[(feedIdx + i) % FEEDS.length]
    try {
      const r = await fetch(feed, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
          'Accept': 'application/json',
        },
        cache: 'no-store',
      })
      if (!r.ok) continue
      const d = await r.json()
      if (!d.items?.length) continue

      const news = d.items.slice(0, 4).map(it => {
        // Extrai imagem do content se não tiver no enclosure
        let img = it.enclosure?.link || it.thumbnail || ''
        if (!img && it.content) {
          const match = it.content.match(/<img[^>]+src=["']([^"']+)["']/i)
          if (match) img = match[1]
        }
        if (!img && it.description) {
          const match = it.description.match(/<img[^>]+src=["']([^"']+)["']/i)
          if (match) img = match[1]
        }
        return {
          title: it.title?.replace(/<[^>]+>/g,'') || '',
          desc:  (it.description || it.content || '').replace(/<[^>]+>/g,'').slice(0, 160),
          img,
          cat:   it.categories?.[0] || 'Moda',
        }
      })
      
      return NextResponse.json({ news, source: feed })
    } catch(e) { continue }
  }

  return NextResponse.json({ news: FALLBACK })
}
