import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Users, Shield, Car as CarIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  pode_dirigir: boolean;
  ativo: boolean;
}

export default function AdminUsuariosPage() {
  const { profile } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ nome: '', email: '', senha: '', tipo: 'motorista', pode_dirigir: true });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadUsuarios(); }, []);

  const loadUsuarios = async () => {
    const { data } = await supabase.from('usuarios').select('*').order('nome');
    setUsuarios((data || []) as Usuario[]);
    setLoading(false);
  };

  const createUser = async () => {
    if (!newUser.nome || !newUser.email || !newUser.senha) {
      toast.error('Preencha todos os campos');
      return;
    }
    setCreating(true);
    try {
      // Create auth user via edge function (admin only)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.senha,
      });
      if (authError) throw authError;

      if (authData.user) {
        await supabase.from('usuarios').insert({
          id: authData.user.id,
          nome: newUser.nome,
          email: newUser.email,
          tipo: newUser.tipo,
          pode_dirigir: newUser.pode_dirigir,
          ativo: true,
        });
      }

      toast.success('Usuário criado com sucesso!');
      setShowCreate(false);
      setNewUser({ nome: '', email: '', senha: '', tipo: 'motorista', pode_dirigir: true });
      loadUsuarios();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar usuário');
    }
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="p-4 pb-20 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Usuários</h2>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gradient-primary text-primary-foreground">
            <UserPlus className="mr-1 h-4 w-4" /> Novo
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {usuarios.map((u) => (
              <Card key={u.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                    {u.tipo === 'admin' ? <Shield className="h-5 w-5 text-primary" /> : <CarIcon className="h-5 w-5 text-secondary" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{u.nome}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={u.tipo === 'admin' ? 'default' : 'secondary'}>{u.tipo}</Badge>
                    <span className={`text-xs ${u.ativo ? 'text-success' : 'text-destructive'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={newUser.nome} onChange={(e) => setNewUser(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Senha</Label>
              <Input type="password" value={newUser.senha} onChange={(e) => setNewUser(p => ({ ...p, senha: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={newUser.tipo} onValueChange={(v) => setNewUser(p => ({ ...p, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="motorista">Motorista</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newUser.pode_dirigir} onCheckedChange={(v) => setNewUser(p => ({ ...p, pode_dirigir: v }))} />
              <Label>Pode dirigir</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={createUser} disabled={creating}>
              {creating ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
