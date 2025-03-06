import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { FiEdit } from 'react-icons/fi';

export const Profile = () => {
  const supabase = useSupabaseClient();
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getProfile = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        console.error('Error fetching user:', error);
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profile) {
        setUsername(profile.username);
        setAvatarUrl(profile.avatar_url);
      }
      setLoading(false);
    };

    getProfile();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    const userResponse = await supabase.auth.getUser();
    if (!userResponse.data?.user) return;

    // Use a relative file path: do NOT include the bucket name.
    const filePath = `${userResponse.data.user.id}/${file.name}`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    if (error) {
      console.error('Error uploading avatar:', error);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update the profile with the new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq('id', userResponse.data.user.id);

    if (updateError) {
      console.error('Error updating profile with avatar:', updateError);
      return;
    }

    setAvatarUrl(publicUrlData.publicUrl);
  };

  return (
    <div className="container mx-auto max-w-xl p-6 flex justify-center items-center min-h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <Card className="shadow-xl border border-gray-200 dark:border-gray-700 rounded-2xl w-full p-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 relative">
            {/* Avatar with pencil overlay */}
            <div className="relative">
              {loading ? (
                <Skeleton className="w-24 h-24 rounded-full" />
              ) : (
                <Avatar className="w-24 h-24 border border-gray-300 dark:border-gray-600">
                  <AvatarImage src={avatarUrl || ''} alt="User Avatar" />
                  <AvatarFallback>
                    {username ? username[0].toUpperCase() : '?'}
                  </AvatarFallback>
                </Avatar>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow hover:bg-gray-100"
              >
                <FiEdit className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            {/* Hidden file input triggered by the pencil button */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              className="hidden"
            />

            {/* Profile Information */}
            <div className="text-center w-full">
              <p className="text-lg font-semibold">Username:</p>
              {loading ? (
                <Skeleton className="w-32 h-6 mt-1" />
              ) : (
                <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
                  {username || 'N/A'}
                </p>
              )}
            </div>

            <Button onClick={handleLogout} className="w-full">
              Logout
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
