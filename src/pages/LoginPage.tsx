import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Car, Mail, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'reset'>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      toast.error('Erro ao enviar email de recuperação.');
    } else {
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setMode('login');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 gradient-primary">
      <div className="mb-8 text-center animate-fade-in">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-sm">
          <Car className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-extrabold text-primary-foreground">NupDrive</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">Gestão de Frota • ANUP</p>
      </div>

      <Card className="w-full max-w-sm animate-slide-up border-0 shadow-2xl">
        <CardHeader className="pb-4">
          {mode === 'reset' && (
            <button onClick={() => setMode('login')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="h-4 w-4" /> Voltar ao login
            </button>
          )}
          <h2 className="text-xl font-bold text-foreground">
            {mode === 'login' ? 'Entrar' : 'Recuperar Senha'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === 'login' ? 'Acesse sua conta NupDrive' : 'Enviaremos um link para redefinir sua senha'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={mode === 'login' ? handleLogin : handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {mode === 'login' && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Enviar Link'}
            </Button>

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => setMode('reset')}
                className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Esqueci minha senha
              </button>
            )}
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-primary-foreground/50">
        © {new Date().getFullYear()} ANUP • NupDrive v1.0
      </p>
    </div>
  );
}
