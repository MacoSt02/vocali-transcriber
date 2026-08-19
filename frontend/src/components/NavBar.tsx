import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function NavBar() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="flex items-center justify-between border-b bg-background px-8 py-4">
      <div className="flex gap-6 text-sm font-medium text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground">
          Transcribir
        </Link>
        <Link to="/history" className="hover:text-foreground">
          Historial
        </Link>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{email}</span>
        <Button variant="secondary" size="sm" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>
    </nav>
  );
}
