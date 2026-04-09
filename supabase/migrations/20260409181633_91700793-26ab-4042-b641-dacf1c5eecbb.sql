-- Create usuarios table (linked to auth.users)
CREATE TABLE public.usuarios (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'motorista' CHECK (tipo IN ('admin', 'motorista')),
  pode_dirigir BOOLEAN NOT NULL DEFAULT true,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Create role check function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios WHERE id = _user_id AND tipo = 'admin'
  )
$$;

CREATE POLICY "Users can read own profile" ON public.usuarios FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all users" ON public.usuarios FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert users" ON public.usuarios FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update users" ON public.usuarios FOR UPDATE USING (public.is_admin(auth.uid()));

-- Create veiculos table
CREATE TABLE public.veiculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  placa TEXT NOT NULL UNIQUE,
  km_atual NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'em_uso', 'manutencao')),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read vehicles" ON public.veiculos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update vehicles" ON public.veiculos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can insert vehicles" ON public.veiculos FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete vehicles" ON public.veiculos FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Create corridas table
CREATE TABLE public.corridas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  motorista_id UUID NOT NULL REFERENCES public.usuarios(id),
  veiculo_id UUID NOT NULL REFERENCES public.veiculos(id),
  km_inicio NUMERIC NOT NULL,
  km_fim NUMERIC,
  destino TEXT,
  observacoes TEXT,
  observacoes_final TEXT,
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'finalizada')),
  inicio_lat DOUBLE PRECISION,
  inicio_lng DOUBLE PRECISION,
  fim_lat DOUBLE PRECISION,
  fim_lng DOUBLE PRECISION,
  admin_dirigindo BOOLEAN DEFAULT false,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finalizada_em TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.corridas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own rides" ON public.corridas FOR SELECT TO authenticated USING (auth.uid() = motorista_id);
CREATE POLICY "Admins can read all rides" ON public.corridas FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can insert rides" ON public.corridas FOR INSERT TO authenticated WITH CHECK (auth.uid() = motorista_id);
CREATE POLICY "Users can update own rides" ON public.corridas FOR UPDATE TO authenticated USING (auth.uid() = motorista_id);
CREATE POLICY "Admins can update rides" ON public.corridas FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- Create checklists table
CREATE TABLE public.checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  motorista_id UUID NOT NULL REFERENCES public.usuarios(id),
  veiculo_id UUID NOT NULL REFERENCES public.veiculos(id),
  itens JSONB NOT NULL DEFAULT '{}',
  observacao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own checklists" ON public.checklists FOR SELECT TO authenticated USING (auth.uid() = motorista_id);
CREATE POLICY "Admins can read all checklists" ON public.checklists FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can insert checklists" ON public.checklists FOR INSERT TO authenticated WITH CHECK (auth.uid() = motorista_id);

-- Create fotos table
CREATE TABLE public.fotos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  corrida_id UUID NOT NULL REFERENCES public.corridas(id),
  motorista_id UUID NOT NULL REFERENCES public.usuarios(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('inicio', 'fim')),
  posicao TEXT NOT NULL CHECK (posicao IN ('frente', 'traseira', 'lado_direito', 'lado_esquerdo')),
  url TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own photos" ON public.fotos FOR SELECT TO authenticated USING (auth.uid() = motorista_id);
CREATE POLICY "Admins can read all photos" ON public.fotos FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can insert photos" ON public.fotos FOR INSERT TO authenticated WITH CHECK (auth.uid() = motorista_id);

-- Create localizacoes table
CREATE TABLE public.localizacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  corrida_id UUID NOT NULL REFERENCES public.corridas(id),
  motorista_id UUID NOT NULL REFERENCES public.usuarios(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  velocidade DOUBLE PRECISION,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.localizacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert locations" ON public.localizacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = motorista_id);
CREATE POLICY "Admins can read locations" ON public.localizacoes FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Create abastecimentos table
CREATE TABLE public.abastecimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  corrida_id UUID REFERENCES public.corridas(id),
  motorista_id UUID NOT NULL REFERENCES public.usuarios(id),
  veiculo_id UUID NOT NULL REFERENCES public.veiculos(id),
  valor NUMERIC NOT NULL,
  km NUMERIC NOT NULL,
  url_nota TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.abastecimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own refuels" ON public.abastecimentos FOR SELECT TO authenticated USING (auth.uid() = motorista_id);
CREATE POLICY "Admins can read all refuels" ON public.abastecimentos FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can insert refuels" ON public.abastecimentos FOR INSERT TO authenticated WITH CHECK (auth.uid() = motorista_id);

-- Create zona_azul table
CREATE TABLE public.zona_azul (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  corrida_id UUID REFERENCES public.corridas(id),
  motorista_id UUID NOT NULL REFERENCES public.usuarios(id),
  valor NUMERIC NOT NULL,
  localizacao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.zona_azul ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own zona azul" ON public.zona_azul FOR SELECT TO authenticated USING (auth.uid() = motorista_id);
CREATE POLICY "Admins can read all zona azul" ON public.zona_azul FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can insert zona azul" ON public.zona_azul FOR INSERT TO authenticated WITH CHECK (auth.uid() = motorista_id);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos', 'fotos', true);
CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT USING (bucket_id = 'fotos');
CREATE POLICY "Authenticated users can upload photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos');