import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Car, Plus, Wrench, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Veiculo {
  id: string;
  nome: string;
  placa: string;
  km_atual: number;
  status: string;
}

export default function AdminVeiculosPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<Veiculo | null>(null);
  const [newVeiculo, setNewVeiculo] = useState({ nome: '', placa: '', km_atual: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadVeiculos(); }, []);

  const loadVeiculos = async () => {
    const { data } = await supabase.from('veiculos').select('*').order('nome');
    setVeiculos((data || []) as Veiculo[]);
    setLoading(false);
  };

  const createVeiculo = async () => {
    if (!newVeiculo.nome || !newVeiculo.placa) { toast.error('Preencha nome e placa'); return; }
    setCreating(true);
    try {
      await supabase.from('veiculos').insert({
        nome: newVeiculo.nome,
        placa: newVeiculo.placa.toUpperCase(),
        km_atual: Number(newVeiculo.km_atual) || 0,
      });
      toast.success('Veículo cadastrado!');
      setShowCreate(false);
      setNewVeiculo({ nome: '', placa: '', km_atual: '' });
      loadVeiculos();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cadastrar');
    }
    setCreating(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('veiculos').update({ status }).eq('id', id);
    toast.success('Status atualizado');
    loadVeiculos();
    setShowEdit(null);
  };

  const updateKm = async (id: string, km: number) => {
    await supabase.from('veiculos').update({ km_atual: km }).eq('id', id);
    toast.success('Km atualizado');
    loadVeiculos();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'disponivel': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'em_uso': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'manutencao': return <Wrench className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="p-4 pb-20 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Gestão de Veículos</h2>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gradient-primary text-primary-foreground">
            <Plus className="mr-1 h-4 w-4" /> Novo
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />)}</div>
        ) : (
          <div className="space-y-3">
            {veiculos.map(v => (
              <Card key={v.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowEdit(v)}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                    <Car className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{v.nome}</h3>
                    <p className="text-sm text-muted-foreground">{v.placa} • {v.km_atual?.toLocaleString()} km</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(v.status)}
                    <Badge variant={v.status === 'disponivel' ? 'default' : v.status === 'em_uso' ? 'secondary' : 'destructive'} className="text-xs">
                      {v.status === 'disponivel' ? 'Disponível' : v.status === 'em_uso' ? 'Em Uso' : 'Manutenção'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Veículo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nome</Label><Input value={newVeiculo.nome} onChange={e => setNewVeiculo(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Civic 2024" /></div>
            <div className="space-y-1"><Label>Placa</Label><Input value={newVeiculo.placa} onChange={e => setNewVeiculo(p => ({ ...p, placa: e.target.value }))} placeholder="ABC1D23" /></div>
            <div className="space-y-1"><Label>Km Atual</Label><Input type="number" value={newVeiculo.km_atual} onChange={e => setNewVeiculo(p => ({ ...p, km_atual: e.target.value }))} placeholder="0" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={createVeiculo} disabled={creating}>{creating ? 'Criando...' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar {showEdit?.nome}</DialogTitle></DialogHeader>
          {showEdit && (
            <div className="space-y-4">
              <div className="text-sm"><strong>Placa:</strong> {showEdit.placa}</div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={showEdit.status} onValueChange={v => updateStatus(showEdit.id, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="em_uso">Em Uso</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Km Atual</Label>
                <div className="flex gap-2">
                  <Input type="number" defaultValue={showEdit.km_atual} id="editKm" />
                  <Button onClick={() => {
                    const el = document.getElementById('editKm') as HTMLInputElement;
                    updateKm(showEdit.id, Number(el.value));
                  }}>Salvar</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
