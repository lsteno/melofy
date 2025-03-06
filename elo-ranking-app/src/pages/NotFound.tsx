import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto flex flex-col justify-center items-center min-h-screen p-6">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-6">
        The page you are looking for does not exist.
      </p>
      <Button onClick={() => navigate('/')}>Go Home</Button>
    </div>
  );
};
