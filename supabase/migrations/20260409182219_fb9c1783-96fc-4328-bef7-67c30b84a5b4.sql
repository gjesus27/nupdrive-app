-- Create notificacoes table
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'alerta',
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT false,
  dados JSONB,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON public.notificacoes
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

CREATE POLICY "Users can update own notifications" ON public.notificacoes
  FOR UPDATE TO authenticated USING (auth.uid() = usuario_id);

CREATE POLICY "Authenticated users can insert notifications" ON public.notificacoes
  FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;

-- Index for faster lookups
CREATE INDEX idx_notificacoes_usuario ON public.notificacoes(usuario_id, lida, criado_em DESC);