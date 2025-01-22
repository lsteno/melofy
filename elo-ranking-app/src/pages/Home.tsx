import { Button } from '@/components/ui/button';
import { CardSpinner } from '@/components/ui/CardSpinner';

export const HomePage = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          Welcome to ELO Ranking
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Create and share ranked lists of anything. From movies to sports
          teams, books to restaurants - rank what matters to you!
        </p>
        <div className="h-64 mb-8">
          <CardSpinner />
        </div>
        <Button asChild className="mb-12">
          <a href="/create-list">Create Your First List</a>
        </Button>

        <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-4">
            Example: Top Sci-Fi Movies
          </h2>
          <ol className="text-left list-decimal list-inside">
            <li className="mb-2">Inception</li>
            <li className="mb-2">The Matrix</li>
            <li className="mb-2">Interstellar</li>
            <li className="mb-2">Blade Runner</li>
            <li className="mb-2">2001: A Space Odyssey</li>
          </ol>
        </div>
      </div>
    </main>
  );
};
