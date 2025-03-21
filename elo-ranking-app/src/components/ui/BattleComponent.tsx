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
  // Main state for movie management
  const [allMovies, setAllMovies] = useState<MovieItem[]>([]);
  const [currentPair, setCurrentPair] = useState<MovieItem[]>([]);
  const [nextPair, setNextPair] = useState<MovieItem[]>([]);

  // UI state management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [battleCount, setBattleCount] = useState(0);
  const [winStreak, setWinStreak] = useState<WinStreak>({});
  const [winner, setWinner] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progressValues, setProgressValues] = useState<{
    [key: number]: number;
  }>({});

  const selectMoviePair = (
    movies: MovieItem[],
    previousPair: MovieItem[]
  ): MovieItem[] => {
    const RANGE_SIZE = 100; // Group movies within 100 rating points
    const ratingGroups: { [key: number]: MovieItem[] } = {};

    // Group movies by rating ranges for fairer matches
    movies.forEach((movie) => {
      const ratingGroup = Math.floor(movie.elo_rating / RANGE_SIZE);
      if (!ratingGroups[ratingGroup]) ratingGroups[ratingGroup] = [];
      ratingGroups[ratingGroup].push(movie);
    });

    const validGroups = Object.values(ratingGroups).filter(
      (group) => group.length >= 2
    );

    if (validGroups.length === 0) {
      // Fallback to random selection if no valid groups
      const shuffled = [...movies].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 2);
    }

    const selectedGroup =
      validGroups[Math.floor(Math.random() * validGroups.length)];
    let attempts = 0;
    const MAX_ATTEMPTS = 10;
    let selectedPair: MovieItem[];

    // Try to find a pair that wasn't in the previous battle
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

  const animateProgress = (
    movieId: number,
    startValue: number,
    endValue: number,
    isWinner: boolean
  ) => {
    setProgressValues((prev) => ({ ...prev, [movieId]: startValue }));

    const duration = 1000; // Animation duration in milliseconds
    const steps = 60; // 60fps animation
    const stepTime = duration / steps;
    const valueChange = endValue - startValue;

    const targetValue = isWinner ? endValue + 20 : endValue;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Cubic easing for smooth animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setProgressValues((prev) => ({
        ...prev,
        [movieId]: startValue + valueChange * easeProgress,
      }));

      if (currentStep >= steps) {
        clearInterval(interval);
        // Reset to actual value after animation
        setTimeout(() => {
          setProgressValues((prev) => ({
            ...prev,
            [movieId]: endValue,
          }));
        }, 500);
      }
    }, stepTime);
  };

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

  const handleBattle = async (winnerId: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setWinner(winnerId);

    const winner = currentPair.find((m) => m.id === winnerId)!;
    const loser = currentPair.find((m) => m.id !== winnerId)!;

    // Update win streak and calculate new ratings
    const winnerStreak = (winStreak[winnerId] || 0) + 1;
    setWinStreak((prev) => ({
      ...prev,
      [winnerId]: winnerStreak,
      [loser.id]: 0,
    }));

    const kFactor = 32 * (1 + winnerStreak * 0.1);
    const [newWinnerRating, newLoserRating] = calculateElo(
      winner.elo_rating,
      loser.elo_rating,
      kFactor
    );

    // Start progress animations
    animateProgress(
      winner.id,
      winner.elo_rating / 20,
      newWinnerRating / 20,
      true
    );
    animateProgress(
      loser.id,
      loser.elo_rating / 20,
      newLoserRating / 20,
      false
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

    // Wait for animation to complete
    setTimeout(async () => {
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
      }
    }, 1000);
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
              initial={{ opacity: 1 }}
              animate={{
                opacity: winner === null ? 1 : winner === movie.id ? 1 : 0.7,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: isTransitioning ? 1 : 1.02 }}
              whileTap={{ scale: isTransitioning ? 1 : 0.98 }}
              className="w-full max-w-md mx-auto" // Added max-width and centering
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
                  <AnimatePresence>
                    {winner === movie.id && winStreak[movie.id] > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                      >
                        <div className="text-center text-white">
                          <div className="text-4xl font-bold mb-2">🔥</div>
                          <div className="text-2xl font-bold">
                            {winStreak[movie.id]} Win
                            {winStreak[movie.id] > 1 ? 's' : ''}!
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <CardContent className="p-6">
                  {' '}
                  {/* Increased padding */}
                  <h3
                    className="text-xl font-semibold mb-4 leading-tight min-h-[3.5rem] line-clamp-2"
                    title={movie.title} // Show full title on hover
                  >
                    {movie.title}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        ELO Rating
                      </span>
                      <span className="font-medium">
                        {Math.round(movie.elo_rating)}
                      </span>
                    </div>
                    <Progress
                      value={progressValues[movie.id] ?? movie.elo_rating / 20}
                      className={`transition-all duration-300 ${
                        winner === movie.id
                          ? 'bg-muted [&>div]:bg-green-500'
                          : winner !== null
                            ? 'opacity-50'
                            : ''
                      }`}
                    />
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
