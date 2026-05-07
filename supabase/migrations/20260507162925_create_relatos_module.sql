-- ============================================================
-- SoloLatinas: Relatos Module Migration
-- ============================================================

-- 1. TYPES
DROP TYPE IF EXISTS public.relato_status CASCADE;
CREATE TYPE public.relato_status AS ENUM ('borrador', 'revision', 'publicado', 'destacado', 'archivado');

-- 2. CORE TABLES

-- User profiles (if not exists)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    country TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Relatos (stories) table
CREATE TABLE IF NOT EXISTS public.relatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    cuerpo TEXT NOT NULL DEFAULT '',
    extracto TEXT DEFAULT '',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    imagen_url TEXT DEFAULT '',
    pais TEXT DEFAULT '',
    categoria TEXT DEFAULT '',
    autor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    estado public.relato_status DEFAULT 'borrador'::public.relato_status,
    generar_imagen_ia BOOLEAN DEFAULT false,
    vistas INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    tiempo_lectura INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_relatos_autor_id ON public.relatos(autor_id);
CREATE INDEX IF NOT EXISTS idx_relatos_estado ON public.relatos(estado);
CREATE INDEX IF NOT EXISTS idx_relatos_created_at ON public.relatos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_relatos_tags ON public.relatos USING GIN(tags);

-- 4. FUNCTIONS (before RLS policies)

-- Handle new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Calculate reading time based on word count
CREATE OR REPLACE FUNCTION public.calculate_reading_time(content TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    word_count INTEGER;
BEGIN
    word_count := array_length(string_to_array(trim(content), ' '), 1);
    RETURN GREATEST(1, CEIL(word_count::DECIMAL / 200));
END;
$$;

-- 5. ENABLE RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatos ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- user_profiles policies
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "public_can_read_user_profiles" ON public.user_profiles;
CREATE POLICY "public_can_read_user_profiles"
ON public.user_profiles
FOR SELECT
TO public
USING (true);

-- relatos policies
DROP POLICY IF EXISTS "public_can_read_published_relatos" ON public.relatos;
CREATE POLICY "public_can_read_published_relatos"
ON public.relatos
FOR SELECT
TO public
USING (estado IN ('publicado', 'destacado'));

DROP POLICY IF EXISTS "authors_can_read_own_relatos" ON public.relatos;
CREATE POLICY "authors_can_read_own_relatos"
ON public.relatos
FOR SELECT
TO authenticated
USING (autor_id = auth.uid());

DROP POLICY IF EXISTS "authors_can_insert_relatos" ON public.relatos;
CREATE POLICY "authors_can_insert_relatos"
ON public.relatos
FOR INSERT
TO authenticated
WITH CHECK (autor_id = auth.uid());

DROP POLICY IF EXISTS "authors_can_update_own_relatos" ON public.relatos;
CREATE POLICY "authors_can_update_own_relatos"
ON public.relatos
FOR UPDATE
TO authenticated
USING (autor_id = auth.uid())
WITH CHECK (autor_id = auth.uid());

DROP POLICY IF EXISTS "authors_can_delete_own_relatos" ON public.relatos;
CREATE POLICY "authors_can_delete_own_relatos"
ON public.relatos
FOR DELETE
TO authenticated
USING (autor_id = auth.uid());

-- 7. TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_relatos_updated_at ON public.relatos;
CREATE TRIGGER update_relatos_updated_at
    BEFORE UPDATE ON public.relatos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
