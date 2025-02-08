// ImportLetterboxdMovies.tsx
import React, { useState } from 'react';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';


// Replace these with your actual Supabase project URL and anon key.
const SUPABASE_URL = 'https://your-supabase-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';

// Initialize the Supabase client.
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Define the TypeScript interface for a diary entry.
interface DiaryItem {
  type: 'diary';
  date: {
    published: number;
    watched: number;
  };
  film: {
    title: string;
    year: string;
    image: {
      tiny?: string;
      small?: string;
      medium?: string;
      large?: string;
    };
  };
  rating: { text: string; score: number };
  review: string;
  spoilers: boolean;
  isRewatch: boolean;
  uri: string;
}

const ImportLetterboxdMovies: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleImport = async (): Promise<void> => {
    setStatus('');
    if (!username.trim()) {
      setStatus('Please enter a Letterboxd username.');
      return;
    }
    setLoading(true);

    // Ensure the user is logged in.
    const user: User | null = supabase.auth.user();
    if (!user) {
      setStatus('User not logged in! Please log in first.');
      setLoading(false);
      return;
    }

    try {
      // Fetch and process the Letterboxd feed using the helper module.
      const items = await letterboxd(username.trim());
      if (!items || items.length === 0) {
        throw new Error('No items returned from Letterboxd.');
      }
      // Filter for diary entries (movie watch events).
      const diaryItems = items.filter(
        (item: any) => item.type === 'diary'
      ) as DiaryItem[];
      if (diaryItems.length === 0) {
        throw new Error('No diary entries found in the feed.');
      }
      console.log(
        `Fetched ${diaryItems.length} diary entries from Letterboxd.`
      );

      // Create a new list in Supabase.
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
      console.log(`Created list with id ${listId}`);

      // Insert each diary entry as a list item.
      for (const diary of diaryItems) {
        // Use a default TMDB ID (e.g., 0) since the RSS feed doesn’t provide one.
        // Choose a poster image from the diary entry (medium preferred, then small).
        const title = diary.film.title;
        const posterPath =
          diary.film.image?.medium || diary.film.image?.small || '';

        const { error: itemError } = await supabase.from('list_items').insert([
          {
            list_id: listId,
            tmdb_id: 0, // Default value; adjust if you have a way to resolve a TMDB id.
            title: title,
            poster_path: posterPath,
          },
        ]);
        if (itemError) {
          console.error(`Error inserting movie "${title}":`, itemError);
        } else {
          console.log(`Inserted movie "${title}" successfully.`);
        }
      }

      setStatus('Letterboxd import complete.');
    } catch (error: any) {
      console.error('Error importing Letterboxd movies:', error);
      setStatus(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Import Letterboxd Movies</h2>
      <input
        type="text"
        placeholder="Enter Letterboxd username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />
      <button
        onClick={handleImport}
        disabled={loading}
        style={{ padding: '10px 20px' }}
      >
        {loading ? 'Importing...' : 'Import'}
      </button>
      {status && <p style={{ marginTop: '15px' }}>{status}</p>}
    </div>
  );
};

export default ImportLetterboxdMovies;
