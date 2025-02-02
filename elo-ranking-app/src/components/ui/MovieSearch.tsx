import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { tmdbApi, getImageUrl } from '@/services/tmdb';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Import the filled plus and check icons from the free-solid-svg-icons package
import { faCirclePlus, faCircleCheck } from '@fortawesome/free-solid-svg-icons';

type ChildComponentProps = {
  onButtonClick: (movie: any) => void;
};

export function MovieSearch({ onButtonClick }: ChildComponentProps) {
  // State management for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  // State to track favorite (toggled) movies by their id
  const [favoriteMovies, setFavoriteMovies] = useState([]);

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
    [] // Empty dependency array so the function is created only once
  );

  // Handle input changes
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle movie selection (clicking on the row, but not the icon)
  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setMovies([]); // Clear search results
    setSearchTerm(''); // Clear search input
  };

  const handleButtonClick = (movie) => {
    onButtonClick(movie);
  };

  // Toggle the favorite state for a given movie
  const toggleFavorite = (movieId) => {
    setFavoriteMovies((prevFavorites) => {
      if (prevFavorites.includes(movieId)) {
        return prevFavorites.filter((id) => id !== movieId);
      } else {
        return [...prevFavorites, movieId];
      }
    });
  };

  // Cleanup debounced function on component unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <div className="max-w-2xl mx-auto p-4 container">
      <div className="space-y-4 w-full">
        {/* Wrap the input and search results in a relative container */}
        <div className="relative w-full">
          {/* Search Input */}
          <Input
            type="text"
            placeholder="Search for movies..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />

          {/* Loading State */}
          {loading && (
            <div className="text-center w-full">Searching movies...</div>
          )}

          {/* Error State */}
          {error && <div className="text-red-500 w-full">{error}</div>}

          {/* Search Results */}
          {movies.length > 0 && (
            <div className="absolute left-0 z-10 w-full bg-white shadow-lg rounded-md border mt-1">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                  onClick={() => handleMovieSelect(movie)}
                >
                  <div className="flex items-center gap-4">
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
                  {/* Icon toggling between filled plus (default) and filled check (after click) */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <FontAwesomeIcon
                      icon={
                        favoriteMovies.includes(movie.id)
                          ? faCircleCheck
                          : faCirclePlus
                      }
                      size="2x"
                      className="cursor-pointer"
                      onClick={() => {
                        toggleFavorite(movie.id);
                        handleButtonClick(movie);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Movie Display */}
        {selectedMovie && (
          <Card className="mt-4 w-full">
            <CardContent className="p-4 w-full">
              <div className="flex gap-4 w-full">
                {selectedMovie.posterPath && (
                  <img
                    src={getImageUrl(selectedMovie.posterPath)}
                    alt={selectedMovie.title}
                    className="w-48 rounded"
                  />
                )}
                <div className="w-full">
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
