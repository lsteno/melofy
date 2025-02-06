// components/MovieBattle.jsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateElo } from '@/lib/elo';
import { getImageUrl } from '@/services/tmdb';

export default function MovieBattle(list) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMovies = async () => {
    const { data, error } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', list.id)
      .order('elo_rating', { ascending: false })
      .limit(2);

    if (!error && data.length === 2) {
      setMovies(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleBattle = async (winnerId) => {
    const winner = movies.find((m) => m.id === winnerId);
    const loser = movies.find((m) => m.id !== winnerId);

    const [newWinnerRating, newLoserRating] = calculateElo(
      winner.elo_rating,
      loser.elo_rating
    );

    // Update Supabase
    await supabase
      .from('list_items')
      .update({ elo_rating: newWinnerRating })
      .eq('id', winner.id);

    await supabase
      .from('list_items')
      .update({ elo_rating: newLoserRating })
      .eq('id', loser.id);

    // Fetch new pair
    await fetchMovies();
  };

  if (isLoading) return <div>Loading...</div>;
  console.log(movies);
  if (movies.length < 2) return <div>Add at least 2 movies to battle!</div>;

  return (
    <div className="battle-container">
      {movies.map((movie) => (
        <div
          key={movie.id}
          className="movie-card"
          onClick={() => handleBattle(movie.id)}
        >
          <img src={getImageUrl(movie.poster_path)} alt={movie.title} />
          <h3>{movie.title}</h3>
          <div className="elo-rating">Rating: {movie.elo_rating}</div>
        </div>
      ))}
    </div>
  );
}
