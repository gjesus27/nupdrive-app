import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ClipboardCheck, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const CHECKLIST_ITEMS = [
  { id: 'oleo', label: 'Óleo' },
  { id: 'agua', label: 'Água' },
  { id: 'pneus', label: 'Pneus' },
  { id: 'farois', label: 'Faróis' },
  { id: 'combustivel', label: 'Combustível' },
];

export default function ChecklistPage() {
  const { veiculoId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Record<string, boolean>>({});
  const [observacao, setObservacao] = useState('');
  const [showObsModal, setShowObsModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleItem = (id: string) => {
    setItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allChecked = CHECKLIST_ITEMS.every((item) => items[item.id]);
  const hasUnchecked = CHECKLIST_ITEMS.some((item) => !items[item.id]) && Object.keys(items).length > 0;

  const handleSubmit = async () => {
    if (!allChecked && !observacao) {
      setShowObsModal(true);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('checklists').insert({
        motorista_id: profile!.id,
        veiculo_id: veiculoId,
        itens: items,
        observacao: observacao || null,
      });

      if (error) throw error;
      toast.success('Checklist registrado!');
      navigate(`/corrida/${veiculoId}`);
    } catch (err) {
      toast.error('Erro ao salvar checklist');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="p-4 pb-20">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                <ClipboardCheck className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Checklist Inicial</h2>
                <p className="text-sm text-muted-foreground">Verifique todos os itens antes de sair</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {CHECKLIST_ITEMS.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <Checkbox
                  checked={!!items[item.id]}
                  onCheckedChange={() => toggleItem(item.id)}
                />
                <span className="text-sm font-medium">{item.label}</span>
                {items[item.id] === false && (
                  <AlertCircle className="ml-auto h-4 w-4 text-destructive" />
                )}
              </label>
            ))}

            {observacao && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium text-muted-foreground">Observação:</p>
                <p className="text-sm">{observacao}</p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              className="w-full gradient-primary text-primary-foreground"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Confirmar e Continuar'}
            </Button>
          </CardContent>
        </Card>
      </main>

      <Dialog open={showObsModal} onOpenChange={setShowObsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Observações</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Descreva o problema encontrado:</Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Pneu traseiro com pouco ar..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowObsModal(false)}>Cancelar</Button>
            <Button onClick={() => { setShowObsModal(false); handleSubmit(); }}>
              Salvar e Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
