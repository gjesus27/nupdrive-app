import { Car, LogOut, Menu, X, LayoutDashboard, Users, Fuel, Car as CarIcon, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationPanel } from '@/components/NotificationPanel';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const { profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = profile?.tipo === 'admin';

  const navItems = [
    ...(isAdmin ? [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
      { label: 'Usuários', icon: Users, path: '/admin/usuarios' },
      { label: 'Veículos Gestão', icon: CarIcon, path: '/admin/veiculos' },
    ] : []),
    { label: 'Veículos', icon: Car, path: '/veiculos' },
  ];

  return (
    <header className="gradient-primary sticky top-0 z-50 shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6 text-primary-foreground" />
          <h1 className="text-lg font-bold text-primary-foreground">NupDrive</h1>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-primary-foreground/80 hidden sm:block mr-2">
            {profile?.nome}
          </span>
          <NotificationPanel />
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-primary-foreground/20 px-4 py-2 animate-slide-up">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMenuOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
          <button
            onClick={() => { signOut(); setMenuOpen(false); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </nav>
      )}
    </header>
  );
}
