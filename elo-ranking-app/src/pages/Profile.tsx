import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from 'react';

export const Profile = () => {
  const supabase = useSupabaseClient();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch additional user data from your 'profiles' table if needed
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
        } else if (profile) {
          setUsername(profile.username);
        }
      }
    };

    getProfile();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Profile Information */}
          <div>
            <p className="text-lg font-semibold">Username:</p>
            <p>{username || 'N/A'}</p>
          </div>
          {/* Add more profile details here */}
          <Button onClick={handleLogout}>Logout</Button>
        </CardContent>
      </Card>
    </div>
  );
};
