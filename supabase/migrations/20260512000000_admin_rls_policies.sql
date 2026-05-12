-- ============================================================
-- SoloLatinas: Admin RLS Policies
-- Uses admin_users table (email-based) as source of truth.
-- ============================================================

-- Helper function: returns true if the calling user's email is in admin_users.
-- SECURITY DEFINER ensures it can read admin_users regardless of RLS on that table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = auth.email()
  );
$$;

-- admin_users RLS: authenticated users may only read their own row.
-- This lets the client-side isAdmin() query work without exposing other admin emails.
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_check_own_admin_status" ON public.admin_users;
CREATE POLICY "users_can_check_own_admin_status"
ON public.admin_users
FOR SELECT
TO authenticated
USING (email = auth.email());

-- Admin can read ALL relatos (including drafts/archived)
DROP POLICY IF EXISTS "admin_can_read_all_relatos" ON public.relatos;
CREATE POLICY "admin_can_read_all_relatos"
ON public.relatos
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admin can update any relato (moderation / status changes)
DROP POLICY IF EXISTS "admin_can_update_any_relato" ON public.relatos;
CREATE POLICY "admin_can_update_any_relato"
ON public.relatos
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Admin can delete any relato
DROP POLICY IF EXISTS "admin_can_delete_any_relato" ON public.relatos;
CREATE POLICY "admin_can_delete_any_relato"
ON public.relatos
FOR DELETE
TO authenticated
USING (public.is_admin());
