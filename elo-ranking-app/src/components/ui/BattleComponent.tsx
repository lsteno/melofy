import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateElo } from '@/lib/elo';
import { getImageUrl } from '@/services/tmdb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MovieItem {
  id: number;
  title: string;
  poster_path: string;
  elo_rating: number;
  list_id: number;
  created_at: string;
}

interface MovieBattleProps {
  list: number;
}

interface WinStreak {
  [key: number]: number;
}

const MovieBattle: React.FC<MovieBattleProps> = ({ list }) => {
  // State for all available movies
  const [allMovies, setAllMovies] = useState<MovieItem[]>([]);
  // Current battle pair
  const [currentPair, setCurrentPair] = useState<MovieItem[]>([]);
  // Next pair (preloaded)
  const [nextPair, setNextPair] = useState<MovieItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [battleCount, setBattleCount] = useState(0);
  const [winStreak, setWinStreak] = useState<WinStreak>({});
  const [error, setError] = useState<string | null>(null);

  // Animation states
  const [winner, setWinner] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch all movies once at the start
  const fetchAllMovies = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', list);

      if (fetchError) throw new Error(fetchError.message);
      if (!data || data.length < 2) {
        throw new Error(
          'Add at least 2 movies to your list to start battling!'
        );
      }

      setAllMovies(data);
      // Initialize both current and next pairs
      const firstPair = selectMoviePair(data, []);
      const secondPair = selectMoviePair(data, firstPair);
      setCurrentPair(firstPair);
      setNextPair(secondPair);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const selectMoviePair = (
    movies: MovieItem[],
    previousPair: MovieItem[]
  ): MovieItem[] => {
    const RANGE_SIZE = 100;
    const ratingGroups: { [key: number]: MovieItem[] } = {};

    movies.forEach((movie) => {
      const ratingGroup = Math.floor(movie.elo_rating / RANGE_SIZE);
      if (!ratingGroups[ratingGroup]) ratingGroups[ratingGroup] = [];
      ratingGroups[ratingGroup].push(movie);
    });

    const validGroups = Object.values(ratingGroups).filter(
      (group) => group.length >= 2
    );

    if (validGroups.length === 0) {
      const shuffled = [...movies].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 2);
    }

    const selectedGroup =
      validGroups[Math.floor(Math.random() * validGroups.length)];
    let attempts = 0;
    const MAX_ATTEMPTS = 10;
    let selectedPair: MovieItem[];

    do {
      const shuffled = [...selectedGroup].sort(() => Math.random() - 0.5);
      selectedPair = shuffled.slice(0, 2);
      attempts++;

      if (attempts >= MAX_ATTEMPTS) break;
    } while (
      previousPair.length > 0 &&
      selectedPair.some((movie) =>
        previousPair.some((prevMovie) => prevMovie.id === movie.id)
      )
    );

    return selectedPair;
  };

  const handleBattle = async (winnerId: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setWinner(winnerId);

    const winner = currentPair.find((m) => m.id === winnerId)!;
    const loser = currentPair.find((m) => m.id !== winnerId)!;

    // Update local state first for immediate feedback
    const winnerStreak = (winStreak[winnerId] || 0) + 1;
    setWinStreak((prev) => ({
      ...prev,
      [winnerId]: winnerStreak,
      [loser.id]: 0,
    }));

    // Calculate new ratings
    const kFactor = 32 * (1 + winnerStreak * 0.1);
    const [newWinnerRating, newLoserRating] = calculateElo(
      winner.elo_rating,
      loser.elo_rating,
      kFactor
    );

    // Update local movie ratings
    setAllMovies((prev) =>
      prev.map((movie) => {
        if (movie.id === winner.id)
          return { ...movie, elo_rating: newWinnerRating };
        if (movie.id === loser.id)
          return { ...movie, elo_rating: newLoserRating };
        return movie;
      })
    );

    // Prepare next pair while animation is playing
    const newNextPair = selectMoviePair(allMovies, nextPair);

    // Wait for animation
    setTimeout(async () => {
      // Move to next pair
      setCurrentPair(nextPair);
      setNextPair(newNextPair);
      setWinner(null);
      setIsTransitioning(false);
      setBattleCount((prev) => prev + 1);

      // Update database in background
      try {
        await Promise.all([
          supabase
            .from('list_items')
            .update({ elo_rating: newWinnerRating })
            .eq('id', winner.id),
          supabase
            .from('list_items')
            .update({ elo_rating: newLoserRating })
            .eq('id', loser.id),
        ]);
      } catch (err) {
        console.error('Failed to update database:', err);
        // Could add a toast notification here
      }
    }, 1000); // Match this with animation duration
  };

  useEffect(() => {
    fetchAllMovies();
  }, [list]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <CardContent className="text-center text-red-500">{error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-2">
          Movie Battle #{battleCount + 1}
        </h2>
        <p className="text-muted-foreground">Choose the better movie</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="wait">
          {currentPair.map((movie) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 1, scale: 1 }}
              animate={{
                opacity: winner === null ? 1 : winner === movie.id ? 1 : 0.5,
                scale: winner === null ? 1 : winner === movie.id ? 1.05 : 0.95,
                filter:
                  winner === null
                    ? 'brightness(1)'
                    : winner === movie.id
                      ? 'brightness(1.2)'
                      : 'brightness(0.8)',
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: isTransitioning ? 1 : 1.02 }}
              whileTap={{ scale: isTransitioning ? 1 : 0.98 }}
            >
              <Card
                className={`overflow-hidden cursor-pointer transition-shadow hover:shadow-lg ${
                  isTransitioning ? 'pointer-events-none' : ''
                }`}
                onClick={() => handleBattle(movie.id)}
              >
                <div className="aspect-[2/3] relative">
                  <img
                    src={getImageUrl(movie.poster_path)}
                    alt={movie.title}
                    className="object-cover w-full h-full"
                  />
                  {winner === movie.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 2 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/30"
                    >
                      <span className="text-4xl">🏆</span>
                    </motion.div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{movie.title}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        ELO Rating
                      </span>
                      <span className="font-medium">
                        {Math.round(movie.elo_rating)}
                      </span>
                    </div>
                    <Progress value={movie.elo_rating / 20} />
                    {winStreak[movie.id] > 0 && (
                      <div className="text-sm text-green-600 mt-2">
                        🔥 {winStreak[movie.id]} win streak!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => {
            if (!isTransitioning) {
              setCurrentPair(nextPair);
              setNextPair(selectMoviePair(allMovies, nextPair));
              setBattleCount((prev) => prev + 1);
            }
          }}
          disabled={isTransitioning}
        >
          Skip this battle
        </Button>
      </div>
    </div>
  );
};

export default MovieBattle;
