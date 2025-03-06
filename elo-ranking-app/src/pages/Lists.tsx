import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import CreateListForm from '../components/ui/CreateListForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import '../static/style/list.css';

export const ListsPage = () => {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const supabase = useSupabaseClient();
  const user = useUser();
  const navigate = useNavigate(); // Initialize the navigate function

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
      .from('lists')
      .select('id, title, description, category, is_public')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      setError('Error fetching lists: ' + error.message);
    } else {
      setLists(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      {
        <>
            <h2 className="text-2xl font-semibold text-center mb-6">
            Your Lists
            </h2>
            {/* <ImportLetterboxdMovies /> */}
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="default"
            className="w-full mb-4"
          >
            {showForm ? 'Cancel' : 'Create New List'}
          </Button>

          {showForm && (
            <CreateListForm
              onListCreated={() => {
                fetchLists();
                setShowForm(false);
              }}
            />
          )}

          {loading ? (
            <p className="text-center">Loading...</p>
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : lists.length === 0 ? (
            <p className="text-gray-500 text-center">
              No lists found. Create one!
            </p>
          ) : (
            <div className="space-y-4">
              {lists.map((list) => (
                <Card
                  key={list.id}
                  className="hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate(`/list/${list.id}`)}
                >
                  <CardHeader>
                    <CardTitle>{list.title}</CardTitle>
                    <div className="flex gap-2 text-sm">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                        {list.category.charAt(0).toUpperCase() + list.category.slice(1).toLowerCase()}
                        </span>
                      {list.is_public && (
                        <span className="bg-blue-100 px-2 py-1 rounded">
                          Public
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      {list.description || 'No description'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      }
    </div>
  );
};
