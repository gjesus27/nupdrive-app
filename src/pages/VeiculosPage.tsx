import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, CheckCircle2, AlertTriangle, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Veiculo {
  id: string;
  nome: string;
  placa: string;
  km_atual: number;
  status: string;
}

export default function VeiculosPage() {
  const { profile } = useAuth();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadVeiculos();
  }, []);

  const loadVeiculos = async () => {
    const { data, error } = await supabase
      .from('veiculos')
      .select('*')
      .order('nome');
    if (error) {
      toast.error('Erro ao carregar veículos');
    } else {
      setVeiculos(data as Veiculo[]);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'disponivel': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'em_uso': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'manutencao': return <Wrench className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'disponivel': return 'Disponível';
      case 'em_uso': return 'Em Uso';
      case 'manutencao': return 'Manutenção';
      default: return status;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'disponivel': return 'default';
      case 'em_uso': return 'secondary';
      case 'manutencao': return 'destructive';
      default: return 'outline';
    }
  };

  const iniciarCorrida = (veiculoId: string) => {
    navigate(`/checklist/${veiculoId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="p-4 pb-20">
        <h2 className="mb-4 text-xl font-bold">Selecionar Veículo</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : veiculos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Car className="mb-2 h-12 w-12" />
            <p>Nenhum veículo cadastrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {veiculos.map((v) => (
              <Card key={v.id} className="overflow-hidden">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                    <Car className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{v.nome}</h3>
                    <p className="text-sm text-muted-foreground">{v.placa} • {v.km_atual?.toLocaleString()} km</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {getStatusIcon(v.status)}
                      <Badge variant={getStatusVariant(v.status)} className="text-xs">
                        {getStatusLabel(v.status)}
                      </Badge>
                    </div>
                  </div>
                  {v.status === 'disponivel' && (
                    <Button size="sm" onClick={() => iniciarCorrida(v.id)} className="gradient-primary text-primary-foreground">
                      Iniciar
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
