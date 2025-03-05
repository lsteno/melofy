//
// IMPORTS
//
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MovieSearch } from '@/components/ui/MovieSearch';
import { getImageUrl } from '@/services/tmdb';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

//
// TYPES
//

interface ListItem {
  id: number; // Adjust type if your ID is a string
  tmdb_id: number;
  title: string;
  poster_path: string;
}

interface Movie {
  id: number;
  title: string;
  posterPath: string;
}

interface MovieDetails {
  overview: string;
  release_date: string;
  vote_average: number;
  // add other details if needed
}

//
// API CALL: Fetch movie details from TMDB
//

async function fetchMovieDetails(tmdbId: number): Promise<MovieDetails> {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY; // Replace with your TMDB API key or use an environment variable
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch movie details');
  }
  const data = await response.json();
  return data;
}

//
// MOVIE CARD COMPONENT
//

interface MovieCardProps {
  movie: ListItem;
  onDelete: (movie: ListItem) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded && !details) {
      setLoadingDetails(true);
      setDetailsError(null);
      fetchMovieDetails(movie.tmdb_id)
        .then((data) => setDetails(data))
        .catch((error) => setDetailsError(error.message))
        .finally(() => setLoadingDetails(false));
    }
  }, [isExpanded, details, movie.tmdb_id]);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(movie);
  };

  return (
    <motion.div layout className="cursor-pointer">
      <Card className="hover:shadow-lg transition-shadow max-w-[200px] mx-auto relative group">
        <div
          className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20 p-1"
          onClick={handleDeleteClick}
        >
          <FontAwesomeIcon
            icon={faCircleXmark}
            size="2x"
            className="cursor-pointer text-red-500 hover:text-red-700 bg-white rounded-full"
          />
        </div>
        <CardContent className="p-2 relative" onClick={toggleExpand}>
          <img
            src={getImageUrl(movie.poster_path, 'w500')}
            alt={movie.title}
            className="w-full aspect-[2/3] object-cover rounded-md"
          />
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-2 bg-black/80 text-white rounded-md p-3 overflow-y-auto"
                style={{ maxHeight: "calc(100% - 16px)" }}
              >
                {loadingDetails ? (
                  <p className="text-sm text-center">Loading details...</p>
                ) : detailsError ? (
                  <p className="text-sm text-red-500 text-center">
                    Error: {detailsError}
                  </p>
                ) : details ? (
                  <div className="text-sm">
                    <p className="mb-2">{details.overview}</p>
                    <p className="mt-2">
                      <strong>Release:</strong> {details.release_date}
                    </p>
                    <p>
                      <strong>Rating:</strong> {details.vote_average}
                    </p>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
          <CardHeader className="p-0 pt-2">
            <CardTitle className="text-base text-center truncate px-1">
              {movie.title}
            </CardTitle>
          </CardHeader>
        </CardContent>
      </Card>
    </motion.div>
  );
};

//
// MAIN LIST COMPONENT
//

export const List: React.FC = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const { listId } = useParams<{ listId: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lists, setLists] = useState<ListItem[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchLists();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchLists = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from<ListItem>('list_items')
      .select('id, tmdb_id, title, poster_path')
      .eq('list_id', listId)
      .order('added_at', { ascending: false });

    if (error) {
      setError('Error fetching elements: ' + error.message);
    } else {
      setLists(data || []);
    }
    setLoading(false);
  };

  const handleAddMovie = async (selectedMovie: Movie) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('You must be logged in to add movies to a list.');
      setLoading(false);
      return;
    }

    // Insert the movie into your "list_items" table.
    const { data, error } = await supabase
      .from('list_items')
      .insert([
        {
          list_id: listId,
          tmdb_id: selectedMovie.id,
          title: selectedMovie.title,
          poster_path: selectedMovie.posterPath,
          elo_rating: 1000,
          position: 0,
        },
      ])
      .select();

    if (error) {
      setError(error.message);
    } else {
      setLists((prev) => [data[0], ...prev]);
      setSuccess('Item added successfully!');
    }

    setLoading(false);
  };

  const handleDeleteMovie = async (selectedMovie: ListItem) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('You must be logged in to delete movies from a list.');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('list_items')
      .delete()
      .eq('id', selectedMovie.id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Item removed successfully!');
      fetchLists();
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Button to start a battle */}
      <div className="mb-12 max-w-2xl mx-auto">
        <Button onClick={() => navigate(`/list/${listId}/battle`)}>
          Battle!
        </Button>
      </div>
      <div className="mb-12 max-w-2xl mx-auto">
        <MovieSearch onButtonClick={handleAddMovie} />
      </div>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : lists.length === 0 ? (
        <p className="text-gray-500 text-center">No elements found. Add one!</p>
      ) : (
        // Grid of movie cards
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-center">
          {lists.map((list) => (
            <MovieCard
              key={list.id}
              movie={list}
              onDelete={handleDeleteMovie}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default List;
