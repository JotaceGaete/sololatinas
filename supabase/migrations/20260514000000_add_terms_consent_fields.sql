-- Add legal consent and age verification fields to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_adult_confirmed        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS content_policy_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.user_profiles.terms_accepted_at         IS 'Timestamp when user accepted Terms of Use and Privacy Policy';
COMMENT ON COLUMN public.user_profiles.is_adult_confirmed        IS 'User confirmed they are 18+ years old at registration';
COMMENT ON COLUMN public.user_profiles.content_policy_accepted_at IS 'Timestamp when user accepted the Adult Content Policy';
