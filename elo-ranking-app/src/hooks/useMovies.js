// src/hooks/useMovies.js
import { useState, useEffect } from 'react';
import { tmdbApi } from '../services/tmdb';

export const useMovies = (page = 1) => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                setLoading(true);
                const data = await tmdbApi.getPopularMovies(page);
                setMovies(data.results);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, [page]);

    return { movies, loading, error };
};