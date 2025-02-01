import { Link } from 'react-router-dom';
import { useUser } from '@supabase/auth-helpers-react';

export const Navbar = () => {
  const user = useUser();
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex h-16 justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            ELO Ranking
          </Link>
          <div className="flex gap-4">
            <Link to="/lists" className="hover:text-gray-600">
              My Lists
            </Link>
            {user ? (
              <Link to="/profile" className="hover:text-gray-600">
                Profile
              </Link>
            ) : (
              <Link to="/auth" className="hover:text-gray-600">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
