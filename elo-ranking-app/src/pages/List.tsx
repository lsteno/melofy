import React from 'react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MovieSearch } from '@/components/ui/MovieSearch';
import { getImageUrl } from '@/services/tmdb';

export const List = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const { listId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lists, setLists] = useState<any[]>([]);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (user) {
      fetchLists();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchLists = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('list_items')
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

  const handleAddMovie = async (selectedMovie: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('You must be logged in to add movies to a list.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('list_items').insert([
      {
        list_id: listId,
        tmdb_id: selectedMovie.id,
        title: selectedMovie.title,
        poster_path: selectedMovie.posterPath,
        elo_rating: 1000,
        position: 0,
      },
    ]);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Item added successfully!');
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : lists.length === 0 ? (
        <p className="text-gray-500 text-center">No elements found. Add one!</p>
      ) : (
        <div className="space-y-4">
          {lists.map((list) => (
            <Card key={list.id} className="hover:bg-gray-100 cursor-pointer">
              <CardHeader>
                <CardTitle>{list.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={getImageUrl(list.poster_path, 'w500')}
                  alt={list.title}
                  className="w-36 h-48 object-cover rounded-md"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <MovieSearch onButtonClick={handleAddMovie} />
    </div>
  );
};

export default List;
