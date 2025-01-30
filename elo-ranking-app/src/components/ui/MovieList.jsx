// src/components/MovieList.jsx
import { useMovies } from '@/hooks/useMovies';
import { getImageUrl } from '@/services/tmdb';

export function MovieList() {
    const { movies, loading, error } = useMovies();

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {movies.map((movie) => (
                <div key={movie.id} className="movie-card">
                    <img
                        src={getImageUrl(movie.poster_path)}
                        alt={movie.title}
                        className="w-full h-auto rounded"
                    />
                    <h3 className="text-lg font-bold mt-2">{movie.title}</h3>
                    <p className="text-sm">{movie.release_date}</p>
                </div>
            ))}
        </div>
    );
}
