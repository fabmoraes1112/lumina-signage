# Lumina Signage — Deploy

## 1. Supabase — criar tabelas

1. Acesse **supabase.com** → seu projeto
2. Vá em **SQL Editor** → clique em **New query**
3. Cole todo o conteúdo do arquivo `supabase-schema.sql`
4. Clique em **Run**
5. Confirme que as tabelas foram criadas em **Table Editor**

## 2. GitHub — subir o código

1. Acesse **github.com** → seu repositório `lumina-signage`
2. Delete todos os arquivos antigos
3. Faça upload de TODOS os arquivos desta pasta mantendo a estrutura:
   ```
   lumina-system/
   ├── app/
   │   ├── api/config/route.js
   │   ├── api/midias/route.js
   │   ├── api/playlist/route.js
   │   ├── api/upload/route.js
   │   ├── painel/page.js
   │   ├── tv/[loja]/page.js
   │   ├── globals.css
   │   ├── layout.js
   │   └── page.js
   ├── lib/supabase.js
   ├── next.config.js
   ├── package.json
   └── supabase-schema.sql
   ```
   ⚠️ NÃO suba o `.env.local` — as chaves ficam no Vercel

## 3. Vercel — fazer o deploy

1. Acesse **vercel.com** → clique em **Add New Project**
2. Importe o repositório `lumina-signage` do GitHub
3. Em **Environment Variables** adicione:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://myowrxkzcmhhyiegflft.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
   ```
4. Clique em **Deploy**
5. Aguarde 2 minutos → sistema no ar!

## 4. URLs do sistema

Após o deploy o Vercel vai gerar uma URL tipo:
```
https://lumina-signage-xxx.vercel.app
```

- **Painel:** https://lumina-signage-xxx.vercel.app/painel
- **TV Iúna:** https://lumina-signage-xxx.vercel.app/tv/iuna
- **TV Mutum:** https://lumina-signage-xxx.vercel.app/tv/mutum

## 5. Na Smart TV

1. Abra o Chrome na TV
2. Digite: `https://lumina-signage-xxx.vercel.app/tv/iuna`
3. Coloque em tela cheia
4. Pronto! A TV atualiza automaticamente sempre que você publicar pelo painel.

