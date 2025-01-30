import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import CreateListForm from '../components/ui/CreateListForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import '../static/style/list.css';

export const ListsPage = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const supabase = useSupabaseClient();
  const user = useUser();

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
      .select('id, title, description');

    if (error) {
      setError('Error fetching lists');
    } else {
      setLists(data);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <h2 className="text-2xl font-semibold text-center mb-6">Your Lists</h2>

      <Button
        onClick={() => setShowForm(!showForm)}
        variant="default"
        className="w-full mb-4"
      >
        {showForm ? 'Cancel' : 'Create New List'}
      </Button>

      {showForm && <CreateListForm onListCreated={fetchLists} />}

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : lists.length === 0 ? (
        <p className="text-gray-500 text-center">No lists found. Create one!</p>
      ) : (
        <div className="space-y-4">
          {lists.map((list) => (
            <Card key={list.id}>
              <CardHeader>
                <CardTitle>{list.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {list.description || 'No description'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
