import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Car, MapPin, Fuel, Activity, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ motoristas: 0, veiculos: 0, corridasHoje: 0, corridasAndamento: 0 });
  const [corridas, setCorridas] = useState<any[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filtroStatus]);

  const loadData = async () => {
    setLoading(true);
    // Stats
    const [{ count: motoristas }, { count: veiculos }, { count: corridasHoje }, { count: corridasAndamento }] = await Promise.all([
      supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('tipo', 'motorista'),
      supabase.from('veiculos').select('*', { count: 'exact', head: true }),
      supabase.from('corridas').select('*', { count: 'exact', head: true }).gte('criado_em', new Date().toISOString().split('T')[0]),
      supabase.from('corridas').select('*', { count: 'exact', head: true }).eq('status', 'em_andamento'),
    ]);
    setStats({
      motoristas: motoristas || 0,
      veiculos: veiculos || 0,
      corridasHoje: corridasHoje || 0,
      corridasAndamento: corridasAndamento || 0,
    });

    // Corridas
    let query = supabase.from('corridas').select('*, usuarios!corridas_motorista_id_fkey(nome), veiculos(nome, placa)').order('criado_em', { ascending: false }).limit(20);
    if (filtroStatus !== 'todas') query = query.eq('status', filtroStatus);
    const { data } = await query;
    setCorridas(data || []);
    setLoading(false);
  };

  const statCards = [
    { label: 'Motoristas', value: stats.motoristas, icon: Users, color: 'text-primary' },
    { label: 'Veículos', value: stats.veiculos, icon: Car, color: 'text-secondary' },
    { label: 'Corridas Hoje', value: stats.corridasHoje, icon: TrendingUp, color: 'text-success' },
    { label: 'Em Andamento', value: stats.corridasAndamento, icon: Activity, color: 'text-warning' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="p-4 pb-20 space-y-4">
        <h2 className="text-xl font-bold">Dashboard</h2>

        <div className="grid grid-cols-2 gap-3">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <span className="text-2xl font-bold">{s.value}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Corridas Recentes</h3>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="finalizada">Finalizadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : corridas.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <MapPin className="mx-auto mb-2 h-8 w-8" />
            <p>Nenhuma corrida encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {corridas.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{(c as any).usuarios?.nome || 'Motorista'}</p>
                      <p className="text-sm text-muted-foreground">
                        {(c as any).veiculos?.nome} • {(c as any).veiculos?.placa}
                      </p>
                      {c.destino && <p className="text-sm text-muted-foreground mt-1">📍 {c.destino}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        Km: {c.km_inicio} {c.km_fim ? `→ ${c.km_fim}` : ''}
                      </p>
                    </div>
                    <Badge variant={c.status === 'em_andamento' ? 'default' : 'secondary'}>
                      {c.status === 'em_andamento' ? 'Em Andamento' : 'Finalizada'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
