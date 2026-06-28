import { NextResponse } from 'next/server'

const FALLBACK = [
  { title: 'Tendências do inverno 2026: cores vibrantes dominam as passarelas', desc: 'As principais marcas apostam em paletas ousadas e sobreposição de peças para a temporada fria deste ano.', img: '', cat: 'Tendência' },
  { title: 'Guarda-roupa cápsula: como montar looks versáteis com poucas peças', desc: 'A técnica garante combinações infinitas com apenas 10 peças-chave e revoluciona a forma de se vestir.', img: '', cat: 'Dica de estilo' },
  { title: 'Botas de cano médio lideram as vendas no inverno 2026', desc: 'O modelo ganhou versões para todos os estilos e orçamentos, sendo o calçado mais procurado da temporada.', img: '', cat: 'Calçados' },
  { title: 'Moletom vira peça-chave no visual masculino moderno', desc: 'Conforto e estilo se unem na peça mais desejada pelos homens neste inverno, do casual ao social.', img: '', cat: 'Masculino' },
]

export async function GET() {
  const feeds = [
    'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Frevistaquem.globo.com%2FQUEM%2Fnoticia%2Fmoda%2Frss.xml&count=4',
    'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fmarieclaire.globo.com%2Frss%2Fmoda%2F&count=4',
    'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fvogue.globo.com%2Frss%2F&count=4',
  ]

  for (const feed of feeds) {
    try {
      const r = await fetch(feed, {
        next: { revalidate: 900 },
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      const d = await r.json()
      if (d.items?.length) {
        const news = d.items.slice(0, 4).map(it => ({
          title: it.title || '',
          desc:  (it.description || it.content || '').replace(/<[^>]+>/g, '').slice(0, 160),
          img:   it.enclosure?.link || it.thumbnail || '',
          cat:   it.categories?.[0] || 'Moda',
        }))
        return NextResponse.json({ news })
      }
    } catch(e) { continue }
  }

  return NextResponse.json({ news: FALLBACK })
}
