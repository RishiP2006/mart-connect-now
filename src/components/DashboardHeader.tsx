import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, User, Home } from 'lucide-react';
import { toast } from 'sonner';
import { CartDrawer } from './CartDrawer';

interface DashboardHeaderProps {
  title: string;
  role: 'customer' | 'retailer' | 'wholesaler';
}

export const DashboardHeader = ({ title, role }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
      navigate('/');
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Home className="h-5 w-5" />
            <span className="font-bold text-lg">Live MART</span>
          </Link>
          <span className="text-sm text-muted-foreground">| {title}</span>
        </div>

        <nav className="flex items-center gap-3">
          {role === 'customer' && (
            <>
              <Button variant="ghost" asChild>
                <Link to="/products">Browse Products</Link>
              </Button>
              <CartDrawer />
            </>
          )}

          <Button variant="ghost" size="icon" asChild>
            <Link to="/profile" aria-label="Profile">
              <User className="h-5 w-5" />
            </Link>
          </Button>

          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );
};
