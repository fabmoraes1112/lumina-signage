import './globals.css'

export const metadata = {
  title: 'Hubrem Signage',
  description: 'Sistema de mídia indoor — FW Agência',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
