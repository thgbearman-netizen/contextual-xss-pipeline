-- Targets table for scan targets
CREATE TABLE public.targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'complete', 'error')),
    cms_detected TEXT,
    tech_stack JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Endpoints discovered from targets
CREATE TABLE public.endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID REFERENCES public.targets(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'GET' CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    params JSONB DEFAULT '[]'::jsonb,
    auth_required BOOLEAN DEFAULT false,
    cms TEXT,
    risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'discovered' CHECK (status IN ('discovered', 'classified', 'testing', 'vulnerable', 'clean')),
    input_class TEXT CHECK (input_class IN ('display_content', 'log_sink', 'admin_only', 'metadata', 'api_field')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Injections table for tracking active injections
CREATE TABLE public.injections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID REFERENCES public.endpoints(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL UNIQUE,
    param TEXT NOT NULL,
    context_type TEXT CHECK (context_type IN ('html_body', 'attribute', 'js_variable', 'json', 'email', 'log_viewer', 'pdf_export')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'injected', 'callback_received', 'validated', 'failed')),
    injected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Callbacks table for OOB correlation
CREATE TABLE public.callbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    injection_id UUID REFERENCES public.injections(id) ON DELETE CASCADE NOT NULL,
    callback_type TEXT NOT NULL CHECK (callback_type IN ('http', 'dns', 'smtp')),
    source_ip TEXT,
    user_agent TEXT,
    delay_seconds INTEGER,
    confidence TEXT NOT NULL DEFAULT 'low' CHECK (confidence IN ('low', 'medium', 'high')),
    raw_data JSONB,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Findings table for validated vulnerabilities
CREATE TABLE public.findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID REFERENCES public.endpoints(id) ON DELETE CASCADE NOT NULL,
    callback_id UUID REFERENCES public.callbacks(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    evidence JSONB,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'reported', 'fixed', 'false_positive')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Logs table for terminal output
CREATE TABLE public.scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID REFERENCES public.targets(id) ON DELETE CASCADE,
    level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error', 'success')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for this security tool)
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.injections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (security tool - no auth required)
CREATE POLICY "Public access for targets" ON public.targets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for endpoints" ON public.endpoints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for injections" ON public.injections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for callbacks" ON public.callbacks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for findings" ON public.findings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for scan_logs" ON public.scan_logs FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.endpoints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.callbacks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_logs;

-- Create indexes for performance
CREATE INDEX idx_endpoints_target_id ON public.endpoints(target_id);
CREATE INDEX idx_endpoints_status ON public.endpoints(status);
CREATE INDEX idx_injections_endpoint_id ON public.injections(endpoint_id);
CREATE INDEX idx_injections_token ON public.injections(token);
CREATE INDEX idx_callbacks_injection_id ON public.callbacks(injection_id);
CREATE INDEX idx_scan_logs_target_id ON public.scan_logs(target_id);
CREATE INDEX idx_scan_logs_created_at ON public.scan_logs(created_at DESC);