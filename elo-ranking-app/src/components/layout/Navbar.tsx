import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';

export const Navbar = () => {
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex h-16 justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            ELO Ranking
          </Link>

          <div className="flex gap-4">
            {user ? (
              <>
                <Link to="/lists">
                  <Button variant="ghost">My Lists</Button>
                </Link>
                <Button onClick={logout} variant="outline">
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button>Login</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
