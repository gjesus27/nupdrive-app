import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, MapPin, Fuel, ParkingCircle, Flag, Navigation } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type FotoPosition = 'frente' | 'traseira' | 'lado_direito' | 'lado_esquerdo';

export default function CorridaPage() {
  const { veiculoId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [corridaId, setCorridaId] = useState<string | null>(null);
  const [kmInicio, setKmInicio] = useState('');
  const [destino, setDestino] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [fotosInicio, setFotosInicio] = useState<Record<FotoPosition, string | null>>({
    frente: null, traseira: null, lado_direito: null, lado_esquerdo: null,
  });
  const [step, setStep] = useState<'inicio' | 'em_andamento' | 'finalizando'>('inicio');
  const [kmFim, setKmFim] = useState('');
  const [obsFinal, setObsFinal] = useState('');
  const [loading, setLoading] = useState(false);

  // Abastecimento modal
  const [showAbast, setShowAbast] = useState(false);
  const [abastValor, setAbastValor] = useState('');
  const [abastKm, setAbastKm] = useState('');

  // Zona Azul modal
  const [showZona, setShowZona] = useState(false);
  const [zonaValor, setZonaValor] = useState('');
  const [zonaLocal, setZonaLocal] = useState('');

  const trackingRef = useRef<number | null>(null);

  const handleFotoUpload = async (position: FotoPosition, file: File) => {
    try {
      const ext = file.name.split('.').pop();
      const path = `corridas/${Date.now()}_${position}.${ext}`;
      const { error } = await supabase.storage.from('fotos').upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(path);
      setFotosInicio(prev => ({ ...prev, [position]: urlData.publicUrl }));
      toast.success(`Foto ${position} salva!`);
    } catch {
      toast.error('Erro ao enviar foto');
    }
  };

  const startCorrida = async () => {
    if (!kmInicio) { toast.error('Informe o km inicial'); return; }
    setLoading(true);
    try {
      let pos: GeolocationPosition | null = null;
      try {
        pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 }));
      } catch {}

      const { data, error } = await supabase.from('corridas').insert({
        motorista_id: profile!.id,
        veiculo_id: veiculoId,
        km_inicio: Number(kmInicio),
        destino,
        observacoes,
        inicio_lat: pos?.coords.latitude,
        inicio_lng: pos?.coords.longitude,
        status: 'em_andamento',
        admin_dirigindo: profile!.tipo === 'admin',
      }).select().single();

      if (error) throw error;
      setCorridaId(data.id);

      // Save initial photos
      for (const [pos, url] of Object.entries(fotosInicio)) {
        if (url) {
          await supabase.from('fotos').insert({
            corrida_id: data.id,
            motorista_id: profile!.id,
            tipo: 'inicio',
            posicao: pos,
            url,
          });
        }
      }

      // Update vehicle status
      await supabase.from('veiculos').update({ status: 'em_uso', km_atual: Number(kmInicio) }).eq('id', veiculoId);

      setStep('em_andamento');
      startTracking(data.id);
      toast.success('Corrida iniciada!');
    } catch {
      toast.error('Erro ao iniciar corrida');
    }
    setLoading(false);
  };

  const startTracking = (cId: string) => {
    if (!navigator.geolocation) return;
    trackingRef.current = window.setInterval(async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
        );
        await supabase.from('localizacoes').insert({
          corrida_id: cId,
          motorista_id: profile!.id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          velocidade: pos.coords.speed,
        });
      } catch {}
    }, 15000);
  };

  const finalizarCorrida = async () => {
    if (!kmFim) { toast.error('Informe o km final'); return; }
    if (Number(kmFim) < Number(kmInicio)) { toast.error('Km final não pode ser menor que km inicial'); return; }
    setLoading(true);
    try {
      let pos: GeolocationPosition | null = null;
      try {
        pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 }));
      } catch {}

      await supabase.from('corridas').update({
        km_fim: Number(kmFim),
        fim_lat: pos?.coords.latitude,
        fim_lng: pos?.coords.longitude,
        observacoes_final: obsFinal,
        status: 'finalizada',
        finalizada_em: new Date().toISOString(),
      }).eq('id', corridaId);

      await supabase.from('veiculos').update({ status: 'disponivel', km_atual: Number(kmFim) }).eq('id', veiculoId);

      if (trackingRef.current) clearInterval(trackingRef.current);
      toast.success('Corrida finalizada!');
      navigate('/veiculos');
    } catch {
      toast.error('Erro ao finalizar corrida');
    }
    setLoading(false);
  };

  const registrarAbastecimento = async () => {
    if (!abastValor || !abastKm) { toast.error('Preencha todos os campos'); return; }
    try {
      await supabase.from('abastecimentos').insert({
        corrida_id: corridaId,
        motorista_id: profile!.id,
        veiculo_id: veiculoId,
        valor: Number(abastValor),
        km: Number(abastKm),
      });
      toast.success('Abastecimento registrado!');
      setShowAbast(false);
      setAbastValor('');
      setAbastKm('');
    } catch {
      toast.error('Erro ao registrar abastecimento');
    }
  };

  const registrarZonaAzul = async () => {
    if (!zonaValor) { toast.error('Informe o valor'); return; }
    try {
      await supabase.from('zona_azul').insert({
        corrida_id: corridaId,
        motorista_id: profile!.id,
        valor: Number(zonaValor),
        localizacao: zonaLocal,
      });
      toast.success('Zona azul registrada!');
      setShowZona(false);
      setZonaValor('');
      setZonaLocal('');
    } catch {
      toast.error('Erro ao registrar zona azul');
    }
  };

  useEffect(() => {
    return () => {
      if (trackingRef.current) clearInterval(trackingRef.current);
    };
  }, []);

  const fotoPositions: { key: FotoPosition; label: string }[] = [
    { key: 'frente', label: 'Frente' },
    { key: 'traseira', label: 'Traseira' },
    { key: 'lado_direito', label: 'Lado Direito' },
    { key: 'lado_esquerdo', label: 'Lado Esquerdo' },
  ];

  if (step === 'inicio') {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="p-4 pb-20 space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" />
                Iniciar Corrida
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Km Inicial *</Label>
                <Input type="number" value={kmInicio} onChange={(e) => setKmInicio(e.target.value)} placeholder="Ex: 45230" />
              </div>
              <div className="space-y-2">
                <Label>Destino</Label>
                <Input value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Ex: Aeroporto de Guarulhos" />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações iniciais..." rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Fotos do Veículo
              </h2>
              <p className="text-sm text-muted-foreground">Tire 4 fotos do veículo</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {fotoPositions.map(({ key, label }) => (
                  <label key={key} className="cursor-pointer">
                    <div className={`flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                      fotosInicio[key] ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'
                    }`}>
                      {fotosInicio[key] ? (
                        <img src={fotosInicio[key]!} alt={label} className="h-full w-full rounded-xl object-cover" />
                      ) : (
                        <>
                          <Camera className="mb-1 h-6 w-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFotoUpload(key, e.target.files[0])} />
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={startCorrida} className="w-full gradient-primary text-primary-foreground h-12 text-base" disabled={loading}>
            {loading ? 'Iniciando...' : '🚗 Iniciar Corrida'}
          </Button>
        </main>
      </div>
    );
  }

  if (step === 'em_andamento') {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="p-4 pb-20 space-y-4">
          <Card className="border-primary/30 bg-accent/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 animate-pulse rounded-full bg-success" />
                <div>
                  <p className="font-semibold">Corrida em Andamento</p>
                  <p className="text-sm text-muted-foreground">
                    {destino ? `Destino: ${destino}` : 'GPS rastreando...'} • Km: {kmInicio}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setShowAbast(true)} className="h-20 flex-col gap-2">
              <Fuel className="h-6 w-6 text-primary" />
              <span className="text-xs">Abastecimento</span>
            </Button>
            <Button variant="outline" onClick={() => setShowZona(true)} className="h-20 flex-col gap-2">
              <ParkingCircle className="h-6 w-6 text-primary" />
              <span className="text-xs">Zona Azul</span>
            </Button>
          </div>

          <Button onClick={() => setStep('finalizando')} className="w-full h-12 text-base" variant="destructive">
            <Flag className="mr-2 h-5 w-5" />
            Finalizar Corrida
          </Button>
        </main>

        <Dialog open={showAbast} onOpenChange={setShowAbast}>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Abastecimento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Valor (R$)</Label>
                <Input type="number" value={abastValor} onChange={(e) => setAbastValor(e.target.value)} placeholder="150.00" />
              </div>
              <div className="space-y-1">
                <Label>Km Atual</Label>
                <Input type="number" value={abastKm} onChange={(e) => setAbastKm(e.target.value)} placeholder="45500" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAbast(false)}>Cancelar</Button>
              <Button onClick={registrarAbastecimento}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showZona} onOpenChange={setShowZona}>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Zona Azul</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Valor (R$)</Label>
                <Input type="number" value={zonaValor} onChange={(e) => setZonaValor(e.target.value)} placeholder="5.00" />
              </div>
              <div className="space-y-1">
                <Label>Localização</Label>
                <Input value={zonaLocal} onChange={(e) => setZonaLocal(e.target.value)} placeholder="Rua Augusta, 200" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowZona(false)}>Cancelar</Button>
              <Button onClick={registrarZonaAzul}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Finalizando
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="p-4 pb-20 space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              Finalizar Corrida
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Km Final *</Label>
              <Input type="number" value={kmFim} onChange={(e) => setKmFim(e.target.value)} placeholder="Ex: 45280" />
            </div>
            <div className="space-y-2">
              <Label>Observações Finais</Label>
              <Textarea value={obsFinal} onChange={(e) => setObsFinal(e.target.value)} placeholder="Observações finais..." rows={3} />
            </div>
            <Button onClick={finalizarCorrida} className="w-full gradient-primary text-primary-foreground h-12" disabled={loading}>
              {loading ? 'Finalizando...' : '✅ Finalizar Corrida'}
            </Button>
            <Button variant="outline" onClick={() => setStep('em_andamento')} className="w-full">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
