-- ============================================================
-- SoloLatinas: Comments & Reactions Module
-- ============================================================

-- 1. TABLES

-- Story comments
CREATE TABLE IF NOT EXISTS public.story_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relato_id UUID REFERENCES public.relatos(id) ON DELETE CASCADE,
    autor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    contenido TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Story reactions (one per user per relato per type)
CREATE TABLE IF NOT EXISTS public.story_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relato_id UUID REFERENCES public.relatos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint: one reaction per user per relato per type
CREATE UNIQUE INDEX IF NOT EXISTS idx_story_reactions_unique
ON public.story_reactions (relato_id, user_id, tipo);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_story_comments_relato_id ON public.story_comments(relato_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_created_at ON public.story_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_reactions_relato_id ON public.story_reactions(relato_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_id ON public.story_reactions(user_id);

-- 3. ENABLE RLS
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES

-- story_comments: anyone can read, authenticated users can write their own
DROP POLICY IF EXISTS "public_can_read_story_comments" ON public.story_comments;
CREATE POLICY "public_can_read_story_comments"
ON public.story_comments
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "authenticated_can_insert_story_comments" ON public.story_comments;
CREATE POLICY "authenticated_can_insert_story_comments"
ON public.story_comments
FOR INSERT
TO authenticated
WITH CHECK (autor_id = auth.uid());

DROP POLICY IF EXISTS "authors_can_update_own_story_comments" ON public.story_comments;
CREATE POLICY "authors_can_update_own_story_comments"
ON public.story_comments
FOR UPDATE
TO authenticated
USING (autor_id = auth.uid())
WITH CHECK (autor_id = auth.uid());

DROP POLICY IF EXISTS "authors_can_delete_own_story_comments" ON public.story_comments;
CREATE POLICY "authors_can_delete_own_story_comments"
ON public.story_comments
FOR DELETE
TO authenticated
USING (autor_id = auth.uid());

-- story_reactions: anyone can read, authenticated users manage their own
DROP POLICY IF EXISTS "public_can_read_story_reactions" ON public.story_reactions;
CREATE POLICY "public_can_read_story_reactions"
ON public.story_reactions
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "authenticated_can_insert_story_reactions" ON public.story_reactions;
CREATE POLICY "authenticated_can_insert_story_reactions"
ON public.story_reactions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_can_delete_own_story_reactions" ON public.story_reactions;
CREATE POLICY "users_can_delete_own_story_reactions"
ON public.story_reactions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 5. TRIGGERS
DROP TRIGGER IF EXISTS update_story_comments_updated_at ON public.story_comments;
CREATE TRIGGER update_story_comments_updated_at
    BEFORE UPDATE ON public.story_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
