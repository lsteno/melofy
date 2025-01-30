import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { tmdbApi, getImageUrl } from '@/services/tmdb';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function MovieSearch() {
  // State management for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);

  // Create a debounced search function that only triggers after 500ms of no typing
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query) {
        setMovies([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await tmdbApi.searchMovies(query);
        setMovies(data.results.slice(0, 5)); // Limit results to 5 movies
      } catch (err) {
        setError(err.message);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    }, 500),
    [] // Empty dependency array since we don't want to recreate the debounced function
  );

  // Handle input changes
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle movie selection
  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setMovies([]); // Clear search results
    setSearchTerm(''); // Clear search input
  };

  // Cleanup debounced function on component unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="space-y-4">
        {/* Search Input */}
        <Input
          type="text"
          placeholder="Search for movies..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full"
        />

        {/* Loading State */}
        {loading && <div className="text-center">Searching movies...</div>}

        {/* Error State */}
        {error && <div className="text-red-500">{error}</div>}

        {/* Search Results */}
        {movies.length > 0 && (
          <div className="absolute z-10 w-full max-w-2xl bg-white shadow-lg rounded-md border">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-4"
                onClick={() => handleMovieSelect(movie)}
              >
                {movie.posterPath && (
                  <img
                    src={getImageUrl(movie.posterPath, 'w92')}
                    alt={movie.title}
                    className="w-12 h-18 object-cover rounded"
                  />
                )}
                <div>
                  <div className="font-medium">{movie.title}</div>
                  <div className="text-sm text-gray-500">
                    {movie.releaseDate?.split('-')[0]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Movie Display */}
        {selectedMovie && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {selectedMovie.posterPath && (
                  <img
                    src={getImageUrl(selectedMovie.posterPath)}
                    alt={selectedMovie.title}
                    className="w-48 rounded"
                  />
                )}
                <div>
                  <h2 className="text-xl font-bold">{selectedMovie.title}</h2>
                  <p className="text-gray-500">
                    Released: {selectedMovie.releaseDate}
                  </p>
                  <p className="mt-2">{selectedMovie.overview}</p>
                  <p className="mt-2">
                    Rating: {selectedMovie.voteAverage.toFixed(1)}/10
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
