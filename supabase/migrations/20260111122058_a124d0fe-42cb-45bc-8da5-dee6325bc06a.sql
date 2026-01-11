-- Add session_id to targets for session-based filtering
ALTER TABLE public.targets ADD COLUMN IF NOT EXISTS session_id uuid DEFAULT gen_random_uuid();

-- Add session_id to scan_logs for session-based filtering
ALTER TABLE public.scan_logs ADD COLUMN IF NOT EXISTS session_id uuid;

-- Create index for faster session queries
CREATE INDEX IF NOT EXISTS idx_targets_session_id ON public.targets(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_session_id ON public.scan_logs(session_id);

-- Add validation_hash to callbacks for duplicate detection
ALTER TABLE public.callbacks ADD COLUMN IF NOT EXISTS validation_hash text;
ALTER TABLE public.callbacks ADD COLUMN IF NOT EXISTS is_duplicate boolean DEFAULT false;
ALTER TABLE public.callbacks ADD COLUMN IF NOT EXISTS fp_reason text;

-- Add unique constraint to prevent exact duplicate callbacks
CREATE INDEX IF NOT EXISTS idx_callbacks_validation_hash ON public.callbacks(validation_hash);

-- Add context metadata to injections for better correlation
ALTER TABLE public.injections ADD COLUMN IF NOT EXISTS expected_delay_min integer DEFAULT 60;
ALTER TABLE public.injections ADD COLUMN IF NOT EXISTS expected_delay_max integer DEFAULT 86400;
ALTER TABLE public.injections ADD COLUMN IF NOT EXISTS ip_whitelist text[];

-- Create a function to generate validation hash for callbacks
CREATE OR REPLACE FUNCTION public.generate_callback_hash(
  p_token text,
  p_source_ip text,
  p_user_agent text,
  p_callback_type text
) RETURNS text AS $$
BEGIN
  RETURN md5(COALESCE(p_token, '') || COALESCE(p_source_ip, '') || COALESCE(p_user_agent, '') || COALESCE(p_callback_type, ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;