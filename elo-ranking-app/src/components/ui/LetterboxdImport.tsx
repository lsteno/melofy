import React, { useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

// Define the Movie interface.
interface Movie {
  title: string;
  tmdbId: number;
  posterPath: string | null;
}

/**
 * Fetches the Letterboxd RSS feed for a given username, parses the XML,
 * and returns an array of cleaned movie data.
 *
 * @param username - The Letterboxd username.
 * @returns A promise that resolves to an array of Movie objects.
 */
async function fetchLetterboxdMovies(username: string): Promise<Movie[]> {
  const rssUrl = `https://letterboxd.com/${username.trim()}/rss/`;
  // Use the AllOrigins proxy
  const corsProxy =
    'https://api.allorigins.hexocode.repl.co/get?disableCache=true&url=';
  const proxyUrl = corsProxy + encodeURIComponent(rssUrl);

  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
  }

  const data = await response.json();
  // AllOrigins returns JSON with a "contents" field containing the original feed.
  const rssText = data.contents;

  // Parse the XML using DOMParser.
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(rssText, 'application/xml');
  const items = xmlDoc.querySelectorAll('item');

  if (items.length === 0) {
    throw new Error('No movies found in the feed.');
  }

  const movies: Movie[] = [];

  items.forEach((item) => {
    // Get the film title from <letterboxd:filmTitle> (fallback to <title>).
    const filmTitleElem = item.getElementsByTagName('letterboxd:filmTitle')[0];
    const titleElem = item.getElementsByTagName('title')[0];
    const title = filmTitleElem?.textContent || titleElem?.textContent || '';
    if (!title) return; // Skip if title is missing

    // Get the TMDB movie ID.
    const tmdbIdElem = item.getElementsByTagName('tmdb:movieId')[0];
    if (!tmdbIdElem || !tmdbIdElem.textContent) return; // Skip if TMDB ID is missing
    const tmdbId = parseInt(tmdbIdElem.textContent, 10);

    // Extract the poster URL from the description (which contains HTML).
    let posterPath: string | null = null;
    const descriptionElem = item.getElementsByTagName('description')[0];
    if (descriptionElem && descriptionElem.textContent) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = descriptionElem.textContent;
      const imgElem = tempDiv.querySelector('img');
      if (imgElem) {
        posterPath = imgElem.getAttribute('src');
      }
    }

    movies.push({
      title: title.trim(),
      tmdbId,
      posterPath,
    });
  });

  return movies;
}

const ImportLetterboxdMovies: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const supabase = useSupabaseClient();
  const user = useUser();

  const handleImport = async (): Promise<void> => {
    setStatus('');
    if (!username.trim()) {
      setStatus('Please enter a Letterboxd username.');
      return;
    }
    setLoading(true);

    // Check that the user is logged in.
    if (!user) {
      setStatus('User not logged in! Please log in first.');
      setLoading(false);
      return;
    }

    try {
      // Use the helper function to fetch and clean up the movies.
      const movies = await fetchLetterboxdMovies(username);
      console.log(
        `Fetched ${movies.length} movies from Letterboxd for ${username}`
      );

      // Upload to Supabase: Create a new list.
      const listTitle = `Letterboxd Import - ${username.trim()}`;
      const { data: listData, error: listError } = await supabase
        .from('lists')
        .insert([
          {
            user_id: user.id,
            title: listTitle,
            description: 'Movies imported from Letterboxd',
            category: 'MOVIES',
          },
        ])
        .single();

      if (listError || !listData) {
        throw new Error(`Error creating list: ${listError?.message}`);
      }
      const listId: string = listData.id;
      console.log(`Created new list with ID: ${listId}`);

      // Upload each movie into the list_items table.
      for (const movie of movies) {
        const { error: itemError } = await supabase.from('list_items').insert([
          {
            list_id: listId,
            tmdb_id: movie.tmdbId,
            title: movie.title,
            poster_path: movie.posterPath,
          },
        ]);
        if (itemError) {
          console.error(
            `Error inserting "${movie.title}" (TMDB ID: ${movie.tmdbId}):`,
            itemError
          );
        } else {
          console.log(
            `Imported movie: ${movie.title} (TMDB ID: ${movie.tmdbId})`
          );
        }
      }

      setStatus('Letterboxd import complete.');
    } catch (error: any) {
      console.error('Error during import:', error);
      setStatus(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Import Letterboxd Movies</h2>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Enter Letterboxd username"
          value={username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setUsername(e.target.value)
          }
          style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
        />
      </div>
      <button
        onClick={handleImport}
        disabled={loading}
        style={{ padding: '10px 20px', cursor: 'pointer' }}
      >
        {loading ? 'Importing...' : 'Import'}
      </button>
      {status && <p style={{ marginTop: '15px' }}>{status}</p>}
    </div>
  );
};

export default ImportLetterboxdMovies;
