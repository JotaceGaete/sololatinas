-- ============================================================
-- SoloLatinas: Admin RLS Policies
-- Grants full access on relatos and user_profiles to users
-- with role = 'admin' in user_profiles.
-- ============================================================

-- Helper function: check if the calling user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Admin can read ALL relatos (including drafts and archived)
DROP POLICY IF EXISTS "admin_can_read_all_relatos" ON public.relatos;
CREATE POLICY "admin_can_read_all_relatos"
ON public.relatos
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admin can update any relato (status changes, moderation)
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

-- Admin can read all user profiles (already covered by public policy, but explicit)
DROP POLICY IF EXISTS "admin_can_read_all_user_profiles" ON public.user_profiles;
CREATE POLICY "admin_can_read_all_user_profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.is_admin());
