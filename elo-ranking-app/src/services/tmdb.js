// src/services/tmdb.js
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

import axios from 'axios';

const tmdbAxios = axios.create({
    baseURL: TMDB_BASE_URL,
    params: {
        api_key: import.meta.env.VITE_TMDB_API_KEY,
    },
    headers: {
        'Content-Type': 'application/json',
    },
});

// Utility function for image URLs
export const getImageUrl = (path, size = 'w500') => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// API service focusing on search functionality
export const tmdbApi = {
    // Search movies with enhanced error handling and response processing
    searchMovies: async (query, page = 1) => {
        try {
            if (!query?.trim()) {
                return { results: [], total_results: 0 };
            }
            
            const response = await tmdbAxios.get('/search/movie', {
                params: { 
                    query: query.trim(),
                    page,
                    include_adult: false // Filter out adult content
                }
            });
            
            // Process the results to include only necessary data
            const processedResults = response.data.results.map(movie => ({
                id: movie.id,
                title: movie.title,
                releaseDate: movie.release_date,
                posterPath: movie.poster_path,
                overview: movie.overview,
                voteAverage: movie.vote_average
            }));
            
            return {
                results: processedResults,
                total_results: response.data.total_results,
                page: response.data.page,
                total_pages: response.data.total_pages
            };
        } catch (error) {
            console.error('Error searching movies:', error);
            throw new Error('Failed to search movies. Please try again.');
        }
    }
};