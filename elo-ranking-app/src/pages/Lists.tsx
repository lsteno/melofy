import { MovieSearch } from '../components/ui/MovieSearch';

export const ListsPage = () => {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-center my-8">Movie Search</h1>
      <MovieSearch />
    </div>
  );
};
