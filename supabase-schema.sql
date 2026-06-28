-- ═══════════════════════════════════════════════════
-- LUMINA SIGNAGE — Schema do banco de dados Supabase
-- Cole e execute no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════

-- Lojas
CREATE TABLE IF NOT EXISTS lojas (
  id        TEXT PRIMARY KEY,
  nome      TEXT NOT NULL,
  cidade    TEXT,
  instagram TEXT,
  slogan    TEXT,
  cor       TEXT DEFAULT '#d2b36f',
  pix       BOOLEAN DEFAULT true,
  cartao    BOOLEAN DEFAULT true,
  dinheiro  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mídias
CREATE TABLE IF NOT EXISTS midias (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loja       TEXT REFERENCES lojas(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  tipo       TEXT CHECK (tipo IN ('imagem','video','design')) DEFAULT 'imagem',
  filename   TEXT NOT NULL,
  path       TEXT NOT NULL,
  url        TEXT NOT NULL,
  categoria  TEXT DEFAULT 'Geral',
  tamanho    BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist
CREATE TABLE IF NOT EXISTS playlist (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loja       TEXT REFERENCES lojas(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL,
  nome       TEXT,
  dur_sec    INTEGER DEFAULT 10,
  url        TEXT DEFAULT '',
  path       TEXT DEFAULT '',
  ordem      INTEGER DEFAULT 0,
  ativo      BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status das TVs
CREATE TABLE IF NOT EXISTS tvs (
  id         TEXT PRIMARY KEY,
  loja       TEXT REFERENCES lojas(id) ON DELETE CASCADE,
  nome       TEXT,
  last_seen  TIMESTAMPTZ,
  modulo     TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Dados iniciais das lojas ──
INSERT INTO lojas (id, nome, cidade, instagram, slogan) VALUES
  ('iuna',  'A Paulistana Iúna',  'Iúna, ES',  'lojaapaulistanaiuna', 'Moda que faz você brilhar'),
  ('mutum', 'A Paulistana Mutum', 'Mutum, MG', 'apaulistanamutum',    'Moda que faz você brilhar')
ON CONFLICT (id) DO NOTHING;

-- ── Playlist padrão — Iúna ──
INSERT INTO playlist (loja, tipo, nome, dur_sec, ordem) VALUES
  ('iuna', 'slides',    'Slides institucionais', 8,  0),
  ('iuna', 'noticias',  'Notícias de moda',      12, 1),
  ('iuna', 'quiz',      'Quiz cultural',          12, 2),
  ('iuna', 'galeria',   'Galeria de fotos',       0,  3),
  ('iuna', 'clima',     'Previsão do tempo',      10, 4),
  ('iuna', 'instagram', 'Instagram + QR Code',    20, 5)
ON CONFLICT DO NOTHING;

-- ── Playlist padrão — Mutum ──
INSERT INTO playlist (loja, tipo, nome, dur_sec, ordem) VALUES
  ('mutum', 'slides',    'Slides institucionais', 8,  0),
  ('mutum', 'noticias',  'Notícias de moda',      12, 1),
  ('mutum', 'quiz',      'Quiz cultural',          12, 2),
  ('mutum', 'galeria',   'Galeria de fotos',       0,  3),
  ('mutum', 'clima',     'Previsão do tempo',      10, 4),
  ('mutum', 'instagram', 'Instagram + QR Code',    20, 5)
ON CONFLICT DO NOTHING;

-- ── Políticas de acesso (RLS) ──
ALTER TABLE lojas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE midias  ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE tvs     ENABLE ROW LEVEL SECURITY;

-- Acesso público de leitura (a TV lê sem autenticação)
CREATE POLICY "Leitura pública lojas"    ON lojas    FOR SELECT USING (true);
CREATE POLICY "Leitura pública midias"   ON midias   FOR SELECT USING (true);
CREATE POLICY "Leitura pública playlist" ON playlist  FOR SELECT USING (true);
CREATE POLICY "Leitura pública tvs"      ON tvs      FOR SELECT USING (true);

-- Escrita pública (painel escreve via anon key)
CREATE POLICY "Escrita pública lojas"    ON lojas    FOR ALL USING (true);
CREATE POLICY "Escrita pública midias"   ON midias   FOR ALL USING (true);
CREATE POLICY "Escrita pública playlist" ON playlist  FOR ALL USING (true);
CREATE POLICY "Escrita pública tvs"      ON tvs      FOR ALL USING (true);

-- ── Storage: bucket midias público ──
-- (já criado pelo painel do Supabase, apenas confirma política)
INSERT INTO storage.buckets (id, name, public) VALUES ('midias', 'midias', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Storage público midias" ON storage.objects
  FOR ALL USING (bucket_id = 'midias');
