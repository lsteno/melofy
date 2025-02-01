import React from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';

export const Profile = () => {
  const supabase = useSupabaseClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Button onClick={handleLogout}>Logout</Button>
    </div>
  );
};
