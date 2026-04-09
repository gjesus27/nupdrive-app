import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { TrackingMap } from '@/components/TrackingMap';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Car, MapPin, Fuel, Activity, TrendingUp, FileText, Download, Eye, ParkingCircle, Image } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportCorridasPDF, exportCorridasExcel, exportAbastecimentosPDF, exportAbastecimentosExcel, exportZonaAzulPDF } from '@/lib/reports';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ motoristas: 0, veiculos: 0, corridasHoje: 0, corridasAndamento: 0, totalKm: 0, totalAbast: 0, totalZona: 0 });
  const [corridas, setCorridas] = useState<any[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [filtroMotorista, setFiltroMotorista] = useState('todos');
  const [filtroVeiculo, setFiltroVeiculo] = useState('todos');
  const [filtroData, setFiltroData] = useState('');
  const [motoristas, setMotoristas] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDrivers, setActiveDrivers] = useState<any[]>([]);
  const [selectedCorrida, setSelectedCorrida] = useState<any>(null);
  const [corridaFotos, setCorridaFotos] = useState<any[]>([]);
  const [corridaRoute, setCorridaRoute] = useState<[number, number][]>([]);

  useEffect(() => {
    loadFilters();
    loadActiveDrivers();
    const interval = setInterval(loadActiveDrivers, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadData();
  }, [filtroStatus, filtroMotorista, filtroVeiculo, filtroData]);

  const loadFilters = async () => {
    const [{ data: m }, { data: v }] = await Promise.all([
      supabase.from('usuarios').select('id, nome').eq('tipo', 'motorista'),
      supabase.from('veiculos').select('id, nome, placa'),
    ]);
    setMotoristas(m || []);
    setVeiculos(v || []);
  };

  const loadActiveDrivers = async () => {
    const { data } = await supabase
      .from('corridas')
      .select('id, motorista_id, destino, usuarios!corridas_motorista_id_fkey(nome), veiculos(nome)')
      .eq('status', 'em_andamento');

    if (data) {
      const driversWithPos = await Promise.all(data.map(async (c: any) => {
        const { data: loc } = await supabase
          .from('localizacoes')
          .select('lat, lng')
          .eq('corrida_id', c.id)
          .order('criado_em', { ascending: false })
          .limit(1);
        return { ...c, lat: loc?.[0]?.lat, lng: loc?.[0]?.lng };
      }));
      setActiveDrivers(driversWithPos.filter(d => d.lat && d.lng));
    }
  };

  const loadData = async () => {
    setLoading(true);
    const [{ count: motoristasCount }, { count: veiculosCount }, { count: corridasHoje }, { count: corridasAndamento }] = await Promise.all([
      supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('tipo', 'motorista'),
      supabase.from('veiculos').select('*', { count: 'exact', head: true }),
      supabase.from('corridas').select('*', { count: 'exact', head: true }).gte('criado_em', new Date().toISOString().split('T')[0]),
      supabase.from('corridas').select('*', { count: 'exact', head: true }).eq('status', 'em_andamento'),
    ]);

    // Totals
    const { data: abastData } = await supabase.from('abastecimentos').select('valor');
    const { data: zonaData } = await supabase.from('zona_azul').select('valor');
    const { data: corridasKm } = await supabase.from('corridas').select('km_inicio, km_fim').not('km_fim', 'is', null);

    const totalAbast = (abastData || []).reduce((acc: number, a: any) => acc + Number(a.valor), 0);
    const totalZona = (zonaData || []).reduce((acc: number, z: any) => acc + Number(z.valor), 0);
    const totalKm = (corridasKm || []).reduce((acc: number, c: any) => acc + (Number(c.km_fim) - Number(c.km_inicio)), 0);

    setStats({
      motoristas: motoristasCount || 0,
      veiculos: veiculosCount || 0,
      corridasHoje: corridasHoje || 0,
      corridasAndamento: corridasAndamento || 0,
      totalKm, totalAbast, totalZona,
    });

    let query = supabase.from('corridas')
      .select('*, usuarios!corridas_motorista_id_fkey(nome), veiculos(nome, placa)')
      .order('criado_em', { ascending: false })
      .limit(50);

    if (filtroStatus !== 'todas') query = query.eq('status', filtroStatus);
    if (filtroMotorista !== 'todos') query = query.eq('motorista_id', filtroMotorista);
    if (filtroVeiculo !== 'todos') query = query.eq('veiculo_id', filtroVeiculo);
    if (filtroData) query = query.gte('criado_em', filtroData).lt('criado_em', filtroData + 'T23:59:59');

    const { data } = await query;
    setCorridas(data || []);
    setLoading(false);
  };

  const viewCorridaDetails = async (corrida: any) => {
    setSelectedCorrida(corrida);
    const [{ data: fotos }, { data: locs }] = await Promise.all([
      supabase.from('fotos').select('*').eq('corrida_id', corrida.id),
      supabase.from('localizacoes').select('lat, lng').eq('corrida_id', corrida.id).order('criado_em'),
    ]);
    setCorridaFotos(fotos || []);
    setCorridaRoute((locs || []).map((l: any) => [l.lat, l.lng]));
  };

  const handleExportPDF = () => {
    const data = corridas.map((c: any) => ({
      motorista: c.usuarios?.nome || '-',
      veiculo: c.veiculos?.nome || '-',
      placa: c.veiculos?.placa || '-',
      destino: c.destino || '-',
      km_inicio: c.km_inicio,
      km_fim: c.km_fim,
      status: c.status,
      criado_em: c.criado_em,
      finalizada_em: c.finalizada_em,
    }));
    exportCorridasPDF(data);
  };

  const handleExportExcel = () => {
    const data = corridas.map((c: any) => ({
      motorista: c.usuarios?.nome || '-',
      veiculo: c.veiculos?.nome || '-',
      placa: c.veiculos?.placa || '-',
      destino: c.destino || '-',
      km_inicio: c.km_inicio,
      km_fim: c.km_fim,
      status: c.status,
      criado_em: c.criado_em,
      finalizada_em: c.finalizada_em,
    }));
    exportCorridasExcel(data);
  };

  const exportAbastPDF = async () => {
    const { data } = await supabase.from('abastecimentos').select('*, usuarios!abastecimentos_motorista_id_fkey(nome), veiculos(nome)');
    if (data) exportAbastecimentosPDF(data.map((a: any) => ({ motorista: a.usuarios?.nome || '-', veiculo: a.veiculos?.nome || '-', valor: Number(a.valor), km: Number(a.km), criado_em: a.criado_em })));
  };

  const exportZonaPDF = async () => {
    const { data } = await supabase.from('zona_azul').select('*, usuarios!zona_azul_motorista_id_fkey(nome)');
    if (data) exportZonaAzulPDF(data.map((z: any) => ({ motorista: z.usuarios?.nome || '-', valor: Number(z.valor), localizacao: z.localizacao || '-', criado_em: z.criado_em })));
  };

  const statCards = [
    { label: 'Motoristas', value: stats.motoristas, icon: Users, color: 'text-primary' },
    { label: 'Veículos', value: stats.veiculos, icon: Car, color: 'text-secondary' },
    { label: 'Corridas Hoje', value: stats.corridasHoje, icon: TrendingUp, color: 'text-success' },
    { label: 'Em Andamento', value: stats.corridasAndamento, icon: Activity, color: 'text-warning' },
  ];

  const consumoCards = [
    { label: 'Km Total', value: `${stats.totalKm.toLocaleString()} km`, icon: MapPin },
    { label: 'Abastecimento', value: `R$ ${stats.totalAbast.toFixed(2)}`, icon: Fuel },
    { label: 'Zona Azul', value: `R$ ${stats.totalZona.toFixed(2)}`, icon: ParkingCircle },
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

        {/* Consumo Summary */}
        <div className="grid grid-cols-3 gap-2">
          {consumoCards.map(c => (
            <Card key={c.label}>
              <CardContent className="p-3 text-center">
                <c.icon className="mx-auto h-4 w-4 text-primary mb-1" />
                <p className="text-sm font-bold">{c.value}</p>
                <p className="text-[10px] text-muted-foreground">{c.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Live Map */}
        {activeDrivers.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                Motoristas em Rota ({activeDrivers.length})
              </h3>
            </CardHeader>
            <CardContent className="p-3">
              <TrackingMap
                markers={activeDrivers.map((d: any) => ({
                  lat: d.lat, lng: d.lng,
                  label: `${d.usuarios?.nome || 'Motorista'} - ${d.veiculos?.nome || ''}${d.destino ? ` → ${d.destino}` : ''}`,
                  color: '#7c3aed',
                }))}
                height="250px"
              />
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="corridas" className="space-y-3">
          <TabsList className="w-full">
            <TabsTrigger value="corridas" className="flex-1">Corridas</TabsTrigger>
            <TabsTrigger value="relatorios" className="flex-1">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="corridas" className="space-y-3">
            {/* Filters */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="finalizada">Finalizadas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroMotorista} onValueChange={setFiltroMotorista}>
                <SelectTrigger><SelectValue placeholder="Motorista" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {motoristas.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filtroVeiculo} onValueChange={setFiltroVeiculo}>
                <SelectTrigger><SelectValue placeholder="Veículo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {veiculos.map(v => <SelectItem key={v.id} value={v.id}>{v.nome} ({v.placa})</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} />
            </div>

            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />)}</div>
            ) : corridas.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <MapPin className="mx-auto mb-2 h-8 w-8" /><p>Nenhuma corrida encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {corridas.map((c) => (
                  <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => viewCorridaDetails(c)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{c.usuarios?.nome || 'Motorista'}</p>
                          <p className="text-sm text-muted-foreground">{c.veiculos?.nome} • {c.veiculos?.placa}</p>
                          {c.destino && <p className="text-sm text-muted-foreground mt-1">📍 {c.destino}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            Km: {c.km_inicio} {c.km_fim ? `→ ${c.km_fim} (${Number(c.km_fim) - Number(c.km_inicio)} km)` : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(c.criado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={c.status === 'em_andamento' ? 'default' : 'secondary'}>
                            {c.status === 'em_andamento' ? 'Em Andamento' : 'Finalizada'}
                          </Badge>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="relatorios" className="space-y-3">
            <Card>
              <CardHeader><h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Exportar Relatórios</h3></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button onClick={handleExportPDF} variant="outline" className="flex-1"><Download className="mr-1 h-4 w-4" /> Corridas PDF</Button>
                  <Button onClick={handleExportExcel} variant="outline" className="flex-1"><Download className="mr-1 h-4 w-4" /> Corridas Excel</Button>
                </div>
                <div className="flex gap-2">
                  <Button onClick={exportAbastPDF} variant="outline" className="flex-1"><Fuel className="mr-1 h-4 w-4" /> Abastecimentos</Button>
                  <Button onClick={exportZonaPDF} variant="outline" className="flex-1"><ParkingCircle className="mr-1 h-4 w-4" /> Zona Azul</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Corrida Detail Modal */}
      <Dialog open={!!selectedCorrida} onOpenChange={() => setSelectedCorrida(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Corrida</DialogTitle>
          </DialogHeader>
          {selectedCorrida && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Motorista:</span> <strong>{selectedCorrida.usuarios?.nome}</strong></div>
                <div><span className="text-muted-foreground">Veículo:</span> <strong>{selectedCorrida.veiculos?.nome}</strong></div>
                <div><span className="text-muted-foreground">Destino:</span> <strong>{selectedCorrida.destino || '-'}</strong></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={selectedCorrida.status === 'em_andamento' ? 'default' : 'secondary'}>{selectedCorrida.status === 'em_andamento' ? 'Em Andamento' : 'Finalizada'}</Badge></div>
                <div><span className="text-muted-foreground">Km Início:</span> <strong>{selectedCorrida.km_inicio}</strong></div>
                <div><span className="text-muted-foreground">Km Fim:</span> <strong>{selectedCorrida.km_fim || '-'}</strong></div>
              </div>

              {selectedCorrida.observacoes && (
                <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Observações:</p><p className="text-sm">{selectedCorrida.observacoes}</p></div>
              )}

              {corridaRoute.length > 1 && (
                <div>
                  <p className="text-sm font-medium mb-2">Trajeto</p>
                  <TrackingMap
                    route={corridaRoute}
                    markers={[
                      { lat: corridaRoute[0][0], lng: corridaRoute[0][1], label: 'Início', color: '#22c55e' },
                      { lat: corridaRoute[corridaRoute.length - 1][0], lng: corridaRoute[corridaRoute.length - 1][1], label: 'Fim', color: '#ef4444' },
                    ]}
                    height="200px"
                  />
                </div>
              )}

              {corridaFotos.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1"><Image className="h-4 w-4" /> Fotos</p>
                  <div className="grid grid-cols-2 gap-2">
                    {corridaFotos.map((f: any) => (
                      <div key={f.id} className="relative">
                        <img src={f.url} alt={f.posicao} className="w-full aspect-square rounded-lg object-cover" />
                        <Badge className="absolute bottom-1 left-1 text-[10px]">{f.tipo} - {f.posicao}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
